"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Csv = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_parse_1 = require("csv-parse");
class Csv {
    static read(directory) {
        let strings = [[]];
        fs_1.default.createReadStream("./migration_data.csv")
            .pipe((0, csv_parse_1.parse)({ delimiter: ",", from_line: 2 }))
            .on("data", function (row) {
            console.log(row);
            strings.push(row);
        });
        return strings;
    }
    static write() { }
    static create() { }
}
exports.Csv = Csv;
//# sourceMappingURL=CsvManager.js.map