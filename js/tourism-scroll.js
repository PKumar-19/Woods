gsap.registerPlugin(ScrollTrigger);

// Get diagnostics logger (created in scripts.js)
function getTourismDiag() {
  if (window.WoodsLoadDiagnostics) return window.WoodsLoadDiagnostics;
  // Fallback if scripts.js hasn't loaded yet
  return {
    log: function(s, m, d) { console.log('[TOURISM] [' + s + '] ' + m, d || ''); },
    milestone: function(n) { console.log('%c[TOURISM MILESTONE] ' + n, 'background: #1e5a8a; color: #fff; padding: 2px 8px;'); },
    warn: function(s, m, d) { console.warn('[TOURISM] [' + s + '] ' + m, d || ''); },
    error: function(s, m, d) { console.error('[TOURISM] [' + s + '] ' + m, d || ''); }
  };
}

var tourismDiag = getTourismDiag();
tourismDiag.log('TOURISM_SCROLL', 'tourism-scroll.js loaded, waiting for window.load');

// Wait for full load so elements are present and sized correctly
window.addEventListener("load", () => {
  tourismDiag = getTourismDiag(); // Re-get in case scripts.js loaded after us
  tourismDiag.milestone('tourism-scroll.js window.load fired');

  const texts = Array.from(document.querySelectorAll('.serenity-rotator .serenity-subtext'));
  const imgs = Array.from(document.querySelectorAll('.serenity-image-rotator .rot-image'));
  const count = Math.min(texts.length, imgs.length);

  tourismDiag.log('SERENITY', 'Found ' + texts.length + ' text elements, ' + imgs.length + ' image elements');

  if (!count) {
    tourismDiag.warn('SERENITY', 'No serenity rotator elements found, aborting');
    return;
  }

  const rotator = document.querySelector('.serenity-image-rotator');
  if (!rotator) {
    tourismDiag.warn('SERENITY', 'serenity-image-rotator element not found, aborting');
    return;
  }

  tourismDiag.log('SERENITY', 'Serenity rotator found, initializing');

  let idx = 0;
  let isTransitioning = false;

  // Get background color from page content
  const pageContent = document.getElementById('clapat-page-content');
  const bgColor = pageContent ? pageContent.getAttribute('data-bgcolor') : '#1f3533';

  // Function to create pixel grid
  function createPixelGrid() {
    const windowWidth = window.innerWidth;
    let pixelsPerRow = 0;

    // Define breakpoints matching the existing system
    if (windowWidth >= 1920) {
      pixelsPerRow = 20;
    } else if (windowWidth >= 1600) {
      pixelsPerRow = 18;
    } else if (windowWidth >= 1280) {
      pixelsPerRow = 16;
    } else if (windowWidth >= 1024) {
      pixelsPerRow = 14;
    } else if (windowWidth >= 768) {
      pixelsPerRow = 12;
    } else {
      pixelsPerRow = 10;
    }

    const pixelSize = windowWidth / pixelsPerRow;
    const parentWidth = rotator.offsetWidth;
    const parentHeight = rotator.offsetHeight;
    const cols = Math.ceil(parentWidth / pixelSize);
    const rows = Math.ceil(parentHeight / pixelSize) + 1;
    const pixelSizePercent = (100 / cols) + '%';

    // Create pixels wrapper
    const pixelsWrapper = document.createElement('div');
    pixelsWrapper.className = 'pixels-wrapper';

    // Create pixel elements
    for (let i = 0; i < rows * cols; i++) {
      const pixel = document.createElement('div');
      pixel.className = 'pixel';
      pixel.style.width = pixelSizePercent;
      pixel.style.backgroundColor = bgColor;
      pixelsWrapper.appendChild(pixel);
    }

    return pixelsWrapper;
  }

  // Function to animate pixels out
  function animatePixelsOut(pixelsWrapper, callback) {
    const pixelElements = pixelsWrapper.querySelectorAll('.pixel');

    gsap.to(pixelElements, {
      duration: 0.2,
      opacity: 0,
      delay: function() {
        return gsap.utils.random(0, 0.4);
      },
      ease: Power4.easeOut,
      onComplete: function() {
        pixelsWrapper.remove();
        isTransitioning = false;
        if (callback) callback();
      }
    });
  }

  const show = i => {
    if (isTransitioning) return;
    isTransitioning = true;

    texts.forEach((el, j) => el.classList.toggle('active', j === i));

    // Create pixel cover container
    const pixelCover = document.createElement('div');
    pixelCover.className = 'serenity-pixels-cover';

    // Create and add pixels
    const pixelsWrapper = createPixelGrid();
    pixelCover.appendChild(pixelsWrapper);
    rotator.appendChild(pixelCover);

    // Change the image underneath the pixels
    setTimeout(() => {
      imgs.forEach((el, j) => el.classList.toggle('active', j === i));

      // Animate pixels out to reveal new image
      setTimeout(() => {
        animatePixelsOut(pixelsWrapper, () => {
          pixelCover.remove();
        });
      }, 50);
    }, 50);
  };

  tourismDiag.log('SERENITY', 'Showing initial image (index 0)');
  show(0);
  const interval = 2500;

  tourismDiag.log('SERENITY', 'Starting rotator interval every ' + interval + 'ms');
  // Store interval ID for cleanup on page unload
  const rotatorIntervalId = setInterval(() => {
    idx = (idx + 1) % count;
    show(idx);
  }, interval);

  // Cleanup interval when page is hidden or unloaded to prevent memory leaks
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(rotatorIntervalId);
    }
  });
  window.addEventListener('beforeunload', () => {
    clearInterval(rotatorIntervalId);
  });
  
  const heroWord = document.getElementById("tourism-hero-title");
  const dockPoint = document.getElementById("tourism-dock-point");
  const sticky = document.getElementById("sticky");

  tourismDiag.log('WHY_KASAULI', 'DOM elements check', {
    heroWord: !!heroWord,
    dockPoint: !!dockPoint,
    sticky: !!sticky
  });

  if (!heroWord || !dockPoint || !sticky) {
    tourismDiag.warn('WHY_KASAULI', 'Missing DOM elements, aborting scroll animations', {
      heroWord: !!heroWord,
      dockPoint: !!dockPoint,
      sticky: !!sticky
    });
    return;
  }

  tourismDiag.log('WHY_KASAULI', 'All required DOM elements found');

  // Calculate a robust x/y offset so the hero word docks to the dock point across breakpoints
  function getDockPosition() {
    const heroRect = heroWord.getBoundingClientRect();
    const dockRect = dockPoint.getBoundingClientRect();

    // Use center alignment by default (more robust across different font sizes/line-wrapping)
    const heroCenterX = heroRect.left + heroRect.width / 2;
    const heroCenterY = heroRect.top + heroRect.height / 2;
    const dockCenterX = dockRect.left + dockRect.width / 2;
    const dockCenterY = dockRect.top + dockRect.height / 2;

    const dx = dockCenterX - heroCenterX;
    const dy = dockCenterY - heroCenterY;

    return { x: dx, y: dy };
  }

  /* MAIN SCROLL TIMELINE */
  // Use explicit scroller when available to avoid depending on defaults
  // On mobile, smooth-scroll is disabled, so we use native window scrolling
  const scrollerEl = document.querySelector('#content-scroll');
  const windowWidth = window.innerWidth;
  const isMobile = windowWidth <= 480;
  const isTablet = windowWidth > 480 && windowWidth <= 1024;
  const isMobileOrTablet = windowWidth <= 1024;

  // Check if smooth-scroll is active (it's disabled on mobile in common.js)
  const hasSmoothScroll = document.body.classList.contains('smooth-scroll');

  // Get responsive scroll trigger settings
  // For mobile/tablet: the animation should complete within the kasauli-title-center height
  function getScrollTriggerSettings() {
    if (isMobile) {
      // Mobile: animation completes within first 12% of section scroll
      return { start: "top top", end: "12% top", scrub: 2.0 };
    } else if (isTablet) {
      // Tablet: animation completes within first 30% of section scroll
      return { start: "top top", end: "30% top", scrub: 2.0 };
    }
    return { start: "top top", end: "bottom bottom", scrub: 2.0 };
  }

  const scrollSettings = getScrollTriggerSettings();

  // Adjust scroll trigger settings for mobile/tablet
  const scrollTriggerConfig = {
    trigger: "#tourism-hero",
    start: scrollSettings.start,
    end: scrollSettings.end,
    scrub: scrollSettings.scrub,
    // markers: true, // turn on when debugging
    onUpdate: (self) => {
      // Change text when animation is 50% complete
      const docked = self.progress > 0.5;
      console.log(
        "tourism-scroll progress:",
        self.progress,
        "docked:",
        docked
      );
      // Update text immediately without delay for better sync
      heroWord.textContent = docked ? "Kasauli's" : "Kasauli";

      // On mobile/tablet: keep text visible but use z-index layering to prevent overlap
      // The serenity-rotator has z-index: 15, so keeping Kasauli at z-index: 1 ensures
      // it passes behind the rotator if they overlap during the docking animation
      // This allows the docking animation to be visible while preventing ugly overlap
      heroWord.style.opacity = "1";
    },
    onToggle: (self) =>
      console.log("tourism-scroll onToggle, isActive:", self.isActive),
  };

  // Only use custom scroller if smooth-scroll is active (not on mobile)
  if (scrollerEl && hasSmoothScroll) scrollTriggerConfig.scroller = scrollerEl;

  tourismDiag.log('WHY_KASAULI', 'Creating GSAP timeline with ScrollTrigger');
  const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig });

  tourismDiag.log('WHY_KASAULI', 'Timeline created, scrollTrigger attached: ' + !!tl.scrollTrigger);

  // Debounced ScrollTrigger refresh to prevent excessive calls
  let refreshTimeout = null;
  const debouncedRefresh = () => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  };

  // Refresh after images and media load (reduces intermittent layout-shift issues)
  if (typeof imagesLoaded !== 'undefined') {
    const targetForImages = scrollerEl || document;
    tourismDiag.log('WHY_KASAULI', 'Setting up imagesLoaded callback for ScrollTrigger refresh');
    imagesLoaded(targetForImages, () => {
      tourismDiag.log('WHY_KASAULI', 'imagesLoaded callback fired, refreshing ScrollTrigger');
      debouncedRefresh();

      // Single delayed refresh to handle late layout shifts (consolidated from multiple calls)
      setTimeout(() => {
        tourismDiag.log('WHY_KASAULI', 'Delayed ScrollTrigger refresh (1s after imagesLoaded)');
        debouncedRefresh();
      }, 1000);
    });
  } else {
    tourismDiag.warn('WHY_KASAULI', 'imagesLoaded not available');
  }

  // Debounced resize handler to prevent excessive refreshes
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 150);
  });

  // Single delayed refresh after load (consolidated from 3 calls to 1)
  setTimeout(() => debouncedRefresh(), 800);

  // Direct debug ScrollTrigger to verify ScrollTrigger receives updates even if timeline doesn't
  ScrollTrigger.create({
    id: "tourism-debug",
    trigger: "#tourism-hero",
    start: scrollSettings.start,
    end: scrollSettings.end,
    scroller: hasSmoothScroll ? scrollerEl : undefined,
    // markers: true,
    onUpdate: function (self) {
      console.log("tourism-debug onUpdate:", self.progress);
    },
  });

  /* Fade WHY */
  tl.to(
    "#why",
    {
      opacity: 0,
      y: -12,
    },
    0
  );

  /* Show sentence */
  tl.to(
    "#sentence",
    {
      opacity: 1,
    },
    0.2
  );

  /* DOCK Kasauli on its OWN LINE (responsive-friendly) */
  function getTargetScale() {
    const w = window.innerWidth;
    // Scale calculated to match serenity-label font size at each breakpoint
    // Mobile: serenity-label is clamp(22px, 6vw, 32px), kasauli-text is 50px
    // At 480px: 6vw = 28.8px, so scale = 28.8/50 = 0.576
    if (w <= 480) return 0.40; // small phones - match INVEST IN font size
    if (w <= 768) return 0.26; // phones / small tablets
    if (w <= 1024) return 0.24; // tablets
    return 0.3; // desktop
  }

  // Cache the initial positions at load time for consistent animation
  let cachedDockPosition = null;

  function calculateAndCacheDockPosition() {
    const heroRect = heroWord.getBoundingClientRect();
    const serenityLabelForDock = document.querySelector('.serenity-label');
    const dockPointEl = document.getElementById('tourism-dock-point');
    const scale = getTargetScale();

    if (isMobileOrTablet && serenityLabelForDock) {
      const labelRect = serenityLabelForDock.getBoundingClientRect();

      // =====================================================
      // MANUAL ADJUSTMENT: Change this value to move Kasauli's horizontally
      // Positive = move RIGHT, Negative = move LEFT
      // =====================================================
      const mobileXOffset = 30; // Adjust this value (in pixels) to fine-tune horizontal position

      // Align LEFT edges of scaled Kasauli's with INVEST IN
      const targetX = labelRect.left - heroRect.left + mobileXOffset;

      // Calculate target Y to position below INVEST IN with appropriate spacing
      const targetY = labelRect.bottom - heroRect.top + 5;

      cachedDockPosition = { x: targetX, y: targetY };

      console.log('Dock position calc:', {
        labelLeft: labelRect.left,
        heroLeft: heroRect.left,
        mobileXOffset: mobileXOffset,
        targetX: targetX,
        targetY: targetY,
        scale: scale
      });
    } else if (dockPointEl) {
      // Desktop: dock to the dock point
      const pos = getDockPosition();
      const nudge = (() => {
        const w = window.innerWidth;
        if (w >= 1400) return heroRect.width * 0.60;
        if (w >= 1200) return heroRect.width * 0.80;
        if (w >= 1024) return heroRect.width * 0.82;
        return 0;
      })();
      cachedDockPosition = { x: pos.x + nudge, y: pos.y };
    } else {
      cachedDockPosition = { x: 0, y: 0 };
    }

    return cachedDockPosition;
  }

  // Calculate initial dock position
  calculateAndCacheDockPosition();

  // Recalculate on resize
  window.addEventListener('resize', () => {
    cachedDockPosition = null;
    calculateAndCacheDockPosition();
  });

  tl.to(
    heroWord,
    {
      x: () => cachedDockPosition ? cachedDockPosition.x : 0,
      y: () => cachedDockPosition ? cachedDockPosition.y : 0,
      scale: () => getTargetScale(),
      // Use left top origin for mobile/tablet so left edge aligns with INVEST IN
      transformOrigin: isMobileOrTablet ? "left top" : "left center",
      ease: "power2.inOut",
    },
    0
  );

  // Orientation change triggers refresh (resize handler already added above with debounce)
  window.addEventListener('orientationchange', () => debouncedRefresh());

  /* ROTATING WORDS (commented out intentionally) */
  /*
  const rotate = document.getElementById("rotate");
  const words = ["Serenity", "Nature", "Wilderness", "AQI"];

  const rotateTl = gsap.timeline({ repeat: -1, paused: true });

  words.forEach(word => {
    rotateTl
      .to(rotate, { opacity: 0, y: -10, duration: 0.3 })
      .call(() => rotate.textContent = word)
      .to(rotate, { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 1.2 });
  });
  */

  ScrollTrigger.create({
    trigger: "#sentence",
    start: "top 80%",
    once: true,
    onEnter: () => {
      if (
        typeof rotateTl !== "undefined" &&
        rotateTl &&
        typeof rotateTl.play === "function"
      ) {
        rotateTl.play();
      } else {
        console.log(
          "tourism-scroll: rotateTl not defined, skipping rotate play"
        );
      }
    },
  });

  // Refresh ScrollTrigger after a small delay to ensure measurements are correct
  setTimeout(() => ScrollTrigger.refresh(), 200);

  /* SERENITY LABEL AND ROTATOR SCROLL FADE ANIMATIONS */
  const serenityLabelEl = document.querySelector('.serenity-label');
  const serenityRotatorEl = document.querySelector('.serenity-rotator');

  tourismDiag.log('SERENITY_VISIBILITY', 'Serenity elements check', {
    serenityLabel: !!serenityLabelEl,
    serenityRotator: !!serenityRotatorEl,
    isMobileOrTablet: isMobileOrTablet
  });

  if (serenityLabelEl && serenityRotatorEl) {
    tourismDiag.log('SERENITY_VISIBILITY', 'Setting up serenity visibility animations');
    // On mobile/tablet, don't hide these elements initially since:
    // 1. The docking animation completes quickly and syncs with reveal
    // 2. Prevents "flash of invisible content" when cache is cleared
    // 3. Better UX - content is visible even if JS takes time to load
    if (!isMobileOrTablet) {
      // Only on desktop: Set initial state - hidden until scroll reveals them
      tourismDiag.log('SERENITY_VISIBILITY', 'Desktop mode: hiding serenity elements initially');
      gsap.set([serenityLabelEl, serenityRotatorEl], {
        opacity: 0,
        y: 30
      });
    } else {
      tourismDiag.log('SERENITY_VISIBILITY', 'Mobile/tablet mode: keeping serenity elements visible');
    }

    if (isMobileOrTablet) {
      // For mobile/tablet: sync reveal with the docking animation using same trigger
      // Add the reveal animation to the main timeline so it syncs with docking
      tl.to(
        [serenityLabelEl, serenityRotatorEl],
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          ease: 'power2.out',
        },
        0.3 // Start slightly after docking begins
      );
    } else {
      // Desktop: use separate scroll trigger for reveal
      ScrollTrigger.create({
        trigger: '.kasauli_serenity_section',
        start: 'top 70%',
        end: 'bottom 30%',
        scroller: hasSmoothScroll ? scrollerEl : undefined,
        // markers: true, // uncomment for debugging
        onEnter: () => {
          gsap.to([serenityLabelEl, serenityRotatorEl], {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.15
          });
        },
        onLeave: () => {
          gsap.to([serenityLabelEl, serenityRotatorEl], {
            opacity: 0,
            y: -30,
            duration: 0.6,
            ease: 'power2.in',
            stagger: 0.1
          });
        },
        onEnterBack: () => {
          gsap.to([serenityLabelEl, serenityRotatorEl], {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.15
          });
        },
        onLeaveBack: () => {
          gsap.to([serenityLabelEl, serenityRotatorEl], {
            opacity: 0,
            y: 30,
            duration: 0.6,
            ease: 'power2.in',
            stagger: 0.1
          });
        }
      });

      // Fallback: if element is already visible in viewport, show it immediately
      // This handles cases where ScrollTrigger doesn't fire due to race conditions
      setTimeout(() => {
        const sectionRect = document.querySelector('.kasauli_serenity_section');
        if (sectionRect) {
          const rect = sectionRect.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            gsap.to([serenityLabelEl, serenityRotatorEl], {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power2.out',
              stagger: 0.15
            });
          }
        }
      }, 2000);
    }
  }

  // Fallback for "Why" and "Kasauli" text visibility
  // Ensure these elements are visible even if scroll animation doesn't trigger
  setTimeout(() => {
    tourismDiag.log('WHY_KASAULI', 'Running visibility fallback check (1.5s after load)');
    const whyEl = document.getElementById('why');
    const kasauliEl = document.getElementById('tourism-hero-title');

    // If we're at the top of the page (tourism section not scrolled), ensure visibility
    if (whyEl && kasauliEl) {
      const tourismSection = document.getElementById('tourism-hero');
      if (tourismSection) {
        const rect = tourismSection.getBoundingClientRect();
        // If section is above the viewport (user hasn't scrolled to it yet)
        if (rect.top > window.innerHeight) {
          tourismDiag.log('WHY_KASAULI', 'Tourism section not in view, resetting to visible state');
          // Reset to initial visible state
          gsap.set(whyEl, { opacity: 1, y: 0 });
          gsap.set(kasauliEl, { opacity: 1, scale: 1, x: 0, y: 0 });
        } else {
          tourismDiag.log('WHY_KASAULI', 'Tourism section in view, no fallback needed');
        }
      }
    }
  }, 1500);

  tourismDiag.milestone('tourism-scroll.js initialization COMPLETE');
});
