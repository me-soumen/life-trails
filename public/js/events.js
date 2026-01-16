// Events Management
(function() {
    'use strict';

    function getUserData() {
        const user = window.auth.getCurrentUser();
        if (!user) return null;

        const dataKey = `life-trails-data-${user.userId}`;
        const data = localStorage.getItem(dataKey);
        
        if (data) {
            return JSON.parse(data);
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

    // Load sample data for user123 if not already loaded
    function loadSampleDataIfNeeded() {
        const user = window.auth.getCurrentUser();
        if (!user || user.userId !== 'user123') {
            return Promise.resolve();
        }

        const dataKey = `life-trails-data-${user.userId}`;
        const existingData = localStorage.getItem(dataKey);
        
        // If data already exists with content, don't load
        if (existingData) {
            try {
                const data = JSON.parse(existingData);
                const hasEvents = data.events && Object.keys(data.events).length > 0;
                const hasFamily = data.family && data.family.length > 0;
                if (hasEvents || hasFamily) {
                    return Promise.resolve(); // Data already loaded
                }
            } catch (e) {
                // Invalid data, continue to load
            }
        }

        // Check if we've already tried to load (and failed)
        const sampleDataLoaded = localStorage.getItem('sample-data-loaded-user123');
        if (sampleDataLoaded === 'failed') {
            return Promise.resolve(); // Already tried and failed
        }

        // Try to load sample data - adjust path based on current location
        const currentPath = window.location.pathname;
        let dataPath = 'data/sample-family.json';
        if (currentPath.includes('/app/dashboard/')) {
            dataPath = '../../../data/sample-family.json';
        } else if (currentPath.includes('/app/add/')) {
            dataPath = '../../../../data/sample-family.json';
        } else if (currentPath.includes('/app/signin/')) {
            dataPath = '../../../data/sample-family.json';
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
                
                // Store in localStorage
                localStorage.setItem(dataKey, JSON.stringify(sampleData));
                localStorage.setItem('sample-data-loaded-user123', 'success');
                
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
                console.error('Error loading sample data:', err);
                localStorage.setItem('sample-data-loaded-user123', 'failed');
            });
    }

    function saveUserData(data) {
        const user = window.auth.getCurrentUser();
        if (!user) return false;

        const dataKey = `life-trails-data-${user.userId}`;
        localStorage.setItem(dataKey, JSON.stringify(data));
        return true;
    }

    function getAllEvents() {
        const data = getUserData();
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

    function addEvent(eventData) {
        const data = getUserData();
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

    function deleteEvent(year, eventIndex) {
        const data = getUserData();
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
        loadSampleDataIfNeeded
    };

    // Auto-load sample data on initialization if needed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(loadSampleDataIfNeeded, 100);
        });
    } else {
        setTimeout(loadSampleDataIfNeeded, 100);
    }
})();
