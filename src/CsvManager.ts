import fs from "fs";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";

export class Csv {
  public static read(directory: string, delimiter: string): Promise<Map<String, Number>> {
    return new Promise((resolve, reject) => {
      const data: Map<String, Number> = new Map();

      fs.createReadStream(directory)
        .pipe(parse({ delimiter: delimiter, from_line: 2 }))
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

  public static write() {}

  public static create(directory: String, data) {
    stringify(data, (err, output) => {
      if (err) throw err;

      fs.writeFile("example.csv", output, (err) => {
        if (err) throw err;
        console.log("CSV file saved.");
      });
    });
  }
}
