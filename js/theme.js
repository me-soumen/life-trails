// Theme Management
(function() {
    'use strict';

    const THEME_KEY = 'life-trails-theme';
    const DEFAULT_THEME = 'light'; // Default to light theme with gradients

    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
        setTheme(savedTheme);
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        updateThemeButton(theme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    function updateThemeButton(theme) {
        const buttons = document.querySelectorAll('.theme-toggle');
        buttons.forEach(btn => {
            const isDark = theme === 'dark';
            btn.setAttribute('data-theme', theme);
            btn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
            
            const track = btn.querySelector('.theme-toggle-track');
            const knob = btn.querySelector('.theme-toggle-knob');
            const text = btn.querySelector('.theme-toggle-text');
            
            // Only require track and knob, text is optional (for mobile buttons)
            if (!track || !knob) return;
            
            // Update toggle state
            if (isDark) {
                btn.classList.add('theme-toggle-dark');
                btn.classList.remove('theme-toggle-light');
                if (text) {
                    text.innerHTML = 'DARK<br>MODE';
                }
                // Remove inline display styles from icons to let CSS handle visibility
                const sunIcon = knob.querySelector('.theme-toggle-icon-sun');
                const moonIcon = knob.querySelector('.theme-toggle-icon-moon');
                if (sunIcon) sunIcon.removeAttribute('style');
                if (moonIcon) moonIcon.removeAttribute('style');
                
                // If icons don't exist, create them
                if (!sunIcon || !moonIcon) {
                    knob.innerHTML = `
                        <svg class="theme-toggle-icon theme-toggle-icon-sun" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <svg class="theme-toggle-icon theme-toggle-icon-moon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    `;
                }
            } else {
                btn.classList.add('theme-toggle-light');
                btn.classList.remove('theme-toggle-dark');
                if (text) {
                    text.innerHTML = 'LIGHT<br>MODE';
                }
                // Remove inline display styles from icons to let CSS handle visibility
                const sunIcon = knob.querySelector('.theme-toggle-icon-sun');
                const moonIcon = knob.querySelector('.theme-toggle-icon-moon');
                if (sunIcon) sunIcon.removeAttribute('style');
                if (moonIcon) moonIcon.removeAttribute('style');
                
                // If icons don't exist, create them
                if (!sunIcon || !moonIcon) {
                    knob.innerHTML = `
                        <svg class="theme-toggle-icon theme-toggle-icon-sun" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <svg class="theme-toggle-icon theme-toggle-icon-moon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    `;
                }
            }
        });
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

    // Export to window
    window.themeManager = {
        toggle: toggleTheme,
        set: setTheme,
        init: initTheme
    };
})();
