/**
 * jQuery Animations Module
 * ========================
 * Hybrid animation system that works alongside GSAP
 * - Simple animations (fade, slide) handled by jQuery
 * - Complex scroll-triggered animations remain in GSAP
 * - Centralized JS ready detection for preloader
 *
 * @requires jQuery 3.x+
 * @requires GSAP (for scroll-triggered animations)
 */

(function($, window, document) {
    'use strict';

    // ============================================
    // NAMESPACE: WoodsAnimations
    // ============================================
    var WoodsAnimations = window.WoodsAnimations = window.WoodsAnimations || {};

    // ============================================
    // JS READY DETECTION SYSTEM
    // Tracks when all critical scripts are loaded
    // ============================================
    WoodsAnimations.ReadyState = {
        // Track individual module readiness
        modules: {
            jquery: false,
            gsap: false,
            scrollTrigger: false,
            imagesLoaded: false,
            infiniteScroll: false,
            faq: false,
            tourismScroll: false,
            customAnimations: false
        },

        // Callbacks to run when all ready
        _callbacks: [],

        // Check if a module is ready
        isModuleReady: function(moduleName) {
            return this.modules[moduleName] === true;
        },

        // Mark a module as ready
        setModuleReady: function(moduleName) {
            if (this.modules.hasOwnProperty(moduleName)) {
                this.modules[moduleName] = true;
                this._checkAllReady();
            }
        },

        // Check if all critical modules are ready
        isAllReady: function() {
            var criticalModules = ['jquery', 'gsap', 'scrollTrigger', 'imagesLoaded'];
            for (var i = 0; i < criticalModules.length; i++) {
                if (!this.modules[criticalModules[i]]) {
                    return false;
                }
            }
            return true;
        },

        // Register a callback for when all modules are ready
        onReady: function(callback) {
            if (typeof callback === 'function') {
                if (this.isAllReady()) {
                    callback();
                } else {
                    this._callbacks.push(callback);
                }
            }
        },

        // Internal: Check and fire callbacks when ready
        _checkAllReady: function() {
            if (this.isAllReady()) {
                var callbacks = this._callbacks.slice();
                this._callbacks = [];
                for (var i = 0; i < callbacks.length; i++) {
                    try {
                        callbacks[i]();
                    } catch (e) {
                        console.error('WoodsAnimations.ReadyState callback error:', e);
                    }
                }
            }
        },

        // Get ready status summary
        getStatus: function() {
            var ready = [];
            var pending = [];
            for (var key in this.modules) {
                if (this.modules[key]) {
                    ready.push(key);
                } else {
                    pending.push(key);
                }
            }
            return { ready: ready, pending: pending, allReady: this.isAllReady() };
        }
    };

    // ============================================
    // JQUERY ANIMATION UTILITIES
    // Simple animations that don't need GSAP
    // ============================================
    WoodsAnimations.Animate = {
        // Default easing (jQuery UI provides more options if loaded)
        defaultEasing: 'swing',
        defaultDuration: 400,

        /**
         * Fade in element with optional delay
         * @param {jQuery|string} element - Element or selector
         * @param {Object} options - { duration, delay, easing, callback }
         */
        fadeIn: function(element, options) {
            options = $.extend({
                duration: this.defaultDuration,
                delay: 0,
                easing: this.defaultEasing,
                callback: null
            }, options);

            var $el = $(element);
            if (options.delay > 0) {
                $el.delay(options.delay);
            }
            $el.fadeIn(options.duration, options.easing, options.callback);
            return $el;
        },

        /**
         * Fade out element with optional delay
         * @param {jQuery|string} element - Element or selector
         * @param {Object} options - { duration, delay, easing, callback }
         */
        fadeOut: function(element, options) {
            options = $.extend({
                duration: this.defaultDuration,
                delay: 0,
                easing: this.defaultEasing,
                callback: null
            }, options);

            var $el = $(element);
            if (options.delay > 0) {
                $el.delay(options.delay);
            }
            $el.fadeOut(options.duration, options.easing, options.callback);
            return $el;
        },

        /**
         * Slide up (collapse) with fade
         * @param {jQuery|string} element - Element or selector
         * @param {Object} options - { duration, delay, easing, callback }
         */
        slideUpFade: function(element, options) {
            options = $.extend({
                duration: this.defaultDuration,
                delay: 0,
                easing: this.defaultEasing,
                callback: null
            }, options);

            var $el = $(element);
            if (options.delay > 0) {
                setTimeout(function() {
                    $el.slideUp(options.duration, options.easing, options.callback);
                }, options.delay);
            } else {
                $el.slideUp(options.duration, options.easing, options.callback);
            }
            return $el;
        },

        /**
         * Slide down (expand) with fade
         * @param {jQuery|string} element - Element or selector
         * @param {Object} options - { duration, delay, easing, callback }
         */
        slideDownFade: function(element, options) {
            options = $.extend({
                duration: this.defaultDuration,
                delay: 0,
                easing: this.defaultEasing,
                callback: null
            }, options);

            var $el = $(element);
            if (options.delay > 0) {
                setTimeout(function() {
                    $el.slideDown(options.duration, options.easing, options.callback);
                }, options.delay);
            } else {
                $el.slideDown(options.duration, options.easing, options.callback);
            }
            return $el;
        },

        /**
         * Animate CSS properties with jQuery
         * For transforms, use CSS classes instead (better performance)
         * @param {jQuery|string} element - Element or selector
         * @param {Object} props - CSS properties to animate
         * @param {Object} options - { duration, delay, easing, callback }
         */
        animate: function(element, props, options) {
            options = $.extend({
                duration: this.defaultDuration,
                delay: 0,
                easing: this.defaultEasing,
                callback: null
            }, options);

            var $el = $(element);
            if (options.delay > 0) {
                $el.delay(options.delay);
            }
            $el.animate(props, options.duration, options.easing, options.callback);
            return $el;
        },

        /**
         * Add CSS class with transition (CSS handles the animation)
         * Better for transform-based animations
         * @param {jQuery|string} element - Element or selector
         * @param {string} className - Class to add
         * @param {number} delay - Delay before adding class (ms)
         */
        addClassWithDelay: function(element, className, delay) {
            var $el = $(element);
            if (delay > 0) {
                setTimeout(function() {
                    $el.addClass(className);
                }, delay);
            } else {
                $el.addClass(className);
            }
            return $el;
        },

        /**
         * Remove CSS class with transition
         * @param {jQuery|string} element - Element or selector
         * @param {string} className - Class to remove
         * @param {number} delay - Delay before removing class (ms)
         */
        removeClassWithDelay: function(element, className, delay) {
            var $el = $(element);
            if (delay > 0) {
                setTimeout(function() {
                    $el.removeClass(className);
                }, delay);
            } else {
                $el.removeClass(className);
            }
            return $el;
        },

        /**
         * Staggered animation for multiple elements
         * @param {jQuery|string} elements - Elements or selector
         * @param {string} animationType - 'fadeIn', 'fadeOut', 'addClass', 'removeClass'
         * @param {Object} options - { staggerDelay, duration, className, callback }
         */
        stagger: function(elements, animationType, options) {
            options = $.extend({
                staggerDelay: 100,
                duration: this.defaultDuration,
                className: 'animated',
                callback: null
            }, options);

            var $els = $(elements);
            var self = this;
            var completed = 0;

            $els.each(function(index) {
                var $el = $(this);
                var delay = index * options.staggerDelay;

                switch (animationType) {
                    case 'fadeIn':
                        self.fadeIn($el, { duration: options.duration, delay: delay });
                        break;
                    case 'fadeOut':
                        self.fadeOut($el, { duration: options.duration, delay: delay });
                        break;
                    case 'addClass':
                        self.addClassWithDelay($el, options.className, delay);
                        break;
                    case 'removeClass':
                        self.removeClassWithDelay($el, options.className, delay);
                        break;
                }

                // Track completion for callback
                if (options.callback) {
                    setTimeout(function() {
                        completed++;
                        if (completed === $els.length) {
                            options.callback();
                        }
                    }, delay + options.duration);
                }
            });

            return $els;
        }
    };

    // ============================================
    // PRELOADER CONTROLLER
    // jQuery-based preloader with JS ready detection
    // ============================================
    WoodsAnimations.Preloader = {
        // Configuration
        config: {
            minDisplayTime: 2000,      // Minimum time to show preloader (ms)
            maxWaitTime: 8000,         // Maximum wait time for JS (ms)
            checkInterval: 100,        // How often to check if JS is ready (ms)
            countdownDuration: 3000    // Duration of 0-99 countdown (ms)
        },

        // State
        _startTime: null,
        _checkInterval: null,
        _completed: false,

        /**
         * Initialize preloader
         */
        init: function() {
            this._startTime = Date.now();
            this._startCountdown();
            this._waitForJS();
        },

        /**
         * Start the countdown animation (0-99) using jQuery
         */
        _startCountdown: function() {
            var self = this;
            var $number2 = $('.number_2');
            var $number3 = $('.number_3');
            var $percentageFirst = $('.percentage-first');

            // Calculate animation duration
            var duration = this.config.countdownDuration;

            // Animate first digit column (0-9)
            $number2.css({
                'transition': 'transform ' + (duration * 0.8) + 'ms cubic-bezier(0.19, 1, 0.22, 1)',
                'transform': 'translateY(-90%)'
            });

            // Animate second digit column (0-9) with slight delay
            setTimeout(function() {
                $number3.css({
                    'transition': 'transform ' + (duration * 0.85) + 'ms cubic-bezier(0.19, 1, 0.22, 1)',
                    'transform': 'translateY(-90%)'
                });
            }, 200);

            // Show "wait, wait.." text briefly then hide
            setTimeout(function() {
                $percentageFirst.find('span').css({
                    'transition': 'transform 1s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.5s ease',
                    'transform': 'translateY(0)',
                    'opacity': '1'
                });
            }, duration - 1000);
        },

        /**
         * Wait for all JS modules to be ready
         */
        _waitForJS: function() {
            var self = this;
            var startTime = Date.now();

            // Poll for JS readiness
            this._checkInterval = setInterval(function() {
                var elapsed = Date.now() - startTime;
                var minTimeElapsed = elapsed >= self.config.minDisplayTime;
                var jsReady = WoodsAnimations.ReadyState.isAllReady();
                var maxTimeReached = elapsed >= self.config.maxWaitTime;

                // Complete when: (min time passed AND JS ready) OR max time reached
                if ((minTimeElapsed && jsReady) || maxTimeReached) {
                    clearInterval(self._checkInterval);
                    self._complete();
                }
            }, this.config.checkInterval);
        },

        /**
         * Complete the preloader and reveal content
         */
        _complete: function() {
            if (this._completed) return;
            this._completed = true;

            var $percentage = $('.percentage');
            var $percentageFirst = $('.percentage-first');
            var $percentageLast = $('.percentage-last');
            var $preloaderWrap = $('.preloader-wrap');
            var wrapperHeight = $('.percentage-wrapper').height();

            // Animate 99 -> 100 transition using jQuery
            $percentage.add($percentageFirst).animate({
                opacity: 0
            }, {
                duration: 500,
                easing: 'swing',
                step: function(now, fx) {
                    // Also animate Y position using CSS transform
                    if (fx.prop === 'opacity') {
                        $(this).css('transform', 'translateY(' + (-wrapperHeight * (1 - now)) + 'px)');
                    }
                }
            });

            // Show 100
            $percentageLast.find('span').delay(200).animate({
                opacity: 1
            }, {
                duration: 800,
                easing: 'swing',
                start: function() {
                    $(this).css('transform', 'translateY(0)');
                }
            });

            // Fade out 100 after showing
            setTimeout(function() {
                $percentageLast.animate({
                    opacity: 0
                }, {
                    duration: 500,
                    easing: 'swing',
                    step: function(now, fx) {
                        if (fx.prop === 'opacity') {
                            $(this).css('transform', 'translateY(' + (-30 * (1 - now)) + 'px)');
                        }
                    }
                });
            }, 1000);

            // Hide preloader wrapper
            setTimeout(function() {
                $preloaderWrap.animate({ opacity: 0 }, {
                    duration: 300,
                    complete: function() {
                        $(this).css({
                            'visibility': 'hidden',
                            'transform': 'translateY(-100%)'
                        });

                        // Trigger content reveal
                        WoodsAnimations.Preloader._revealContent();
                    }
                });
            }, 300);
        },

        /**
         * Reveal page content after preloader hides
         */
        _revealContent: function() {
            // Use GSAP for complex content animations if available
            // Fall back to jQuery for simple ones
            if (typeof gsap !== 'undefined') {
                // GSAP handles complex hero animations
                // This is called from scripts.js initOnFirstLoad()
                $(document).trigger('preloader:complete');
            } else {
                // jQuery fallback for content reveal
                var $heroTitle = $('.hero-title.caption-timeline span');
                var $heroFooter = $('.hero-footer-left, .hero-footer-right');
                var $header = $('.clapat-header');
                var $mainContent = $('#main-page-content, #page-nav');

                // Animate header
                $header.css({
                    'transition': 'transform 0.45s ease-out, opacity 0.45s ease-out',
                    'transform': 'translateY(0)',
                    'opacity': '1'
                });

                // Animate hero title spans with stagger
                $heroTitle.each(function(index) {
                    var $span = $(this);
                    setTimeout(function() {
                        $span.css({
                            'transition': 'transform 0.5s ease-out, opacity 0.5s ease-out',
                            'transform': 'translateY(0)',
                            'opacity': '1'
                        });
                    }, 600 + (index * 50));
                });

                // Animate hero footer
                setTimeout(function() {
                    $heroFooter.css({
                        'transition': 'transform 0.3s ease-out, opacity 0.3s ease-out',
                        'transform': 'translateY(0)',
                        'opacity': '1'
                    });
                }, 800);

                // Fade in main content
                $mainContent.delay(500).animate({ opacity: 1 }, 1700);

                $(document).trigger('preloader:complete');
            }
        },

        /**
         * Force complete preloader (for error recovery)
         */
        forceComplete: function() {
            if (this._checkInterval) {
                clearInterval(this._checkInterval);
            }
            this._complete();
        }
    };

    // ============================================
    // SCROLL ANIMATIONS (jQuery-compatible subset)
    // For simple reveal animations that don't need scrub
    // ============================================
    WoodsAnimations.ScrollReveal = {
        // Elements to observe
        _observers: [],

        /**
         * Initialize scroll reveal for elements
         * Uses IntersectionObserver for performance
         * @param {string} selector - Elements to animate
         * @param {Object} options - { threshold, rootMargin, className, stagger }
         */
        init: function(selector, options) {
            options = $.extend({
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px',
                className: 'animated',
                stagger: false,
                staggerDelay: 100
            }, options);

            var $elements = $(selector);
            if ($elements.length === 0) return;

            // Use IntersectionObserver if available (modern browsers)
            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            var $el = $(entry.target);

                            if (options.stagger) {
                                var index = $el.data('reveal-index') || 0;
                                setTimeout(function() {
                                    $el.addClass(options.className);
                                }, index * options.staggerDelay);
                            } else {
                                $el.addClass(options.className);
                            }

                            // Unobserve after animation (one-time reveal)
                            observer.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: options.threshold,
                    rootMargin: options.rootMargin
                });

                // Observe each element
                $elements.each(function(index) {
                    $(this).data('reveal-index', index);
                    observer.observe(this);
                });

                this._observers.push(observer);
            } else {
                // Fallback: Add class immediately for older browsers
                $elements.addClass(options.className);
            }
        },

        /**
         * Disconnect all observers (cleanup)
         */
        destroy: function() {
            this._observers.forEach(function(observer) {
                observer.disconnect();
            });
            this._observers = [];
        }
    };

    // ============================================
    // INITIALIZATION
    // Auto-detect and mark modules as ready
    // ============================================

    // jQuery is ready (this file is loaded)
    WoodsAnimations.ReadyState.setModuleReady('jquery');

    // Check GSAP on DOM ready
    $(document).ready(function() {
        // Check GSAP
        if (typeof gsap !== 'undefined') {
            WoodsAnimations.ReadyState.setModuleReady('gsap');
        }

        // Check ScrollTrigger
        if (typeof ScrollTrigger !== 'undefined') {
            WoodsAnimations.ReadyState.setModuleReady('scrollTrigger');
        }

        // Check imagesLoaded
        if (typeof imagesLoaded !== 'undefined') {
            WoodsAnimations.ReadyState.setModuleReady('imagesLoaded');
        }

        // Mark custom animations as ready after a short delay
        // (allows other scripts to initialize)
        setTimeout(function() {
            WoodsAnimations.ReadyState.setModuleReady('customAnimations');
        }, 100);
    });

    // Check for infinite scroll ready (set by infinite-scroll.js)
    var infiniteScrollCheck = setInterval(function() {
        if (window.portfolioLightboxReady === true) {
            WoodsAnimations.ReadyState.setModuleReady('infiniteScroll');
            clearInterval(infiniteScrollCheck);
        }
    }, 50);

    // Timeout for infinite scroll check
    setTimeout(function() {
        clearInterval(infiniteScrollCheck);
        // Mark as ready anyway after timeout to prevent blocking
        if (!WoodsAnimations.ReadyState.isModuleReady('infiniteScroll')) {
            WoodsAnimations.ReadyState.setModuleReady('infiniteScroll');
        }
    }, 5000);

    // Export for global access
    window.WoodsAnimations = WoodsAnimations;

})(jQuery, window, document);
