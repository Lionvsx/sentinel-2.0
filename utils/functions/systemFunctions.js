const date = require('date-and-time');


function getDateTime() {
    const now = new Date(Date.now());
    return date.format(now, 'ddd MMM DD YYYY HH:mm:ss');
}

function getTime() {
    const now = new Date(Date.now());
    return date.format(now, 'HH:mm:ss');
}

function getDateOfCurrentWeek(day) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    if (!daysOfWeek.includes(day)) {
        throw new Error('Invalid day name');
    }

    const today = new Date();
    // Adjust so 0 (Monday) - 6 (Sunday)
    const todayIndex = (today.getUTCDay() + 6) % 7;
    const targetIndex = daysOfWeek.indexOf(day);

    // Calculate difference between today and target day
    const diff = targetIndex - todayIndex;

    today.setUTCDate(today.getUTCDate() + diff);

    return today.getUTCDate();
}

function getDateOfToday() {
    const today = new Date();
    return today.getUTCDate();
}

function getParisUTCOffset() {
    const date = new Date();
    const timeZone = 'Europe/Paris';

    // Get the offset in minutes
    const offset = -date.toLocaleString('en', { timeZone, timeZoneName: 'short' }).split('GMT')[1].split(':')[0];

    return -parseInt(offset, 10);
}

function getCurrentWeekNumber() {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function minutesToHHMM(minutes) {
    // Calculer les heures et les minutes
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // Formatter en HH:MM
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(mins).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}

module.exports = {
    getDateTime,
    getTime,
    getDateOfCurrentWeek,
    getParisUTCOffset,
    getDateOfToday,
    minutesToHHMM,
    getCurrentWeekNumber,
}