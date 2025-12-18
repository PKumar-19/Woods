// header-woods.js
// Non-destructive override to keep the header gradient hidden and video full-screen.
(function(){
  function applyHeaderWoods() {
    const el = document.querySelector('.header-gradient.header-gradient-woods');
    if (!el) return;
    el.style.setProperty('background-color','transparent','important');
    el.style.setProperty('mask-image','none','important');
    el.style.setProperty('-webkit-mask-image','none','important');
    el.style.setProperty('opacity','0','important');
    el.style.setProperty('pointer-events','none','important');
  }

  // Apply header styles as soon as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyHeaderWoods);
  } else {
    applyHeaderWoods();
  }

  // Re-apply header styles if scripts try to change them
  function observeHeader() {
    const target = document.querySelector('.header-gradient.header-gradient-woods');
    if (!target) return;
    const mo = new MutationObserver(function() {
      applyHeaderWoods();
    });
    mo.observe(target, { attributes: true, attributeFilter: ['style','class'] });
  }

  // Watch for the header gradient element being added
  const bodyObserver = new MutationObserver(function(mutations) {
    if (document.querySelector('.header-gradient.header-gradient-woods')) {
      applyHeaderWoods();
      observeHeader();
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  // Fix the video size and hide the overlay without moving elements
  function fixVideoDisplay() {
    const bgGif = document.querySelector('.bg-gif-woods');
    if (bgGif) {
      bgGif.style.setProperty('position','fixed','important');
      bgGif.style.setProperty('top','0','important');
      bgGif.style.setProperty('left','0','important');
      bgGif.style.setProperty('width','100%','important');
      bgGif.style.setProperty('height','100vh','important');
      bgGif.style.setProperty('transform','none','important');
      bgGif.style.setProperty('z-index','10','important');
    }
    
    const overlay = document.querySelector('.bg-overlay');
    if (overlay) {
      overlay.style.setProperty('display','none','important');
    }
  }

  // Apply video fix as soon as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixVideoDisplay);
  } else {
    fixVideoDisplay();
  }

  // Keep re-applying in case scripts override our styles
  var fixInterval = setInterval(fixVideoDisplay, 500);
  setTimeout(function() {
    clearInterval(fixInterval);
  }, 5000);

})();
