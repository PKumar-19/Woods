// /* ============================================
//    BACKGROUND COLOR DETECTOR - VIDEO FIX
//    Better video detection for hero sections
//    ============================================ */

// class BackgroundColorDetector {
//     constructor(options = {}) {
//         this.targets = [];
//         this.config = {
//             sampleSize: 20,
//             updateInterval: options.updateInterval || 100,
//             luminanceThreshold: options.luminanceThreshold || 0.45,
//             debug: options.debug || false,
//         };
        
//         this.canvas = document.createElement('canvas');
//         this.canvas.width = this.config.sampleSize;
//         this.canvas.height = this.config.sampleSize;
//         this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
//         this.isRunning = false;
//         this.animationId = null;
//         this.lastUpdate = 0;
//         this.mediaCache = new Map();
        
//         // Cache all videos on page for faster lookup
//         this.videoElements = [];
//         this.updateVideoCache();
        
//         if (this.config.debug) {
//             this.createDebugPanel();
//         }
//     }
    
//     updateVideoCache() {
//         this.videoElements = Array.from(document.querySelectorAll('video'));
//         if (this.config.debug && this.videoElements.length > 0) {
//             console.log('[BG Detector] Found videos:', this.videoElements.length);
//         }
//     }
    
//     createDebugPanel() {
//         const panel = document.createElement('div');
//         panel.id = 'bg-detector-debug';
//         panel.style.cssText = `
//             position: fixed;
//             bottom: 10px;
//             left: 10px;
//             background: rgba(0,0,0,0.95);
//             color: #0f0;
//             padding: 15px;
//             font-family: monospace;
//             font-size: 11px;
//             z-index: 999999;
//             border-radius: 8px;
//             max-width: 400px;
//             max-height: 400px;
//             overflow-y: auto;
//         `;
//         document.body.appendChild(panel);
//         this.debugPanel = panel;
//     }
    
//     registerTarget(config) {
//         const element = document.querySelector(config.selector);
//         if (!element) {
//             console.warn(`[BG Detector] Target not found: ${config.selector}`);
//             return null;
//         }
        
//         const target = {
//             element,
//             selector: config.selector,
//             type: config.type || 'text',
//             darkClass: config.darkClass || 'text-dark',
//             lightClass: config.lightClass || 'text-light',
//             threshold: config.threshold ?? this.config.luminanceThreshold,
//             currentMode: null,
//         };
        
//         this.targets.push(target);
        
//         // Initial detection
//         this.detectAndUpdate(target);
        
//         return target;
//     }
    
//     start() {
//         if (this.isRunning) return;
//         this.isRunning = true;
//         this.monitor();
        
//         // Periodically update video cache (new videos might be added dynamically)
//         this.videoCacheInterval = setInterval(() => this.updateVideoCache(), 2000);
//     }
    
//     stop() {
//         this.isRunning = false;
//         if (this.animationId) cancelAnimationFrame(this.animationId);
//         if (this.videoCacheInterval) clearInterval(this.videoCacheInterval);
//     }
    
//     monitor() {
//         if (!this.isRunning) return;
        
//         const now = performance.now();
//         if (now - this.lastUpdate >= this.config.updateInterval) {
//             this.detectAndUpdateAll();
//             this.lastUpdate = now;
//         }
        
//         this.animationId = requestAnimationFrame(() => this.monitor());
//     }
    
//     detectAndUpdateAll() {
//         let debugHtml = '<b>🎨 BG Color Detector</b><br>';
//         debugHtml += `Videos found: ${this.videoElements.length}<br><br>`;
        
//         for (const target of this.targets) {
//             const result = this.detectAndUpdate(target);
            
//             if (this.config.debug && result) {
//                 const modeColor = result.mode === 'dark' ? '#ffd700' : '#00ffff';
//                 debugHtml += `<div style="margin-bottom:10px;padding:8px;background:rgba(255,255,255,0.1);border-radius:4px;">`;
//                 debugHtml += `<b>${target.selector}</b><br>`;
//                 debugHtml += `Luminance: ${result.luminance.toFixed(3)}<br>`;
//                 debugHtml += `Threshold: ${target.threshold}<br>`;
//                 debugHtml += `Mode: <span style="color:${modeColor};font-weight:bold">${result.mode.toUpperCase()}</span><br>`;
//                 debugHtml += `Color: <span style="display:inline-block;width:16px;height:16px;background:rgb(${result.color.r},${result.color.g},${result.color.b});border:2px solid #fff;vertical-align:middle;margin-right:5px;border-radius:2px;"></span>`;
//                 debugHtml += `rgb(${result.color.r}, ${result.color.g}, ${result.color.b})<br>`;
//                 debugHtml += `Source: <span style="color:#aaa">${result.source}</span>`;
//                 debugHtml += `</div>`;
//             }
//         }
        
