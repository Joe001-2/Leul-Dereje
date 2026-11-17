/**
 * Scroll-Driven Architectural Sketch Canvas
 * Renders a 240-frame 1280x720 WebP sequence with silky sub-frame alpha blending,
 * inertial RAF smoothing, and predictive multi-lane preloading.
 */
(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const INITIAL_BATCH_SIZE = 40; // Preload upfront for instantaneous first interaction
  const FRAME_PATH = (index) =>
    `assets/sequence/frame_${String(index).padStart(4, '0')}.webp`;

  const canvas = document.getElementById('sketch-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  // Image storage & status
  const images = new Array(TOTAL_FRAMES);
  const loadingStatus = new Uint8Array(TOTAL_FRAMES); // 0 = unrequested, 1 = loading, 2 = loaded, 3 = failed

  // Cover math cache (updated only on resize)
  let coverDx = 0;
  let coverDy = 0;
  let coverDw = 1280;
  let coverDh = 720;
  const NATIVE_W = 1280;
  const NATIVE_H = 720;

  // Smoothing Playhead State
  let targetFrame = 0;
  let currentFrame = 0;
  let isScrollTriggerReady = false;
  let rafId = null;

  /**
   * Calculate object-fit: cover coordinates
   */
  function updateCoverMetrics() {
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / NATIVE_W, ch / NATIVE_H);
    coverDw = Math.round(NATIVE_W * scale);
    coverDh = Math.round(NATIVE_H * scale);
    coverDx = Math.round((cw - coverDw) / 2);
    coverDy = Math.round((ch - coverDh) / 2);
  }

  /**
   * Resize canvas matching window and capped devicePixelRatio for maximum FPS
   */
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75); // 1.75 max balances retina crispness with 60fps GPU fillrate
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';

    updateCoverMetrics();
    renderSubFrame(currentFrame);

    if (typeof ScrollTrigger !== 'undefined' && isScrollTriggerReady) {
      ScrollTrigger.refresh();
    }
  }

  /**
   * Preload a single frame returning a Promise
   */
  function loadSingleFrame(index) {
    if (index < 0 || index >= TOTAL_FRAMES) return Promise.resolve(null);
    if (loadingStatus[index] === 2) return Promise.resolve(images[index]);
    if (loadingStatus[index] === 1) return Promise.resolve(null); // Already in-flight

    loadingStatus[index] = 1;
    return new Promise((resolve) => {
      const img = new Image();
      img.src = FRAME_PATH(index + 1); // 1-indexed files
      img.onload = () => {
        images[index] = img;
        loadingStatus[index] = 2;
        resolve(img);
      };
      img.onerror = () => {
        loadingStatus[index] = 3;
        resolve(null);
      };
    });
  }

  /**
   * Find nearest loaded frame if a target frame is temporarily unavailable
   */
  function getNearestLoadedFrame(targetIdx) {
    if (loadingStatus[targetIdx] === 2 && images[targetIdx]) {
      return images[targetIdx];
    }
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = targetIdx - offset;
      const next = targetIdx + offset;
      if (prev >= 0 && loadingStatus[prev] === 2 && images[prev]) {
        return images[prev];
      }
      if (next < TOTAL_FRAMES && loadingStatus[next] === 2 && images[next]) {
        return images[next];
      }
    }
    return null;
  }

  /**
   * Silky Sub-Frame Rendering Engine with Dual-Frame Alpha Cross-Fade
   * Eliminates discrete stepping cuts and renders fluid analog transitions.
   */
  function renderSubFrame(framePos) {
    const clampedPos = Math.max(0, Math.min(TOTAL_FRAMES - 1, framePos));
    const floorIdx = Math.floor(clampedPos);
    const ceilIdx = Math.min(floorIdx + 1, TOTAL_FRAMES - 1);
    const fraction = clampedPos - floorIdx;

    const baseImg = (loadingStatus[floorIdx] === 2 && images[floorIdx])
      ? images[floorIdx]
      : getNearestLoadedFrame(floorIdx);

    if (!baseImg) return;

    // Draw primary base frame
    ctx.globalAlpha = 1.0;
    ctx.drawImage(baseImg, coverDx, coverDy, coverDw, coverDh);

    // If positioned between two frames and next frame is available, cross-fade to eliminate stepped snapping
    if (ceilIdx !== floorIdx && fraction > 0.02) {
      const nextImg = (loadingStatus[ceilIdx] === 2 && images[ceilIdx]) ? images[ceilIdx] : null;
      if (nextImg) {
        ctx.globalAlpha = fraction;
        ctx.drawImage(nextImg, coverDx, coverDy, coverDw, coverDh);
        ctx.globalAlpha = 1.0;
      }
    }
  }

  /**
   * Continuous RAF physics loop for buttery smooth momentum
   */
  function startRenderLoop() {
    function tick() {
      const diff = targetFrame - currentFrame;
      const absDiff = Math.abs(diff);

      if (absDiff > 0.002) {
        // Smooth exponential damping (lerp factor: 0.12 = responsive yet silk-smooth)
        currentFrame += diff * 0.12;
        renderSubFrame(currentFrame);
      } else if (absDiff > 0) {
        currentFrame = targetFrame;
        renderSubFrame(currentFrame);
      }

      rafId = requestAnimationFrame(tick);
    }
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  /**
   * Prioritize loading frames surrounding the user's current scroll area
   */
  function prioritizeFramesNear(centerIndex) {
    const RADIUS = 18;
    const start = Math.max(0, centerIndex - 5);
    const end = Math.min(TOTAL_FRAMES, centerIndex + RADIUS);

    for (let i = start; i < end; i++) {
      if (loadingStatus[i] === 0) {
        loadSingleFrame(i);
      }
    }
  }

  /**
   * High-speed parallel background stream for all remaining frames
   */
  function streamAllRemainingFrames() {
    let nextIndex = INITIAL_BATCH_SIZE;
    const CONCURRENCY = 6; // 6 parallel network lanes

    function pumpLane() {
      if (nextIndex >= TOTAL_FRAMES) return;
      const idx = nextIndex++;
      if (loadingStatus[idx] === 0) {
        loadSingleFrame(idx).then(() => {
          pumpLane();
        });
      } else {
        pumpLane();
      }
    }

    for (let c = 0; c < CONCURRENCY; c++) {
      pumpLane();
    }
  }

  /**
   * Setup GSAP ScrollTrigger timeline
   */
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      setupFallbackScrollListener();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const timelineTracker = { progress: 0 };

    gsap.to(timelineTracker, {
      progress: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8, // 0.8s smooth weighted scroll scrub
        onUpdate: (self) => {
          targetFrame = self.progress * (TOTAL_FRAMES - 1);
          prioritizeFramesNear(Math.round(targetFrame));
        }
      }
    });

    isScrollTriggerReady = true;
  }

  /**
   * Fallback scroll listener if GSAP CDN fails
   */
  function setupFallbackScrollListener() {
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
      targetFrame = progress * (TOTAL_FRAMES - 1);
      prioritizeFramesNear(Math.round(targetFrame));
    }, { passive: true });
  }

  // Window resize debouncer for mobile address bar stability
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastWidth) > 12) {
      lastWidth = window.innerWidth;
      resizeCanvas();
    }
  }, { passive: true });

  // Initial layout sizing
  resizeCanvas();

  // Load first critical batch upfront for instant interactive readiness
  const initialLoads = [];
  for (let i = 0; i < Math.min(INITIAL_BATCH_SIZE, TOTAL_FRAMES); i++) {
    initialLoads.push(loadSingleFrame(i));
  }

  Promise.all(initialLoads).then(() => {
    // Render initial frame
    renderSubFrame(0);

    // Launch continuous 60fps RAF loop
    startRenderLoop();

    // Wire up ScrollTrigger
    initGSAP();

    // Stream remaining frames through multi-lane background loader
    streamAllRemainingFrames();
  });

})();
