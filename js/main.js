/* ============================================================
   JavaScript — Dana: The Cyber Relic
   Sections: Carousel (infinite loop, autoplay, controls),
            Gallery (show more / less)
   ============================================================ */

/* ==========================================================
   CAROUSEL
   ========================================================== */

// DOM references
const windowEl = document.querySelector('.carousel-window');
const track = document.querySelector('.carousel-track');
const dots = document.querySelectorAll('.dot');

// Transition string used for smooth sliding
const TRANSITION = 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)';

// Original slides (without clones)
const realItems = Array.from(document.querySelectorAll('.carousel-item'));
const realCount = realItems.length;
const startIndex = realItems.findIndex(item => item.classList.contains('active'));

// Helper: clone all real items
function cloneSet() {
    return realItems.map(item => {
        const clone = item.cloneNode(true);
        clone.classList.add('clone');
        return clone;
    });
}

// Build duplicated sets (prev and next)
const prevSet = cloneSet();
const nextSet = cloneSet();

prevSet.forEach(node => track.insertBefore(node, track.firstChild));
nextSet.forEach(node => track.appendChild(node));

// Full item list = [prev clones] + [real] + [next clones]
const items = Array.from(document.querySelectorAll('.carousel-item'));

// Current index points to the middle (real) set initially
let current = realCount + startIndex;
const AUTOPLAY_MS = 4000;
let autoplayTimer = null;

// Calculate the translation offset for a given index
function slideOffset(index) {
    const gap = 24;
    const itemWidth = items[0].offsetWidth;
    const containerWidth = windowEl.offsetWidth;
    return index * (itemWidth + gap) - (containerWidth - itemWidth) / 2;
}

// Update active classes on items and dots
function setActiveClasses(index) {
    items.forEach((item, i) => item.classList.toggle('active', i === index));

    // Map to logical index (0..realCount-1) for dots
    const logicalIndex = ((index - realCount) % realCount + realCount) % realCount;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === logicalIndex));
}

// Animated move (user-triggered or autoplay)
function updateCarousel() {
    track.style.transition = TRANSITION;
    track.style.transform = `translateX(-${slideOffset(current)}px)`;
    setActiveClasses(current);
}

// Instant move without animation (used for seamless looping)
function jumpTo(index) {
    current = index;

    track.style.transition = 'none';
    items.forEach(item => { item.style.transition = 'none'; });

    track.style.transform = `translateX(-${slideOffset(current)}px)`;
    setActiveClasses(current);

    // Force reflow to commit the no-transition state
    track.offsetHeight;

    track.style.transition = TRANSITION;
    items.forEach(item => { item.style.transition = ''; });
}

// Public methods
function goTo(index) {
    current = index;
    updateCarousel();
}

function next() { goTo(current + 1); }
function prev() { goTo(current - 1); }

// Listen for transition end to perform seamless loop
track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return;

    if (current >= realCount * 2) {
        jumpTo(current - realCount);
    } else if (current < realCount) {
        jumpTo(current + realCount);
    }
});

// Button controls
const nextBtn = document.querySelector('.carousel .next');
const prevBtn = document.querySelector('.carousel .prev');

nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });
prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });

// Dot controls
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        goTo(realCount + index);
        restartAutoplay();
    });
});

// Autoplay functions
function startAutoplay() {
    autoplayTimer = setInterval(next, AUTOPLAY_MS);
}

function restartAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
}

// Pause on hover
const carousel = document.querySelector('.carousel');
carousel.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
carousel.addEventListener('mouseleave', startAutoplay);

// Recalculate position on resize
window.addEventListener('resize', () => jumpTo(current));

// Initialise
jumpTo(current);
startAutoplay();


/* ==========================================================
   GALLERY — Show more / less
   ========================================================== */

const galleryGrid = document.getElementById('gallery-grid');
const galleryToggle = document.getElementById('gallery-toggle');

// Only run if the gallery elements exist
if (galleryGrid && galleryToggle) {
    const INITIAL_VISIBLE = 3;
    const galleryItems = Array.from(galleryGrid.querySelectorAll('.gallery-item'));

    // Hide items beyond the initial visible count
    galleryItems.forEach((item, index) => {
        if (index >= INITIAL_VISIBLE) item.classList.add('is-hidden');
    });

    // Hide toggle if there are no extra items
    if (galleryItems.length <= INITIAL_VISIBLE) {
        galleryToggle.style.display = 'none';
    }

    let expanded = false;

    galleryToggle.addEventListener('click', () => {
        expanded = !expanded;

        galleryItems.forEach((item, index) => {
            if (index >= INITIAL_VISIBLE) {
                item.classList.toggle('is-hidden', !expanded);
            }
        });

        galleryToggle.textContent = expanded ? 'Show Less' : 'Show More';

        // When collapsing, scroll back to top of gallery
        if (!expanded) {
            document.getElementById('gallery').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
}