//         if (this.debugPanel) {
//             this.debugPanel.innerHTML = debugHtml;
//         }
//     }
    
//     detectAndUpdate(target) {
//         const rect = target.element.getBoundingClientRect();
//         const centerX = rect.left + rect.width / 2;
//         const centerY = rect.top + rect.height / 2;
        
//         // First, check if there's a video covering this area
//         const videoResult = this.checkForVideo(centerX, centerY);
        
//         let result;
//         if (videoResult) {
//             result = videoResult;
//         } else {
//             // Fallback to standard element detection
//             result = this.sampleAtPoint(centerX, centerY, target.element);
//         }
        
//         const luminance = this.calculateLuminance(result.color);
//         const newMode = luminance > target.threshold ? 'dark' : 'light';
        
//         if (newMode !== target.currentMode) {
//             this.applyMode(target, newMode);
//             target.currentMode = newMode;
//         }
        
//         return {
//             luminance,
//             mode: newMode,
//             color: result.color,
//             source: result.source
//         };
//     }
    
//     /**
//      * Check if any video element covers the given point
//      * This is more reliable than elementsFromPoint for videos
//      */
//     checkForVideo(x, y) {
//         for (const video of this.videoElements) {
//             const rect = video.getBoundingClientRect();
            
//             // Check if point is inside video bounds
//             if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
//                 // Check if video is visible
//                 const style = getComputedStyle(video);
//                 if (style.display === 'none' || style.visibility === 'hidden') continue;
//                 if (parseFloat(style.opacity) < 0.1) continue;
                
//                 // Try to sample the video
//                 const color = this.sampleVideo(video, x, y);
//                 if (color) {
//                     return { color, source: `VIDEO (${video.className || video.id || 'unnamed'})` };
//                 }
                
//                 // If video sampling failed (CORS), estimate from video darkness
//                 // Most hero videos are dark, so return a dark color as fallback
//                 if (this.config.debug) {
//                     console.log('[BG Detector] Video found but sampling failed (CORS?), using dark fallback');
//                 }
//                 return { color: { r: 200, g: 200, b: 200 }, source: 'VIDEO (CORS fallback - light)' };
//             }
//         }
//         return null;
//     }
    
//     sampleAtPoint(x, y, excludeElement) {
//         const elements = document.elementsFromPoint(x, y);
        
//         for (const el of elements) {
//             if (el === excludeElement || excludeElement.contains(el)) continue;
            
//             const result = this.getColorFromElement(el, x, y);
//             if (result) return result;
//         }
        
//         return { color: { r: 30, g: 30, b: 30 }, source: 'fallback (dark)' };
//     }
    
//     getColorFromElement(element, x, y) {
//         const style = getComputedStyle(element);
//         const tag = element.tagName;
        
//         if (style.display === 'none' || style.visibility === 'hidden') return null;
//         if (parseFloat(style.opacity) === 0) return null;
        
//         // VIDEO
//         if (tag === 'VIDEO') {
//             const color = this.sampleVideo(element, x, y);
//             if (color) return { color, source: 'VIDEO' };
//             // CORS fallback
//             return { color: { r: 40, g: 40, b: 40 }, source: 'VIDEO (CORS)' };
//         }
        
//         // IMG
//         if (tag === 'IMG') {
//             const color = this.sampleImage(element, x, y);
//             if (color) return { color, source: `IMG` };
//         }
        
//         // Background image
//         const bgImage = style.backgroundImage;
//         if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
//             const color = this.sampleBgImage(element, bgImage, x, y);
//             if (color) return { color, source: 'bg-image' };
//         }
        
//         // Background color
//         const bgColor = style.backgroundColor;
//         if (bgColor && bgColor !== 'transparent' && !bgColor.includes('rgba(0, 0, 0, 0)')) {
//             const color = this.parseColor(bgColor);
//             if (color) {
//                 const alpha = this.parseAlpha(bgColor);
//                 if (alpha > 0.1) {
//                     return { color, source: `bg-color (${tag})` };
//                 }
//             }
//         }
        
