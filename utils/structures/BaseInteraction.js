const Logger = require('../services/Logger')

module.exports = class BaseInteraction {
    constructor(name, category, type, help) {
        this.name = name;
        this.category = category;
        this.type = type;
        this.help = help;
        this.consoleLogger = new Logger(name);
    }

    /**
     *
     * @param message {String}
     * @param logData {JSON}
     */
    log(message, logData = undefined) {
        logData ? this.consoleLogger.log(message, 'info', logData) : this.consoleLogger.log(message, 'info');
    }
    /**
     *
     * @param message {String}
     * @param logData {JSON}
     */
    error(message, logData = undefined) {
        logData ? this.consoleLogger.log(message, 'error', logData) : this.consoleLogger.log(message, 'error');
    }
    /**
     *
     * @param message {String}
     * @param logData {JSON}
     */
    warn(message, logData = undefined) {
        logData ? this.consoleLogger.log(message, 'warn', logData) : this.consoleLogger.log(message, 'warn');
    }
}