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

        // Try to migrate from JSON file (for backward compatibility)
        if (user.userId === 'user123') {
            try {
                // This will only work if life-events.json exists and is accessible
                // In a real scenario, you'd fetch it, but for now we'll just return default
            } catch (e) {
                // Ignore migration errors
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
        deleteEvent
    };
})();
