// Parallax scroll effect for tourism hero section
document.addEventListener('DOMContentLoaded', function() {
    const heroSection = document.querySelector('.tourism-hero-section');
    
    if (!heroSection) return;
    
    function updateParallax() {
        const scrollPosition = window.pageYOffset;
        const heroTop = heroSection.getBoundingClientRect().top + scrollPosition;
        const heroHeight = heroSection.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Calculate scroll progress (0 to 1) based on when element enters and leaves viewport
        let scrollProgress = 0;
        const elementBottomInViewport = scrollPosition + viewportHeight - heroTop;
        
        if (elementBottomInViewport > 0 && scrollPosition < heroTop + heroHeight) {
            scrollProgress = elementBottomInViewport / (viewportHeight + heroHeight);
            scrollProgress = Math.max(0, Math.min(1, scrollProgress));
        }
        
        // Zoom background from 100% to 120% based on scroll
        const backgroundSize = 100 + (scrollProgress * 20);
        heroSection.style.backgroundSize = backgroundSize + '%';
    }
    
    window.addEventListener('scroll', updateParallax, { passive: true });
    window.addEventListener('resize', updateParallax);
    
    // Trigger once on page load
    updateParallax();
});
