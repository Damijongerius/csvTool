"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const CsvManager_js_1 = require("./CsvManager.js");
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const port = 3000;
const storage = multer_1.default.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path_1.default.extname(file.originalname));
    },
});
// Initialize upload middleware
const upload = (0, multer_1.default)({ storage: storage }).single("file");
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
// Set up routes
app.get("/", (req, res) => {
    res.render("index");
});
app.get("/success", (req, res) => {
    res.render("success", { message: req.query.message });
});
app.post("/upload", async (req, res) => {
    console.log(req.body);
    let emails = [];
    let AuthKey = await getAuthKey(req.body.publicKey, req.body.privateKey);
    upload(req, res, (err) => {
        if (err) {
            console.error(err);
            res.send("An error occurred while uploading the file.");
        }
        else {
            CsvManager_js_1.Csv.read(req.file.path).then(function (data) {
                data.forEach((key, value) => {
                    emails.push(value);
                });
                let Users = getUsers(emails, AuthKey).then(function (users) {
                    //console.log(users);
                });
            });
        }
    });
});
// Set up view engine
app.set("views", path_1.default.join(__dirname, "views"));
app.set("view engine", "pug");
// Set up body-parser middleware
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
async function getAuthKey(apiKey, apiSecret) {
    const key = await axios_1.default.post("https://ontwikkel.q1000.nl/authenticator/api/authenticate", {
        apiKey: apiKey,
        apiSecret: apiSecret,
    });
    return key.data.authToken;
}
async function getUsers(emails, authKey) {
    const response = await axios_1.default.post("https://ontwikkel.q1000.nl/authenticator/api/get-users-by-emails", {
        authToken: authKey,
        emails: emails,
    });
    return response.data.users;
}
//# sourceMappingURL=index.js.map