"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const essentials_1 = require("./essentials");
const axios = require("axios");
const express = require("express");
const multer = require("multer");
const path = require("path");
const { Csv } = require("./CsvManager.js");
const port = 3000;
const app = express();
const upload = multer({ dest: 'uploads/' });
let essentials;
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.get('/', (req, res) => {
    res.render('index');
});
app.get("/success", (req, res) => {
    res.render("success", { message: req.query.message });
});
process.on('exit', (code) => {
    // Cleanup code here
    console.log(`Exiting with code: ${code}`);
});
process.on('SIGTERM' || 'SIGINT', () => {
    // Graceful shutdown code here
    console.log('Received SIGTERM. Gracefully shutting down...');
    // Perform cleanup tasks, close connections, etc.
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
app.post('/setEssentials', async (req, res) => {
    if (!req.body.publicKey || !req.body.privateKey || !req.body.identityProvider) {
        res.redirect('/');
    }
    const key = await getAuthKey(req.body.publicKey, req.body.privateKey);
    essentials = new essentials_1.Essentials(key, req.body.identityProvider);
    const identityProvider = req.body.identityProvider;
    const publickey = req.body.publicKey;
    res.render('index', { publickey, identityProvider });
});
app.get('/externalId', (req, res) => {
    if (essentials == null || !essentials.authKey || !essentials.identityProvider) {
        return res.redirect('/');
    }
    res.render('externalId');
});
app.get('/userInserter', (req, res) => {
    if (essentials == null || !essentials.authKey || !essentials.identityProvider) {
        return res.redirect('/');
    }
    res.render('userInserter');
});
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.render('externalId');
    }
    const filePath = file.path;
    const emails = await csvToEmails(filePath);
    const users = await getUsers(emails, essentials.authKey);
    const duplicates = await RemoveDuplicateEmails(users);
    const externals = await HasExternalId(duplicates.include, essentials.authKey);
    const externalset = await SetExternalIds(externals.usersWithoutExternalId, await readCsv(filePath));
    const conflictedUsers = await convertUsers(externals.usersWithExternalId);
    const successfulUsers = await convertUsers(externalset);
    res.render('editor', { conflictedUsers, successfulUsers });
});
// Start the server
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
async function RemoveDuplicateEmails(users) {
    const uniqueEmails = [...new Set(users.map(user => user.email))];
    const exclude = users.filter((user, index, arr) => {
        return arr.filter(u => u.email === user.email).length > 1;
    }).map(user => user.email);
    const include = uniqueEmails.filter(email => {
        return !exclude.includes(email);
    });
    const uniqueExclude = [...new Set(exclude)];
    const result = {
        exclude: [],
        include: []
    };
    users.forEach(user => {
        if (uniqueExclude.includes(user.email)) {
            result.exclude.push(user);
        }
        else if (include.includes(user.email)) {
            result.include.push(user);
        }
    });
    return result;
}
async function SetExternalIds(users, csvData) {
    let data = new Map();
    csvData.forEach((key, value) => {
        users.forEach(user => {
            if (value == user.email) {
                data.set(user, key);
                setExternalId(essentials.authKey, user.id, essentials.identityProvider, key);
            }
        });
    });
    return data;
}
async function HasExternalId(users, authToken) {
    const userIds = users.map(user => user.id);
    const result = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/get-users-external-ids", {
        authToken: authToken,
        userIds: userIds,
    });
    const usersWithExternalId = new Map();
    let usersWithoutExternalId = [];
    if (result.data.usersExternalIds && result.data.usersExternalIds.length > 0) {
        users.forEach(user => {
            result.data.usersExternalIds.forEach(external => {
                if (user.id == external.authUserId) {
                    if (external.externalId != 0) {
                        usersWithExternalId.set(user, external.externalId);
                    }
                    else if (!usersWithoutExternalId.includes(user)) {
                        usersWithoutExternalId.push(user);
                    }
                }
            });
        });
    }
    else {
        usersWithoutExternalId = users;
    }
    return { usersWithExternalId, usersWithoutExternalId };
}
async function getAuthKey(apiKey, apiSecret) {
    const key = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/authenticate", {
        apiKey: apiKey,
        apiSecret: apiSecret,
    });
    return key.data.authToken;
}
async function csvToEmails(path) {
    let emails = [];
    let data = await Csv.read(path);
    data.forEach((key, value) => {
        emails.push(value);
    });
    return emails;
}
async function readCsv(path) {
    let emails = [];
    let data = await Csv.read(path);
    return data;
}
async function getUsers(emails, authKey) {
    const response = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/get-users-by-emails", {
        authToken: authKey,
        emails: emails,
    });
    return response.data.users;
}
;
async function setExternalId(authKey, userId, identityProvider, externalId) {
    const response = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/set-user-external-id", {
        authToken: authKey,
        userId: userId,
        identityProvider: identityProvider,
        externalId: externalId
    });
    return response.data.users;
}
async function convertUsers(users) {
    let newUsers = [];
    users.forEach((key, value) => {
        newUsers.push({
            id: value.id,
            username: value.username,
            email: value.email,
            externalId: key
        });
    });
    return newUsers;
}
//# sourceMappingURL=index.js.map