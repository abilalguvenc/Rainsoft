document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Sticky navbar, hide on scroll down ---------- */
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    let lastScrollY = window.scrollY;

    const closeMenu = () => {
        navLinks.classList.remove('open');
        navbar.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
    };

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);

        // Don't slide the bar away while the mobile menu is open.
        if (!navLinks.classList.contains('open')) {
            const scrollingDown = window.scrollY > lastScrollY && window.scrollY > 150;
            navbar.classList.toggle('nav-hidden', scrollingDown);
        }

        lastScrollY = window.scrollY;
    }, { passive: true });

    /* ---------- Mobile menu ---------- */
    navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        navbar.classList.toggle('nav-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    navLinks.addEventListener('click', (e) => {
        if (e.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
            closeMenu();
            navToggle.focus();
        }
    });

    /* ---------- Scroll animations ---------- */
    const fadeElements = document.querySelectorAll('.fade-up');

    if (reduceMotion || !('IntersectionObserver' in window)) {
        // No observer (or the visitor asked for less motion): just show everything.
        fadeElements.forEach((el) => el.classList.add('visible'));
    } else {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

        fadeElements.forEach((el) => observer.observe(el));
    }

    /* ---------- Active nav link ---------- */
    const sections = Array.from(document.querySelectorAll('main section[id], main header[id]'));
    const linkFor = new Map();
    document.querySelectorAll('.nav-links a[href^="#"]').forEach((a) => {
        linkFor.set(a.getAttribute('href').slice(1), a);
    });

    if ('IntersectionObserver' in window && sections.length) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const link = linkFor.get(entry.target.id);
                if (link) link.classList.toggle('active', entry.isIntersecting);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach((s) => spy.observe(s));
    }

    /* ---------- Partner marquee ---------- */
    const track = document.getElementById('marquee-track');
    if (track && !reduceMotion) {
        const container = track.parentElement;
        const originals = Array.from(track.children);
        const speed = 1.2; // pixels per frame
        let scrollPos = 0;
        let isPaused = false;

        // Clone the strip until it comfortably overfills the viewport, so there is
        // always another logo queued as one rotates off the left edge.
        const initMarquee = () => {
            const containerWidth = container.offsetWidth;
            if (!containerWidth || !track.scrollWidth) return;

            // Hard cap: originals.length * 12 keeps a pathological resize loop bounded.
            const maxChildren = originals.length * 12;
            while (track.scrollWidth < containerWidth * 2.5 && track.children.length < maxChildren) {
                const before = track.children.length;
                originals.forEach((item) => track.appendChild(item.cloneNode(true)));
                if (track.children.length === before) break; // nothing was added; bail out
            }
        };

        initMarquee();
        window.addEventListener('load', initMarquee);

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(initMarquee, 200);
        });

        track.addEventListener('mouseenter', () => { isPaused = true; });
        track.addEventListener('mouseleave', () => { isPaused = false; });
        track.addEventListener('focusin', () => { isPaused = true; });
        track.addEventListener('focusout', () => { isPaused = false; });

        const animate = () => {
            if (!isPaused) {
                scrollPos -= speed;

                const firstItem = track.firstElementChild;
                if (firstItem) {
                    const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
                    const itemWidth = firstItem.offsetWidth;

                    // Once an item is fully off-screen, requeue it at the end.
                    if (itemWidth && Math.abs(scrollPos) >= itemWidth + gap) {
                        scrollPos += itemWidth + gap;
                        track.appendChild(firstItem);
                    }
                }

                track.style.transform = `translateX(${scrollPos}px)`;
            }
            requestAnimationFrame(animate);
        };

        animate();
    }

    /* ---------- Contact form ---------- */
    // GitHub Pages has no backend, so submissions go through Web3Forms, which
    // emails them to info@rainsoft.uk. The access key is public by design.
    const WEB3FORMS_KEY = '66a453aa-6575-436d-b660-925ac7c898a7';
    const form = document.getElementById('contact-form');
    if (form) {
        const messageField = form.querySelector('#contact-message');
        const chips = form.querySelectorAll('.topic-chip');
        const otherChip = form.querySelector('.topic-chip[data-other]');
        const selectChip = (chip) => chips.forEach((c) => c.classList.toggle('active', c === chip));

        chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                selectChip(chip);
                messageField.value = chip.dataset.message;
                messageField.focus();
                // Park the caret at the end so "Other" can be finished straight away.
                const end = messageField.value.length;
                messageField.setSelectionRange(end, end);
            });
        });

        // Free typing counts as "Other"; clearing the message drops the topic.
        messageField.addEventListener('input', () => {
            if (!messageField.value.trim()) {
                selectChip(null);
            } else if (!form.querySelector('.topic-chip.active')) {
                selectChip(otherChip);
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const name = form.querySelector('#contact-name').value.trim();
            const email = form.querySelector('#contact-email').value.trim();
            const message = messageField.value.trim();
            if (!name || !email || !message) return;
            const topic = form.querySelector('.topic-chip.active')?.textContent || 'General';

            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Sending…';

            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        access_key: WEB3FORMS_KEY,
                        subject: `New ${topic} enquiry from ${name}`,
                        from_name: 'Rainsoft Website',
                        name,
                        email,
                        replyto: email,
                        topic,
                        message,
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message);
                btn.textContent = 'Thanks! We’ll be in touch.';
                form.reset();
                selectChip(null);
            } catch (err) {
                btn.textContent = 'Something went wrong. Please email us.';
            }

            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 4000);
        });
    }
});
