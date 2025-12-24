gsap.registerPlugin(ScrollTrigger);

// Wait for full load so elements are present and sized correctly
window.addEventListener("load", () => {
  const texts = Array.from(document.querySelectorAll('.serenity-rotator .serenity-subtext'));
  const imgs = Array.from(document.querySelectorAll('.serenity-image-rotator .rot-image'));
  const count = Math.min(texts.length, imgs.length);
  if (!count) return;
  let idx = 0;
  const show = i => {
      texts.forEach((el,j) => el.classList.toggle('active', j === i));
      imgs.forEach((el,j) => el.classList.toggle('active', j === i));
  };
  show(0);
  const interval = 2500;
  setInterval(() => { idx = (idx + 1) % count; show(idx); }, interval);
  
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

  // Calculate the x/y offset relative to the sticky container
  function getDockPosition() {
    const heroRect = heroWord.getBoundingClientRect();
    const dockRect = dockPoint.getBoundingClientRect();
    const stickyRect = sticky.getBoundingClientRect();
    // Defensive arithmetic in case layout changes
    return {
      x:
        dockRect.left -
        heroRect.left +
        (heroWord.offsetLeft - heroWord.getBoundingClientRect().left),
      y:
        dockRect.top -
        heroRect.top +
        (heroWord.offsetTop - heroWord.getBoundingClientRect().top),
    };
  }

  /* MAIN SCROLL TIMELINE */
  // Use explicit scroller when available to avoid depending on defaults
  const scrollerEl = document.querySelector('#content-scroll');
  const scrollTriggerConfig = {
    trigger: "#tourism-hero",
    start: "top top",
    end: "bottom bottom",
    scrub: 1.2,
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
      if (docked) {
        heroWord.textContent = "Kasauli's";
      } else {
        heroWord.textContent = "Kasauli";
      }
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

  /* DOCK Kasauli on its OWN LINE */
  tl.to(
    heroWord,
    {
      x: () => getDockPosition().x,
      y: () => getDockPosition().y,
      scale: 0.3,
      transformOrigin: "81% -10%",
      ease: "power2.inOut",
    },
    0
  );

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
