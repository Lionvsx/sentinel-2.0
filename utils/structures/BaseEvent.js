const Logger = require("../services/logger");

module.exports = class BaseEvent {
    constructor(name) {
        this.name = name;
        this.consoleLogger = new Logger(name);
    }

    /**
     *
     * @param message {String}
     * @param logData {JSON}
     */
    log(message, logData = undefined) {
        logData ? this.consoleLogger.log(message, 'info') : this.consoleLogger.log(message, 'info', logData);
    }
    /**
     *
     * @param message {String}
     * @param logData {JSON}
     */
    error(message, logData = undefined) {
        logData ? this.consoleLogger.log(message, 'error') : this.consoleLogger.log(message, 'error', logData);
    }
    /**
     *
     * @param message {String}
     * @param logData {JSON}
     */
    warn(message, logData = undefined) {
        logData ? this.consoleLogger.log(message, 'warn') : this.consoleLogger.log(message, 'warning', logData);
    }
}