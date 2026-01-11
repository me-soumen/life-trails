// Family Management
(function() {
    'use strict';

    function getFamily() {
        const data = window.eventsManager.getUserData();
        return data ? (data.family || []) : [];
    }

    function addFamilyMember(memberData) {
        const data = window.eventsManager.getUserData();
        if (!data) return false;

        if (!data.family) {
            data.family = [];
        }

        const newMember = {
            name: memberData.name,
            relation: memberData.relation,
            level: parseInt(memberData.level),
            image: memberData.image || 'default.png',
            nickname: memberData.nickname || null
        };

        data.family.push(newMember);
        return window.eventsManager.saveUserData(data);
    }

    function deleteFamilyMember(index) {
        const data = window.eventsManager.getUserData();
        if (!data || !data.family) return false;

        data.family.splice(index, 1);
        return window.eventsManager.saveUserData(data);
    }

    function getFamilyByLevel() {
        const family = getFamily();
        const levels = {};

        family.forEach(member => {
            if (!levels[member.level]) {
                levels[member.level] = [];
            }
            levels[member.level].push(member);
        });

        return levels;
    }

    function getGenerationLabel(level) {
        if (level <= -2) return 'Grand Parents';
        if (level === -1) return 'Parents';
        if (level === 0) return 'Self / Siblings';
        if (level === 1) return 'Children';
        if (level >= 2) return 'Grand Children';
        return 'Family';
    }

    // Export to window
    window.familyManager = {
        getFamily,
        addFamilyMember,
        deleteFamilyMember,
        getFamilyByLevel,
        getGenerationLabel
    };
})();
