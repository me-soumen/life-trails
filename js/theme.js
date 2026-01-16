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
                const maskId = 'moonMask' + Math.random().toString(36).substr(2, 9);
                knob.innerHTML = `
                    <svg class="theme-toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g mask="url(#${maskId})">
                            <circle cx="12" cy="12" r="5.5" fill="currentColor"/>
                        </g>
                        <circle cx="15.5" cy="8.5" r="1" fill="currentColor"/>
                        <circle cx="17.5" cy="10.5" r="0.6" fill="currentColor"/>
                        <defs>
                            <mask id="${maskId}">
                                <rect width="24" height="24" fill="white"/>
                                <circle cx="15" cy="12" r="4" fill="black"/>
                            </mask>
                        </defs>
                    </svg>
                `;
            } else {
                btn.classList.add('theme-toggle-light');
                btn.classList.remove('theme-toggle-dark');
                if (text) {
                    text.innerHTML = 'LIGHT<br>MODE';
                }
                knob.innerHTML = `
                    <svg class="theme-toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                        <path d="M12 6V4M12 20V18M6 12H4M20 12H18M8.5 8.5L7 7M17 17L15.5 15.5M8.5 15.5L7 17M17 7L15.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                `;
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
