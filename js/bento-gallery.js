/**
 * Bento Gallery Carousel
 * Handles Next/Previous navigation for cycling through image/video sets
 */

(function() {
    'use strict';

    // Configuration: Add your slide sets here
    // Each slide is an object with content for each bento item
    const slides = [
        {
            // Slide 1 (Default)
            mainImage: { src: 'images/invest-in-kasauli/why-kasauli.webp', alt: 'Kasauli Hills' },
            mainTitle: 'Kasauli',
            mainSubtitle: 'Himachal, the Land of Pine and Peace',
            textHeading: 'Unleash your adventurous spirit in Kasauli.',
            textDescription: 'Witness the Himalayan sunrise, walk through ancient pine forests, and explore dramatic landscapes sculpted by nature and time.',
            image3: { src: 'images/invest-in-kasauli/Nature.webp', alt: 'Kasauli Mountains' },
            exploreText: 'Monkey Point, Christ Church, and panoramic hill trails.',
            image5: { src: 'images/invest-in-kasauli/Wilderness.webp', alt: 'Kasauli Wildlife' },
            media6: { type: 'video', src: 'videos/THE-WOODS-KASAULI-2.mp4' },
            cuisineText: 'Savor Himachali delicacies and fresh mountain produce.',
            image8: { src: 'images/invest-in-kasauli/Serenity.webp', alt: 'Kasauli Serenity' },
            stayText: 'Luxury villas with views of the valley.',
            image10: { src: 'images/invest-in-kasauli/AQI.webp', alt: 'Kasauli AQI' }
        },
        // Add more slides here following the same structure:
        // {
        //     mainImage: { src: 'path/to/image.webp', alt: 'Description' },
        //     mainTitle: 'Title',
        //     mainSubtitle: 'Subtitle',
        //     textHeading: 'Heading text',
        //     textDescription: 'Description text',
        //     image3: { src: 'path/to/image.webp', alt: 'Description' },
        //     exploreText: 'Explore description',
        //     image5: { src: 'path/to/image.webp', alt: 'Description' },
        //     media6: { type: 'video', src: 'path/to/video.mp4' }, // or { type: 'image', src: 'path/to/image.webp', alt: 'Description' }
        //     cuisineText: 'Cuisine description',
        //     image8: { src: 'path/to/image.webp', alt: 'Description' },
        //     stayText: 'Stay description',
        //     image10: { src: 'path/to/image.webp', alt: 'Description' }
        // },
    ];

    let currentSlide = 0;

    // DOM Elements
    const elements = {
        item1: null,
        item1Title: null,
        item1Subtitle: null,
        item2Heading: null,
        item2Description: null,
        item3: null,
        item4Text: null,
        item5: null,
        item6: null,
        item7Text: null,
        item8: null,
        item9Text: null,
        item10: null,
        prevBtn: null,
        nextBtn: null
    };

    /**
     * Initialize the gallery
     */
    function init() {
        // Cache DOM elements
        const section = document.querySelector('.bento-gallery-section');
        if (!section) return;

        elements.item1 = section.querySelector('.bento-item-1 img');
        elements.item1Title = section.querySelector('.bento-item-1 .bento-title');
        elements.item1Subtitle = section.querySelector('.bento-item-1 .bento-subtitle');
        elements.item2Heading = section.querySelector('.bento-item-2 .bento-heading');
        elements.item2Description = section.querySelector('.bento-item-2 .bento-description');
        elements.item3 = section.querySelector('.bento-item-3 img');
        elements.item4Text = section.querySelector('.bento-item-4 .bento-text');
        elements.item5 = section.querySelector('.bento-item-5 img');
        elements.item6 = section.querySelector('.bento-item-6');
        elements.item7Text = section.querySelector('.bento-item-7 .bento-text');
        elements.item8 = section.querySelector('.bento-item-8 img');
        elements.item9Text = section.querySelector('.bento-item-9 .bento-text');
        elements.item10 = section.querySelector('.bento-item-10 img');

        // Get navigation buttons
        const buttons = section.querySelectorAll('.bento-nav-btn');
        if (buttons.length >= 2) {
            elements.prevBtn = buttons[0];
            elements.nextBtn = buttons[1];

            // Add event listeners
            elements.prevBtn.addEventListener('click', goToPrevSlide);
            elements.nextBtn.addEventListener('click', goToNextSlide);
        }

        // Update button states
        updateButtonStates();
    }

    /**
     * Go to the next slide
     */
    function goToNextSlide() {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            updateSlide();
        }
    }

    /**
     * Go to the previous slide
     */
    function goToPrevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlide();
        }
    }

    /**
     * Update the gallery content with current slide data
     */
    function updateSlide() {
        const slide = slides[currentSlide];
        if (!slide) return;

        // Add fade-out class
        const grid = document.querySelector('.bento-grid');
        if (grid) {
            grid.classList.add('transitioning');
        }

        // Update content after a short delay for transition
        setTimeout(() => {
            // Item 1 - Main image
            if (elements.item1 && slide.mainImage) {
                elements.item1.src = slide.mainImage.src;
                elements.item1.alt = slide.mainImage.alt;
            }
            if (elements.item1Title) {
                elements.item1Title.textContent = slide.mainTitle;
            }
            if (elements.item1Subtitle) {
                elements.item1Subtitle.textContent = slide.mainSubtitle;
            }

            // Item 2 - Text box
            if (elements.item2Heading) {
                elements.item2Heading.textContent = slide.textHeading;
            }
            if (elements.item2Description) {
                elements.item2Description.textContent = slide.textDescription;
            }

            // Item 3 - Image
            if (elements.item3 && slide.image3) {
                elements.item3.src = slide.image3.src;
                elements.item3.alt = slide.image3.alt;
            }

            // Item 4 - Explore text
            if (elements.item4Text) {
                elements.item4Text.textContent = slide.exploreText;
            }

            // Item 5 - Image
            if (elements.item5 && slide.image5) {
                elements.item5.src = slide.image5.src;
                elements.item5.alt = slide.image5.alt;
            }

            // Item 6 - Video or Image
            if (elements.item6 && slide.media6) {
                updateMedia6(slide.media6);
            }

            // Item 7 - Cuisine text
            if (elements.item7Text) {
                elements.item7Text.textContent = slide.cuisineText;
            }

            // Item 8 - Image
            if (elements.item8 && slide.image8) {
                elements.item8.src = slide.image8.src;
                elements.item8.alt = slide.image8.alt;
            }

            // Item 9 - Stay text
            if (elements.item9Text) {
                elements.item9Text.textContent = slide.stayText;
            }

            // Item 10 - Image
            if (elements.item10 && slide.image10) {
                elements.item10.src = slide.image10.src;
                elements.item10.alt = slide.image10.alt;
            }

            // Remove fade-out class
            if (grid) {
                grid.classList.remove('transitioning');
            }

            // Update button states
            updateButtonStates();

        }, 150);
    }

    /**
     * Update item 6 which can be either video or image
     */
    function updateMedia6(media) {
        if (!elements.item6) return;

        // Pause any existing video
        const existingVideo = elements.item6.querySelector('video');
        if (existingVideo) {
            existingVideo.pause();
        }

        if (media.type === 'video') {
            elements.item6.innerHTML = `
                <video muted loop playsinline preload="metadata">
                    <source src="${media.src}" type="video/mp4">
                </video>
                <div class="bento-video-overlay" onclick="this.classList.toggle('playing'); this.previousElementSibling.paused ? this.previousElementSibling.play() : this.previousElementSibling.pause();">
                    <div class="bento-play-icon">
                        <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"></polygon></svg>
                    </div>
                </div>
            `;
        } else {
            elements.item6.innerHTML = `
                <img src="${media.src}" alt="${media.alt || ''}" loading="lazy">
            `;
        }
    }

    /**
     * Update button disabled states
     */
    function updateButtonStates() {
        if (elements.prevBtn) {
            elements.prevBtn.disabled = currentSlide === 0;
            elements.prevBtn.style.opacity = currentSlide === 0 ? '0.4' : '1';
            elements.prevBtn.style.cursor = currentSlide === 0 ? 'not-allowed' : 'pointer';
        }
        if (elements.nextBtn) {
            elements.nextBtn.disabled = currentSlide === slides.length - 1;
            elements.nextBtn.style.opacity = currentSlide === slides.length - 1 ? '0.4' : '1';
            elements.nextBtn.style.cursor = currentSlide === slides.length - 1 ? 'not-allowed' : 'pointer';
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API for external use if needed
    window.bentoGallery = {
        next: goToNextSlide,
        prev: goToPrevSlide,
        goTo: function(index) {
            if (index >= 0 && index < slides.length) {
                currentSlide = index;
                updateSlide();
            }
        },
        addSlide: function(slideData) {
            slides.push(slideData);
            updateButtonStates();
        },
        getCurrentSlide: function() {
            return currentSlide;
        },
        getTotalSlides: function() {
            return slides.length;
        }
    };

})();
