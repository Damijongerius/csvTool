import axios from "axios";
import { Csv } from "./CsvManager.js";
import express from "express";
import multer from "multer";
import path from "path";

const app = express();
const port = 3000;

const AuthKey = "ec4b6d42-dd05-4569-bc2b-6c8b8e680d66"

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize upload middleware
const upload = multer({ storage: storage }).single("file");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/success", (req, res) => {
  res.render("success", { message: req.query.message });
});

app.post("/upload", (req, res) => {
  console.log(AuthKey);

  upload(req, res, (err) => {
    if (err) {
      console.error(err);
      res.send("An error occurred while uploading the file.");
      return;
    }
      let emails: String[] = [];
      Csv.read(req.file.path, ",").then(function (data) {
        data.forEach((key, value) => {
          emails.push(value);
        });
        console.log(emails);
        axios
          .post(
            "https://ontwikkel.q1000.nl/authenticator/api/get-users-by-emails",
            {
              authToken: AuthKey,
              emails: emails,
            }
          )
          .then(function (response) {
            console.log({
              authToken: AuthKey,
              emails: emails,
            })
            console.log(response.data);
            const users: object[] = response.data;
            users.forEach((id) => {
              console.log("id");
            });
            //res.redirect(`/success`);
          });
      });
    }
  );
});

// Set up view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Set up body-parser middleware
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
