export const LOG_LEVEL = {
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG_WARN: 4,
    DEBUG: 5,
}


export function log(logLevel = 1000, msg, config = null) {
    if (config == null) {
        console.log("\x1b[31m<Error>A config file must be provided to the log function\x1b[0m")
        return;
    }

    if (logLevel > config.log_level)
        return;
    switch (logLevel) {
        case LOG_LEVEL.ERROR:
            console.log("\x1b[31m[Error] ", msg, "\x1b[0m")
            break;
        case LOG_LEVEL.WARN:
            console.log("\x1b[33m[Warning] ", msg, "\x1b[0m")
            break;
        case LOG_LEVEL.INFO:
            console.log("\x1b[32m[Info] ", msg, "\x1b[0m")
            break;
        case LOG_LEVEL.DEBUG:
            console.log("\x1b[37m[Debug] ", msg, "\x1b[0m")
            break;
        case LOG_LEVEL.DEBUG_WARN:
            console.log("\x1b[33m[Debug - Warning] ", msg, "\x1b[0m")
            break;
    }
}


export class Log{
    static config = null;

    static setConfig(config){
        this.config = config;
    }

    static log(logLevel, msg){
        if (Log.config == null) {
            console.log("\x1b[31m<Error> The log function was not initialized\x1b[0m")
            return;
        }
    
        if (logLevel > Log.config.log_level)
            return;
        switch (logLevel) {
            case LOG_LEVEL.ERROR:
                console.log("\x1b[31m[Error] ", msg, "\x1b[0m")
                break;
            case LOG_LEVEL.WARN:
                console.log("\x1b[33m[Warning] ", msg, "\x1b[0m")
                break;
            case LOG_LEVEL.INFO:
                console.log("\x1b[32m[Info] ", msg, "\x1b[0m")
                break;
            case LOG_LEVEL.DEBUG:
                console.log("\x1b[37m[Debug] ", msg, "\x1b[0m")
                break;
            case LOG_LEVEL.DEBUG_WARN:
                console.log("\x1b[33m[Debug - WARNING] ", msg, "\x1b[0m")
                break;
        }
    }
}

export default Log.log;