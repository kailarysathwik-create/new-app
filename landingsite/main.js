document.addEventListener('DOMContentLoaded', () => {
    // Reveal Animations
    const revealElements = document.querySelectorAll('[data-reveal]');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target); 
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Parallax Effect for Floating Elements
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    // Store initial transforms to avoid matrix issues
    const initialTransforms = new Map();
    parallaxElements.forEach(el => {
        initialTransforms.set(el, window.getComputedStyle(el).transform === 'none' ? '' : window.getComputedStyle(el).transform);
    });

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-parallax')) || 0;
            const yPos = -(scrolled * speed);
            const base = initialTransforms.get(el);
            el.style.transform = `${base} translateY(${yPos}px)`;
        });
    });

    // Showcase Horizontal Scroll Logic
    const showcase = document.querySelector('.showcase');
    const screenStrip = document.getElementById('screenStrip');
    const featuresScroll = document.querySelector('.features-scroll');
    const featureBlocks = document.querySelectorAll('.feature-block');
    const phoneScreen = document.querySelector('.phone-screen');

    if (showcase && screenStrip && phoneScreen && featuresScroll) {
        const stripImages = screenStrip.querySelectorAll('.screen-img');
        
        window.addEventListener('scroll', () => {
            const showcaseRect = showcase.getBoundingClientRect();
            // Total scroll track is 500vh, minus the viewport we are currently seeing
            const scrollDistance = showcaseRect.height - window.innerHeight;
            
            // Progress from top of showcase to the bottom of its scrollable area
            let progress = -showcaseRect.top / scrollDistance;
            progress = Math.max(0, Math.min(1, progress));

            const totalBlocks = featureBlocks.length;
            const floatIndex = progress * (totalBlocks - 1);
            const activeIndex = Math.round(floatIndex);

            // Update active states
            featureBlocks.forEach((block, idx) => {
                if (idx === activeIndex) {
                    block.classList.add('active');
                } else {
                    block.classList.remove('active');
                }
            });

            // 1. Scroll the text track horizontally
            // The text track translates left by enough to view all slides
            const textMaxScroll = featuresScroll.scrollWidth - window.innerWidth;
            featuresScroll.style.transform = `translateX(${-progress * textMaxScroll}px)`;

            // 2. Scroll the phone images horizontally
            if (stripImages.length > 0) {
                const imgWidth = stripImages[0].offsetWidth;
                const targetX = floatIndex * imgWidth;
                screenStrip.style.transform = `translateX(${-targetX}px)`;
            }
        });
    }

    // Logo Animation: Subtle scale on hover
    const logoImg = document.querySelector('.logo-img');
    if (logoImg) {
        logoImg.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        logoImg.addEventListener('mouseenter', () => {
            logoImg.style.transform = 'scale(1.1) rotate(-5deg)';
        });
        logoImg.addEventListener('mouseleave', () => {
            logoImg.style.transform = 'scale(1) rotate(0deg)';
        });
    }
});
