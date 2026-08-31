/* ----- Carousel (infinite loop, no visible cut, smooth) ----- */
const windowEl = document.querySelector('.carousel-window');
const track = document.querySelector('.carousel-track');
const dots = document.querySelectorAll('.dot');

// Single source of truth for the slide animation
const TRANSITION = 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)';

// Capture the original slides before touching the DOM
const realItems = Array.from(document.querySelectorAll('.carousel-item'));
const realCount = realItems.length;
const startIndex = realItems.findIndex(item => item.classList.contains('active'));

// Duplicate the FULL set on both sides (not just one item).
// This matters because .carousel-item uses flex: 0 0 75%, so
// neighbouring slides peek in from the sides. A single clone only
// guarantees the *centered* slide matches at reset time — the
// peeking neighbours would still swap abruptly. A full duplicate
// on each side guarantees the whole visible neighbourhood matches.
function cloneSet() {
    return realItems.map(item => {
        const clone = item.cloneNode(true);
        clone.classList.add('clone');
        return clone;
    });
}

const prevSet = cloneSet();
const nextSet = cloneSet();

prevSet.forEach(node => track.insertBefore(node, track.firstChild));
nextSet.forEach(node => track.appendChild(node));

// items = [prevSet][realSet][nextSet]
const items = Array.from(document.querySelectorAll('.carousel-item'));

let current = realCount + startIndex; // start inside the middle (real) set
const AUTOPLAY_MS = 4000;
let autoplayTimer = null;

function slideOffset(index) {
    const gap = 24;
    const itemWidth = items[0].offsetWidth;
    const containerWidth = windowEl.offsetWidth;
    return index * (itemWidth + gap) - (containerWidth - itemWidth) / 2;
}

function setActiveClasses(index) {
    items.forEach((item, i) => item.classList.toggle('active', i === index));

    // Map back to a 0..realCount-1 logical index for the dots
    const logicalIndex = ((index - realCount) % realCount + realCount) % realCount;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === logicalIndex));
}

// Animated move (user-triggered / autoplay)
function updateCarousel() {
    track.style.transition = TRANSITION;
    track.style.transform = `translateX(-${slideOffset(current)}px)`;
    setActiveClasses(current);
}

// Instant move, no animation — only ever used once we're sitting on
// a fully-duplicated slide, so nothing visibly changes on screen
function jumpTo(index) {
    current = index;

    // Disable the track's slide transition AND each item's own
    // active-state transition (opacity/scale). Without the second
    // part, swapping .active from the clone to the real item still
    // plays that item's local transition, showing up as a second,
    // misplaced "pop" animation right after the slide finishes.
    track.style.transition = 'none';
    items.forEach(item => { item.style.transition = 'none'; });

    track.style.transform = `translateX(-${slideOffset(current)}px)`;
    setActiveClasses(current);

    // Force reflow so the browser commits the "no transition" state
    // before we hand control back
    track.offsetHeight;

    track.style.transition = TRANSITION;
    items.forEach(item => { item.style.transition = ''; });
}

function goTo(index) {
    current = index;
    updateCarousel();
}

function next() { goTo(current + 1); }
function prev() { goTo(current - 1); }

track.addEventListener('transitionend', (e) => {
    // .carousel-item children also transition their own `transform`
    // (the active scale effect) and transitionend bubbles up, so we
    // must ignore anything that didn't originate on the track itself
    if (e.target !== track || e.propertyName !== 'transform') return;

    // Once we've drifted into a fully-duplicated zone, silently
    // recentre into the real (middle) set — neighbours match exactly
    if (current >= realCount * 2) {
        jumpTo(current - realCount);
    } else if (current < realCount) {
        jumpTo(current + realCount);
    }
});

document.querySelector('.next').addEventListener('click', () => { next(); restartAutoplay(); });
document.querySelector('.prev').addEventListener('click', () => { prev(); restartAutoplay(); });

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => { goTo(realCount + index); restartAutoplay(); });
});

function startAutoplay() {
    autoplayTimer = setInterval(next, AUTOPLAY_MS);
}

function restartAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
}

// Pause on hover so it doesn't move while the user is looking at it
const carousel = document.querySelector('.carousel');
carousel.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
carousel.addEventListener('mouseleave', startAutoplay);

window.addEventListener('resize', () => jumpTo(current));

jumpTo(current);
startAutoplay();