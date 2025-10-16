// --- Utility Function: Throttling for performance ---
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// --- Core Functions ---

// 1. Dark/Light toggle
const toggle = document.getElementById('modeToggle');
const setModeText = (isDark) => {
    toggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
};
const toggleMode = () => {
    const isDark = document.body.classList.toggle('dark');
    document.body.classList.toggle('light', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    setModeText(isDark);
};
if (toggle) {
    toggle.addEventListener('click', toggleMode);
}

// --- New Function: Counting Animation (Updated to handle "+" format) ---
const animateCount = (element) => {
    // Prevent animation from running multiple times
    if (element.classList.contains('animated')) return;
    element.classList.add('animated');

    const target = parseInt(element.getAttribute('data-target'));
    const format = element.getAttribute('data-format'); // e.g., K+, B+, %, +
    const duration = 2000; // 2 seconds
    let startTimestamp = null;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Calculate the current value
        let currentValue = Math.floor(progress * target);

        // Formatting logic
        let formattedValue = currentValue;

        if (format === 'K+') {
            formattedValue = (currentValue / 1000).toFixed(0) + 'K+';
        } else if (format === 'B+') {
            // Need to divide by 1 billion
            formattedValue = (currentValue / 1000000000).toFixed(0) + 'B+';
        } else if (format === '%') {
            formattedValue = currentValue + '%';
        } else if (format === '+') {
            // New format for 10+
            formattedValue = currentValue + '+';
        }

        element.textContent = formattedValue;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Ensure final value is exactly the target format and fully visible
            if (format === 'K+') {
                element.textContent = (target / 1000).toFixed(0) + 'K+';
            } else if (format === 'B+') {
                element.textContent = (target / 1000000000).toFixed(0) + 'B+';
            } else if (format === '%') {
                element.textContent = target + '%';
            } else if (format === '+') {
                element.textContent = target + '+';
            } else {
                element.textContent = target; // Plain number
            }
        }
    };

    window.requestAnimationFrame(step);
};
// --- End Counting Animation Function ---


