document.addEventListener('DOMContentLoaded', () => {
    // Sticky Navbar
    // Sticky Navbar & Hide on Scroll logic
    const navbar = document.getElementById('navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        // Toggle 'scrolled' class based on distance from top
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide/Show navbar based on scroll direction
        if (window.scrollY > lastScrollY && window.scrollY > 150) {
            // Scrolling down and past certain threshold
            navbar.classList.add('nav-hidden');
        } else {
            // Scrolling up
            navbar.classList.remove('nav-hidden');
        }

        lastScrollY = window.scrollY;
    });

    // Scroll Animations (Intersection Observer)
    const fadeElements = document.querySelectorAll('.fade-up');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(element => {
        observer.observe(element);
    });

    // Procedural Marquee logic
    const track = document.getElementById('marquee-track');
    if (track) {
        const container = track.parentElement;
        let scrollPos = 0;
        const speed = 1.2; // Pixels per frame
        let isPaused = false;

        // Clone items procedurally to fill the screen width + buffer
        const initMarquee = () => {
            const containerWidth = container.offsetWidth;
            if (containerWidth === 0) return;

            // We need enough items to fill the screen at least twice to ensure 
            // there's always an item to show while one is being re-queued.
            while (track.scrollWidth > 0 && track.scrollWidth < containerWidth * 2.5) {
                const currentItems = Array.from(track.children);
                currentItems.forEach(item => {
                    const clone = item.cloneNode(true);
                    track.appendChild(clone);
                });
            }
        };

        initMarquee();
        // Re-run on resize and load to ensure continuity
        window.addEventListener('resize', initMarquee);
        window.addEventListener('load', initMarquee);

        track.addEventListener('mouseenter', () => isPaused = true);
        track.addEventListener('mouseleave', () => isPaused = false);

        const animate = () => {
            if (!isPaused) {
                scrollPos -= speed;

                const firstItem = track.firstElementChild;
                if (firstItem) {
                    const style = window.getComputedStyle(track);
                    const gap = parseFloat(style.gap) || 0;
                    const itemWidth = firstItem.offsetWidth;

                    // Procedural move: when an item is fully off-screen, move it to the end
                    if (Math.abs(scrollPos) >= itemWidth + gap) {
                        scrollPos += (itemWidth + gap);
                        track.appendChild(firstItem);
                    }
                }

                track.style.transform = `translateX(${scrollPos}px)`;
            }
            requestAnimationFrame(animate);
        };

        animate();
    }

    // Form submission prevent default
    const form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Message Sent!';
            btn.style.backgroundColor = '#2cba6c'; // success green
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                form.reset();
            }, 3000);
        });
    }
});
