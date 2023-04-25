"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Csv = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_parse_1 = require("csv-parse");
const csv_stringify_1 = require("csv-stringify");
class Csv {
    static read(directory, delimiter) {
        return new Promise((resolve, reject) => {
            const data = new Map();
            fs_1.default.createReadStream(directory)
                .pipe((0, csv_parse_1.parse)({ delimiter: delimiter, from_line: 2 }))
                .on("data", function (row) {
                console.log(row);
                if (row && row.length > 1) {
                    // skip empty rows
                    data.set(row[0], row[1]);
                }
            })
                .on("end", function () {
                resolve(data);
            })
                .on("error", function (err) {
                resolve(data);
            });
        });
    }
    static write() { }
    static create(directory, data) {
        (0, csv_stringify_1.stringify)(data, (err, output) => {
            if (err)
                throw err;
            fs_1.default.writeFile("example.csv", output, (err) => {
                if (err)
                    throw err;
                console.log("CSV file saved.");
            });
        });
    }
}
exports.Csv = Csv;
//# sourceMappingURL=CsvManager.js.map