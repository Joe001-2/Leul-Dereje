/**
 * Scroll-Driven Architectural Sketch Canvas
 * Renders a 240-frame 1280x720 WebP sequence with silky sub-frame alpha blending,
 * continuous RAF momentum, and instant passive native scroll response.
 */
(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const INITIAL_BATCH = 15; // Fast initial burst so first frames are ready in milliseconds
  const FRAME_PATH = (index) =>
    `assets/sequence/frame_${String(index).padStart(4, '0')}.webp`;

  const canvas = document.getElementById('sketch-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  // Image storage & status
  const images = new Array(TOTAL_FRAMES);
  const loadingStatus = new Uint8Array(TOTAL_FRAMES); // 0 = unrequested, 1 = loading, 2 = loaded, 3 = failed

  // Cached layout metrics
  let coverDx = 0;
  let coverDy = 0;
  let coverDw = 1280;
  let coverDh = 720;
  const NATIVE_W = 1280;
  const NATIVE_H = 720;

  // Smoothing Playhead State
  let targetFrame = 0;
  let currentFrame = 0;
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
   * Resize canvas matching window and devicePixelRatio
   */
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
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
  }

  /**
   * Preload a single frame returning a Promise
   */
  function loadSingleFrame(index) {
    if (index < 0 || index >= TOTAL_FRAMES) return Promise.resolve(null);
    if (loadingStatus[index] === 2) return Promise.resolve(images[index]);
    if (loadingStatus[index] === 1) return Promise.resolve(null);

    loadingStatus[index] = 1;
    return new Promise((resolve) => {
      const img = new Image();
      img.src = FRAME_PATH(index + 1);
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

    // Cross-fade to next frame when transitioning
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
        // Damped momentum (lerp factor: 0.10 for organic, non-jerky glide)
        currentFrame += diff * 0.10;
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
    const RADIUS = 20;
    const start = Math.max(0, centerIndex - 5);
    const end = Math.min(TOTAL_FRAMES, centerIndex + RADIUS);

    for (let i = start; i < end; i++) {
      if (loadingStatus[i] === 0) {
        loadSingleFrame(i);
      }
    }
  }

  /**
   * Native, non-blocking scroll progress calculator
   * Uses 100% passive listeners so native touch and trackpad scrolling is NEVER locked.
   */
  function updateScrollProgress() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    const maxScroll = docHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;

    targetFrame = progress * (TOTAL_FRAMES - 1);
    prioritizeFramesNear(Math.round(targetFrame));
  }

  /**
   * High-speed parallel background stream for remaining frames
   */
  function streamAllRemainingFrames() {
    let nextIndex = INITIAL_BATCH;
    const CONCURRENCY = 6;

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

  // Attach passive scroll listeners immediately — ZERO DELAY, ZERO BLOCKING
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('touchmove', updateScrollProgress, { passive: true });

  // Mobile address bar friendly resize listener
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastWidth) > 12) {
      lastWidth = window.innerWidth;
      resizeCanvas();
    }
    updateScrollProgress();
  }, { passive: true });

  // Initial setup
  resizeCanvas();
  updateScrollProgress();
  startRenderLoop();

  // Load first frame immediately and render
  loadSingleFrame(0).then(() => {
    renderSubFrame(0);
  });

  // Load first burst in parallel, then stream the rest
  const burstLoads = [];
  for (let i = 0; i < Math.min(INITIAL_BATCH, TOTAL_FRAMES); i++) {
    burstLoads.push(loadSingleFrame(i));
  }

  Promise.all(burstLoads).then(() => {
    streamAllRemainingFrames();
  });

})();
