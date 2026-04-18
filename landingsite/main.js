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

    // Showcase Scroll Logic
    const showcase = document.querySelector('.showcase');
    const screenStrip = document.getElementById('screenStrip');
    const featureBlocks = document.querySelectorAll('.feature-block');
    const phoneScreen = document.querySelector('.phone-screen');

    if (showcase && screenStrip && phoneScreen) {
        window.addEventListener('scroll', () => {
            const windowHeight = window.innerHeight;
            const viewportCenter = windowHeight / 2;

            // Find the block that is most "centered"
            let closestBlockIdx = 0;
            let minDistance = Infinity;

            featureBlocks.forEach((block, idx) => {
                const rect = block.getBoundingClientRect();
                const blockCenter = rect.top + (rect.height / 2);
                const distance = Math.abs(blockCenter - viewportCenter);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestBlockIdx = idx;
                }
            });

            // Update active states
            featureBlocks.forEach((block, idx) => {
                if (idx === closestBlockIdx) {
                    block.classList.add('active');
                } else {
                    block.classList.remove('active');
                }
            });

            // Calculate precise translation
            // Each image takes up exactly imgHeight in the strip
            const stripImages = screenStrip.querySelectorAll('.screen-img');
            if (stripImages.length > 0) {
                const imgHeight = stripImages[0].offsetHeight;
                
                // We want the current active image to be at the top of the strip (0px offset relative to screen)
                // BUT we also want a smooth transition as we scroll between blocks
                
                // Find transition progress between current block and next/prev
                const activeBlock = featureBlocks[closestBlockIdx];
                const activeRect = activeBlock.getBoundingClientRect();
                const activeCenter = activeRect.top + (activeRect.height / 2);
                
                // Normalised offset from center (-0.5 to 0.5)
                let blockProgress = (viewportCenter - activeCenter) / activeRect.height;
                blockProgress = Math.max(-0.5, Math.min(0.5, blockProgress));

                const targetY = -(closestBlockIdx + blockProgress) * imgHeight;
                screenStrip.style.transform = `translateY(${targetY}px)`;
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
