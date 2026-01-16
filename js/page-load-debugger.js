/**
 * Page Load Performance Debugger
 * This script tracks and logs all resource loading times to help identify bottlenecks
 */

(function() {
    'use strict';

    var startTime = performance.now();
    var loadTimes = [];

    console.log('%c=== PAGE LOAD DEBUGGER STARTED ===', 'background: #222; color: #00ff00; font-size: 14px; padding: 5px;');
    console.log('Start time:', new Date().toISOString());

    // Track Navigation Timing
    function logNavigationTiming() {
        if (!performance.timing) {
            console.warn('Navigation Timing API not supported');
            return;
        }

        var t = performance.timing;
        var navStart = t.navigationStart;

        console.log('%c--- NAVIGATION TIMING ---', 'color: #ff9800; font-weight: bold;');
        console.table({
            'DNS Lookup': { time: (t.domainLookupEnd - t.domainLookupStart) + 'ms' },
            'TCP Connection': { time: (t.connectEnd - t.connectStart) + 'ms' },
            'Request to Response Start (TTFB)': { time: (t.responseStart - t.requestStart) + 'ms' },
            'Response Download': { time: (t.responseEnd - t.responseStart) + 'ms' },
            'DOM Interactive': { time: (t.domInteractive - navStart) + 'ms' },
            'DOM Content Loaded': { time: (t.domContentLoadedEventEnd - navStart) + 'ms' },
            'Page Load Complete': { time: (t.loadEventEnd - navStart) + 'ms' }
        });
    }

    // Track Resource Loading using Performance API
    function logResourceTiming() {
        if (!performance.getEntriesByType) {
            console.warn('Resource Timing API not supported');
            return;
        }

        var resources = performance.getEntriesByType('resource');

        // Categorize resources
        var categories = {
            'Scripts (JS)': [],
            'Stylesheets (CSS)': [],
            'Images': [],
            'Fonts': [],
            'Videos': [],
            'Other': []
        };

        resources.forEach(function(resource) {
            var entry = {
                name: resource.name.split('/').pop().substring(0, 50), // Short name
                fullUrl: resource.name,
                duration: Math.round(resource.duration) + 'ms',
                durationNum: resource.duration,
                size: resource.transferSize ? Math.round(resource.transferSize / 1024) + 'KB' : 'cached/unknown',
                startTime: Math.round(resource.startTime) + 'ms'
            };

            if (resource.initiatorType === 'script' || resource.name.endsWith('.js')) {
                categories['Scripts (JS)'].push(entry);
            } else if (resource.initiatorType === 'link' || resource.name.endsWith('.css')) {
                categories['Stylesheets (CSS)'].push(entry);
            } else if (resource.initiatorType === 'img' || /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?|$)/i.test(resource.name)) {
                categories['Images'].push(entry);
            } else if (/\.(woff|woff2|ttf|otf|eot)(\?|$)/i.test(resource.name)) {
                categories['Fonts'].push(entry);
            } else if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(resource.name)) {
                categories['Videos'].push(entry);
            } else {
                categories['Other'].push(entry);
            }
        });

        // Log each category
        Object.keys(categories).forEach(function(category) {
            var items = categories[category];
            if (items.length === 0) return;

            // Sort by duration (slowest first)
            items.sort(function(a, b) { return b.durationNum - a.durationNum; });

            var totalDuration = items.reduce(function(sum, item) { return sum + item.durationNum; }, 0);

            console.log('%c--- ' + category + ' (' + items.length + ' files, Total: ' + Math.round(totalDuration) + 'ms) ---',
                'color: #2196F3; font-weight: bold;');

            console.table(items.map(function(item) {
                return {
                    'Resource': item.name,
                    'Load Time': item.duration,
                    'Size': item.size,
                    'Start': item.startTime
                };
            }));
        });

        // Find the SLOWEST resources overall
        var allResources = resources.map(function(r) {
            return {
                name: r.name.split('/').pop().substring(0, 40),
                fullUrl: r.name,
                duration: r.duration,
                size: r.transferSize
            };
        }).sort(function(a, b) { return b.duration - a.duration; });

        console.log('%c=== TOP 10 SLOWEST RESOURCES ===', 'background: #f44336; color: white; font-size: 14px; padding: 5px;');
        console.table(allResources.slice(0, 10).map(function(r) {
            return {
                'Resource': r.name,
                'Load Time': Math.round(r.duration) + 'ms',
                'Size': r.size ? Math.round(r.size / 1024) + 'KB' : 'unknown'
            };
        }));

        // Find LARGEST resources
        var largestResources = allResources.filter(function(r) { return r.size > 0; })
            .sort(function(a, b) { return b.size - a.size; });

        console.log('%c=== TOP 10 LARGEST RESOURCES ===', 'background: #9c27b0; color: white; font-size: 14px; padding: 5px;');
        console.table(largestResources.slice(0, 10).map(function(r) {
            return {
                'Resource': r.name,
                'Size': Math.round(r.size / 1024) + 'KB',
                'Load Time': Math.round(r.duration) + 'ms'
            };
        }));
    }

    // Track video loading specifically
    function trackVideoLoading() {
        var videos = document.querySelectorAll('video');
        console.log('%c--- VIDEO ELEMENTS (' + videos.length + ' found) ---', 'color: #e91e63; font-weight: bold;');

        videos.forEach(function(video, index) {
            var src = video.querySelector('source') ? video.querySelector('source').src : video.src;
            console.log('Video ' + (index + 1) + ':', {
                src: src,
                readyState: video.readyState,
                networkState: video.networkState,
                buffered: video.buffered.length > 0 ?
                    'Buffered: ' + Math.round(video.buffered.end(0)) + 's' : 'Not buffered'
            });
        });
    }

    // Track images that are still loading or failed
    function trackImageStatus() {
        var images = document.querySelectorAll('img');
        var loadingImages = [];
        var failedImages = [];

        images.forEach(function(img) {
            if (!img.complete) {
                loadingImages.push(img.src);
            } else if (img.naturalWidth === 0) {
                failedImages.push(img.src);
            }
        });

        if (loadingImages.length > 0) {
            console.log('%c--- IMAGES STILL LOADING ---', 'color: #ff5722; font-weight: bold;');
            loadingImages.forEach(function(src) { console.log('  Loading:', src); });
        }

        if (failedImages.length > 0) {
            console.log('%c--- FAILED IMAGES ---', 'color: #f44336; font-weight: bold;');
            failedImages.forEach(function(src) { console.log('  Failed:', src); });
        }
    }

    // Check for render-blocking resources
    function checkRenderBlocking() {
        console.log('%c--- RENDER-BLOCKING ANALYSIS ---', 'color: #795548; font-weight: bold;');

        // Check scripts without async/defer
        var scripts = document.querySelectorAll('script[src]');
        var blockingScripts = [];
        scripts.forEach(function(script) {
            if (!script.async && !script.defer) {
                blockingScripts.push(script.src.split('/').pop());
            }
        });

        if (blockingScripts.length > 0) {
            console.log('Potentially render-blocking scripts (no async/defer):');
            blockingScripts.forEach(function(s) { console.log('  -', s); });
        }

        // Check stylesheets
        var stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        console.log('Stylesheets (all are render-blocking by default):', stylesheets.length);
    }

    // Network connection info
    function logNetworkInfo() {
        if (navigator.connection) {
            console.log('%c--- NETWORK INFO ---', 'color: #607d8b; font-weight: bold;');
            console.log('Connection type:', navigator.connection.effectiveType);
            console.log('Downlink:', navigator.connection.downlink + ' Mbps');
            console.log('RTT:', navigator.connection.rtt + 'ms');
        }
    }

    // Summary
    function logSummary() {
        var endTime = performance.now();
        var totalTime = Math.round(endTime - startTime);

        console.log('%c=== LOAD SUMMARY ===', 'background: #4CAF50; color: white; font-size: 14px; padding: 5px;');
        console.log('Total JS execution time:', totalTime + 'ms');

        // Get resource counts
        var resources = performance.getEntriesByType('resource');
        var totalSize = resources.reduce(function(sum, r) { return sum + (r.transferSize || 0); }, 0);

        console.log('Total resources loaded:', resources.length);
        console.log('Total transfer size:', Math.round(totalSize / 1024) + 'KB (' + Math.round(totalSize / 1024 / 1024 * 100) / 100 + 'MB)');

        // Key metrics
        if (performance.timing) {
            var t = performance.timing;
            var ttfb = t.responseStart - t.navigationStart;
            var domReady = t.domContentLoadedEventEnd - t.navigationStart;
            var fullLoad = t.loadEventEnd - t.navigationStart;

            console.log('%c--- KEY METRICS ---', 'color: #00bcd4; font-weight: bold;');
            console.log('Time to First Byte (TTFB):', ttfb + 'ms', ttfb > 600 ? '⚠️ SLOW' : '✓');
            console.log('DOM Content Loaded:', domReady + 'ms', domReady > 3000 ? '⚠️ SLOW' : '✓');
            console.log('Full Page Load:', fullLoad + 'ms', fullLoad > 5000 ? '⚠️ SLOW' : '✓');
        }
    }

    // Run all diagnostics when page is fully loaded
    window.addEventListener('load', function() {
        // Wait a bit for all resources to register
        setTimeout(function() {
            console.log('%c\n=== PAGE FULLY LOADED - RUNNING DIAGNOSTICS ===\n',
                'background: #222; color: #00ff00; font-size: 16px; padding: 10px;');

            logNetworkInfo();
            logNavigationTiming();
            logResourceTiming();
            trackVideoLoading();
            trackImageStatus();
            checkRenderBlocking();
            logSummary();

            console.log('%c=== END OF DIAGNOSTICS ===', 'background: #222; color: #00ff00; font-size: 14px; padding: 5px;');
            console.log('To re-run diagnostics, call: window.runLoadDiagnostics()');
        }, 1000);
    });

    // Make diagnostic functions available globally
    window.runLoadDiagnostics = function() {
        logNetworkInfo();
        logNavigationTiming();
        logResourceTiming();
        trackVideoLoading();
        trackImageStatus();
        checkRenderBlocking();
        logSummary();
    };

    // Track DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        var domReadyTime = Math.round(performance.now() - startTime);
        console.log('%cDOMContentLoaded fired at: ' + domReadyTime + 'ms', 'color: #4CAF50; font-weight: bold;');
    });

    // Track early resource failures
    window.addEventListener('error', function(e) {
        if (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK' || e.target.tagName === 'IMG')) {
            console.error('Resource failed to load:', e.target.src || e.target.href);
        }
    }, true);

})();
