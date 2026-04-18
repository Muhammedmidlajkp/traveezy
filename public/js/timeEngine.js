/**
 * timeEngine.js - Travel time parsing and comparison
 */
const TimeEngine = (() => {
    const parseTimeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const match = timeStr.match(/(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i);
        if (!match) return 0;
        let [_, hours, minutes, period] = match;
        hours = parseInt(hours);
        minutes = parseInt(minutes);
        if (period) {
            if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
        return hours * 60 + minutes;
    };

    const extractRange = (displayStr) => {
        const parts = displayStr.split(/[-–—]| to /i);
        return {
            start: parseTimeToMinutes(parts[0]),
            end: parseTimeToMinutes(parts[1] || parts[0])
        };
    };

    const getMinutesSinceMidnight = () => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    };

    const startSyncLoop = (callback) => {
        callback();
        setInterval(callback, 60000);
    };

    return { parseTimeToMinutes, extractRange, getMinutesSinceMidnight, startSyncLoop };
})();
window.TimeEngine = TimeEngine;
