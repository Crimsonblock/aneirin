export enum LOG_LEVEL {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4
}



export class Logger {
    static logLevel = 0;

    static log(msg: any) {
        if (Logger.logLevel >= LOG_LEVEL.INFO){
            console.log("\x1b[32m[Info] ", msg, "\x1b[0m");
        }
    }

    static warn(msg: any) {
        if (Logger.logLevel >= LOG_LEVEL.WARN)
            console.log("\x1b[33m[Debug - Warning] ", msg, "\x1b[0m")
    }

    static err(msg: any) {
        if (Logger.logLevel >= LOG_LEVEL.ERROR)
            console.log("\x1b[31m[Error] ", msg, "\x1b[0m")
    }

    static dLog(msg: any) {
        if (Logger.logLevel >= LOG_LEVEL.DEBUG)
            console.log("\x1b[37m[Debug] ", msg, "\x1b[0m")
    }

}

export const warn = Logger.warn;
export const err = Logger.err;
export const dLog = Logger.dLog;
export const log = Logger.log;