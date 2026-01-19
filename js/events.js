// Events Management
(function() {
    'use strict';

    // Import encryption functions (dynamic import for compatibility)
    let encryptUserData, decryptUserData;
    
    async function loadEncryptionModule() {
        if (!encryptUserData || !decryptUserData) {
            try {
                const module = await import('./services/encrypt.js');
                encryptUserData = module.encryptUserData;
                decryptUserData = module.decryptUserData;
            } catch (error) {
                console.error('Failed to load encryption module:', error);
                // Fallback to plain text if encryption not available
                encryptUserData = null;
                decryptUserData = null;
            }
        }
    }

    async function getUserData() {
        const user = window.auth.getCurrentUser();
        if (!user) return null;

        await loadEncryptionModule();
        const dataKey = `life-trails-data-${user.userId}`;
        const encryptedData = localStorage.getItem(dataKey);
        
        if (encryptedData) {
            try {
                // Try to decrypt if encryption is available
                if (decryptUserData && !user.isDemo) {
                    // For real users, get PAT from sessionStorage
                    const PAT_STORAGE_KEY = `life-trails-pat-${user.username}`;
                    const token = sessionStorage.getItem(PAT_STORAGE_KEY);
                    if (token) {
                        const decrypted = await decryptUserData(encryptedData, token);
                        return decrypted;
                    } else {
                        // PAT not available, clear data and require re-auth
                        console.warn('PAT not found, clearing encrypted data');
                        localStorage.removeItem(dataKey);
                    }
                } else {
                    // Demo users or encryption not available - try plain JSON
                    try {
                        return JSON.parse(encryptedData);
                    } catch (e) {
                        // Data might be encrypted but no decrypt function
                        console.warn('Failed to parse data, may be encrypted');
                        return null;
                    }
                }
            } catch (error) {
                console.error('Failed to decrypt user data:', error);
                // Clear corrupted data
                localStorage.removeItem(dataKey);
            }
        }

        // Return default structure
        return {
            id: user.userId,
            name: user.name,
            dateOfBirth: user.dateOfBirth || '',
            placeOfBirth: user.placeOfBirth || '',
            family: [],
            events: {}
        };
    }

    // Load demo data from database/{userId}/data.json
    function loadDemoDataIfNeeded() {
        const user = window.auth.getCurrentUser();
        if (!user || !user.isDemo) {
            return Promise.resolve();
        }

        const dataKey = `life-trails-data-${user.userId}`;
        const existingData = localStorage.getItem(dataKey);
        
        // Check if we need to reload data (if family members have old image references)
        let needsReload = false;
        if (existingData) {
            try {
                const data = JSON.parse(existingData);
                const hasEvents = data.events && Object.keys(data.events).length > 0;
                const hasFamily = data.family && data.family.length > 0;
                
                // Check if family has old image references (birth.png or father.png)
                if (hasFamily && data.family.length > 0) {
                    const hasOldImages = data.family.some(member => 
                        member.image === 'birth.png' || member.image === 'father.png'
                    );
                    if (hasOldImages) {
                        needsReload = true;
                    }
                }
                
                if ((hasEvents || hasFamily) && !needsReload) {
                    return Promise.resolve(); // Data already loaded and up to date
                }
            } catch (e) {
                // Invalid data, continue to load
            }
        }

        // Check if we've already tried to load (and failed)
        const loadKey = `demo-data-loaded-${user.userId}`;
        const sampleDataLoaded = localStorage.getItem(loadKey);
        
        // If we need to reload (old images found), clear the load key
        if (needsReload) {
            localStorage.removeItem(loadKey);
        }
        
        if (sampleDataLoaded === 'failed' && !needsReload) {
            return Promise.resolve(); // Already tried and failed (and no reload needed)
        }

        // Try to load demo data from database/{userId}/data.json
        // Map demo@life.trails.click to demo_user folder name
        const userIdFolder = user.userId === 'demo@life.trails.click' ? 'demo_user' : user.userId;
        const currentPath = window.location.pathname;
        let dataPath = `database/${encodeURIComponent(userIdFolder)}/data.json`;
        if (currentPath.includes('/app/dashboard/')) {
            dataPath = `../../../database/${encodeURIComponent(userIdFolder)}/data.json`;
        } else if (currentPath.includes('/app/add/')) {
            dataPath = `../../../../database/${encodeURIComponent(userIdFolder)}/data.json`;
        } else if (currentPath.includes('/app/signin/')) {
            dataPath = `../../../database/${encodeURIComponent(userIdFolder)}/data.json`;
        }

        return fetch(dataPath)
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch: ' + r.status);
                return r.json();
            })
            .then(sampleData => {
                // Validate data structure
                if (!sampleData || typeof sampleData !== 'object') {
                    throw new Error('Invalid data format');
                }
                
                // Use image names directly from JSON file (no random assignment)
                // Images are already specified in the events' images arrays
                // Store in localStorage (demo data can be plain text, but we'll use JSON for consistency)
                localStorage.setItem(dataKey, JSON.stringify(sampleData));
                localStorage.setItem(loadKey, 'success');
                
                // Reload page to show data
                if (window.location.pathname.includes('/app/dashboard') || 
                    window.location.pathname.includes('/app/dashboard/') ||
                    window.location.pathname.endsWith('/app/dashboard')) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                }
            })
            .catch(err => {
                localStorage.setItem(loadKey, 'failed');
            });
    }

    async function saveUserData(data) {
        const user = window.auth.getCurrentUser();
        if (!user) return false;

        await loadEncryptionModule();
        const dataKey = `life-trails-data-${user.userId}`;
        
        try {
            // Encrypt data for real users, plain text for demo users
            if (encryptUserData && !user.isDemo) {
                const PAT_STORAGE_KEY = `life-trails-pat-${user.username}`;
                const token = sessionStorage.getItem(PAT_STORAGE_KEY);
                if (token) {
                    const encrypted = await encryptUserData(data, token);
                    localStorage.setItem(dataKey, encrypted);
                    return true;
                } else {
                    // PAT not available - fallback to plain text (shouldn't happen)
                    console.warn('PAT not found, storing in plain text');
                    localStorage.setItem(dataKey, JSON.stringify(data));
                    return true;
                }
            } else {
                // Demo users or encryption not available - store in plain text
                localStorage.setItem(dataKey, JSON.stringify(data));
                return true;
            }
        } catch (error) {
            console.error('Failed to encrypt/save user data:', error);
            // Fallback to plain text on error
            localStorage.setItem(dataKey, JSON.stringify(data));
            return true;
        }
    }

    async function getAllEvents() {
        const data = await getUserData();
        if (!data || !data.events) return [];

        const allEvents = [];
        Object.keys(data.events).forEach(year => {
            data.events[year].forEach(event => {
                allEvents.push({
                    ...event,
                    year: year,
                    sortDate: new Date(event.date + ' ' + event.time)
                });
            });
        });

        // Sort reverse chronologically (latest first)
        return allEvents.sort((a, b) => b.sortDate - a.sortDate);
    }

    async function addEvent(eventData) {
        const data = await getUserData();
        if (!data) return false;

        const year = eventData.date.split('-')[0];
        if (!data.events[year]) {
            data.events[year] = [];
        }

        // Add event with images
        const newEvent = {
            date: eventData.date,
            time: eventData.time,
            title: eventData.title,
            description: eventData.description,
            place: eventData.place || '',
            images: eventData.images || []
        };

        data.events[year].push(newEvent);
        return saveUserData(data);
    }

    async function deleteEvent(year, eventIndex) {
        const data = await getUserData();
        if (!data || !data.events[year]) return false;

        data.events[year].splice(eventIndex, 1);
        if (data.events[year].length === 0) {
            delete data.events[year];
        }
        return saveUserData(data);
    }

    // Export to window
    window.eventsManager = {
        getUserData,
        saveUserData,
        getAllEvents,
        addEvent,
        deleteEvent,
        loadDemoDataIfNeeded
    };

    // Auto-load demo data on initialization if needed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(loadDemoDataIfNeeded, 100);
        });
    } else {
        setTimeout(loadDemoDataIfNeeded, 100);
    }
})();
