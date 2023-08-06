const winston = require("winston");
const { getDateTime } = require("../functions/systemFunctions");


module.exports = class Logger {
    /**
     * Create Logger instance for each category
     * @param category {String}
     */
    constructor(category) {
        this.category = category;
        this.logData = undefined;
        this.logger = winston.createLogger({
            transports: [
                new winston.transports.File({
                    filename: `logs/app-error.log`,
                    level: 'warn'
                }),
                new winston.transports.File({
                    filename: `logs/app-info.log`,
                    level: 'info'
                }),
                new winston.transports.Console({
                    level: 'info'
                })
            ],
            format: winston.format.printf((info) => {
                let message = `${getDateTime()} | ${info.level.toUpperCase()} | ${this.category}.log | ${info.message} | `;
                message = this.logData ? message + `${JSON.stringify(this.logData)} |` : message;
                return message;
            })
        })
    }
    /**
     * Send info level message
     * @param message {String}
     * @param logData {JSON}
     * @return {void}
     */
    info(message, logData = undefined) {
        this.logData = logData ? logData : undefined;
        this.logger.log('info', message);
    }
    /**
     * Send error level message
     * @param message {String}
     * @param logData {JSON}
     * @return {void}
     */
    error(message, logData = undefined) {
        this.logData = logData ? logData : undefined;
        this.logger.log('error', message);
    }
    /**
     * Send debug level message
     * @param message {String}
     * @param logData {JSON}
     * @return {void}
     */
    debug(message, logData = undefined) {
        this.logData = logData ? logData : undefined;
        this.logger.log('debug', message);
    }
    /**
     * Send log message without level preset
     * @param message {String}
     * @param level {String}
     * @param logData {JSON}
     * @return {void}
     */
    log(message, level, logData = undefined) {
        this.logData = logData ? logData : undefined;
        this.logger.log(level, message);
    }

}