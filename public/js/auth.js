// Authentication Management (localStorage-based)
(function() {
    'use strict';

    const AUTH_KEY = 'life-trails-auth';
    const USERS_KEY = 'life-trails-users';

    function initUsers() {
        if (!localStorage.getItem(USERS_KEY)) {
            // Default user for demo - using demo@life.trails.click
            const defaultUser = {
                id: 'demo@life.trails.click',
                email: 'demo@life.trails.click',
                password: 'demo123',
                name: 'Sam',
                dateOfBirth: '02-09-1993',
                placeOfBirth: 'Durgapur'
            };
            localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser]));
        } else {
            // Update old demo user if it exists with wrong email/id
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            const oldDemoIndex = users.findIndex(u => u.email === 'demo@lifetrails.com');
            if (oldDemoIndex !== -1) {
                users[oldDemoIndex] = {
                    id: 'demo@life.trails.click',
                    email: 'demo@life.trails.click',
                    password: users[oldDemoIndex].password || 'demo123',
                    name: users[oldDemoIndex].name || 'Sam',
                    dateOfBirth: users[oldDemoIndex].dateOfBirth || '02-09-1993',
                    placeOfBirth: users[oldDemoIndex].placeOfBirth || 'Durgapur'
                };
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
            }
        }
    }

    function getUsers() {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function signIn(email, password) {
        initUsers();
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // For demo accounts, use email as userId to match data folder structure
            const isDemoEmail = email === 'demo@life.trails.click' || email === 'demo@lifetrails.com';
            const userId = isDemoEmail ? 'demo@life.trails.click' : user.id;
            
            const authData = {
                userId: userId,
                email: user.email === 'demo@lifetrails.com' ? 'demo@life.trails.click' : user.email,
                name: user.name,
                timestamp: Date.now(),
                isDemo: isDemoEmail
            };
            localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            return { success: true, user: authData };
        }
        
        return { success: false, error: 'Invalid email or password' };
    }

    function signUp(email, password, name, dateOfBirth, placeOfBirth) {
        initUsers();
        const users = getUsers();
        
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'Email already exists' };
        }

        const newUser = {
            id: 'user' + Date.now(),
            email,
            password,
            name,
            dateOfBirth,
            placeOfBirth
        };

        users.push(newUser);
        saveUsers(users);

        // Auto sign in
        return signIn(email, password);
    }

    function signOut() {
        localStorage.removeItem(AUTH_KEY);
    }

    function getCurrentUser() {
        const authData = localStorage.getItem(AUTH_KEY);
        if (!authData) return null;

        try {
            const auth = JSON.parse(authData);
            // Check if session is still valid (24 hours)
            if (Date.now() - auth.timestamp > 24 * 60 * 60 * 1000) {
                signOut();
                return null;
            }
            
            // Fix old demo account data: if email is demo@life.trails.click or demo@lifetrails.com, fix userId
            if ((auth.email === 'demo@life.trails.click' || auth.email === 'demo@lifetrails.com') && 
                auth.userId !== 'demo@life.trails.click') {
                auth.userId = 'demo@life.trails.click';
                auth.email = 'demo@life.trails.click';
                auth.isDemo = true;
                localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
            }
            
            return auth;
        } catch (e) {
            return null;
        }
    }

    function isAuthenticated() {
        return getCurrentUser() !== null;
    }

    function requireAuth() {
        if (!isAuthenticated()) {
            const currentPath = window.location.pathname;
            let signinPath = 'app/signin/';
            // Adjust path based on current location
            if (currentPath.includes('/app/dashboard/')) {
                signinPath = '../signin/';
            } else if (currentPath.includes('/app/add/')) {
                signinPath = '../../signin/';
            }
            window.location.href = signinPath;
            return false;
        }
        return true;
    }

    // Initialize
    initUsers();

    // Export to window
    window.auth = {
        signIn,
        signUp,
        signOut,
        getCurrentUser,
        isAuthenticated,
        requireAuth
    };
})();
