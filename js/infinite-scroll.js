/* ============================================
   INFINITE SCROLL PORTFOLIO - JAVASCRIPT
   Smooth RAF-based animation with speed transitions
   ============================================ */

/**
 * Project Data
 */
const projects = [
    {
        year: '',
        title: 'Front Elevation',
        imageClass: 'front-elevation',
        mockupImage: 'images/Project_Overview/icons-project-overview/Front-Elevation-8.png'
    },
    {
        year: '',
        title: 'Rear Elevation',
        imageClass: 'rear-elevation',
        mockupImage: 'images/Project_Overview/icons-project-overview/Rear-Elevation-8.png'
    },
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
        ? `<img src="${project.image}" alt="${project.title}">`
        : '';

    const imageClass = project.imageClass || '';

    const mockupContent = project.mockupImage
        ? `<img src="${project.mockupImage}" alt="${project.title} mockup" class="mockup-image">`
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
    
    // Pause on hover (only if lightbox is not open)
    scrollTrack.addEventListener('mouseenter', () => {
        if (!state.lightboxOpen) {
            state.isPaused = true;
        }
    });
    scrollTrack.addEventListener('mouseleave', () => {
        if (!state.lightboxOpen) {
            state.isPaused = false;
        }
    });
    
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
   IMAGE LIGHTBOX FUNCTIONALITY
   ============================================ */

// Map imageClass to actual image URLs
const imageClassToUrl = {
    'front-elevation': 'images/Project_Overview/Front-Elevation.png',
    'rear-elevation': 'images/Project_Overview/Rear-Elevation.png',
    'site-layout': 'images/Portfolio_Scroll_Section/Site-Plans.png',
    'ground-floor': 'images/Portfolio_Scroll_Section/Ground-Floor-Plans.png',
    'first-floor': 'images/Portfolio_Scroll_Section/First-Floor-Plans.png',
    'second-floor': 'images/Portfolio_Scroll_Section/Second-Floor-Plans.png'
};

let imageLightbox = null;
let lightboxImage = null;
let lightboxImageWrapper = null;
let lightboxClose = null;
let landscapeContainer = null;
let lastClickedCard = null;
let isAnimating = false;

/**
 * Get the position of an element relative to the landscape container
 */
function getRelativePosition(element, container) {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
        left: elementRect.left - containerRect.left,
        top: elementRect.top - containerRect.top,
        width: elementRect.width,
        height: elementRect.height
    };
}

/**
 * Open lightbox with specified image and animate from card position
 */
function openLightbox(imageUrl, clickedCard) {
    if (!imageLightbox || !lightboxImage || !lightboxImageWrapper || !landscapeContainer || isAnimating) return;

    isAnimating = true;
    lastClickedCard = clickedCard;

    // Stop the scroller completely
    state.isPaused = true;
    state.lightboxOpen = true;

    // Get card position relative to landscape container
    const cardPos = getRelativePosition(clickedCard, landscapeContainer);
    const containerRect = landscapeContainer.getBoundingClientRect();

    // Calculate final centered position - responsive based on screen size
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;

    let widthRatio, maxWidth, paddingY;
    if (isMobile) {
        widthRatio = 0.92;
        maxWidth = 400;
        paddingY = 20;
    } else if (isTablet) {
        widthRatio = 0.90;
        maxWidth = 800;
        paddingY = 30;
    } else {
        widthRatio = 0.85;
        maxWidth = 1200;
        paddingY = 40;
    }

    const finalWidth = Math.min(containerRect.width * widthRatio, maxWidth);
    // Calculate height based on container height minus padding
    const finalHeight = containerRect.height - (paddingY * 2);
    const finalLeft = (containerRect.width - finalWidth) / 2;
    const finalTop = paddingY;

    // Set initial position (at the card location, below the container)
    lightboxImageWrapper.style.transition = 'none';
    lightboxImageWrapper.style.left = cardPos.left + 'px';
    lightboxImageWrapper.style.top = (cardPos.top + containerRect.height) + 'px'; // Start from below (scroll section)
    lightboxImageWrapper.style.width = cardPos.width + 'px';
    lightboxImageWrapper.style.height = cardPos.height + 'px';
    lightboxImageWrapper.style.opacity = '1';

    // Load image
    lightboxImage.src = imageUrl;

    // Show lightbox backdrop
    imageLightbox.classList.add('active');

    // Trigger reflow to ensure initial position is applied
    lightboxImageWrapper.offsetHeight;

    // Animate to final position
    requestAnimationFrame(() => {
        lightboxImageWrapper.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        lightboxImageWrapper.style.left = finalLeft + 'px';
        lightboxImageWrapper.style.top = finalTop + 'px';
        lightboxImageWrapper.style.width = finalWidth + 'px';
        lightboxImageWrapper.style.height = finalHeight + 'px';
    });

    // Animation complete
    setTimeout(() => {
        isAnimating = false;
    }, 1000);
}

