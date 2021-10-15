const date = require('date-and-time');

function getDateTime() {
    const now = new Date(Date.now());
    return date.format(now, 'ddd MMM DD YYYY HH:mm:ss');
}

module.exports = {
    getDateTime,
}