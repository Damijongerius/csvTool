"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const port = 3000;
// Set up storage engine for uploaded files
const storage = multer_1.default.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path_1.default.extname(file.originalname));
    },
});
// Initialize upload middleware
const upload = (0, multer_1.default)({ storage: storage }).single('file');
// Set up routes
app.get('/', (req, res) => {
    res.render('index');
});
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.error(err);
            res.send('An error occurred while uploading the file.');
        }
        else {
            console.log(req.file);
            res.send('File uploaded successfully!');
        }
    });
});
// Set up view engine
app.set('views', path_1.default.join(__dirname, 'views'));
app.set('view engine', 'pug');
// Set up body-parser middleware
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
/*
let AuthKey
axios.post('https://ontwikkel.q1000.nl/authenticator/api/authenticate', {
    apiKey: 'f36ff71e-3328-464c-987a-e8ac8881221e',
    apiSecret: "99528656-63cd-468b-8dff-ab4267bef38f"
})
.then(function (response){
    AuthKey = response.data.authToken;
    console.log(AuthKey);

    Csv.read("./migration_data.csv");
})
*/
//# sourceMappingURL=index.js.map