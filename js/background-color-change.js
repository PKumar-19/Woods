/* ============================================
   BACKGROUND COLOR DETECTOR v3
   Fixed: Video sampling, element detection,
   and better threshold handling
   ============================================ */

class BackgroundColorDetector {
    constructor(options = {}) {
        this.targets = [];
        
        this.config = {
            sampleSize: options.sampleSize || 20,
            updateInterval: options.updateInterval || 80,
            luminanceThreshold: options.luminanceThreshold || 0.45,
            transitionDuration: options.transitionDuration || 300,
            debug: options.debug || false,
        };
        
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.animationId = null;
        this.lastUpdate = 0;
        this.mediaCache = new Map();
        
        this.init(options);
    }
    
    init(options) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.config.sampleSize;
        this.canvas.height = this.config.sampleSize;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        this.injectStyles();
        
        if (options.targetSelector) {
            this.registerTarget({
                selector: options.targetSelector,
                type: 'text',
                darkClass: options.darkClass || 'text-dark',
                lightClass: options.lightClass || 'text-light',
            });
        }
        
        this.start();
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stop();
            } else {
                this.start();
            }
        });
        
        // Create debug panel if enabled
        if (this.config.debug) {
            this.createDebugPanel();
        }
    }
    
    createDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'bg-detector-debug';
        panel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.9);
            color: #fff;
            padding: 15px;
            font-family: monospace;
            font-size: 11px;
            z-index: 99999;
            border-radius: 8px;
            min-width: 250px;
            max-height: 300px;
            overflow-y: auto;
        `;
        document.body.appendChild(panel);
        this.debugPanel = panel;
    }
    
    updateDebug(info) {
        if (!this.debugPanel) return;
        
        let html = '<strong>BG Color Detector Debug</strong><br><br>';
        
        for (const [selector, data] of Object.entries(info)) {
            html += `<div style="margin-bottom:10px;padding:5px;background:rgba(255,255,255,0.1);border-radius:4px;">`;
            html += `<strong>${selector}</strong><br>`;
            html += `Luminance: ${data.luminance.toFixed(3)}<br>`;
            html += `Mode: <span style="color:${data.mode === 'dark' ? '#ffd700' : '#00ff88'}">${data.mode}</span><br>`;
            html += `Color: <span style="display:inline-block;width:12px;height:12px;background:rgb(${data.color.r},${data.color.g},${data.color.b});border:1px solid #fff;vertical-align:middle;"></span> rgb(${data.color.r},${data.color.g},${data.color.b})<br>`;
            html += `Source: ${data.source}<br>`;
            html += `</div>`;
        }
        
        this.debugPanel.innerHTML = html;
    }
    
    registerTarget(config) {
        const element = document.querySelector(config.selector);
        if (!element) {
            console.warn(`BackgroundColorDetector: Target "${config.selector}" not found`);
            return null;
        }
        
        const target = {
            element,
            selector: config.selector,
            type: config.type || 'text',
            darkClass: config.darkClass || 'text-dark',
            lightClass: config.lightClass || 'text-light',
            threshold: config.threshold ?? this.config.luminanceThreshold,
            currentMode: null,
            lastColor: null,
            lastSource: null,
        };
        
        this.targets.push(target);
        
        // Force initial detection
        setTimeout(() => this.detectAndUpdate(target), 100);
        
        return target;
    }
    
    unregisterTarget(selector) {
        const index = this.targets.findIndex(t => t.selector === selector);
        if (index !== -1) {
            const target = this.targets[index];
            target.element.classList.remove(target.darkClass, target.lightClass);
            this.targets.splice(index, 1);
        }
    }
    
    injectStyles() {
        const styleId = 'bg-color-detector-styles-v3';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* ============================================
               TEXT COLOR MODES - High Specificity
               ============================================ */
            
            .social-text.text-dark,
            .social-text.text-dark .social-link,
            body .social-text.text-dark,
            body .social-text.text-dark .social-link {
                color: #1a1a1a !important;
            }
            .social-text.text-dark .social-link:hover {
                color: #333 !important;
            }
            .social-text.text-dark .social-link::after {
                background-color: #1a1a1a !important;
            }
            
            .social-text.text-light,
            .social-text.text-light .social-link,
            body .social-text.text-light,
            body .social-text.text-light .social-link {
                color: #fff !important;
            }
            .social-text.text-light .social-link:hover {
                color: #f2eae3 !important;
            }
            .social-text.text-light .social-link::after {
                background-color: #f2eae3 !important;
            }
            
            /* ============================================
               LOGO SWITCHING - High Specificity
               ============================================ */
            
            #clapat-logo .black-logo,
            #clapat-logo .white-logo,
            body #clapat-logo .black-logo,
            body #clapat-logo .white-logo {
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            
            /* Default - white logo visible */
            #clapat-logo .black-logo,
            body #clapat-logo .black-logo {
                opacity: 0 !important;
                visibility: hidden !important;
            }
            
            #clapat-logo .white-logo,
            body #clapat-logo .white-logo {
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            /* Light background - BLACK logo */
            #clapat-logo.logo-dark .black-logo,
            body #clapat-logo.logo-dark .black-logo,
            html body #clapat-logo.logo-dark .black-logo {
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            #clapat-logo.logo-dark .white-logo,
            body #clapat-logo.logo-dark .white-logo,
            html body #clapat-logo.logo-dark .white-logo {
                opacity: 0 !important;
                visibility: hidden !important;
            }
            
            /* Dark background - WHITE logo */
            #clapat-logo.logo-light .black-logo,
            body #clapat-logo.logo-light .black-logo,
            html body #clapat-logo.logo-light .black-logo {
                opacity: 0 !important;
                visibility: hidden !important;
            }
            
            #clapat-logo.logo-light .white-logo,
            body #clapat-logo.logo-light .white-logo,
            html body #clapat-logo.logo-light .white-logo {
                opacity: 1 !important;
                visibility: visible !important;
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
            this.detectAndUpdateAll();
            this.lastUpdate = now;
        }
        
        this.animationId = requestAnimationFrame(() => this.monitor());
    }
    
    detectAndUpdateAll() {
        const debugInfo = {};
        
        for (const target of this.targets) {
            const result = this.detectAndUpdate(target);
            if (this.config.debug && result) {
                debugInfo[target.selector] = result;
            }
        }
        
        if (this.config.debug) {
            this.updateDebug(debugInfo);
        }
    }
    
    detectAndUpdate(target) {
        // Skip if target is disabled (e.g., logo in video section)
        if (target.disabled) {
            if (this.config.debug) {
                console.log(`[BG Detector] ${target.selector}: SKIPPED (disabled)`);
            }
            return null;
        }

        const { luminance, color, source } = this.sampleBackgroundLuminance(target.element);
        const newMode = luminance > target.threshold ? 'dark' : 'light';

        target.lastColor = color;
        target.lastSource = source;

        if (newMode !== target.currentMode) {
            target.currentMode = newMode;
            this.applyMode(target, newMode, luminance);
        }

        return { luminance, mode: newMode, color, source };
    }
    
    sampleBackgroundLuminance(element) {
        if (!element) return { luminance: 0.5, color: { r: 128, g: 128, b: 128 }, source: 'default' };
        
        const rect = element.getBoundingClientRect();
        
        // Sample from multiple points around the element
        const samplePoints = this.getSamplePoints(rect);
        
        let totalLuminance = 0;
        let samples = 0;
        let lastColor = { r: 128, g: 128, b: 128 };
        let lastSource = 'none';
        
        for (const point of samplePoints) {
            const result = this.getColorAtPoint(point.x, point.y, element);
            if (result && result.color) {
                totalLuminance += this.calculateLuminance(result.color);
                lastColor = result.color;
                lastSource = result.source;
                samples++;
            }
        }
        
        const luminance = samples > 0 ? totalLuminance / samples : 0.5;
        return { luminance, color: lastColor, source: lastSource };
    }
    
    getSamplePoints(rect) {
        const points = [];
        const padding = Math.min(10, rect.width * 0.1, rect.height * 0.1);
        
        // Center point (most important)
        points.push({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            weight: 2
        });
        
        // Grid of points
        const cols = 3;
        const rows = 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                points.push({
                    x: rect.left + padding + (rect.width - 2 * padding) * (col / (cols - 1 || 1)),
                    y: rect.top + padding + (rect.height - 2 * padding) * (row / (rows - 1 || 1)),
                    weight: 1
                });
            }
        }
        
        return points;
    }
    
    getColorAtPoint(x, y, targetElement) {
        // Get all elements at this point
        const elements = document.elementsFromPoint(x, y);
        
        // Filter out the target element and its children
        const backgroundElements = elements.filter(el => {
            if (el === targetElement) return false;
            if (targetElement.contains(el)) return false;
            if (el.contains(targetElement)) return true; // Parent elements are valid backgrounds
            return true;
        });
        
        // Try each element from top to bottom
        for (const element of backgroundElements) {
            const result = this.extractColorFromElement(element, x, y);
            if (result) return result;
        }
        
        // Fallback: check body background
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        if (bodyBg && bodyBg !== 'transparent' && bodyBg !== 'rgba(0, 0, 0, 0)') {
            const color = this.parseColor(bodyBg);
            if (color) return { color, source: 'body background-color' };
        }
        
        // Ultimate fallback
        return { color: { r: 255, g: 255, b: 255 }, source: 'fallback white' };
    }
    
    extractColorFromElement(element, x, y) {
        const style = getComputedStyle(element);
        const tagName = element.tagName;
        
        // Skip invisible elements
        if (style.visibility === 'hidden' || style.opacity === '0') return null;
        if (style.display === 'none') return null;
        
        // 1. Check for VIDEO element (highest priority for dynamic content)
        if (tagName === 'VIDEO') {
            const color = this.sampleVideoColor(element, x, y);
            if (color) return { color, source: `video: ${element.className || element.id || 'unnamed'}` };
        }
        
        // 2. Check for CANVAS element
        if (tagName === 'CANVAS') {
            const color = this.sampleCanvasColor(element, x, y);
            if (color) return { color, source: 'canvas' };
        }
        
        // 3. Check for IMG element
        if (tagName === 'IMG') {
            const color = this.sampleImageColor(element, x, y);
            if (color) return { color, source: `img: ${element.src.split('/').pop()}` };
        }
        
        // 4. Check for background-image
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none' && !bgImage.includes('gradient')) {
            const color = this.sampleBackgroundImage(element, bgImage, x, y);
            if (color) return { color, source: `bg-image: ${element.className || element.tagName}` };
        }
        
        // 5. Check for gradient
        if (bgImage && bgImage.includes('gradient')) {
            const color = this.sampleGradient(bgImage);
            if (color) return { color, source: 'gradient' };
        }
        
        // 6. Check for solid background-color
        const bgColor = style.backgroundColor;
        if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
            const color = this.parseColor(bgColor);
            if (color) return { color, source: `bg-color: ${element.className || element.tagName}` };
        }
        
        return null;
    }
    
    sampleVideoColor(video, x, y) {
        try {
            // Check if video is ready and playing
            if (video.readyState < 2 || video.videoWidth === 0) return null;
            
            const rect = video.getBoundingClientRect();
            
            // Calculate position in video coordinates
            // Handle object-fit: cover
            const style = getComputedStyle(video);
            const objectFit = style.objectFit;
            
            let videoX, videoY;
            
            if (objectFit === 'cover') {
                // Calculate scaling for cover
                const videoRatio = video.videoWidth / video.videoHeight;
                const containerRatio = rect.width / rect.height;
                
                let renderWidth, renderHeight, offsetX = 0, offsetY = 0;
                
                if (containerRatio > videoRatio) {
                    // Container is wider - video scaled by width
                    renderWidth = rect.width;
                    renderHeight = rect.width / videoRatio;
                    offsetY = (renderHeight - rect.height) / 2;
                } else {
                    // Container is taller - video scaled by height
                    renderHeight = rect.height;
                    renderWidth = rect.height * videoRatio;
                    offsetX = (renderWidth - rect.width) / 2;
                }
                
                videoX = ((x - rect.left + offsetX) / renderWidth) * video.videoWidth;
                videoY = ((y - rect.top + offsetY) / renderHeight) * video.videoHeight;
            } else {
                // Default: scale to fit
                const scaleX = video.videoWidth / rect.width;
                const scaleY = video.videoHeight / rect.height;
                videoX = (x - rect.left) * scaleX;
                videoY = (y - rect.top) * scaleY;
            }
            
            // Clamp coordinates
            videoX = Math.max(0, Math.min(videoX, video.videoWidth - 1));
            videoY = Math.max(0, Math.min(videoY, video.videoHeight - 1));
            
            // Sample a region around the point
            const sampleSize = this.config.sampleSize;
            const halfSize = sampleSize / 2;
            
            // Clear and draw video region to canvas
            this.ctx.clearRect(0, 0, sampleSize, sampleSize);
            this.ctx.drawImage(
                video,
                Math.max(0, videoX - halfSize),
                Math.max(0, videoY - halfSize),
                sampleSize,
                sampleSize,
                0, 0,
                sampleSize,
                sampleSize
            );
            
            return this.getAverageColorFromCanvas();
        } catch (e) {
            console.warn('Video sampling error:', e);
            return null;
        }
    }
    
    sampleCanvasColor(canvas, x, y) {
        try {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const canvasX = Math.floor((x - rect.left) * scaleX);
            const canvasY = Math.floor((y - rect.top) * scaleY);
            
            const ctx = canvas.getContext('2d');
            const pixel = ctx.getImageData(
                Math.max(0, Math.min(canvasX, canvas.width - 1)),
                Math.max(0, Math.min(canvasY, canvas.height - 1)),
                1, 1
            ).data;
            
            if (pixel[3] < 128) return null; // Skip transparent
            
            return { r: pixel[0], g: pixel[1], b: pixel[2] };
        } catch (e) {
            return null;
        }
    }
    
    sampleImageColor(img, x, y) {
        try {
            if (!img.complete || !img.naturalWidth) return null;
            
            const rect = img.getBoundingClientRect();
            const style = getComputedStyle(img);
            const objectFit = style.objectFit || 'fill';
            
            let imgX, imgY;
            
            if (objectFit === 'cover') {
                const imgRatio = img.naturalWidth / img.naturalHeight;
                const containerRatio = rect.width / rect.height;
                
                let renderWidth, renderHeight, offsetX = 0, offsetY = 0;
                
                if (containerRatio > imgRatio) {
                    renderWidth = rect.width;
                    renderHeight = rect.width / imgRatio;
                    offsetY = (renderHeight - rect.height) / 2;
                } else {
                    renderHeight = rect.height;
                    renderWidth = rect.height * imgRatio;
                    offsetX = (renderWidth - rect.width) / 2;
                }
                
                imgX = ((x - rect.left + offsetX) / renderWidth) * img.naturalWidth;
                imgY = ((y - rect.top + offsetY) / renderHeight) * img.naturalHeight;
            } else {
                const scaleX = img.naturalWidth / rect.width;
                const scaleY = img.naturalHeight / rect.height;
                imgX = (x - rect.left) * scaleX;
                imgY = (y - rect.top) * scaleY;
            }
            
            // Clamp
            imgX = Math.max(0, Math.min(Math.floor(imgX), img.naturalWidth - 1));
            imgY = Math.max(0, Math.min(Math.floor(imgY), img.naturalHeight - 1));
            
            // Get or create cached canvas
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
            const pixel = ctx.getImageData(imgX, imgY, 1, 1).data;
            
            if (pixel[3] < 128) return null;
            
            return { r: pixel[0], g: pixel[1], b: pixel[2] };
        } catch (e) {
            return null;
        }
    }
    
    sampleBackgroundImage(element, bgImage, x, y) {
        const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (!urlMatch) return null;
        
        const imageUrl = urlMatch[1];
        let cachedData = this.mediaCache.get(imageUrl);
        
        if (!cachedData) {
            // Start loading the image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;
            
            // Mark as loading
            this.mediaCache.set(imageUrl, 'loading');
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                this.mediaCache.set(imageUrl, {
                    canvas,
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };
            
            img.onerror = () => {
                this.mediaCache.set(imageUrl, 'error');
            };
            
            return null;
        }
        
        if (cachedData === 'loading' || cachedData === 'error') {
            return null;
        }
        
        try {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            
            // Calculate background position based on background-size
            let bgWidth = cachedData.width;
            let bgHeight = cachedData.height;
            let offsetX = 0;
            let offsetY = 0;
            
            const bgSize = style.backgroundSize;
            
            if (bgSize === 'cover') {
                const scale = Math.max(rect.width / cachedData.width, rect.height / cachedData.height);
                bgWidth = cachedData.width * scale;
                bgHeight = cachedData.height * scale;
                offsetX = (bgWidth - rect.width) / 2;
                offsetY = (bgHeight - rect.height) / 2;
            } else if (bgSize === 'contain') {
                const scale = Math.min(rect.width / cachedData.width, rect.height / cachedData.height);
                bgWidth = cachedData.width * scale;
                bgHeight = cachedData.height * scale;
            }
            
            const bgX = ((x - rect.left + offsetX) / bgWidth) * cachedData.width;
            const bgY = ((y - rect.top + offsetY) / bgHeight) * cachedData.height;
            
            const ctx = cachedData.canvas.getContext('2d');
            const pixel = ctx.getImageData(
                Math.max(0, Math.min(Math.floor(bgX), cachedData.width - 1)),
                Math.max(0, Math.min(Math.floor(bgY), cachedData.height - 1)),
                1, 1
            ).data;
            
            if (pixel[3] < 128) return null;
            
            return { r: pixel[0], g: pixel[1], b: pixel[2] };
        } catch (e) {
            return null;
        }
    }
    
    sampleGradient(gradientStr) {
        // Extract colors from gradient and return average
        const colorMatches = gradientStr.match(/rgba?\([^)]+\)|#[a-f\d]{3,8}/gi);
        if (!colorMatches || colorMatches.length === 0) return null;
        
        let r = 0, g = 0, b = 0, count = 0;
        
        for (const colorStr of colorMatches) {
            const color = this.parseColor(colorStr);
            if (color) {
                r += color.r;
                g += color.g;
                b += color.b;
                count++;
            }
        }
        
        if (count === 0) return null;
        
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    }
    
    getAverageColorFromCanvas() {
        try {
            const imageData = this.ctx.getImageData(0, 0, this.config.sampleSize, this.config.sampleSize);
            const data = imageData.data;
            
            let r = 0, g = 0, b = 0, count = 0;
            
            for (let i = 0; i < data.length; i += 4) {
                // Skip transparent pixels
                if (data[i + 3] < 50) continue;
                
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
        if (!colorStr) return null;
        
        // Handle rgb/rgba
        const rgbMatch = colorStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
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
    
    calculateLuminance(color) {
        if (!color) return 0.5;
        
        // Using WCAG relative luminance formula
        const rsRGB = color.r / 255;
        const gsRGB = color.g / 255;
        const bsRGB = color.b / 255;
        
        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    
    applyMode(target, mode, luminance) {
        if (!target.element) return;
        
        // Remove both classes first
        target.element.classList.remove(target.darkClass, target.lightClass);
        
        // Add the new class
        const newClass = mode === 'dark' ? target.darkClass : target.lightClass;
        target.element.classList.add(newClass);
        
        if (this.config.debug) {
            console.log(`[BG Detector] ${target.selector}: ${mode} (luminance: ${luminance.toFixed(3)})`);
        }
        
        // Dispatch event
        target.element.dispatchEvent(new CustomEvent('colorModeChange', {
            detail: { mode, luminance, type: target.type }
        }));
    }
    
    setThreshold(threshold, selector = null) {
        const clampedThreshold = Math.max(0, Math.min(1, threshold));
        
        if (selector) {
            const target = this.targets.find(t => t.selector === selector);
            if (target) {
                target.threshold = clampedThreshold;
            }
        } else {
            this.config.luminanceThreshold = clampedThreshold;
            for (const target of this.targets) {
                target.threshold = clampedThreshold;
            }
        }
        
        // Force update after threshold change
        this.forceUpdate();
    }
    
    forceUpdate() {
        this.detectAndUpdateAll();
    }
    
    destroy() {
        this.stop();
        this.mediaCache.clear();
        
        for (const target of this.targets) {
            target.element.classList.remove(target.darkClass, target.lightClass);
        }
        this.targets = [];
        
        if (this.debugPanel) {
            this.debugPanel.remove();
        }
    }
}

// Global instance - exposed on window for other scripts to access
let bgDetector = null;

/**
 * Initialize the background color detector
 */
function initBackgroundColorDetector(options = {}) {
    if (bgDetector) {
        bgDetector.destroy();
    }
    bgDetector = new BackgroundColorDetector(options);
    bgDetector.setThreshold(0.35, '#clapat-logo');
    // Expose globally for logo-scroll-controller.js and debugging
    window.bgDetector = bgDetector;
    return bgDetector;
}

/**
 * Quick setup for common use cases
 */
function setupColorDetection(options = {}) {
    const detector = initBackgroundColorDetector({
        updateInterval: options.updateInterval || 80,
        luminanceThreshold: options.luminanceThreshold || 0.45,
        debug: options.debug || false,
    });
    
    // Register social text
    if (document.querySelector('.social-text')) {
        detector.registerTarget({
            selector: '.social-text',
            type: 'text',
            darkClass: 'text-dark',
            lightClass: 'text-light',
        });
    }
    
    // Register logo
    if (document.querySelector('#clapat-logo')) {
        detector.registerTarget({
            selector: '#clapat-logo',
            type: 'logo',
            darkClass: 'logo-dark',
            lightClass: 'logo-light',
        });
    }
    
    return detector;
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupColorDetection());
} else {
    // Small delay to ensure all elements are properly rendered
    setTimeout(() => setupColorDetection(), 100);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackgroundColorDetector, initBackgroundColorDetector, setupColorDetection };
}