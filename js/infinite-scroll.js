/* ============================================
   INFINITE SCROLL PORTFOLIO - JAVASCRIPT
   Smooth RAF-based animation with speed transitions
   ============================================ */

// Get diagnostics logger (created in scripts.js)
function getInfiniteScrollDiag() {
    if (window.WoodsLoadDiagnostics) return window.WoodsLoadDiagnostics;
    // Fallback if scripts.js hasn't loaded yet
    return {
        log: function(s, m, d) { console.log('[INFINITE_SCROLL] [' + s + '] ' + m, d || ''); },
        milestone: function(n) { console.log('%c[INFINITE_SCROLL MILESTONE] ' + n, 'background: #5a1e8a; color: #fff; padding: 2px 8px;'); },
        warn: function(s, m, d) { console.warn('[INFINITE_SCROLL] [' + s + '] ' + m, d || ''); },
        error: function(s, m, d) { console.error('[INFINITE_SCROLL] [' + s + '] ' + m, d || ''); }
    };
}

var infiniteScrollDiag = getInfiniteScrollDiag();
infiniteScrollDiag.log('INIT', 'infinite-scroll.js loaded');

// Track global mouse position for checking cursor location when lightbox closes
window.mouseX = 0;
window.mouseY = 0;
document.addEventListener('mousemove', (e) => {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
});

/**
 * Project Data
 */
const projects = [
    // {
    //     year: '',
    //     title: 'Front Elevation',
    //     imageClass: 'front-elevation',
    //     mockupImage: 'images/Project_Overview/icons-project-overview/Front-Elevation-8.png'
    // },
    // {
    //     year: '',
    //     title: 'Rear Elevation',
    //     imageClass: 'rear-elevation',
    //     mockupImage: 'images/Project_Overview/icons-project-overview/Rear-Elevation-8.png'
    // },
    {
        year: '',
        title: 'Site Layout',
        imageClass: 'site-layout',
        mockupImage: 'images/Project_Overview/icons-project-overview/Site-Layout-8.png'
    },
    {
        year: '',
        title: 'Ground Floor Layout',
        imageClass: 'ground-floor',
        mockupImage: 'images/Project_Overview/icons-project-overview/Ground-Floor-8.png'
    },
    {
        year: '',
        title: 'First Floor Layout',
        imageClass: 'first-floor',
        mockupImage: 'images/Project_Overview/icons-project-overview/First-Floor-8.png'
    },
    {
        year: '',
        title: 'Second Floor Layout',
        imageClass: 'second-floor',
        mockupImage: 'images/Project_Overview/icons-project-overview/Second-Floor-8.png'
    }
];

/**
 * Configuration
 */
const CONFIG = {
    normalSpeed: 50,        // pixels per second (normal scroll)
    boostMultiplier: 4,     // speed multiplier when boosted
    boostDuration: 800,     // how long boost lasts (ms) on click
    holdBoostDelay: 200,    // delay before returning to normal after release
    speedTransition: 0.08   // smoothness of speed change (0.01 = very smooth, 0.2 = snappy)
};

/**
 * Animation State
 */
const state = {
    position: 0,
    currentSpeed: CONFIG.normalSpeed,
    targetSpeed: CONFIG.normalSpeed,
    direction: -1,           // -1 = left (normal), 1 = right
    targetDirection: -1,
    halfWidth: 0,
    isHolding: false,
    isPaused: false,
    lightboxOpen: false,     // Track if lightbox is open
    lastTime: 0,
    animationId: null,
    boostTimeout: null
};

let scrollTrack = null;
let scrollLeftBtn = null;
let scrollRightBtn = null;

/**
 * Create a single project card HTML
 */