/**
 * Close the lightbox with animation back to card
 */
function closeLightbox() {
    if (!imageLightbox || !lightboxImageWrapper || !landscapeContainer || isAnimating) return;

    isAnimating = true;

    // Hide close button immediately
    imageLightbox.classList.remove('active');

    // If we have the original card, animate back to it
    if (lastClickedCard) {
        const cardPos = getRelativePosition(lastClickedCard, landscapeContainer);
        const containerRect = landscapeContainer.getBoundingClientRect();

        // Animate back to card position (going down to scroll section)
        lightboxImageWrapper.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        lightboxImageWrapper.style.left = cardPos.left + 'px';
        lightboxImageWrapper.style.top = (cardPos.top + containerRect.height) + 'px';
        lightboxImageWrapper.style.width = cardPos.width + 'px';
        lightboxImageWrapper.style.height = cardPos.height + 'px';
        lightboxImageWrapper.style.opacity = '0';
    }

    // Clean up after animation
    setTimeout(() => {
        lightboxImage.src = '';
        lightboxImageWrapper.style.transition = 'none';
        lastClickedCard = null;
        isAnimating = false;

        // Resume scroll animation
        state.lightboxOpen = false;
        state.isPaused = false;
    }, 500);
}

/**
 * Get image URL from card-image element
 */
function getImageUrlFromCard(cardImage) {
    // Check for imageClass
    for (const [className, url] of Object.entries(imageClassToUrl)) {
        if (cardImage.classList.contains(className)) {
            return url;
        }
    }

    // Fallback: try to get background-image from computed style
    const bgImage = window.getComputedStyle(cardImage).backgroundImage;
    if (bgImage && bgImage !== 'none') {
        // Extract URL from background-image: url("...")
        const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (match) return match[1];
    }

    // Check for img inside
    const img = cardImage.querySelector('img');
    if (img && img.src) return img.src;

    return null;
}

/**
 * Initialize lightbox functionality
 */
function initLightbox() {
    imageLightbox = document.getElementById('imageLightbox');
    lightboxImage = document.getElementById('lightboxImage');
    lightboxImageWrapper = document.querySelector('.lightbox-image-wrapper');
    lightboxClose = document.getElementById('lightboxClose');
    landscapeContainer = document.querySelector('.landscape-image-container');

    if (!imageLightbox || !lightboxImage || !lightboxImageWrapper || !landscapeContainer) {
        console.warn('Lightbox elements not found');
        return;
    }

    // Close button click
    if (lightboxClose) {
        lightboxClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closeLightbox();
        });
    }

    // Click on backdrop (empty space) to close
    imageLightbox.addEventListener('click', (e) => {
        if (e.target === imageLightbox) {
            closeLightbox();
        }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageLightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // Add click listeners to card images (use event delegation on scroll track)
    if (scrollTrack) {
        scrollTrack.addEventListener('click', (e) => {
            const cardImage = e.target.closest('.card-image');
            if (cardImage) {
                e.stopPropagation();
                const imageUrl = getImageUrlFromCard(cardImage);
                if (imageUrl) {
                    openLightbox(imageUrl, cardImage);
                }
            }
        });
    }
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initInfiniteScroll();
        initLightbox();
    });
} else {
    initInfiniteScroll();
    initLightbox();
}