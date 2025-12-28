/* Book Call modal - inline version (no fetch required) */
(function(){
  'use strict';

  var cssPath = 'css/book-call.css';
  var jsPath = 'js/book-call.js';
  var modalInserted = false;
  var cssInserted = false;

  // Modal HTML template (inlined to avoid fetch issues with file:// protocol)
  var modalHTML = '<div id="bookCallModal" class="book-call-modal" aria-hidden="true" role="dialog" aria-modal="true">' +
    '<div class="book-call-overlay" data-action="close"></div>' +
    '<div class="book-call-dialog" role="document">' +
    '<button class="book-call-close" data-action="close" aria-label="Close popup">\u2715</button>' +
    '<div class="book-call-inner">' +
    '<h2 id="bookCallTitle">Book a Call</h2>' +
    '<p class="book-call-sub">Schedule a quick call with our sales team — we will reach out to you shortly.</p>' +
    '<form id="bookCallForm" novalidate>' +
    '<div class="bc-row"><label class="bc-field">Name<input type="text" id="bc-name" name="name" required minlength="2" placeholder="What\'s your name"></label></div>' +
    '<div class="bc-row"><label class="bc-field">Email<input type="email" id="bc-email" name="email" required placeholder="you@domain.com"></label></div>' +
    '<div class="bc-row"><label class="bc-field">Contact Number<input type="tel" id="bc-phone" name="phone" required placeholder="+91 70000 00000"></label></div>' +
    '<div class="bc-row"><label class="bc-field">Message (optional)<textarea id="bc-message" name="message" rows="3" placeholder="A preferred time or short note"></textarea></label></div>' +
    '<div class="bc-row bc-captcha"><span>Captcha:</span><span id="bc-c1"></span><span class="plus">+</span><span id="bc-c2"></span><span class="equals">=</span><input id="bc-captcha" name="captcha" inputmode="numeric" required placeholder="Answer" /></div>' +
    '<div class="bc-row actions"><button type="submit" id="bc-submit" class="bc-submit">Book Call</button><button type="button" class="bc-secondary" data-action="close">Cancel</button></div>' +
    '<div id="bc-status" class="bc-status" role="status" aria-live="polite"></div>' +
    '</form>' +
    '<p class="bc-privacy">We will reply from <strong>sales@thewoodskasauli.com</strong> — your email will be used to contact you.</p>' +
    '</div></div></div>';

  function insertCSS(){
    if(cssInserted) return;
    if(document.querySelector('link[href="'+cssPath+'"]')){ cssInserted = true; return; }
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = cssPath;
    document.head.appendChild(l);
    cssInserted = true;
    console.log('[BookCall] CSS inserted');
  }

  function insertModal(){
    if(modalInserted) return;
    if(document.getElementById('bookCallModal')){ modalInserted = true; return; }
    var temp = document.createElement('div');
    temp.innerHTML = modalHTML;
    var modalEl = temp.firstChild;
    document.body.appendChild(modalEl);
    modalInserted = true;
    console.log('[BookCall] Modal HTML inserted');
  }

  function loadJSAndInit(cb){
    // Check if already loaded
    if(window.BookCallModal){
      console.log('[BookCall] BookCallModal already exists');
      cb && cb();
      return;
    }

    // Check if script tag exists
    var existingScript = document.querySelector('script[src="'+jsPath+'"]');
    if(existingScript){
      console.log('[BookCall] Script tag exists, waiting for init');
      waitForInit(cb);
      return;
    }

    // Load the script
    console.log('[BookCall] Loading book-call.js');
    var s = document.createElement('script');
    s.src = jsPath;
    s.onload = function(){
      console.log('[BookCall] book-call.js loaded');
      waitForInit(cb);
    };
    s.onerror = function(){
      console.error('[BookCall] Failed to load book-call.js');
    };
    document.body.appendChild(s);
  }

  function waitForInit(cb){
    var attempts = 0;
    var maxAttempts = 30;
    function check(){
      attempts++;
      if(window.BookCallModal && typeof window.BookCallModal.open === 'function'){
        console.log('[BookCall] BookCallModal ready after ' + attempts + ' attempts');
        cb && cb();
      } else if(attempts < maxAttempts){
        setTimeout(check, 100);
      } else {
        console.error('[BookCall] BookCallModal never initialized');
      }
    }
    check();
  }

  function openModal(){
    console.log('[BookCall] openModal() called');
    insertCSS();
    insertModal();
    loadJSAndInit(function(){
      console.log('[BookCall] Calling BookCallModal.open()');
      window.BookCallModal.open();
    });
  }

  function handleButtonClick(e){
    e.preventDefault();
    e.stopPropagation();
    console.log('[BookCall] Button clicked!', e.target);
    openModal();
    return false;
  }

  function attachHandlers(){
    // Target buttons - NOT including download-brochure-btn as it has its own handler
    var selectors = ['.why-kasauli-button', '.tourism-action-button', '.book-call-btn'];
    var totalFound = 0;

    selectors.forEach(function(sel){
      var buttons = document.querySelectorAll(sel);
      console.log('[BookCall] Found ' + buttons.length + ' buttons for: ' + sel);
      buttons.forEach(function(btn){
        totalFound++;
        // Remove any existing onclick
        btn.onclick = null;
        // Add click listener
        btn.addEventListener('click', handleButtonClick, true); // Use capture phase
        console.log('[BookCall] Handler attached to:', btn);
      });
    });

    console.log('[BookCall] Total handlers attached: ' + totalFound);

    // Auto-open via query string
    if(window.location.search.indexOf('bookcall=1') !== -1){
      console.log('[BookCall] Auto-opening via query string');
      setTimeout(openModal, 500);
    }
  }

  function init(){
    console.log('[BookCall] Initializing, readyState:', document.readyState);
    attachHandlers();

    // Also handle the contact form if present
    if(document.getElementById('contactform')){
      console.log('[BookCall] Contact form found, loading JS');
      insertModal();
      loadJSAndInit(function(){
        console.log('[BookCall] JS loaded for contact form');
      });
    }
  }

  // Initialize when DOM is ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.BookCallDebug = {
    openModal: openModal,
    attachHandlers: attachHandlers,
    insertModal: insertModal
  };

  console.log('[BookCall] Script loaded. Use BookCallDebug.openModal() to test.');
})();
