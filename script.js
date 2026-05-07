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

    /* Booking form handling
       Submits to custom booking API with Google Calendar integration.
    */
    const form = document.getElementById('bookForm');
    const status = document.getElementById('formStatus');

    if (form && status) {
        form.addEventListener('submit', async (e) => {
            // Honeypot check
            const hp = form.querySelector('input[name="_gotcha"]');
            if (hp && hp.value) { e.preventDefault(); return; }

            // Prevent default form submission
            e.preventDefault();
            setMsg('Processing your booking request…', '');
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                // Get form data
                const formData = new FormData(form);
                
                // Convert form data to object
                const bookingData = {};
                for (const [key, value] of formData.entries()) {
                    if (!key.startsWith('_')) { // Skip honeypot field
                        bookingData[key] = value;
                    }
                }

                // Submit to custom API endpoint
                const response = await fetch('/api/book-appointment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bookingData)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    form.reset();
                    setMsg('Success! Your appointment has been booked. A confirmation email has been sent.', 'success');
                } else {
                    const errorMsg = result.error || 'Something went wrong with your booking. Please try again.';
                    setMsg(errorMsg, 'error');
                }
            } catch (err) {
                console.error('Booking error:', err);
                setMsg('Network error. Please try again or contact us directly.', 'error');
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