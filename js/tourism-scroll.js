gsap.registerPlugin(ScrollTrigger);

// Wait for full load so elements are present and sized correctly
window.addEventListener("load", () => {
  const texts = Array.from(document.querySelectorAll('.serenity-rotator .serenity-subtext'));
  const imgs = Array.from(document.querySelectorAll('.serenity-image-rotator .rot-image'));
  const count = Math.min(texts.length, imgs.length);
  if (!count) return;

  const rotator = document.querySelector('.serenity-image-rotator');
  if (!rotator) return;

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

  show(0);
  const interval = 2500;
  setInterval(() => {
    idx = (idx + 1) % count;
    show(idx);
  }, interval);
  
  const heroWord = document.getElementById("tourism-hero-title");
  console.log("heroWord:", heroWord);
  const dockPoint = document.getElementById("tourism-dock-point");
  console.log("dockPoint:", dockPoint);
  const sticky = document.getElementById("sticky");

  if (!heroWord || !dockPoint || !sticky) {
    console.log(
      "tourism-scroll: missing DOM elements, aborting scroll animations"
    );
    return;
  }

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
  const scrollerEl = document.querySelector('#content-scroll');
  const scrollTriggerConfig = {
    trigger: "#tourism-hero",
    start: "top top",
    end: "bottom bottom",
    scrub: 1.2,
    delay: 2.0,
    // markers: true, // turn on when debugging
    onUpdate: (self) => {
      // debug
      const docked = self.progress > 0.5; // adjust threshold as needed
      console.log(
        "tourism-scroll progress:",
        self.progress,
        "docked:",
        docked
      );
      setTimeout(() => {
        heroWord.textContent = docked ? "Kasauli's" : "Kasauli";
        heroWord.style.opacity = "1";
        // heroWord.style.marginBottom = docked ? "20px" : "0px";
      }, 300); // match CSS transition duration
    },
    onToggle: (self) =>
      console.log("tourism-scroll onToggle, isActive:", self.isActive),
  };

  if (scrollerEl) scrollTriggerConfig.scroller = scrollerEl;

  const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig });

  console.log(
    "tourism-scroll: timeline created, scrollTrigger attached?",
    !!tl.scrollTrigger
  );

  // Refresh after images and media load (reduces intermittent layout-shift issues)
  if (typeof imagesLoaded !== 'undefined') {
    const targetForImages = scrollerEl || document;
    imagesLoaded(targetForImages, () => {
      console.log('tourism-scroll: images loaded, refreshing ScrollTrigger');
      ScrollTrigger.refresh();

      // additional delayed refreshes to handle late layout shifts (videos, fonts, heavy images)
      setTimeout(() => ScrollTrigger.refresh(), 500);
      setTimeout(() => ScrollTrigger.refresh(), 1000);
      setTimeout(() => ScrollTrigger.refresh(), 2000);
    });
  }

  // Refresh on window resize/orientation
  window.addEventListener('resize', () => ScrollTrigger.refresh());

  // Extra refreshes after load to mitigate intermittent cases where media loads late
  setTimeout(() => ScrollTrigger.refresh(), 500);
  setTimeout(() => ScrollTrigger.refresh(), 1000);
  setTimeout(() => ScrollTrigger.refresh(), 2000);

  // Direct debug ScrollTrigger to verify ScrollTrigger receives updates even if timeline doesn't
  ScrollTrigger.create({
    id: "tourism-debug",
    trigger: "#tourism-hero",
    start: "top top",
    end: "bottom bottom",
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
    if (w <= 480) return 0.6; // small phones
    if (w <= 768) return 0.45; // phones / small tablets
    if (w <= 1024) return 0.22; // tablets
    return 0.3; // desktop
  }

  // Small horizontal nudge to move the docked title slightly right on larger screens.
  function getDockNudge(heroRect) {
    const w = window.innerWidth;
    // Use a fraction of the hero width so the adjustment scales with text size
    if (w >= 1400) return heroRect.width * 0.60;
    if (w >= 1200) return heroRect.width * 0.80;
    if (w >= 1024) return heroRect.width * 0.82;
    if (w >= 768) return heroRect.width * 0.62;
    return 0;
  }

  tl.to(
    heroWord,
    {
      x: () => {
        const pos = getDockPosition();
        const heroRect = heroWord.getBoundingClientRect();
        return pos.x + getDockNudge(heroRect);
      },
      y: () => getDockPosition().y,
      scale: () => getTargetScale(),
      // keep transform origin centered vertically, left-aligned horizontally for consistent docking
      transformOrigin: "left center",
      ease: "power2.inOut",
    },
    0
  );

  // Ensure measurements are recalculated on resize/orientation changes
  window.addEventListener('orientationchange', () => ScrollTrigger.refresh());
  window.addEventListener('resize', () => {
    // small debounce
    clearTimeout(window._tourismResizeTimeout);
    window._tourismResizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 120);
  });

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
});
