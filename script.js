/* ============================================================
   FIELD IT — SCRIPT
   Mobile nav, scroll-aware header, and custom booking form handling
   with Google Calendar integration.
   ============================================================ */

(function () {
    'use strict';

    /* Footer year */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* Scroll-aware nav border */
    const nav = document.querySelector('.nav');
    const onScroll = () => {
        if (!nav) return;
        nav.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Mobile nav toggle */
    const toggle = document.querySelector('.nav-toggle');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        // Close menu when a link is clicked
        nav.querySelectorAll('.nav-links a').forEach((a) => {
            a.addEventListener('click', () => {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Booking form handling removed - using Google Scheduler iframe instead
})();