"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = __importDefault(require("fs"));
class Logger {
    constructor(logFilePath) {
        this.logFilePath = logFilePath;
    }
    log(message) {
        const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(message)}\n`;
        fs_1.default.appendFile(this.logFilePath, logEntry, (err) => {
            if (err) {
                console.error('Error writing to log file:', err);
            }
        });
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map