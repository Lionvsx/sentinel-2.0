const date = require('date-and-time');
const { DateTime } = require('luxon');


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

    const today = DateTime.now().setZone('Europe/Paris');
    // Adjust so 1 (Monday) - 7 (Sunday)
    const todayIndex = today.weekday;
    const targetIndex = daysOfWeek.indexOf(day) + 1;

    // Calculate difference between today and target day
    const diff = targetIndex - todayIndex;

    const targetDay = today.plus({ days: diff });

    return targetDay.toFormat('d');
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

function getParisISOString() {
    const date = DateTime.now().setZone('Europe/Paris');
    return date.toISO();
}

function getParisCurrentDay() {
    const date = DateTime.now().setZone('Europe/Paris');
    return date.toFormat('EEEE');
}

module.exports = {
    getDateTime,
    getTime,
    getDateOfCurrentWeek,
    getDateOfToday,
    minutesToHHMM,
    getCurrentWeekNumber,
    getParisISOString,
    getParisUTCOffset,
    getParisCurrentDay
}