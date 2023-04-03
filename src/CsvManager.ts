import fs from "fs";
import { parse } from "csv-parse";

export class Csv {
  public static read(directory: string): [string[]] {
    let strings: [string[]] = [[]];
    fs.createReadStream("./migration_data.csv")
      .pipe(parse({ delimiter: ",", from_line: 2 }))
      .on("data", function (row) {
        console.log(row);
        strings.push(row);
      });
    return strings;
  }

  public static write() {}

  public static create() {}
}