// Initialize theme from localStorage and set up event listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(savedTheme);
    setModeText(savedTheme === 'dark');

    // 2. Smooth scroll for nav links (now handles both desktop and mobile nav)
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            // Ensure link still scrolls (even if menu logic below is active)
            document.querySelector(link.getAttribute('href')).scrollIntoView({behavior:'smooth'});
        });
    });

    // Mobile Menu Logic
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobile-nav');

    if (menuToggle && mobileNav) {
        const toggleMenu = () => {
            // Check current expanded state
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            
            // Toggle classes and attributes
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            mobileNav.setAttribute('aria-hidden', isExpanded); // Hide if it was open
            mobileNav.classList.toggle('is-open');
            document.body.classList.toggle('menu-open'); // Lock body scroll
            
            // Toggle the icon (bars <-> times)
            menuToggle.querySelector('i').className = isExpanded ? 'fas fa-bars' : 'fas fa-times';
        };

        menuToggle.addEventListener('click', toggleMenu);
        
        // Close menu when a link inside the mobile nav is clicked
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                // Wait a moment for scroll to start, then close menu
                setTimeout(toggleMenu, 300); 
            });
        });
    }
    
    // 3. Fade-in animations using Intersection Observer
    // Selects all sections except hero (which is always visible)
    const sections = document.querySelectorAll('section:not(#hero)');
    
    // Intersection Observer callback
    const handleIntersection = throttle((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                // Don't unobserve #portfolio here, as the count animation observer handles it.
                // We'll let the count animation observer unobserve the main portfolio section to manage the single-run animation better.
                if(entry.target.id !== 'portfolio') { 
                    observer.unobserve(entry.target); // Stop observing once visible
                }
            }
        });
    }, 150); 

    const observer = new IntersectionObserver(handleIntersection, {threshold:0.1});
    sections.forEach(sec => observer.observe(sec));


    // --- Portfolio Stats Counting Animation Observer (Existing) ---
    const portfolioStats = document.querySelectorAll('#portfolio .count-animate');
    let hasPortfolioAnimated = false; // Flag to ensure the count only animates once

    const handlePortfolioCountAnimation = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasPortfolioAnimated) {
                portfolioStats.forEach(stat => {
                    animateCount(stat);
                });
                hasPortfolioAnimated = true; // Set flag so it doesn't re-run
                observer.unobserve(entry.target); // Stop observing the parent section
            }
        });
    };
    
    // Create an observer targeting the parent section (#portfolio)
    const portfolioSection = document.getElementById('portfolio');
    if (portfolioSection) {
        const portfolioCountObserver = new IntersectionObserver(handlePortfolioCountAnimation, {
            threshold: 0.2 // Trigger when 20% of the section is visible
        });
        portfolioCountObserver.observe(portfolioSection);
    }
    // --- End Portfolio Stats Counting Animation Observer ---


    // --- NEW: Client Stats Counting Animation Observer ---
    const clientStatsContainer = document.querySelector('.client-stats-showcase');
    const clientStats = document.querySelectorAll('.client-stats-showcase .count-animate');
    let hasClientStatsAnimated = false; // Flag for new stats

    const handleClientCountAnimation = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasClientStatsAnimated) {
                clientStats.forEach(stat => {
                    animateCount(stat);
                });
                hasClientStatsAnimated = true; // Set flag so it doesn't re-run
                observer.unobserve(entry.target); // Stop observing the container
            }
        });
    };

    if (clientStatsContainer) {
        const clientStatsObserver = new IntersectionObserver(handleClientCountAnimation, {
            threshold: 0.2 // Trigger when 20% of the container is visible
        });
        clientStatsObserver.observe(clientStatsContainer);
    }
    // --- END NEW: Client Stats Counting Animation Observer ---

    // 4. Portfolio filter and 5. Portfolio reveal info are removed as the data model changed.
    // The previous portfolio projects are replaced by the Impact Grid.

    // --- Typing Animation (Optimized with Intersection Observer) ---
    const typedTextElement = document.getElementById('typed-text');
    const heroSection = document.getElementById('hero'); // Target element to observe
    const phrases = ["scale profits.", "drive traffic.", "optimize campaigns.", "build growth."];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let animationFrameId = null; // To hold the requestAnimationFrame ID
    let isObserving = false; // Flag to track if the animation is currently running

    // Time-based variables for animation control
    const typingSpeed = 100; // Time per character (ms)
    const deletingSpeed = 50; // Time per character (ms)
    const pauseDuration = 1500; // Pause at end of phrase (ms)
    let lastFrameTime = 0;
    let totalDelayTime = 0;
    let isPaused = false;

    function type(currentTime) {
        if (!typedTextElement || !isObserving) {
            // Stop if the element is not found or not in view
            return; 
        }

        // Calculate time elapsed since last frame
        if (!lastFrameTime) lastFrameTime = currentTime;
        const deltaTime = currentTime - lastFrameTime;

        if (isPaused) {
            totalDelayTime += deltaTime;
            if (totalDelayTime >= pauseDuration) {
                isPaused = false;
                totalDelayTime = 0;
            } else {
                animationFrameId = requestAnimationFrame(type);
                lastFrameTime = currentTime;
                return;
            }
        }

        const currentPhrase = phrases[phraseIndex];
        let currentSpeed = isDeleting ? deletingSpeed : typingSpeed;

        if (totalDelayTime >= currentSpeed) {
            totalDelayTime = 0; // Reset accumulated time

            if (isDeleting) {
                // Deleting
                typedTextElement.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
                if (charIndex === 0) {
                    isDeleting = false;
                    phraseIndex = (phraseIndex + 1) % phrases.length;
                    isPaused = true;
                    totalDelayTime = 0;
                }
            } else {
                // Typing
                typedTextElement.textContent += currentPhrase[charIndex];
                charIndex++;
                if (charIndex === currentPhrase.length) {
                    isDeleting = true;
                    isPaused = true;
                }
            }
        }

        totalDelayTime += deltaTime;
        lastFrameTime = currentTime;
        animationFrameId = requestAnimationFrame(type);
    }

    if (typedTextElement && heroSection) {
        const typingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!isObserving) {
                        // Start the animation only if it's not already running
                        isObserving = true;
                        animationFrameId = requestAnimationFrame(type);
                    }
                } else {
                    // Pause the animation when out of view
                    isObserving = false;
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                    // Reset time/state variables for a cleaner restart
                    lastFrameTime = 0;
                    totalDelayTime = 0;
                }
            });
        }, {
            // A threshold of 0.5 means the animation starts/stops when 50% of the element is visible
            threshold: 0.5
        });

        typingObserver.observe(heroSection);
    }
    // --- END Typing Animation Optimization ---
});
