/**
 * A utility class for logging messages.
 * Only logs when in development mode (__DEV__ is true).
 */
export class Logger {
    /** Private constructor to prevent instantiation */
    private constructor() { }

    /**
     * Logs a message only when in debug mode
     * 
     * @param message - The message to log
     * @param tag - Optional tag to prefix the message
     */
    static log(message: string, tag?: string): void {
        if (__DEV__) {
            const logMessage = tag ? `[${tag}] ${message}` : message;
            console.log(logMessage);
        }
    }

    /**
     * Logs an error message only when in debug mode
     * 
     * @param message - The error message to log
     * @param tag - Optional tag to prefix the message
     * @param error - Optional error object
     */
    static error(message: string, tag?: string, error?: Error | any): void {
        if (__DEV__) {
            const logMessage = tag ? `[${tag}] ERROR: ${message}` : `ERROR: ${message}`;
            const fullMessage = error ? `${logMessage} - ${error}` : logMessage;
            console.error(fullMessage.toString());
            if (error?.stack) {
                console.error(error.stack.toString());
            }
        }
    }

    /**
     * Logs an info message only when in debug mode
     * 
     * @param message - The info message to log
     * @param tag - Optional tag to prefix the message
     */
    static info(message: string, tag?: string): void {
        if (__DEV__) {
            const logMessage = tag ? `[${tag}] INFO: ${message}` : `INFO: ${message}`;
            console.info(logMessage);
        }
    }

    /**
     * Logs a warning message only when in debug mode
     * 
     * @param message - The warning message to log
     * @param tag - Optional tag to prefix the message
     */
    static warning(message: string, tag?: string): void {
        if (__DEV__) {
            const logMessage = tag ? `[${tag}] WARNING: ${message}` : `WARNING: ${message}`;
            console.warn(logMessage);
        }
    }
}
