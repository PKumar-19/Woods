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
    '<h2 id="bookCallTitle">Investment Opportunity</h2>' +
    '<p class="book-call-sub">Discover luxury living at The Woods Kasauli</p>' +
    '<form id="bookCallForm" novalidate>' +
    '<div class="bc-row"><label class="bc-field">Name<input type="text" id="bc-name" name="name" required minlength="2" placeholder="What\'s your name"></label></div>' +
    '<div class="bc-row"><label class="bc-field">Email<input type="email" id="bc-email" name="email" required placeholder="you@domain.com"></label></div>' +
    '<div class="bc-row"><label class="bc-field">Contact Number<input type="tel" id="bc-phone" name="phone" required placeholder="+91 70000 00000"></label></div>' +
    '<div class="bc-row bc-captcha"><span>Captcha:</span><span id="bc-c1"></span><span class="plus">+</span><span id="bc-c2"></span><span class="equals">=</span><input id="bc-captcha" name="captcha" inputmode="numeric" required placeholder="Answer" /></div>' +
    '<div class="bc-row actions"><button type="submit" id="bc-submit" class="bc-submit">Book Call</button><button type="button" class="bc-secondary" data-action="close">Cancel</button></div>' +
    '<div id="bc-status" class="bc-status" role="status" aria-live="polite"></div>' +
    '</form>' +
    '<p class="bc-privacy">We will reply from <strong>sales@thewoodskasauli.com</strong> — your email will be used to contact you.</p>' +
    '</div></div></div>';

  // Inline critical CSS as fallback
  var inlineCSS = '.book-call-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:99999;font-family:Montserrat,system-ui,Arial;background:transparent}.book-call-modal.show{display:flex}.book-call-overlay{position:absolute;inset:0;background:rgba(6,8,10,0.62);backdrop-filter:blur(6px);cursor:pointer;opacity:0;animation:fadeIn .18s forwards}.book-call-dialog{position:relative;max-width:560px;width:94%;background:#fff;border-radius:14px;padding:22px;box-shadow:0 26px 60px rgba(10,10,10,.36);transform:translateY(12px);opacity:0;animation:popIn .22s .06s forwards;overflow:hidden}.book-call-close{position:absolute;right:12px;top:12px;border:0;background:transparent;font-size:20px;cursor:pointer;color:#666}.book-call-inner h2{margin:0 0 8px;font-size:20px;color:#1f3533}.book-call-sub{margin:0 0 14px;color:#666}.bc-row{margin-bottom:12px}.bc-field{display:block;font-size:13px;color:#333}.bc-field input,.bc-field textarea{width:100%;padding:10px;border-radius:8px;border:1px solid #e9e9e9;margin-top:6px;font-size:14px;box-sizing:border-box}.bc-captcha{display:flex;align-items:center;gap:8px;color:#1f3533;font-weight:600}.bc-captcha input{width:60px}.actions{display:flex;gap:10px;align-items:center}.bc-submit{background:#1f3533;color:#fff;border:0;padding:10px 16px;border-radius:999px;cursor:pointer}.bc-secondary{background:transparent;border:1px solid #e5e5e5;padding:8px 14px;border-radius:999px;cursor:pointer}.bc-status{margin-top:8px;color:#0b6;min-height:18px}.bc-status.error{color:#b00}.bc-privacy{margin-top:12px;font-size:12px;color:#777}@keyframes popIn{to{transform:none;opacity:1}}@keyframes fadeIn{to{opacity:1}}';

  function insertCSS(){
    if(cssInserted) return;
    // Try external CSS first
    if(!document.querySelector('link[href*="book-call.css"]')){
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = cssPath;
      document.head.appendChild(l);
      console.log('[BookCall] External CSS link inserted');
    }
    // Also inject inline CSS as fallback (ensures it works even if external fails)
    if(!document.getElementById('book-call-inline-css')){
      var style = document.createElement('style');
      style.id = 'book-call-inline-css';
      style.textContent = inlineCSS;
      document.head.appendChild(style);
      console.log('[BookCall] Inline CSS inserted');
    }
    cssInserted = true;
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
    // Target buttons - using event delegation for reliability
    var selectors = ['.why-kasauli-button', '.tourism-action-button', '.book-call-btn'];

    // Use event delegation on document for maximum reliability
    document.addEventListener('click', function(e){
      var target = e.target;
      // Check if clicked element or its parent matches our selectors
      for(var i = 0; i < selectors.length; i++){
        if(target.matches && target.matches(selectors[i])){
          e.preventDefault();
          e.stopPropagation();
          console.log('[BookCall] Button clicked via delegation:', target);
          openModal();
          return false;
        }
        // Also check parent elements (in case button has child elements)
        var parent = target.closest ? target.closest(selectors[i]) : null;
        if(parent){
          e.preventDefault();
          e.stopPropagation();
          console.log('[BookCall] Button clicked via delegation (parent):', parent);
          openModal();
          return false;
        }
      }
    }, true); // Capture phase

    // Also attach directly to buttons as backup
    selectors.forEach(function(sel){
      var buttons = document.querySelectorAll(sel);
      console.log('[BookCall] Found ' + buttons.length + ' buttons for: ' + sel);
      buttons.forEach(function(btn){
        btn.addEventListener('click', handleButtonClick, true);
      });
    });

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