//         return null;
//     }
    
//     parseAlpha(colorStr) {
//         const match = colorStr.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
//         return match ? parseFloat(match[1]) : 1;
//     }
    
//     sampleVideo(video, x, y) {
//         try {
//             if (video.readyState < 2 || video.videoWidth === 0) {
//                 if (this.config.debug) console.log('[BG Detector] Video not ready');
//                 return null;
//             }
            
//             const rect = video.getBoundingClientRect();
//             const style = getComputedStyle(video);
            
//             let vx, vy;
            
//             // Handle object-fit: cover (most common for hero videos)
//             if (style.objectFit === 'cover') {
//                 const vRatio = video.videoWidth / video.videoHeight;
//                 const cRatio = rect.width / rect.height;
                
//                 let rw, rh, ox = 0, oy = 0;
//                 if (cRatio > vRatio) {
//                     rw = rect.width;
//                     rh = rect.width / vRatio;
//                     oy = (rh - rect.height) / 2;
//                 } else {
//                     rh = rect.height;
//                     rw = rect.height * vRatio;
//                     ox = (rw - rect.width) / 2;
//                 }
                
//                 vx = ((x - rect.left + ox) / rw) * video.videoWidth;
//                 vy = ((y - rect.top + oy) / rh) * video.videoHeight;
//             } else {
//                 vx = ((x - rect.left) / rect.width) * video.videoWidth;
//                 vy = ((y - rect.top) / rect.height) * video.videoHeight;
//             }
            
//             // Clamp to valid range
//             vx = Math.max(0, Math.min(vx, video.videoWidth - 1));
//             vy = Math.max(0, Math.min(vy, video.videoHeight - 1));
            
//             // Sample area around the point
//             const size = this.config.sampleSize;
//             this.ctx.clearRect(0, 0, size, size);
            
//             this.ctx.drawImage(
//                 video,
//                 Math.max(0, vx - size/2),
//                 Math.max(0, vy - size/2),
//                 size, size,
//                 0, 0,
//                 size, size
//             );
            
//             return this.avgColorFromCanvas();
//         } catch (e) {
//             if (this.config.debug) console.log('[BG Detector] Video sample error:', e.message);
//             return null;
//         }
//     }
    
//     sampleImage(img, x, y) {
//         try {
//             if (!img.complete || !img.naturalWidth) return null;
            
//             const rect = img.getBoundingClientRect();
//             let ix = ((x - rect.left) / rect.width) * img.naturalWidth;
//             let iy = ((y - rect.top) / rect.height) * img.naturalHeight;
            
//             ix = Math.max(0, Math.min(Math.floor(ix), img.naturalWidth - 1));
//             iy = Math.max(0, Math.min(Math.floor(iy), img.naturalHeight - 1));
            
//             let cached = this.mediaCache.get(img.src);
//             if (!cached) {
//                 cached = document.createElement('canvas');
//                 cached.width = img.naturalWidth;
//                 cached.height = img.naturalHeight;
//                 cached.getContext('2d').drawImage(img, 0, 0);
//                 this.mediaCache.set(img.src, cached);
//             }
            
//             const pixel = cached.getContext('2d').getImageData(ix, iy, 1, 1).data;
//             if (pixel[3] < 50) return null;
            
//             return { r: pixel[0], g: pixel[1], b: pixel[2] };
//         } catch (e) {
//             return null;
//         }
//     }
    
//     sampleBgImage(element, bgImage, x, y) {
//         const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
//         if (!urlMatch) return null;
        
//         const url = urlMatch[1];
//         let cached = this.mediaCache.get(url);
        
//         if (!cached) {
//             const img = new Image();
//             img.crossOrigin = 'anonymous';
//             img.onload = () => {
//                 const c = document.createElement('canvas');
//                 c.width = img.naturalWidth;
//                 c.height = img.naturalHeight;
//                 c.getContext('2d').drawImage(img, 0, 0);
//                 this.mediaCache.set(url, { canvas: c, w: img.naturalWidth, h: img.naturalHeight });
//             };
//             img.src = url;
//             this.mediaCache.set(url, 'loading');
//             return null;
//         }
        
//         if (cached === 'loading') return null;
        
//         try {
//             const rect = element.getBoundingClientRect();
//             const style = getComputedStyle(element);
            