function createCard(project) {
    const imageContent = project.image
        ? `<img src="${project.image}" alt="${project.title}" loading="lazy">`
        : '';

    const imageClass = project.imageClass || '';

    const mockupContent = project.mockupImage
        ? `<img src="${project.mockupImage}" alt="${project.title} mockup" class="mockup-image" loading="lazy">`
        : '<div class="laptop-mockup"></div>';

    return `
        <div class="project-card">
            <div class="card-image ${imageClass}">${imageContent}</div>
            <div class="card-content">
                <div class="card-info">
                    <span class="card-year">${project.year}</span>
                    <h3 class="card-title">${project.title}</h3>
                </div>
                <div class="card-mockup">
                    ${mockupContent}
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize the scroll track with cards
 */
function initScrollTrack() {
    scrollTrack = document.getElementById('scrollTrack');
    if (!scrollTrack) {
        console.error('Scroll track element not found');
        return false;
    }
    
    // Create cards HTML - duplicate for seamless infinite scroll
    const cardsHTML = projects.map(project => createCard(project)).join('');
    scrollTrack.innerHTML = cardsHTML + cardsHTML;
    
    // Remove CSS animation - we'll handle it with JS
    scrollTrack.style.animation = 'none';
    scrollTrack.style.transform = 'translateX(0px)';
    
    // Calculate half width after content is rendered
    requestAnimationFrame(() => {
        state.halfWidth = scrollTrack.scrollWidth / 2;
    });
    
    return true;
}

/**
 * Smooth linear interpolation
 */
function lerp(current, target, factor) {
    const diff = target - current;
    if (Math.abs(diff) < 0.01) return target;
    return current + diff * factor;
}

/**
 * Main animation loop
 */
function animate(currentTime) {
    if (!state.lastTime) state.lastTime = currentTime;
    const deltaTime = (currentTime - state.lastTime) / 1000; // Convert to seconds
    state.lastTime = currentTime;
    
    // Skip if paused or invalid delta
    if (state.isPaused || deltaTime > 0.1) {
        state.animationId = requestAnimationFrame(animate);
        return;
    }
    
    // Smoothly transition speed
    state.currentSpeed = lerp(state.currentSpeed, state.targetSpeed, CONFIG.speedTransition);
    
    // Smoothly transition direction (-1 or 1)
    // We use speed to handle direction changes smoothly
    const effectiveSpeed = state.currentSpeed * state.direction;
    
    // Update position
    state.position += effectiveSpeed * deltaTime;
    
    // Seamless loop - wrap position when it goes past half width
    if (state.halfWidth > 0) {
        if (state.position <= -state.halfWidth) {
            state.position += state.halfWidth;
        } else if (state.position >= 0) {
            state.position -= state.halfWidth;
        }
    }
    
    // Apply transform with hardware acceleration
    scrollTrack.style.transform = `translateX(${state.position}px)`;
    
    // Continue animation loop
    state.animationId = requestAnimationFrame(animate);
}

/**
 * Boost scroll speed in given direction
 */
function boostScroll(direction) {
    // Clear any pending return to normal
    if (state.boostTimeout) {
        clearTimeout(state.boostTimeout);
        state.boostTimeout = null;
    }

    // Update button states
    scrollLeftBtn.classList.remove('active');
    scrollRightBtn.classList.remove('active');

    if (direction === 'left') {
        // Left button: Reverse direction temporarily (scroll backwards)
        state.direction = 1; // Reverse to right (opposite of normal -1)
        state.targetSpeed = CONFIG.normalSpeed * CONFIG.boostMultiplier;
        scrollLeftBtn.classList.add('active');
    } else if (direction === 'right') {
        // Right button: Keep normal direction but increase speed
        state.direction = -1; // Keep normal left direction
        state.targetSpeed = CONFIG.normalSpeed * CONFIG.boostMultiplier;
        scrollRightBtn.classList.add('active');
    }

    // Return to normal after boost duration (only if not holding)
    if (!state.isHolding) {
        state.boostTimeout = setTimeout(() => {
            returnToNormal();
        }, CONFIG.boostDuration);
    }
}

/**
 * Return to normal scroll speed
 */
function returnToNormal() {
    if (state.boostTimeout) {
        clearTimeout(state.boostTimeout);
        state.boostTimeout = null;
    }
    
    // Smoothly return to normal speed and direction
    state.targetSpeed = CONFIG.normalSpeed;
    state.direction = -1; // Return to normal left direction
    
    scrollLeftBtn.classList.remove('active');
    scrollRightBtn.classList.remove('active');
}

/**
 * Handle button click (quick boost)
 */
function handleClick(direction) {
    if (state.isHolding) return;
    boostScroll(direction);
}

/**
 * Start holding a button
 */
function startHold(direction) {
    state.isHolding = true;
    boostScroll(direction);
}

/**
 * Stop holding a button
 */
function endHold() {
    if (!state.isHolding) return;
    state.isHolding = false;
    
    // Return to normal after a short delay
    if (state.boostTimeout) {
        clearTimeout(state.boostTimeout);
    }
    state.boostTimeout = setTimeout(() => {
        returnToNormal();
    }, CONFIG.holdBoostDelay);
}

/**
 * Initialize scroll controls
 */
function initScrollControls() {
    scrollLeftBtn = document.getElementById('scrollLeft');
    scrollRightBtn = document.getElementById('scrollRight');
    
    if (!scrollLeftBtn || !scrollRightBtn) {
        console.error('Scroll buttons not found');
        return false;
    }
    
    // Click events
    scrollLeftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleClick('left');
    });
    scrollRightBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleClick('right');
    });
    
    // Mouse hold events
    scrollLeftBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startHold('left');
    });
    scrollLeftBtn.addEventListener('mouseup', endHold);
    scrollLeftBtn.addEventListener('mouseleave', endHold);
    
    scrollRightBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startHold('right');
    });
    scrollRightBtn.addEventListener('mouseup', endHold);
    scrollRightBtn.addEventListener('mouseleave', endHold);
    
    // Touch events for mobile
    scrollLeftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startHold('left');
    });
    scrollLeftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        endHold();
    });
    scrollLeftBtn.addEventListener('touchcancel', endHold);
    
    scrollRightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startHold('right');
    });
    scrollRightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        endHold();
    });
    scrollRightBtn.addEventListener('touchcancel', endHold);
    
    // Pause on hover over scroll container (not track, to avoid bubbling issues)
    const scrollContainer = scrollTrack.parentElement;
    if (scrollContainer) {
        scrollContainer.addEventListener('mouseenter', () => {
            if (!state.lightboxOpen) {
                state.isPaused = true;
            }
        });
        scrollContainer.addEventListener('mouseleave', () => {
            if (!state.lightboxOpen) {
                state.isPaused = false;
            }
        });
    }
    
    return true;
}

/**
 * Initialize everything
 */
function initInfiniteScroll() {
    if (!initScrollTrack()) return;
    if (!initScrollControls()) return;
    
    // Start animation loop
    state.animationId = requestAnimationFrame(animate);
    
    // Handle visibility change (pause when tab not visible)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            state.isPaused = true;
        } else {
            state.isPaused = false;
            state.lastTime = 0; // Reset timing to avoid jump
        }
    });
    
    // Recalculate half width on resize
    window.addEventListener('resize', () => {
        if (scrollTrack) {
            state.halfWidth = scrollTrack.scrollWidth / 2;
        }
    });
}

/* ============================================
   PORTFOLIO LIGHTBOX MODAL FUNCTIONALITY
   (Amazon-style zoom with hover magnification)
   ============================================ */

// Map imageClass to actual image URLs and titles
const imageClassToData = {
    'front-elevation': { url: 'images/Project_Overview/Front-Elevation.png', title: 'Front Elevation' },
    'rear-elevation': { url: 'images/Project_Overview/Rear-Elevation.png', title: 'Rear Elevation' },
    'site-layout': { url: 'images/Portfolio_Scroll_Section/Site-Plans.png', title: 'Site Layout' },
    'ground-floor': { url: 'images/Portfolio_Scroll_Section/Ground-Floor-Plans.png', title: 'Ground Floor Layout' },
    'first-floor': { url: 'images/Portfolio_Scroll_Section/First-Floor-Plans.png', title: 'First Floor Layout' },
    'second-floor': { url: 'images/Portfolio_Scroll_Section/Second-Floor-Plans.png', title: 'Second Floor Layout' }
};

// Lightbox elements
let portfolioModal = null;
let portfolioModalOverlay = null;
let portfolioModalClose = null;
let lightboxThumbnail = null;
let lightboxThumbnailWrapper = null;
let lightboxTitle = null;
let lightboxZoomResult = null;
let zoomLens = null;

// Zoom configuration
const ZOOM_LEVEL = 2.5; // How much to magnify

// Store current image URL for zoom
let currentImageUrl = '';

/**
 * Open portfolio lightbox modal with specified image and title
 */
function openPortfolioModal(imageUrl, title = 'Floor Plan') {
    if (!portfolioModal || !lightboxThumbnail) return;

    // Stop the scroller completely
    state.isPaused = true;
    state.lightboxOpen = true;

    // Store the image URL for zoom functionality
    currentImageUrl = imageUrl;

    // Set the image source and title
    lightboxThumbnail.src = imageUrl;
    if (lightboxTitle) {
        lightboxTitle.textContent = title;
    }

    // Preload image for zoom (but don't set background yet - wait for hover)
    const img = new Image();
    img.src = imageUrl;

    // Clear any previous zoom state
    if (lightboxZoomResult) {
        lightboxZoomResult.style.backgroundImage = '';
        lightboxZoomResult.classList.remove('active');
    }

    // Show the modal
    portfolioModal.classList.add('show');
    portfolioModal.setAttribute('aria-hidden', 'false');

    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
}

/**
 * Close the portfolio lightbox modal with animation
 */
function closePortfolioModal() {
    if (!portfolioModal) return;

    // Add closing class for exit animation
    portfolioModal.classList.add('closing');

    // After animation completes, hide the modal
    setTimeout(() => {
        portfolioModal.classList.remove('show', 'closing');
        portfolioModal.setAttribute('aria-hidden', 'true');

        // Clear the image source and zoom
        currentImageUrl = '';
        if (lightboxThumbnail) {
            lightboxThumbnail.src = '';
        }
        if (lightboxZoomResult) {
            lightboxZoomResult.style.backgroundImage = '';
            lightboxZoomResult.classList.remove('active');
        }
        if (lightboxThumbnailWrapper) {
            lightboxThumbnailWrapper.classList.remove('active');
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Resume scroll animation - reset timing to prevent jump
        state.lightboxOpen = false;
        state.lastTime = 0; // Reset timing to avoid large deltaTime jump

        // Check if this is a touch device, tablet, or tablet-sized viewport
        // Also check viewport width to handle browser DevTools tablet simulation
        const isTouchDevice = ('ontouchstart' in window) ||
                             (navigator.maxTouchPoints > 0) ||
                             (window.matchMedia('(pointer: coarse)').matches);
        const isTabletOrMobileViewport = window.innerWidth <= 1024;

        // On touch devices or tablet/mobile viewports, always resume scrolling after closing lightbox
        // On desktop with wide viewport, keep paused if cursor is still over the scroll area
        if (isTouchDevice || isTabletOrMobileViewport) {
            state.isPaused = false;
        } else {
            const scrollContainer = scrollTrack ? scrollTrack.parentElement : null;
            if (scrollContainer) {
                const rect = scrollContainer.getBoundingClientRect();
                const mouseX = window.mouseX || 0;
                const mouseY = window.mouseY || 0;
                const isOverContainer = mouseX >= rect.left && mouseX <= rect.right &&
                                       mouseY >= rect.top && mouseY <= rect.bottom;
                state.isPaused = isOverContainer;
            } else {
                state.isPaused = false;
            }
        }

        // Force reapply transform to ensure cards are visible
        if (scrollTrack) {
            scrollTrack.style.transform = `translateX(${state.position}px)`;
        }
    }, 250);
}

/**
 * Get image URL and title from card-image element
 */
function getImageDataFromCard(cardImage) {
    // Check for imageClass
    for (const [className, data] of Object.entries(imageClassToData)) {
        if (cardImage.classList.contains(className)) {
            return data;
        }
    }

    // Fallback: try to get background-image from computed style
    const bgImage = window.getComputedStyle(cardImage).backgroundImage;
    if (bgImage && bgImage !== 'none') {
        const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (match) return { url: match[1], title: 'Floor Plan' };
    }

    // Check for img inside
    const img = cardImage.querySelector('img');
    if (img && img.src) return { url: img.src, title: 'Floor Plan' };

    return null;
}

/**
 * Handle mouse move for zoom effect
 */
function handleZoomMove(e) {
    if (!lightboxThumbnail || !zoomLens || !lightboxZoomResult) return;

    const img = lightboxThumbnail;
    const imgRect = img.getBoundingClientRect();

    // Calculate cursor position relative to image
    let x = e.clientX - imgRect.left;
    let y = e.clientY - imgRect.top;

    // Get lens dimensions
    const lensWidth = zoomLens.offsetWidth;
    const lensHeight = zoomLens.offsetHeight;

    // Constrain lens position within image bounds
    let lensX = x - lensWidth / 2;
    let lensY = y - lensHeight / 2;

    // Keep lens within image boundaries
    lensX = Math.max(0, Math.min(lensX, imgRect.width - lensWidth));
    lensY = Math.max(0, Math.min(lensY, imgRect.height - lensHeight));

    // Position the lens
    zoomLens.style.left = lensX + 'px';
    zoomLens.style.top = lensY + 'px';

    // Calculate zoom result dimensions
    const zoomContainer = lightboxZoomResult.parentElement;
    const resultWidth = zoomContainer.offsetWidth;
    const resultHeight = zoomContainer.offsetHeight;

    // Calculate the ratio between the zoom result and lens
    const ratioX = resultWidth / lensWidth;
    const ratioY = resultHeight / lensHeight;

    // Calculate background size (zoomed image)
    const bgWidth = imgRect.width * ratioX;
    const bgHeight = imgRect.height * ratioY;

    // Calculate background position
    const bgX = -lensX * ratioX;
    const bgY = -lensY * ratioY;

    // Apply zoom to result area
    lightboxZoomResult.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
    lightboxZoomResult.style.backgroundPosition = `${bgX}px ${bgY}px`;
}

/**
 * Handle mouse enter on thumbnail
 */
function handleZoomEnter() {
    if (lightboxThumbnailWrapper) {
        lightboxThumbnailWrapper.classList.add('active');
    }
    if (lightboxZoomResult && currentImageUrl) {
        // Set the background image when hover starts
        lightboxZoomResult.style.backgroundImage = `url('${currentImageUrl}')`;
        lightboxZoomResult.classList.add('active');
    }
}

/**
 * Handle mouse leave on thumbnail
 */
function handleZoomLeave() {
    if (lightboxThumbnailWrapper) {
        lightboxThumbnailWrapper.classList.remove('active');
    }
    if (lightboxZoomResult) {
        lightboxZoomResult.classList.remove('active');
        // Clear the background image to show placeholder text
        lightboxZoomResult.style.backgroundImage = '';
    }
}

/**
 * Initialize portfolio lightbox modal functionality
 */
function initLightbox() {
    portfolioModal = document.getElementById('portfolioLightboxModal');
    portfolioModalOverlay = document.querySelector('.portfolio-lightbox-overlay');
    portfolioModalClose = document.getElementById('portfolioLightboxClose');
    lightboxThumbnail = document.getElementById('lightboxThumbnail');
    lightboxThumbnailWrapper = document.getElementById('lightboxThumbnailWrapper');
    lightboxTitle = document.getElementById('lightboxTitle');
    lightboxZoomResult = document.getElementById('lightboxZoomResult');
    zoomLens = document.getElementById('zoomLens');

    if (!portfolioModal || !lightboxThumbnail) {
        console.warn('Portfolio lightbox modal elements not found');
        return;
    }

    // Close button click
    if (portfolioModalClose) {
        portfolioModalClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closePortfolioModal();
        });
    }

    // Click on overlay (backdrop) to close
    if (portfolioModalOverlay) {
        portfolioModalOverlay.addEventListener('click', () => {
            closePortfolioModal();
        });
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && portfolioModal.classList.contains('show')) {
            closePortfolioModal();
        }
    });

    // Set up zoom functionality on thumbnail
    if (lightboxThumbnailWrapper) {
        lightboxThumbnailWrapper.addEventListener('mousemove', handleZoomMove);
        lightboxThumbnailWrapper.addEventListener('mouseenter', handleZoomEnter);
        lightboxThumbnailWrapper.addEventListener('mouseleave', handleZoomLeave);

        // Touch support for mobile
        lightboxThumbnailWrapper.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleZoomMove(touch);
        }, { passive: false });
        lightboxThumbnailWrapper.addEventListener('touchstart', handleZoomEnter);
        lightboxThumbnailWrapper.addEventListener('touchend', handleZoomLeave);
    }

    // Add click listeners to card images (use event delegation on scroll track)
    if (scrollTrack) {
        scrollTrack.addEventListener('click', (e) => {
            const cardImage = e.target.closest('.card-image');
            if (cardImage) {
                e.stopPropagation();
                const imageData = getImageDataFromCard(cardImage);
                if (imageData) {
                    openPortfolioModal(imageData.url, imageData.title);
                }
            }
        });
    }
}

/* ============================================
   PORTFOLIO SECTION TITLE - SCROLL ANIMATION
   Word-by-word horizontal loading when scrolling down
   ============================================ */

let portfolioTitleObserver = null;
let lastScrollY = 0;
let scrollDirection = 'down'; // Track scroll direction globally

/**
 * Wrap each word in a span for individual animation
 */
function wrapWordsInSpans(element) {
    const text = element.textContent;
    const words = text.split(/\s+/);

    element.innerHTML = words.map((word, index) =>
        `<span class="word" style="transition-delay: ${index * 0.1}s">${word}</span>`
    ).join(' ');
}

/**
 * Initialize scroll-triggered animation for portfolio section title
 * Only animates when scrolling DOWN into view
 */
function initPortfolioTitleAnimation() {
    const portfolioTitle = document.querySelector('.portfolio-section-title');
    if (!portfolioTitle) return;

    const h2 = portfolioTitle.querySelector('h2');
    if (!h2) return;

    // Wrap H2 into lines and words (portfolio-only helper)
    wrapPortfolioLinesWords(h2);

    // Helper that splits on <br> and wraps each word with a staggered transition-delay
    function wrapPortfolioLinesWords(element) {
        const html = element.innerHTML;
        const lines = html.split(/<br\s*\/?\s*>/i).map(l => l.trim()).filter(Boolean);

        const lineDelay = 0.15; // seconds per line
        const wordDelay = 0.08; // seconds per word inside a line

        element.innerHTML = lines.map((line, lineIndex) => {
            const words = line.split(/\s+/).filter(Boolean);
            const wordsHtml = words.map((word, wordIndex) => {
                const delay = (lineIndex * lineDelay) + (wordIndex * wordDelay);
                return `<span class="word" style="transition-delay: ${delay.toFixed(2)}s">${word}</span>`;
            }).join(' ');
            return `<span class="line">${wordsHtml}</span>`;
        }).join('');
    }

    // Track scroll direction (kept for compatibility with other animations)
    lastScrollY = window.scrollY || window.pageYOffset;

    // Use smooth scroll container if available, otherwise window
    const scrollerEl = document.querySelector('#content-scroll');
    const hasSmoothScroll = document.body.classList.contains('smooth-scroll');
    const scrollTarget = (scrollerEl && hasSmoothScroll) ? scrollerEl : window;

    const updateScrollDirection = () => {
        const currentScrollY = scrollTarget === window
            ? (window.scrollY || window.pageYOffset)
            : scrollerEl.scrollTop;

        if (currentScrollY > lastScrollY + 5) {
            scrollDirection = 'down';
        } else if (currentScrollY < lastScrollY - 5) {
            scrollDirection = 'up';
        }
        lastScrollY = currentScrollY;
    };

    scrollTarget.addEventListener('scroll', updateScrollDirection, { passive: true });

    // Create Intersection Observer that only triggers when the section enters the viewport
    // and removes the class on exit so animation can replay when re-entered.
    portfolioTitleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            } else {
                entry.target.classList.remove('animate-in');
            }
        });
    }, {
        root: (hasSmoothScroll ? scrollerEl : null),
        threshold: 0.2, // Trigger when 20% visible
        rootMargin: '0px 0px -30px 0px' // Slight offset from bottom
    });

    // Observe the title element
    portfolioTitleObserver.observe(portfolioTitle);
}

/**
 * Initialize scroll-triggered animation for amenities section title
 * Only animates when scrolling DOWN into view
 */
function initAmenitiesTitleAnimation() {
    const amenitiesTitle = document.querySelector('.slide-amenities-title');
    if (!amenitiesTitle) return;

    // Wrap words in spans for individual animation
    wrapWordsInSpans(amenitiesTitle);

    // Create Intersection Observer
    const amenitiesTitleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && scrollDirection === 'down') {
                // Scrolling down into view - animate in word by word
                entry.target.classList.add('animate-in');
            }
            // When scrolling up or out of view, keep the current state (stays visible)
        });
    }, {
        threshold: 0.2, // Trigger when 20% visible
        rootMargin: '0px 0px -30px 0px' // Slight offset from bottom
    });

    // Observe the title element
    amenitiesTitleObserver.observe(amenitiesTitle);

    // Check if already in view on page load (for refreshes mid-page)
    const rect = amenitiesTitle.getBoundingClientRect();
    const isInView = rect.top < window.innerHeight && rect.bottom > 0;
    if (isInView) {
        // Already visible - animate immediately
        setTimeout(() => {
            amenitiesTitle.classList.add('animate-in');
        }, 100);
    }
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    infiniteScrollDiag.log('INIT', 'DOM not ready, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
        infiniteScrollDiag = getInfiniteScrollDiag(); // Re-get in case scripts.js loaded
        infiniteScrollDiag.milestone('DOMContentLoaded fired - initializing portfolio');
        initInfiniteScroll();
        initLightbox();
        initPortfolioTitleAnimation();
        initAmenitiesTitleAnimation();
        // Signal that portfolio lightbox is ready for preloader
        window.portfolioLightboxReady = true;
        infiniteScrollDiag.log('INIT', 'portfolioLightboxReady = true');
        infiniteScrollDiag.milestone('infinite-scroll.js initialization COMPLETE');
    });
} else {
    infiniteScrollDiag.log('INIT', 'DOM already ready, initializing immediately');
    initInfiniteScroll();
    initLightbox();
    initPortfolioTitleAnimation();
    initAmenitiesTitleAnimation();
    // Signal that portfolio lightbox is ready for preloader
    window.portfolioLightboxReady = true;
    infiniteScrollDiag.log('INIT', 'portfolioLightboxReady = true');
    infiniteScrollDiag.milestone('infinite-scroll.js initialization COMPLETE');
}