/* ============================================================
   FIELD IT — SCRIPT
   Mobile nav, scroll-aware header, and Formspree-with-fallback
   form handling.
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

    /* Booking form handling
       Submits to Formspree if the action URL has been configured.
       Otherwise falls back to a mailto: with the form contents,
       so the site is still usable while you set things up.
    */
    const form = document.getElementById('bookForm');
    const status = document.getElementById('formStatus');

    if (form && status) {
        const actionUrl = form.getAttribute('action') || '';
        const fallbackEmail = form.dataset.fallbackEmail || '';
        const isConfigured = !actionUrl.includes('YOUR_FORM_ID') && actionUrl.startsWith('http');

        form.addEventListener('submit', async (e) => {
            // Honeypot check
            const hp = form.querySelector('input[name="_gotcha"]');
            if (hp && hp.value) { e.preventDefault(); return; }

            if (!isConfigured) {
                // Fallback: open mailto with formatted body
                e.preventDefault();
                const data = new FormData(form);
                const lines = [];
                for (const [k, v] of data.entries()) {
                    if (k.startsWith('_') || !v) continue;
                    lines.push(`${k.replace(/_/g, ' ').toUpperCase()}: ${v}`);
                }
                const subject = encodeURIComponent('Booking request — Field IT');
                const body = encodeURIComponent(lines.join('\n\n'));
                const target = fallbackEmail || 'YOUR_EMAIL@example.com';
                window.location.href = `mailto:${target}?subject=${subject}&body=${body}`;
                setMsg('Opening your email app… Send the message to complete your booking.', 'success');
                return;
            }

            // Configured: submit to Formspree via fetch
            e.preventDefault();
            setMsg('Sending…', '');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const response = await fetch(actionUrl, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { Accept: 'application/json' }
                });
                if (response.ok) {
                    form.reset();
                    setMsg('Got it — booking request received. I\'ll be in touch within 24 hours.', 'success');
                } else {
                    const data = await response.json().catch(() => ({}));
                    const msg = (data.errors && data.errors[0] && data.errors[0].message)
                        || 'Something went wrong. Please text or email instead.';
                    setMsg(msg, 'error');
                }
            } catch (err) {
                setMsg('Network error. Please text or email instead.', 'error');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });

        function setMsg(text, kind) {
            status.textContent = text;
            status.classList.remove('success', 'error');
            if (kind) status.classList.add(kind);
        }
    }
})();