//             let bw = cached.w, bh = cached.h, ox = 0, oy = 0;
            
//             if (style.backgroundSize === 'cover') {
//                 const scale = Math.max(rect.width / cached.w, rect.height / cached.h);
//                 bw = cached.w * scale;
//                 bh = cached.h * scale;
//                 ox = (bw - rect.width) / 2;
//                 oy = (bh - rect.height) / 2;
//             }
            
//             let bx = ((x - rect.left + ox) / bw) * cached.w;
//             let by = ((y - rect.top + oy) / bh) * cached.h;
            
//             bx = Math.max(0, Math.min(Math.floor(bx), cached.w - 1));
//             by = Math.max(0, Math.min(Math.floor(by), cached.h - 1));
            
//             const pixel = cached.canvas.getContext('2d').getImageData(bx, by, 1, 1).data;
//             if (pixel[3] < 50) return null;
            
//             return { r: pixel[0], g: pixel[1], b: pixel[2] };
//         } catch (e) {
//             return null;
//         }
//     }
    
//     avgColorFromCanvas() {
//         try {
//             const data = this.ctx.getImageData(0, 0, this.config.sampleSize, this.config.sampleSize).data;
//             let r = 0, g = 0, b = 0, n = 0;
            
//             for (let i = 0; i < data.length; i += 4) {
//                 if (data[i + 3] < 50) continue;
//                 r += data[i];
//                 g += data[i + 1];
//                 b += data[i + 2];
//                 n++;
//             }
            
//             if (n === 0) return null;
//             return { r: Math.round(r/n), g: Math.round(g/n), b: Math.round(b/n) };
//         } catch (e) {
//             return null;
//         }
//     }
    
//     parseColor(str) {
//         const rgb = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
//         if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
        
//         const hex = str.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
//         if (hex) return { r: parseInt(hex[1], 16), g: parseInt(hex[2], 16), b: parseInt(hex[3], 16) };
        
//         return null;
//     }
    
//     calculateLuminance(color) {
//         if (!color) return 0.5;
        
//         const r = color.r / 255;
//         const g = color.g / 255;
//         const b = color.b / 255;
        
//         const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
//         const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
//         const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
        
//         return 0.2126 * R + 0.7152 * G + 0.0722 * B;
//     }
    
//     applyMode(target, mode) {
//         const { element, darkClass, lightClass } = target;
//         element.classList.remove(darkClass, lightClass);
//         element.classList.add(mode === 'dark' ? darkClass : lightClass);
//     }
    
//     setThreshold(value, selector = null) {
//         if (selector) {
//             const t = this.targets.find(t => t.selector === selector);
//             if (t) t.threshold = value;
//         } else {
//             this.config.luminanceThreshold = value;
//             this.targets.forEach(t => t.threshold = value);
//         }
//     }
    
//     forceUpdate() {
//         this.detectAndUpdateAll();
//     }
    
//     destroy() {
//         this.stop();
//         this.targets.forEach(t => {
//             t.element.classList.remove(t.darkClass, t.lightClass);
//         });
//         this.targets = [];
//         if (this.debugPanel) this.debugPanel.remove();
//     }
// }

// // Global
// let bgDetector = null;

// function initBackgroundColorDetector(options = {}) {
//     if (bgDetector) bgDetector.destroy();
//     bgDetector = new BackgroundColorDetector(options);
//     return bgDetector;
// }

// function setupColorDetection(options = {}) {
//     const detector = initBackgroundColorDetector({
//         updateInterval: options.updateInterval || 80,
//         luminanceThreshold: options.luminanceThreshold || 0.45,
//         debug: options.debug || false,
//     });
    
//     // Logo
//     if (document.querySelector('#clapat-logo')) {
//         detector.registerTarget({
//             selector: '#clapat-logo',
//             type: 'logo',
//             darkClass: 'logo-dark',
//             lightClass: 'logo-light',
//             threshold: options.logoThreshold || 0.45,
//         });
//     }
    
//     // Social text
//     if (document.querySelector('.social-text')) {
//         detector.registerTarget({
//             selector: '.social-text',
//             type: 'text',
//             darkClass: 'text-dark',
//             lightClass: 'text-light',
//         });
//     }
    
//     detector.start();
//     return detector;
// }

// // Auto init after DOM ready
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => {
//         setTimeout(() => setupColorDetection(), 200);
//     });
// } else {
//     setTimeout(() => setupColorDetection(), 200);
// }