// Authentication Management - Username-based with GitHub integration
import { fetchUserData } from './services/api.js';
import { decryptToken } from './services/decrypt.js';

(function() {
    'use strict';

    const AUTH_KEY = 'life-trails-auth';
    const USERS_KEY = 'life-trails-users';

    // Load config.json (use root-relative path to work from any page location)
    async function loadConfig() {
        try {
            const configFromStorage = localStorage.getItem('appConfig');
            if (configFromStorage) {
                return JSON.parse(configFromStorage);
            }
            
            // Calculate correct path based on current page location
            // If we're in /app/signin/, we need ../../js/config/config.json
            // If we're in /app/dashboard/, we need ../../js/config/config.json
            // Use root-relative path to work from anywhere
            const configPath = '/js/config/config.json';
            
            console.log('📂 Loading config from:', configPath);
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`Failed to load config.json: ${response.status} ${response.statusText}`);
            }
            const config = await response.json();
            console.log('✅ Config loaded successfully');
            localStorage.setItem('appConfig', JSON.stringify(config));
            return config;
        } catch (error) {
            console.error('❌ Failed to load config:', error);
            throw new Error('Failed to load configuration: ' + error.message);
        }
    }

    function initUsers() {
        if (!localStorage.getItem(USERS_KEY)) {
            // Default user for demo - using demo@life.trails.click
            const defaultUser = {
                id: 'demo@life.trails.click',
                username: 'demo@life.trails.click',
                password: 'demo123',
                name: 'Sam',
                dateOfBirth: '02-09-1993',
                placeOfBirth: 'Durgapur'
            };
            localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser]));
        }
    }

    // Check if username exists in config.json encryptedSecrets
    async function isUsernameInConfig(username) {
        try {
            const config = await loadConfig();
            return config.encryptedSecrets && config.encryptedSecrets.hasOwnProperty(username);
        } catch (error) {
            return false;
        }
    }

    // Check if it's demo user
    function isDemoUser(username) {
        return username === 'demo@life.trails.click' || username === 'demo@lifetrails.com';
    }

    async function signIn(username, password) {
        try {
            initUsers();
            
            console.log('🔐 Sign in attempt started:', { username, passwordLength: password?.length });
            
            // Check if it's demo user (local authentication)
            if (isDemoUser(username)) {
                console.log('👤 Demo user detected');
                const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
                const user = users.find(u => u.username === username && u.password === password);
                
                if (user) {
                    console.log('✅ Demo user authenticated');
                    const authData = {
                        userId: 'demo_user', // Maps to database/demo_user folder
                        username: 'demo@life.trails.click',
                        name: user.name,
                        timestamp: Date.now(),
                        isDemo: true
                        // Demo users don't need password storage - they use local data
                    };
                    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                    return { success: true, user: authData };
                }
                console.error('❌ Demo user authentication failed');
                return { success: false, error: 'Invalid username or password' };
            }
            
            console.log('🔑 Real user detected, loading config...');
            // For real users, check if username exists in config.json
            let config;
            try {
                config = await loadConfig();
                console.log('✅ Config loaded:', { 
                    hasEncryptedSecrets: !!config.encryptedSecrets, 
                    usernames: config.encryptedSecrets ? Object.keys(config.encryptedSecrets) : [],
                    requestedUsername: username,
                    usernameExists: config.encryptedSecrets && config.encryptedSecrets.hasOwnProperty(username)
                });
            } catch (configError) {
                console.error('❌ Failed to load config:', configError);
                return { success: false, error: 'Failed to load configuration. Please refresh the page.' };
            }
            
            if (!config.encryptedSecrets) {
                console.error('❌ No encryptedSecrets in config');
                return { success: false, error: 'Configuration error: No encrypted secrets found.' };
            }
            
            if (!config.encryptedSecrets[username]) {
                console.error('❌ Username not found in config:', { 
                    username, 
                    availableUsernames: Object.keys(config.encryptedSecrets) 
                });
                return { success: false, error: `Username "${username}" not found in configuration` };
            }
            
            console.log('🔓 Username found in config, attempting decryption...');
            // Step 1: Decrypt the encrypted secret with the password
            const encryptedSecret = config.encryptedSecrets[username];
            console.log('📦 Encrypted secret info:', { 
                length: encryptedSecret ? encryptedSecret.length : 0,
                preview: encryptedSecret ? encryptedSecret.substring(0, 20) + '...' : 'null'
            });
            
            // Try to decrypt - this will throw error if password is wrong
            let decryptedToken;
            try {
                console.log('🔐 Calling decryptToken with password...');
                decryptedToken = await decryptToken(encryptedSecret, password);
                console.log('✅ Decryption successful!', { 
                    tokenLength: decryptedToken ? decryptedToken.length : 0,
                    tokenPreview: decryptedToken ? decryptedToken.substring(0, 10) + '...' : 'null'
                });
                
                // Validate that we got a token (should be a non-empty string)
                if (!decryptedToken || typeof decryptedToken !== 'string' || decryptedToken.trim().length === 0) {
                    console.error('❌ Decryption returned empty token');
                    return { success: false, error: 'Invalid password - decryption failed' };
                }
            } catch (decryptError) {
                // Decryption failed - invalid password
                console.error('❌ Decryption error - invalid password:', decryptError);
                return { success: false, error: 'Invalid password. Please check your password and try again.' };
            }
            
            // Step 2: Call GitHub API to fetch user's data.json
            // If successful, sign in is successful. If error (not 404), show error
            console.log('📥 Decryption successful, calling GitHub API to fetch user data...');
            let userData = null;
            try {
                userData = await fetchUserData(username, password, username);
                console.log('✅ GitHub API call successful!', { hasData: !!userData, hasContent: !!userData?.content });
            } catch (fetchError) {
                // Check what kind of error we got
                if (fetchError.message && fetchError.message.includes('404')) {
                    // 404 means file doesn't exist yet - this is OK for new users
                    console.log('ℹ️ User data not found (404) - new user, sign in successful');
                    userData = null; // New user, no data yet - but login is successful
                } else if (fetchError.message && (fetchError.message.includes('401') || fetchError.message.includes('403'))) {
                    // 401/403 means authentication failed - token might be wrong or expired
                    console.error('❌ GitHub API authentication failed (401/403):', fetchError.message);
                    return { success: false, error: 'Authentication failed. Please check your credentials.' };
                } else if (fetchError.message && fetchError.message.includes('Failed to fetch')) {
                    // Network error or CORS issue
                    console.error('❌ Network error calling GitHub API:', fetchError.message);
                    return { success: false, error: 'Network error. Please check your internet connection and try again.' };
                } else {
                    // Some other error
                    console.error('❌ Error calling GitHub API:', fetchError);
                    return { success: false, error: 'Failed to authenticate with GitHub. Please try again.' };
                }
            }
            
            // Get user info from data or create default
            let userInfo = {
                name: username.replace('lt_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                dateOfBirth: '',
                placeOfBirth: ''
            };
            
            // Save user data to localStorage (will be encrypted in saveUserData)
            const dataKey = `life-trails-data-${username}`;
            let dataToSave;
            
            if (userData && userData.content) {
                userInfo = userData.content;
                dataToSave = {
                    id: username,
                    name: userInfo.name || username,
                    dateOfBirth: userInfo.dateOfBirth || '',
                    placeOfBirth: userInfo.placeOfBirth || '',
                    family: userInfo.family || [],
                    events: userInfo.events || {}
                };
            } else {
                // New user - create empty data structure
                dataToSave = {
                    id: username,
                    name: username.replace('lt_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    dateOfBirth: '',
                    placeOfBirth: '',
                    family: [],
                    events: {}
                };
            }
            
            // Load images from GitHub after loading data (OPTIMIZED: batch loading)
            if (userData && userData.content) {
                console.log('📥 Loading images from GitHub (optimized batch loading)...');
                // Load images asynchronously after PAT is stored
                // Use setTimeout to ensure PAT is in sessionStorage first
                setTimeout(async () => {
                    try {
                        const { fetchAllImagesFromDirectory } = await import('./services/api.js');
                        
                        // Step 1: Collect all required image names from data
                        const requiredEventImages = new Set();
                        const requiredFamilyImages = new Set();
                        
                        // Collect event images
                        if (dataToSave.events) {
                            Object.keys(dataToSave.events).forEach(year => {
                                const yearEvents = dataToSave.events[year] || [];
                                yearEvents.forEach(event => {
                                    if (event.images && Array.isArray(event.images)) {
                                        event.images.forEach(imageName => {
                                            if (imageName) {
                                                requiredEventImages.add(imageName);
                                            }
                                        });
                                    }
                                });
                            });
                        }
                        
                        // Collect family images
                        if (dataToSave.family && Array.isArray(dataToSave.family)) {
                            dataToSave.family.forEach(member => {
                                if (member.image) {
                                    requiredFamilyImages.add(member.image);
                                }
                            });
                        }
                        
                        console.log(`📊 Found ${requiredEventImages.size} event images and ${requiredFamilyImages.size} family images to load`);
                        
                        // Step 2: Fetch ALL images from directories in just 2 API calls
                        // Instead of making individual calls for each image
                        const [eventImagesMap, familyImagesMap] = await Promise.allSettled([
                            requiredEventImages.size > 0 ? fetchAllImagesFromDirectory(username, null, username, 'event') : Promise.resolve({}),
                            requiredFamilyImages.size > 0 ? fetchAllImagesFromDirectory(username, null, username, 'family') : Promise.resolve({})
                        ]);
                        
                        // Step 3: Store only the images we actually need (filter from fetched images)
                        let storedCount = 0;
                        
                        // Store event images
                        if (eventImagesMap.status === 'fulfilled' && eventImagesMap.value) {
                            requiredEventImages.forEach(imageName => {
                                if (eventImagesMap.value[imageName]) {
                                    const imageKey = `life-trails-image-${username}-${imageName}`;
                                    localStorage.setItem(imageKey, eventImagesMap.value[imageName]);
                                    storedCount++;
                                }
                            });
                        }
                        
                        // Store family images
                        if (familyImagesMap.status === 'fulfilled' && familyImagesMap.value) {
                            requiredFamilyImages.forEach(imageName => {
                                if (familyImagesMap.value[imageName]) {
                                    const imageKey = `life-trails-image-${username}-${imageName}`;
                                    localStorage.setItem(imageKey, familyImagesMap.value[imageName]);
                                    storedCount++;
                                }
                            });
                        }
                        
                        const eventFailed = eventImagesMap.status === 'rejected' ? 1 : 0;
                        const familyFailed = familyImagesMap.status === 'rejected' ? 1 : 0;
                        
                        console.log(`✅ Image loading complete: ${storedCount} images stored (from ${requiredEventImages.size + requiredFamilyImages.size} required)`);
                        if (eventFailed || familyFailed) {
                            console.warn(`⚠️ Some directories failed to load: Events: ${eventFailed}, Family: ${familyFailed}`);
                        }
                    } catch (error) {
                        console.warn('⚠️ Failed to load images:', error.message);
                        // Don't block sign-in if image loading fails
                    }
                }, 100); // Small delay to ensure PAT is stored
            }
            
            // Use eventsManager to save (which handles encryption)
            // We need to set up the data first, then eventsManager will encrypt it
            if (window.eventsManager && window.eventsManager.saveUserData) {
                await window.eventsManager.saveUserData(dataToSave);
                console.log('✅ User data saved to localStorage (encrypted)');
            } else {
                // Fallback: encrypt manually or store plain text if module not loaded
                try {
                    const encryptModule = await import('./services/encrypt.js');
                    const encrypted = await encryptModule.encryptUserData(dataToSave, decryptedToken);
                    localStorage.setItem(dataKey, encrypted);
                    console.log('✅ User data saved to localStorage (encrypted)');
                } catch (error) {
                    // If encryption fails, at least save the data
                    localStorage.setItem(dataKey, JSON.stringify(dataToSave));
                    console.warn('⚠️ Encryption failed, data saved in plain text');
                }
            }
            
            console.log('✅ Creating auth data...');
            // Store decrypted PAT in sessionStorage (more secure, cleared on browser close)
            // This avoids storing the password in plain text
            const PAT_STORAGE_KEY = `life-trails-pat-${username}`;
            sessionStorage.setItem(PAT_STORAGE_KEY, decryptedToken);
            console.log('✅ Decrypted PAT stored in sessionStorage');
            
            const authData = {
                userId: username, // username = userId = folder name in GitHub
                username: username,
                name: userInfo.name || userInfo.id || username,
                timestamp: Date.now(),
                isDemo: false
                // Password NOT stored - we use the decrypted PAT from sessionStorage
            };
            localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            console.log('🎉 Sign in successful!');
            return { success: true, user: authData };
        } catch (error) {
            // Any other error
            console.error('❌ Unexpected authentication error:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            return { success: false, error: error.message || 'Authentication failed' };
        }
    }

    function signUp(username, password, name, dateOfBirth, placeOfBirth) {
        // Sign up is only for demo users locally
        // Real users must be added to config.json by admin
        initUsers();
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        
        if (users.find(u => u.username === username)) {
            return { success: false, error: 'Username already exists' };
        }
        
        // Only allow signup for demo-like accounts (local storage)
        // Real users (lt_*) must be added to config.json
        if (username.startsWith('lt_')) {
            return { 
                success: false, 
                error: 'Username format lt_* requires admin setup. Please contact administrator.' 
            };
        }

        const newUser = {
            id: username,
            username: username,
            password,
            name,
            dateOfBirth,
            placeOfBirth
        };

        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Auto sign in
        return signIn(username, password);
    }

    function signOut() {
        // Clear auth data
        const authData = getCurrentUser();
        if (authData && authData.username) {
            // Clear the stored PAT from sessionStorage
            const PAT_STORAGE_KEY = `life-trails-pat-${authData.username}`;
            sessionStorage.removeItem(PAT_STORAGE_KEY);
            
            // Clear encrypted user data from localStorage
            const dataKey = `life-trails-data-${authData.userId}`;
            localStorage.removeItem(dataKey);
            console.log('✅ User data cleared from localStorage');
        }
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
            
            // Fix old demo account data
            if ((auth.username === 'demo@life.trails.click' || auth.username === 'demo@lifetrails.com')) {
                if (auth.userId !== 'demo_user') {
                    auth.userId = 'demo_user';
                    auth.username = 'demo@life.trails.click';
                    auth.isDemo = true;
                    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
                }
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
