// Main Application Logic
(function() {
    'use strict';

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    function getMonthNumber(monthName) {
        const months = {
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12'
        };
        return months[monthName.toLowerCase()] || '01';
    }

    function getImageUrl(userId, imageName) {
        if (!imageName) return '';
        
        // Get current user to check if this is a demo account
        const currentUser = window.auth && window.auth.getCurrentUser ? window.auth.getCurrentUser() : null;
        
        // Always check if current user is demo account first (check for both possible demo emails)
        const isDemoAccount = currentUser && (
            currentUser.email === 'demo@life.trails.click' || 
            currentUser.email === 'demo@lifetrails.com'
        );
        
        // Adjust path based on current location
        const currentPath = window.location.pathname;
        let imagePath;
        
        if (isDemoAccount) {
            // Demo account: images are in data/{userEmail}/images/{imageName}
            // Always use demo@life.trails.click for demo account paths
            const demoEmail = 'demo@life.trails.click';
            
            // First check localStorage for uploaded images (with demo email)
            const imageKey = `life-trails-image-${demoEmail}-${imageName}`;
            const storedImage = localStorage.getItem(imageKey);
            if (storedImage) {
                return storedImage; // Base64 data URL
            }
            
            // Build path to data/{email}/images/{imageName}
            if (currentPath.includes('/app/dashboard/')) {
                imagePath = `../../../data/${encodeURIComponent(demoEmail)}/images/${escapeHtml(imageName)}`;
            } else if (currentPath.includes('/app/add/')) {
                imagePath = `../../../../data/${encodeURIComponent(demoEmail)}/images/${escapeHtml(imageName)}`;
            } else if (currentPath.includes('/app/signin/')) {
                imagePath = `../../../data/${encodeURIComponent(demoEmail)}/images/${escapeHtml(imageName)}`;
            } else {
                imagePath = `data/${encodeURIComponent(demoEmail)}/images/${escapeHtml(imageName)}`;
            }
        } else {
            // Regular account: images are in public/images/{userId}/{imageName}
            const actualUserId = userId || 'default';
            
            // First check localStorage for uploaded images
            const imageKey = `life-trails-image-${actualUserId}-${imageName}`;
            const storedImage = localStorage.getItem(imageKey);
            if (storedImage) {
                return storedImage; // Base64 data URL
            }
            
            if (currentPath.includes('/app/dashboard/')) {
                imagePath = `../../public/images/${actualUserId}/${escapeHtml(imageName)}`;
            } else if (currentPath.includes('/app/add/')) {
                imagePath = `../../../public/images/${actualUserId}/${escapeHtml(imageName)}`;
            } else if (currentPath.includes('/app/signin/')) {
                imagePath = `../../public/images/${actualUserId}/${escapeHtml(imageName)}`;
            } else {
                imagePath = `public/images/${actualUserId}/${escapeHtml(imageName)}`;
            }
        }
        
        return imagePath;
    }

    // Initialize header navigation
    function initHeader() {
        const user = window.auth.getCurrentUser();
        const headerNav = document.querySelector('.header-nav');
        
        if (!headerNav) return;

        // Check if mobile view
        const isMobile = window.innerWidth <= 768;
        
        // Don't populate header-nav on mobile - completely remove content
        if (isMobile) {
            headerNav.innerHTML = '';
            headerNav.style.display = 'none';
            headerNav.style.width = '0';
            headerNav.style.height = '0';
            headerNav.style.overflow = 'hidden';
            headerNav.style.visibility = 'hidden';
            return;
        }

        if (user) {
            // Determine correct paths based on current location
            const currentPath = window.location.pathname;
            let addEventPath = 'app/add/event/';
            let addFamilyPath = 'app/add/family/';
            let homePath = './';
            
            if (currentPath.includes('/app/dashboard/')) {
                addEventPath = '../add/event/';
                addFamilyPath = '../add/family/';
                homePath = '../../';
            } else if (currentPath.includes('/app/add/')) {
                addEventPath = '../event/';
                addFamilyPath = '../family/';
                homePath = '../../dashboard/';
            } else if (currentPath.includes('/app/signin/')) {
                addEventPath = '../add/event/';
                addFamilyPath = '../add/family/';
                homePath = '../../';
            }
            
            headerNav.innerHTML = `
                <a href="${addEventPath}" class="btn btn-secondary">Add Event</a>
                <a href="${addFamilyPath}" class="btn btn-secondary">Add Family</a>
                <button onclick="window.auth.signOut(); window.location.href='${homePath}';" class="btn btn-secondary">Sign Out</button>
                <button class="theme-toggle theme-toggle-light" onclick="window.themeManager.toggle()" aria-label="Toggle theme" data-theme="light">
                    <div class="theme-toggle-track">
                        <div class="theme-toggle-knob">
                            <svg class="theme-toggle-icon theme-toggle-icon-sun" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <svg class="theme-toggle-icon theme-toggle-icon-moon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: none;">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none"/>
                            </svg>
                        </div>
                    </div>
                </button>
            `;
        } else {
            // Determine correct signin path based on current location
            const currentPath = window.location.pathname;
            let signinPath = 'app/signin/';
            
            if (currentPath.includes('/app/dashboard/')) {
                signinPath = '../signin/';
            } else if (currentPath.includes('/app/add/')) {
                signinPath = '../../signin/';
            } else if (currentPath.includes('/app/signin/')) {
                signinPath = './'; // Already on signin page
            }
            
            headerNav.innerHTML = `
                <a href="${signinPath}" class="btn btn-primary">Sign In</a>
                <button class="theme-toggle theme-toggle-light" onclick="window.themeManager.toggle()" aria-label="Toggle theme" data-theme="light">
                    <div class="theme-toggle-track">
                        <div class="theme-toggle-knob">
                            <svg class="theme-toggle-icon theme-toggle-icon-sun" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <svg class="theme-toggle-icon theme-toggle-icon-moon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: none;">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none"/>
                            </svg>
                        </div>
                    </div>
                </button>
            `;
        }
        
        // Re-run on resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(initHeader, 250);
        });
    }

    // Export utilities
    window.app = {
        escapeHtml,
        formatDate,
        getMonthNumber,
        getImageUrl,
        initHeader
    };

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeader);
    } else {
        initHeader();
    }
})();
