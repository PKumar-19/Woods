# Infinite Scroll Slider - Documentation

A clean, modern, and performant infinite horizontal scroll slider for showcasing portfolio projects.

## 📁 Files Created

```
HTML/
├── infinite-scroll.html        # HTML structure for the slider
├── css/
│   └── infinite-scroll.css    # Slider styling
└── js/
    └── infinite-scroll.js     # Slider functionality
```

## 🚀 Installation

The slider has already been integrated into `index.html`:

1. ✅ CSS file linked in the `<head>` section
2. ✅ JS file included before closing `</body>` tag
3. ✅ Container div added to the Portfolio Scroll Section

## 📝 Usage

The slider automatically initializes when the page loads. The container div is:

```html
<div id="infinite-scroll-container"></div>
```

### Manual Initialization

If you need to manually initialize the slider:

```javascript
const slider = new InfiniteScrollSlider('#infinite-scroll-container');
```

## 🎨 Customization

### Adjust Scroll Speed

```javascript
// Make it scroll faster (lower number = faster)
window.infiniteScrollSlider.setSpeed(20); // 20 seconds

// Make it scroll slower (higher number = slower)
window.infiniteScrollSlider.setSpeed(60); // 60 seconds
```

### CSS Variables

You can customize the slider appearance by modifying CSS variables in `css/infinite-scroll.css`:

```css
:root {
    --scroll-duration: 40s;      /* Animation duration */
    --slide-width: 500px;        /* Width of each slide */
    --slide-height: 600px;       /* Height of each slide */
    --slide-gap: 60px;           /* Gap between slides */
}
```

## 🎯 Features

### Automatic Features
- ✨ **Infinite Loop**: Seamlessly loops slides for continuous scrolling
- ⏸️ **Pause on Hover**: Automatically pauses when user hovers over the slider
- 📱 **Fully Responsive**: Adapts to mobile, tablet, and desktop screens
- 🎭 **Smooth Animations**: CSS-based animations for optimal performance
- 👆 **Touch Support**: Pauses on touch/drag for mobile devices
- 🔍 **Intersection Observer**: Pauses when slider is not visible (performance optimization)

### Visual Effects
- Scale up animation on hover
- Image zoom effect on hover
- Staggered slide appearance on load
- Smooth entrance animations

## 📱 Responsive Breakpoints

The slider automatically adjusts at these breakpoints:

- **Desktop** (>1200px): 500px × 600px slides
- **Tablet** (≤1200px): 450px × 550px slides
- **Mobile** (≤768px): 350px × 450px slides

## 🔧 Adding/Removing Slides

To add or remove slides, edit `infinite-scroll.html`:

```html
<!-- Add a new slide -->
<div class="infinite-slide">
    <div class="slide-image">
        <img src="path/to/image.png" alt="Project Name">
    </div>
    <div class="slide-content">
        <div class="slide-year">2025</div>
        <h2 class="slide-title">Project Title</h2>
        <div class="slide-category">Category</div>
    </div>
    <div class="slide-thumbnail">
        <img src="path/to/icon.png" alt="Icon">
    </div>
</div>
```

**Important**: After modifying slides, update the `--scroll-distance` in CSS:

```css
/* Calculate: (slide-width × number-of-slides) + (gap × number-of-slides) */
--scroll-distance: -3360px; /* Example for 6 slides */
```

## 🎮 JavaScript API

### Methods

```javascript
// Get the slider instance
const slider = window.infiniteScrollSlider;

// Pause the slider
slider.pause();

// Resume the slider
slider.resume();

// Change animation speed
slider.setSpeed(30); // seconds

// Get current speed
const speed = slider.getSpeed();

// Destroy the slider
slider.destroy();
```

### Events

Click events are handled automatically. To customize click behavior, edit `js/infinite-scroll.js`:

```javascript
addSlideClickHandlers() {
    const allSlides = this.container.querySelectorAll('.infinite-slide');

    allSlides.forEach(slide => {
        slide.addEventListener('click', (e) => {
            const title = slide.querySelector('.slide-title').textContent;
            // Add your custom logic here
            console.log('Clicked:', title);
        });
    });
}
```

## 🎨 Styling Tips

### Change Background Color

```css
.infinite-slider {
    background-color: #your-color; /* Change from #0c0c0c */
}
```

### Change Card Background

```css
.infinite-slide {
    background-color: #your-color; /* Change from #1a1a1a */
}
```

### Adjust Hover Effect

```css
.infinite-slide:hover {
    transform: scale(1.1) translateY(-15px); /* More dramatic effect */
}
```

### Modify Border Radius

```css
.infinite-slide {
    border-radius: 20px; /* Rounder corners */
}
```

## 🐛 Troubleshooting

### Slider Not Showing

1. Check that all files are properly linked in `index.html`
2. Verify the container div exists: `<div id="infinite-scroll-container"></div>`
3. Check browser console for errors

### Animation Not Working

1. Ensure CSS file is loaded
2. Check that `--scroll-distance` is correctly calculated
3. Verify browser supports CSS animations

### Slides Not Cloning

1. Check that `infinite-scroll.html` is in the correct location
2. Verify the fetch path in `js/infinite-scroll.js`
3. Check browser console for fetch errors

## 📊 Performance

The slider is optimized for performance:

- Uses CSS animations (GPU-accelerated)
- Implements Intersection Observer to pause when not visible
- Uses `will-change` property for smooth transforms
- Minimal JavaScript for better performance

## 🌐 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ IE11 (not supported - requires polyfills)

## 📄 License

This slider is part of the Bennet Creative Portfolio Template.

## 🤝 Support

For issues or questions, refer to the main template documentation.

---

**Created**: 2025
**Version**: 1.0.0
