/* ============================================
   BACKGROUND COLOR DETECTOR
   Dynamically adjusts text color based on 
   background luminance (video, image, or color)
   ============================================ */

class BackgroundColorDetector {
    constructor(options = {}) {
        // Element to monitor (the sticky social text)
        this.targetSelector = options.targetSelector || '.social-text';
        this.target = null;
        
        // Configuration
        this.config = {
            sampleSize: options.sampleSize || 10,           // Grid size for sampling (10x10 = 100 points)
            updateInterval: options.updateInterval || 100,   // ms between checks
            luminanceThreshold: options.luminanceThreshold || 0.5,  // 0-1, below = dark, above = light
            transitionDuration: options.transitionDuration || 300,  // ms for color transition
            darkClass: options.darkClass || 'text-dark',
            lightClass: options.lightClass || 'text-light',
        };
        
        // State
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.animationId = null;
        this.lastUpdate = 0;
        this.currentMode = null; // 'dark' or 'light'
        
        // Cache for video/image elements
        this.mediaCache = new Map();
        
        this.init();
    }
    
    init() {
        // Create off-screen canvas for pixel sampling
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.config.sampleSize;
        this.canvas.height = this.config.sampleSize;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        // Find target element
        this.target = document.querySelector(this.targetSelector);
        if (!this.target) {
            console.warn(`BackgroundColorDetector: Target "${this.targetSelector}" not found`);
            return;
        }
        
        // Inject CSS for color modes
        this.injectStyles();
        
        // Start monitoring
        this.start();
        
        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stop();
            } else {
                this.start();
            }
        });
    }
    
    injectStyles() {
        const styleId = 'bg-color-detector-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Light background - use dark text */
            .social-text.text-dark {
                color: #1a1a1a !important;
            }
            .social-text.text-dark .social-link {
                color: #1a1a1a !important;
            }
            .social-text.text-dark .social-link:hover {
                color: #333 !important;
            }
            .social-text.text-dark .social-link::after {
                background-color: #1a1a1a !important;
            }
            
            /* Dark background - use light text */
            .social-text.text-light {
                color: #fff !important;
            }
            .social-text.text-light .social-link {
                color: #fff !important;
            }
            .social-text.text-light .social-link:hover {
                color: #f2eae3 !important;
            }
            .social-text.text-light .social-link::after {
                background-color: #f2eae3 !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.monitor();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    monitor() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        if (now - this.lastUpdate >= this.config.updateInterval) {
            this.detectAndUpdate();
            this.lastUpdate = now;
        }
        
        this.animationId = requestAnimationFrame(() => this.monitor());
    }
    
    detectAndUpdate() {
        const luminance = this.sampleBackgroundLuminance();
        const newMode = luminance > this.config.luminanceThreshold ? 'dark' : 'light';
        
        if (newMode !== this.currentMode) {
            this.currentMode = newMode;
            this.applyColorMode(newMode);
        }
    }
    
    sampleBackgroundLuminance() {
        if (!this.target) return 0.5;
        
        const rect = this.target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Find elements behind the target
        const elementsAtPoint = this.getElementsAtPoint(centerX, centerY);
        
        // Try to sample from different sources
        let totalLuminance = 0;
        let samples = 0;
        
        // Sample multiple points across the element
        const samplePoints = this.getSamplePoints(rect);
        
        for (const point of samplePoints) {
            const color = this.getColorAtPoint(point.x, point.y, elementsAtPoint);
            if (color) {
                totalLuminance += this.calculateLuminance(color);
                samples++;
            }
        }
        
        return samples > 0 ? totalLuminance / samples : 0.5;
    }
    
    getSamplePoints(rect) {
        const points = [];
        const padding = 5; // Padding from edges
        
        // Sample a grid of points
        const cols = 3;
        const rows = 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                points.push({
                    x: rect.left + padding + (rect.width - 2 * padding) * (col / (cols - 1 || 1)),
                    y: rect.top + padding + (rect.height - 2 * padding) * (row / (rows - 1 || 1))
                });
            }
        }
        
        return points;
    }
    
    getElementsAtPoint(x, y) {
        // Temporarily hide target to get elements behind it
        const originalPointerEvents = this.target.style.pointerEvents;
        this.target.style.pointerEvents = 'none';
        
        const elements = document.elementsFromPoint(x, y);
        
        this.target.style.pointerEvents = originalPointerEvents;
        
        // Filter out the target itself
        return elements.filter(el => el !== this.target && !this.target.contains(el));
    }
    
    getColorAtPoint(x, y, elements) {
        for (const element of elements) {
            // Skip invisible elements
            const style = getComputedStyle(element);
            if (style.visibility === 'hidden' || style.opacity === '0') continue;
            
            // Check for video
            if (element.tagName === 'VIDEO') {
                return this.sampleVideoColor(element, x, y);
            }
            
            // Check for canvas
            if (element.tagName === 'CANVAS') {
                return this.sampleCanvasColor(element, x, y);
            }
            
            // Check for background image
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage !== 'none') {
                const color = this.sampleBackgroundImage(element, bgImage, x, y);
                if (color) return color;
            }
            
            // Check for background color
            const bgColor = style.backgroundColor;
            if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                return this.parseColor(bgColor);
            }
            
            // Check for img element
            if (element.tagName === 'IMG') {
                return this.sampleImageColor(element, x, y);
            }
        }
        
        // Default: check body/html background
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        if (bodyBg && bodyBg !== 'transparent' && bodyBg !== 'rgba(0, 0, 0, 0)') {
            return this.parseColor(bodyBg);
        }
        
        // Fallback to white (assume light background)
        return { r: 255, g: 255, b: 255 };
    }
    
    sampleVideoColor(video, x, y) {
        try {
            if (video.readyState < 2) return null; // Video not ready
            
            const rect = video.getBoundingClientRect();
            const scaleX = video.videoWidth / rect.width;
            const scaleY = video.videoHeight / rect.height;
            
            const videoX = (x - rect.left) * scaleX;
            const videoY = (y - rect.top) * scaleY;
            
            // Draw video frame to canvas
            this.ctx.drawImage(
                video,
                videoX - this.config.sampleSize / 2,
                videoY - this.config.sampleSize / 2,
                this.config.sampleSize,
                this.config.sampleSize,
                0, 0,
                this.config.sampleSize,
                this.config.sampleSize
            );
            
            return this.getAverageColorFromCanvas();
        } catch (e) {
            // CORS or other error
            return null;
        }
    }
    
    sampleCanvasColor(canvas, x, y) {
        try {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const canvasX = (x - rect.left) * scaleX;
            const canvasY = (y - rect.top) * scaleY;
            
            const ctx = canvas.getContext('2d');
            const pixel = ctx.getImageData(Math.floor(canvasX), Math.floor(canvasY), 1, 1).data;
            
            return { r: pixel[0], g: pixel[1], b: pixel[2] };
        } catch (e) {
            return null;
        }
    }
    
    sampleImageColor(img, x, y) {
        try {
            if (!img.complete || !img.naturalWidth) return null;
            
            const rect = img.getBoundingClientRect();
            const scaleX = img.naturalWidth / rect.width;
            const scaleY = img.naturalHeight / rect.height;
            
            const imgX = (x - rect.left) * scaleX;
            const imgY = (y - rect.top) * scaleY;
            
            // Use cached image or create new
            let cachedCanvas = this.mediaCache.get(img.src);
            if (!cachedCanvas) {
                cachedCanvas = document.createElement('canvas');
                cachedCanvas.width = img.naturalWidth;
                cachedCanvas.height = img.naturalHeight;
                const ctx = cachedCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                this.mediaCache.set(img.src, cachedCanvas);
            }
            
            const ctx = cachedCanvas.getContext('2d');
            const pixel = ctx.getImageData(
                Math.max(0, Math.min(Math.floor(imgX), img.naturalWidth - 1)),
                Math.max(0, Math.min(Math.floor(imgY), img.naturalHeight - 1)),
                1, 1
            ).data;
            
            return { r: pixel[0], g: pixel[1], b: pixel[2] };
        } catch (e) {
            return null;
        }
    }
    
    sampleBackgroundImage(element, bgImage, x, y) {
        // Extract URL from background-image
        const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (!urlMatch) return null;
        
        const imageUrl = urlMatch[1];
        
        // Check cache
        let cachedData = this.mediaCache.get(imageUrl);
        
        if (!cachedData) {
            // Load image asynchronously
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                this.mediaCache.set(imageUrl, { canvas, width: img.naturalWidth, height: img.naturalHeight });
            };
            
            return null; // Return null until image is loaded
        }
        
        try {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            
            // Handle background-size
            let bgWidth = cachedData.width;
            let bgHeight = cachedData.height;
            
            if (style.backgroundSize === 'cover') {
                const scale = Math.max(rect.width / cachedData.width, rect.height / cachedData.height);
                bgWidth = cachedData.width * scale;
                bgHeight = cachedData.height * scale;
            } else if (style.backgroundSize === 'contain') {
                const scale = Math.min(rect.width / cachedData.width, rect.height / cachedData.height);
                bgWidth = cachedData.width * scale;
                bgHeight = cachedData.height * scale;
            }
            
            // Calculate position within background
            const bgX = ((x - rect.left) / bgWidth) * cachedData.width;
            const bgY = ((y - rect.top) / bgHeight) * cachedData.height;
            
            const ctx = cachedData.canvas.getContext('2d');
            const pixel = ctx.getImageData(
                Math.max(0, Math.min(Math.floor(bgX), cachedData.width - 1)),
                Math.max(0, Math.min(Math.floor(bgY), cachedData.height - 1)),
                1, 1
            ).data;
            
            return { r: pixel[0], g: pixel[1], b: pixel[2] };
        } catch (e) {
            return null;
        }
    }
    
    getAverageColorFromCanvas() {
        try {
            const imageData = this.ctx.getImageData(0, 0, this.config.sampleSize, this.config.sampleSize);
            const data = imageData.data;
            
            let r = 0, g = 0, b = 0, count = 0;
            
            for (let i = 0; i < data.length; i += 4) {
                // Skip fully transparent pixels
                if (data[i + 3] < 128) continue;
                
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
            
            if (count === 0) return null;
            
            return {
                r: Math.round(r / count),
                g: Math.round(g / count),
                b: Math.round(b / count)
            };
        } catch (e) {
            return null;
        }
    }
    
    parseColor(colorStr) {
        // Handle rgb/rgba
        const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3])
            };
        }
        
        // Handle hex
        const hexMatch = colorStr.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (hexMatch) {
            return {
                r: parseInt(hexMatch[1], 16),
                g: parseInt(hexMatch[2], 16),
                b: parseInt(hexMatch[3], 16)
            };
        }
        
        // Handle short hex
        const shortHexMatch = colorStr.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
        if (shortHexMatch) {
            return {
                r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
                g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
                b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16)
            };
        }
        
        return null;
    }
    
    /**
     * Calculate relative luminance using WCAG formula
     * Returns 0-1 where 0 is darkest, 1 is lightest
     */
    calculateLuminance(color) {
        if (!color) return 0.5;
        
        // Convert to sRGB
        const rsRGB = color.r / 255;
        const gsRGB = color.g / 255;
        const bsRGB = color.b / 255;
        
        // Apply gamma correction
        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
        
        // Calculate luminance
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    
    applyColorMode(mode) {
        if (!this.target) return;
        
        this.target.classList.remove(this.config.darkClass, this.config.lightClass);
        this.target.classList.add(mode === 'dark' ? this.config.darkClass : this.config.lightClass);
        
        // Dispatch custom event for external listeners
        this.target.dispatchEvent(new CustomEvent('colorModeChange', {
            detail: { mode, luminance: this.currentMode }
        }));
    }
    
    /**
     * Manually set the luminance threshold
     */
    setThreshold(threshold) {
        this.config.luminanceThreshold = Math.max(0, Math.min(1, threshold));
    }
    
    /**
     * Force an immediate update
     */
    forceUpdate() {
        this.detectAndUpdate();
    }
    
    /**
     * Clean up
     */
    destroy() {
        this.stop();
        this.mediaCache.clear();
        
        if (this.target) {
            this.target.classList.remove(this.config.darkClass, this.config.lightClass);
        }
    }
}

// Auto-initialize with default selector
let bgDetector = null;

function initBackgroundColorDetector(options = {}) {
    if (bgDetector) {
        bgDetector.destroy();
    }
    bgDetector = new BackgroundColorDetector(options);
    return bgDetector;
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initBackgroundColorDetector());
} else {
    initBackgroundColorDetector();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackgroundColorDetector, initBackgroundColorDetector };
}