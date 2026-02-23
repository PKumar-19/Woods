/**
 * Logo Scroll Controller
 *
 * Controls logo visibility based on scroll position relative to video section:
 * - While in video section: Show white logo only, disable logo switcher
 * - Past video section: Enable logo switcher (background color detector)
 *
 * Supports both native window scroll AND Smooth Scrollbar (custom scroller).
 *
 * Debug logs are included for troubleshooting.
 */

(function() {
    'use strict';

    const DEBUG = false; // Set to true to enable debug logs

    function log(...args) {
        if (DEBUG) {
            console.log('[LogoScrollController]', ...args);
        }
    }

    class LogoScrollController {
        constructor() {
            this.logo = null;
            this.videoSection = null;
            this.heroSection = null;
            this.isInVideoSection = true;
            this.lastScrollY = 0;
            this.ticking = false;
            this.videoSectionBottom = 0;
            this.smoothScrollbar = null;
            this.contentScroll = null;

            log('Initializing LogoScrollController');

            this.init();
        }

        init() {
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            log('Setting up...');

            // Get required elements
            this.logo = document.getElementById('clapat-logo');
            this.videoSection = document.querySelector('.bg-gif-woods');
            this.heroSection = document.getElementById('hero');
            this.contentScroll = document.getElementById('content-scroll');

            if (!this.logo) {
                log('ERROR: Logo element #clapat-logo not found!');
                return;
            }

            if (!this.videoSection && !this.heroSection) {
                log('ERROR: Neither .bg-gif-woods nor #hero found!');
                return;
            }

            log('Elements found:', {
                logo: !!this.logo,
                videoSection: !!this.videoSection,
                heroSection: !!this.heroSection,
                contentScroll: !!this.contentScroll
            });

            // Calculate video section boundaries
            this.calculateBoundaries();

            // Add scroll listener
            this.bindEvents();

            // Initial check - force white logo on load
            this.isInVideoSection = true;
            this.updateLogoState();

            // Add class to body for CSS targeting
            document.body.classList.add('logo-scroll-controller-active');

            log('Setup complete - starting with WHITE LOGO (in video section)');
        }

        calculateBoundaries() {
            // Use hero section to determine the video area
            const section = this.heroSection || this.videoSection;

            if (section) {
                // For smooth scrollbar, we use the element's offset relative to the scroll container
                // The hero section height is what we care about
                const rect = section.getBoundingClientRect();

                // Get current scroll position from smooth scrollbar if available
                let currentScroll = 0;
                if (this.smoothScrollbar) {
                    currentScroll = this.smoothScrollbar.offset.y;
                } else if (window.Scrollbar && this.contentScroll) {
                    this.smoothScrollbar = window.Scrollbar.get(this.contentScroll);
                    if (this.smoothScrollbar) {
                        currentScroll = this.smoothScrollbar.offset.y;
                    }
                }

                // Video section bottom = hero section height (since hero starts at top)
                // We use the hero's height as the threshold
                this.videoSectionBottom = section.offsetHeight;

                log('Video section boundaries calculated:', {
                    bottom: this.videoSectionBottom,
                    heroHeight: section.offsetHeight,
                    viewportHeight: window.innerHeight,
                    currentScroll: currentScroll,
                    hasSmoothScrollbar: !!this.smoothScrollbar
                });
            }
        }

        bindEvents() {
            // Listen for smoothScrollReady event (dispatched by the site's scroll system)
            document.addEventListener('smoothScrollReady', () => {
                log('smoothScrollReady event received');
                this.setupSmoothScrollbarListener();
            });

            // Also try to set up immediately in case smooth scrollbar is already ready
            setTimeout(() => {
                this.setupSmoothScrollbarListener();
            }, 200);

            // Fallback: Also listen for native scroll (in case smooth scrollbar isn't used)
            window.addEventListener('scroll', () => {
                if (!this.smoothScrollbar) {
                    this.lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
                    this.onScroll();
                }
            }, { passive: true });

            // Recalculate on resize
            window.addEventListener('resize', () => {
                this.calculateBoundaries();
                this.checkScrollPosition();
            }, { passive: true });

            log('Events bound');
        }

        setupSmoothScrollbarListener() {
            // Try to get the Smooth Scrollbar instance
            if (window.Scrollbar && this.contentScroll) {
                this.smoothScrollbar = window.Scrollbar.get(this.contentScroll);

                if (this.smoothScrollbar) {
                    log('Smooth Scrollbar found! Adding scroll listener.');

                    // Add scroll listener to smooth scrollbar
                    this.smoothScrollbar.addListener((status) => {
                        this.lastScrollY = status.offset.y;
                        this.onScroll();
                    });

                    // Recalculate boundaries now that we have the scrollbar
                    this.calculateBoundaries();

                    // Check current position
                    this.lastScrollY = this.smoothScrollbar.offset.y;
                    this.checkScrollPosition();
                } else {
                    log('Smooth Scrollbar not yet initialized on #content-scroll');
                }
            } else {
                log('Smooth Scrollbar library not found or #content-scroll missing');
            }
        }

        onScroll() {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.checkScrollPosition();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }

        checkScrollPosition() {
            const scrollY = this.lastScrollY;
            const wasInVideoSection = this.isInVideoSection;

            // Check if we've scrolled past the video section
            // Add a small offset (50px) to ensure smooth transition
            this.isInVideoSection = scrollY < (this.videoSectionBottom - 50);

            // Log scroll position more frequently for debugging the Why Kasauli section
            if (DEBUG && Math.random() < 0.15) { // Log ~15% of scroll events for better visibility
                const logoEl = document.getElementById('clapat-logo');
                log('Scroll check:', {
                    scrollY: Math.round(scrollY),
                    threshold: this.videoSectionBottom - 50,
                    isInVideoSection: this.isInVideoSection,
                    logoClasses: logoEl ? logoEl.className : 'not found',
                    bgDetectorEnabled: window.bgDetector ? !window.bgDetector.targets.find(t => t.selector === '#clapat-logo')?.disabled : 'no detector'
                });
            }

            // Only update if state changed
            if (wasInVideoSection !== this.isInVideoSection) {
                log('=== SCROLL STATE CHANGED ===', {
                    scrollY: Math.round(scrollY),
                    videoSectionBottom: this.videoSectionBottom,
                    isInVideoSection: this.isInVideoSection,
                    action: this.isInVideoSection ? 'SHOW WHITE LOGO ONLY' : 'ENABLE LOGO SWITCHER'
                });

                this.updateLogoState();
            }
        }

        updateLogoState() {
            if (!this.logo) return;

            if (this.isInVideoSection) {
                // In video section: Force white logo, disable switcher
                this.disableLogoSwitcher();
                log('Logo state: WHITE LOGO ONLY (in video section)');
            } else {
                // Past video section: Enable logo switcher
                this.enableLogoSwitcher();
                log('Logo state: SWITCHER ENABLED (past video section)');
            }
        }

        disableLogoSwitcher() {
            if (!this.logo) return;

            // Add class to indicate we're in video section
            this.logo.classList.add('in-video-section');
            this.logo.classList.remove('past-video-section');

            // Remove any detector-applied classes to show white logo
            this.logo.classList.remove('logo-dark', 'logo-light');

            // Force white logo via class
            this.logo.classList.add('force-white-logo');

            // Disable the background detector for logo if it exists
            if (window.bgDetector) {
                const logoTarget = window.bgDetector.targets.find(t => t.selector === '#clapat-logo');
                if (logoTarget) {
                    logoTarget.disabled = true;
                    log('Background detector DISABLED for logo');
                }
            }
        }

        enableLogoSwitcher() {
            if (!this.logo) return;

            // Add class to indicate we're past video section
            this.logo.classList.remove('in-video-section');
            this.logo.classList.add('past-video-section');

            // Remove forced white logo
            this.logo.classList.remove('force-white-logo');

            // Re-enable the background detector for logo if it exists
            if (window.bgDetector) {
                const logoTarget = window.bgDetector.targets.find(t => t.selector === '#clapat-logo');
                if (logoTarget) {
                    logoTarget.disabled = false;

                    // CRITICAL FIX: Reset currentMode to force detectAndUpdate to apply the class
                    // Without this, if the detected mode matches the old currentMode,
                    // no class would be applied (since detectAndUpdate only updates on change)
                    log('Resetting currentMode from:', logoTarget.currentMode, 'to null');
                    logoTarget.currentMode = null;

                    // Force an immediate update
                    window.bgDetector.detectAndUpdate(logoTarget);
                    log('Background detector ENABLED for logo, new mode:', logoTarget.currentMode);
                }
            }
        }

        // Public method to force recalculation (can be called externally)
        refresh() {
            log('Refresh called');
            this.setupSmoothScrollbarListener();
            this.calculateBoundaries();
            this.checkScrollPosition();
        }
    }

    // Initialize when ready
    let controller = null;

    function initController() {
        if (!controller) {
            controller = new LogoScrollController();
            // Expose globally for debugging
            window.logoScrollController = controller;
            log('Controller exposed globally as window.logoScrollController');
        }
    }

    // Try to init as early as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initController);
    } else {
        // Small delay to ensure other scripts have loaded
        setTimeout(initController, 50);
    }

    // Also init after full page load as a fallback
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (controller) {
                controller.refresh();
            } else {
                initController();
            }
        }, 100);
    });

})();
