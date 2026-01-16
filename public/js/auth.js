// Authentication Management (localStorage-based)
(function() {
    'use strict';

    const AUTH_KEY = 'life-trails-auth';
    const USERS_KEY = 'life-trails-users';

    function initUsers() {
        if (!localStorage.getItem(USERS_KEY)) {
            // Default user for demo
            const defaultUser = {
                id: 'user123',
                email: 'demo@lifetrails.com',
                password: 'demo123',
                name: 'Sam',
                dateOfBirth: '02-09-1993',
                placeOfBirth: 'Durgapur'
            };
            localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser]));
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
            const authData = {
                userId: user.id,
                email: user.email,
                name: user.name,
                timestamp: Date.now()
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
