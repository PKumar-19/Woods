/* Book Call modal + form logic (submits to contact.php)
*/
(function(global){
  // Utility validators
  function isValidEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email||'').trim()); }
  function isValidPhone(phone){ return /^[0-9+\s-]{7,20}$/.test((phone||'').trim()); }

  function showStatus(el, msg, isError){ if(!el) return; el.textContent = msg||''; el.classList.toggle('error', !!isError); }

  // Modal behaviour
  function initModal(modal){
    if(!modal) return;
    var overlay = modal.querySelector('.book-call-overlay');
    var closeEls = modal.querySelectorAll('[data-action="close"]');
    function close(){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }
    function open(){
      modal.style.display = ''; // Remove inline display:none (FOUC prevention)
      modal.classList.add('show');
      modal.setAttribute('aria-hidden','false');
      // Reset form and regenerate captcha on open
      var form = modal.querySelector('#bookCallForm');
      if(form) form.reset();
      var statusEl = modal.querySelector('#bc-status');
      if(statusEl) showStatus(statusEl, '', false);
      setModalCaptcha();
      setTimeout(function(){ var f = modal.querySelector('input,textarea,button'); if(f) f.focus(); }, 60);
    }
    overlay && overlay.addEventListener('click', close);
    closeEls && closeEls.forEach(function(btn){ btn.addEventListener('click', close); });
    return {open: open, close: close};
  }

  // Set captcha numbers
  function setModalCaptcha(){
    var c1 = document.getElementById('bc-c1'), c2 = document.getElementById('bc-c2'), bcCaptcha = document.getElementById('bc-captcha');
    if(c1 && c2 && bcCaptcha){
      var a = Math.floor(Math.random()*6)+1, b = Math.floor(Math.random()*6)+1;
      c1.textContent = a;
      c2.textContent = b;
      bcCaptcha.dataset.expected = (a+b);
    }
  }

  // Google Apps Script Web App URL
  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvPF_AXd4aXTCDYly4RZe_QVYKCc90RJ4rdtTyya05nJ7Gx6LVnM0hgkfAr_Sj2pMzTw/exec';

  // POST to Google Apps Script
  function postToGoogleScript(data, statusEl, isModal){
    var payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message || '',
      pageUrl: window.location.href
    };

    // Use URLSearchParams for form-encoded data (works with no-cors)
    var formBody = new URLSearchParams(payload).toString();

    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for Google Apps Script
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody
    })
      .then(function(){
        // With no-cors mode, we can't read the response
        // but if we get here without an error, the request was sent
        showStatus(statusEl,'Thanks — request received. We will contact you shortly.');
        if(isModal){
          setTimeout(function(){
            if(global.BookCallModal && global.BookCallModal.close) global.BookCallModal.close();
          }, 2500);
        } else {
          // Hide success message after 5 seconds for non-modal forms
          setTimeout(function(){
            showStatus(statusEl, '', false);
          }, 5000);
        }
      })
      .catch(function(){
        showStatus(statusEl,'Could not send form — please try again.', true);
      });
  }

  // Generic form handler used for both modal and the existing contact form
  function attachFormHandler(formEl, isModal){
    if(!formEl) return;
    var statusEl = isModal ? formEl.querySelector('#bc-status') : document.getElementById('message');

    function computeCaptchaExpected(form){
      // For contactform - parse verify-sum UL
      var verifySum = form.querySelector('.verify-sum');
      if(verifySum){
        var nums = verifySum.querySelectorAll('li');
        var sum = 0;
        for(var i=0;i<nums.length;i++){
          var n = parseInt(nums[i].textContent,10);
          if(!isNaN(n)) sum += n;
        }
        return sum;
      }
      return null;
    }

    formEl.addEventListener('submit', function(e){
      e.preventDefault();
      showStatus(statusEl, '', false);

      var data = {};
      var captcha, expected;

      if(isModal){
        data.name = (formEl.querySelector('#bc-name').value||'').trim();
        data.email = (formEl.querySelector('#bc-email').value||'').trim();
        data.phone = (formEl.querySelector('#bc-phone').value||'').trim();
        // No captcha for modal form
        captcha = null;
        expected = null;
      } else {
        data.name = (formEl.querySelector('[name="name"]').value||'').trim();
        data.email = (formEl.querySelector('[name="email"]').value||'').trim();
        data.phone = (formEl.querySelector('[name="comments"]').value||'').trim();
        data.message = '';
        captcha = (formEl.querySelector('[name="verify"]').value||'').trim();
        expected = computeCaptchaExpected(formEl);
      }

      // Validation
      if(!data.name || data.name.length < 2){ showStatus(statusEl,'Please enter a valid name', true); return; }
      if(!isValidEmail(data.email)){ showStatus(statusEl,'Please enter a valid email', true); return; }
      if(!data.phone || !isValidPhone(data.phone)){ showStatus(statusEl,'Please enter a valid phone number', true); return; }
      if(expected !== null && (captcha === '' || parseInt(captcha,10) !== parseInt(expected,10))){
        showStatus(statusEl,'Captcha answer is incorrect', true);
        return;
      }

      // Show sending status
      showStatus(statusEl, 'Sending...', false);

      // Submit to contact.php
      postToGoogleScript(data, statusEl, isModal);
    });
  }

  // Public init that will be called after component is loaded/lazy-inserted
  function initComponent(){
    var modal = document.getElementById('bookCallModal');
    var modalApi = initModal(modal);
    if(modalApi) global.BookCallModal = modalApi;

    // Set initial captcha
    setModalCaptcha();

    // Attach modal form handler
    var bookForm = document.getElementById('bookCallForm');
    if(bookForm) attachFormHandler(bookForm, true);

    // Attach to existing page contact form if present
    var contactForm = document.getElementById('contactform');
    if(contactForm) attachFormHandler(contactForm, false);
  }

  // If the component was already loaded into DOM when script ran, init now
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(initComponent, 120);
  } else {
    document.addEventListener('DOMContentLoaded', initComponent, {once:true});
  }

})(window);
