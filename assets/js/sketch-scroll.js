/**
 * Scroll-Driven Architectural Sketch Canvas
 * Renders a 240-frame 1280x720 WebP sequence smoothly scrubbed by GSAP ScrollTrigger.
 */
(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const PRELOAD_BATCH = 25; // First 25 frames loaded upfront for instantaneous initial paint
  const FRAME_PATH = (index) =>
    `assets/sequence/frame_${String(index).padStart(4, '0')}.webp`;

  const canvas = document.getElementById('sketch-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const images = new Array(TOTAL_FRAMES);
  let currentRenderedIndex = -1;
  let isScrollTriggerReady = false;

  /**
   * Resize canvas matching window and devicePixelRatio
   */
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for optimal mobile/desktop FPS
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    if (currentRenderedIndex >= 0) {
      drawFrame(currentRenderedIndex);
    }

    if (typeof ScrollTrigger !== 'undefined' && isScrollTriggerReady) {
      ScrollTrigger.refresh();
    }
  }

  /**
   * Draw a specific frame using object-fit: cover math
   */
  function drawFrame(targetIndex) {
    if (targetIndex < 0 || targetIndex >= TOTAL_FRAMES) return;

    let img = images[targetIndex];

    // Fallback: If target frame is still downloading, locate nearest loaded frame
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = targetIndex - offset;
        const next = targetIndex + offset;
        if (prev >= 0 && images[prev]?.complete && images[prev]?.naturalWidth > 0) {
          img = images[prev];
          break;
        }
        if (next < TOTAL_FRAMES && images[next]?.complete && images[next]?.naturalWidth > 0) {
          img = images[next];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // object-fit: cover calculations
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
    currentRenderedIndex = targetIndex;
  }

  /**
   * Preload a single frame image returning a Promise
   */
  function loadSingleFrame(index) {
    return new Promise((resolve) => {
      if (images[index] && images[index].complete) {
        return resolve(images[index]);
      }
      const img = new Image();
      img.src = FRAME_PATH(index + 1); // 1-indexed (frame_0001.webp - frame_0240.webp)
      img.onload = () => {
        images[index] = img;
        resolve(img);
      };
      img.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Asynchronously load remaining frames in idle background chunks
   */
  function loadRemainingFrames() {
    let cursor = PRELOAD_BATCH;
    const CHUNK_SIZE = 8;

    function processChunk() {
      if (cursor >= TOTAL_FRAMES) return;

      const batch = [];
      const end = Math.min(cursor + CHUNK_SIZE, TOTAL_FRAMES);
      for (let i = cursor; i < end; i++) {
        batch.push(loadSingleFrame(i));
      }
      cursor = end;

      Promise.all(batch).then(() => {
        if (cursor < TOTAL_FRAMES) {
          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(processChunk, { timeout: 250 });
          } else {
            setTimeout(processChunk, 35);
          }
        }
      });
    }

    processChunk();
  }

  /**
   * Wire up GSAP ScrollTrigger timeline
   */
  function initGSAPScrubber() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not loaded; falling back to scroll listener');
      setupFallbackScrollListener();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    // Ignore mobile address bar hide/show to prevent stutter on iOS/Android
    ScrollTrigger.config({ ignoreMobileResize: true });

    const scrubber = { frame: 0 };

    gsap.to(scrubber, {
      frame: TOTAL_FRAMES - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.35, // Smooth responsive scrubbing
        onUpdate: () => {
          const frameIndex = Math.round(scrubber.frame);
          drawFrame(frameIndex);
        }
      }
    });

    isScrollTriggerReady = true;
  }

  /**
   * Lightweight fallback scroll listener if GSAP fails to load
   */
  function setupFallbackScrollListener() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const progress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
          const frameIndex = Math.round(progress * (TOTAL_FRAMES - 1));
          drawFrame(frameIndex);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Initial setup with mobile-optimized resize listener (prevents address bar jitter)
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastWidth) > 10) {
      lastWidth = window.innerWidth;
      resizeCanvas();
    }
  }, { passive: true });
  resizeCanvas();

  // Load first batch immediately
  const initialPromises = [];
  for (let i = 0; i < Math.min(PRELOAD_BATCH, TOTAL_FRAMES); i++) {
    initialPromises.push(loadSingleFrame(i));
  }

  Promise.all(initialPromises).then(() => {
    // Draw initial frame
    drawFrame(0);

    // Initialize ScrollTrigger
    initGSAPScrubber();

    // Start background streaming of remaining frames
    loadRemainingFrames();
  });
})();
