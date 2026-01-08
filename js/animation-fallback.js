/**
 * Animation Fallback System
 * ==========================
 * Ensures all animated elements become visible even if ScrollTrigger fails.
 * This handles race conditions where animations don't trigger due to timing issues.
 */

(function() {
    'use strict';

    // Configuration
    var FALLBACK_DELAY = 4000; // Wait 4 seconds before forcing visibility
    var CHECK_INTERVAL = 500;  // Check every 500ms

    /**
     * Force visibility on elements that should be animated but aren't
     */
    function forceVisibilityFallback() {
        console.log('Animation Fallback: Checking for stuck elements...');

        // 1. Fix .has-animation elements that haven't animated
        var hasAnimationElements = document.querySelectorAll('.has-animation:not(.animated)');
        hasAnimationElements.forEach(function(el) {
            var rect = el.getBoundingClientRect();
            // If element is in viewport but not animated, force it
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add('animated');
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                console.log('Animation Fallback: Forced visibility on .has-animation element');
            }
        });

        // 2. Fix .has-shuffle elements with opacity:0 spans
        var hasShuffleElements = document.querySelectorAll('.has-shuffle');
        hasShuffleElements.forEach(function(shuffleEl) {
            var rect = shuffleEl.getBoundingClientRect();
            // If element is in viewport
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                var spans = shuffleEl.querySelectorAll('span');
                spans.forEach(function(span) {
                    var computedOpacity = window.getComputedStyle(span).opacity;
                    if (parseFloat(computedOpacity) < 0.5) {
                        span.style.opacity = '1';
                        console.log('Animation Fallback: Forced visibility on .has-shuffle span');
                    }
                });
                if (!shuffleEl.classList.contains('animated')) {
                    shuffleEl.classList.add('animated');
                }
            }
        });

        // 3. Fix snap-slider images (amenities section)
        var snapSlideImgMasks = document.querySelectorAll('.snap-slide .img-mask');
        snapSlideImgMasks.forEach(function(mask) {
            var rect = mask.getBoundingClientRect();
            // If element is in viewport
            if (rect.top < window.innerHeight + 200 && rect.bottom > -200) {
                var computedOpacity = window.getComputedStyle(mask).opacity;
                if (parseFloat(computedOpacity) < 0.5) {
                    mask.style.opacity = '1';
                    console.log('Animation Fallback: Forced visibility on snap-slide img-mask');
                }
            }
        });

        // 4. Fix "Why" and "Kasauli" text elements
        var whyEl = document.getElementById('why');
        var kasauliEl = document.getElementById('tourism-hero-title');
        if (whyEl) {
            var computedOpacity = window.getComputedStyle(whyEl).opacity;
            if (parseFloat(computedOpacity) < 0.5) {
                whyEl.style.opacity = '1';
                whyEl.style.transform = 'translateY(0)';
                console.log('Animation Fallback: Forced visibility on #why');
            }
        }
        if (kasauliEl) {
            var computedOpacity = window.getComputedStyle(kasauliEl).opacity;
            if (parseFloat(computedOpacity) < 0.5) {
                kasauliEl.style.opacity = '1';
                console.log('Animation Fallback: Forced visibility on #tourism-hero-title');
            }
        }

        // 5. Fix serenity label and rotator
        var serenityLabel = document.querySelector('.serenity-label');
        var serenityRotator = document.querySelector('.serenity-rotator');
        [serenityLabel, serenityRotator].forEach(function(el) {
            if (el) {
                var rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    var computedOpacity = window.getComputedStyle(el).opacity;
                    if (parseFloat(computedOpacity) < 0.5) {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                        console.log('Animation Fallback: Forced visibility on serenity element');
                    }
                }
            }
        });

        // 6. Fix Kasauli house section content
        var kasauliSection = document.getElementById('Kasauli_house_in_woods_section');
        if (kasauliSection) {
            var sectionElements = kasauliSection.querySelectorAll('.has-animation:not(.animated)');
            sectionElements.forEach(function(el) {
                el.classList.add('animated');
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        }

        // 7. Fix clipped-image (map section)
        var clippedImages = document.querySelectorAll('.clipped-image');
        clippedImages.forEach(function(el) {
            var rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                // Ensure the map iframe is visible
                var iframe = el.querySelector('iframe');
                if (iframe) {
                    iframe.style.opacity = '1';
                }
            }
        });
    }

    /**
     * Continuous check for elements that become visible but aren't animated
     */
    function continuousVisibilityCheck() {
        // Only check elements that are currently in viewport
        var elementsToCheck = [
            '.has-animation:not(.animated)',
            '.has-shuffle:not(.animated)',
            '.snap-slide .img-mask'
        ];

        elementsToCheck.forEach(function(selector) {
            var elements = document.querySelectorAll(selector);
            elements.forEach(function(el) {
                var rect = el.getBoundingClientRect();
                // Element is in viewport
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    var computedOpacity = window.getComputedStyle(el).opacity;
                    // If opacity is too low after being in viewport for a while
                    if (parseFloat(computedOpacity) < 0.3) {
                        // Mark for fallback on next check
                        var checkCount = parseInt(el.getAttribute('data-fallback-check') || '0');
                        el.setAttribute('data-fallback-check', checkCount + 1);

                        // If element has been stuck for 3+ checks (1.5+ seconds), force visibility
                        if (checkCount >= 3) {
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                            if (el.classList.contains('has-animation')) {
                                el.classList.add('animated');
                            }
                            el.removeAttribute('data-fallback-check');
                            console.log('Animation Fallback: Forced stuck element visible');
                        }
                    }
                }
            });
        });
    }

    // Initialize fallback system
    function init() {
        // Initial fallback after delay
        setTimeout(forceVisibilityFallback, FALLBACK_DELAY);

        // Additional fallback on scroll (debounced)
        var scrollTimeout = null;
        window.addEventListener('scroll', function() {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                continuousVisibilityCheck();
            }, 200);
        }, { passive: true });

        // Periodic check for stuck elements
        setInterval(continuousVisibilityCheck, CHECK_INTERVAL);

        // Also run on visibility change (tab becomes active)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                setTimeout(forceVisibilityFallback, 500);
            }
        });

        console.log('Animation Fallback: System initialized');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
