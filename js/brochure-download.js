// Brochure Download Handler
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.querySelector('.download-brochure-btn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const brochurePath = 'brochure/The Woods Kasauli - Vertical.pdf';
            const link = document.createElement('a');
            link.href = brochurePath;
            link.download = 'The Woods Kasauli - Vertical.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});
