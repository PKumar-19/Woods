// Brochure Download Handler
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.querySelector('.download-brochure-btn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const brochurePath = 'brochure/The-Wood-Kasauli-Design.pdf';

            // Check if desktop (viewport width > 1024px)
            const isDesktop = window.innerWidth > 1024;

            if (isDesktop) {
                // Desktop: open PDF in new tab
                window.open(brochurePath, '_blank');
            } else {
                // Mobile/Tablet: download the file
                const link = document.createElement('a');
                link.href = brochurePath;
                link.download = 'The Woods Kasauli - Vertical.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }
});
