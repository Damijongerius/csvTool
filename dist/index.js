"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("./Logger");
const essentials_1 = require("./essentials");
const axios = require("axios");
const express = require("express");
const multer = require("multer");
const path = require("path");
const { Csv } = require("./CsvManager.js");
const port = 3000;
const app = express();
const upload = multer({ dest: "uploads/" });
let essentials;
const logger = new Logger_1.Logger('log.txt');
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    const { message } = req.query;
    res.render("index", { message });
});
app.get("/success", (req, res) => {
    res.render("success", { message: req.query.message });
});
process.on("exit", (code) => {
    console.log(`Exiting with code: ${code}`);
});
process.on("SIGTERM" || "SIGINT", () => {
    logger.log("Received SIGTERM. Gracefully shutting down...");
    server.close(() => {
        logger.log("Server closed.");
        process.exit(0);
    });
});
app.post("/setEssentials", async (req, res) => {
    let message = "fill all the fields pls";
    if (!req.body.publicKey ||
        !req.body.privateKey ||
        !req.body.identityProvider) {
        logger.log(message);
        res.redirect(`/?message=${message}`);
    }
    const response = await getAuthKey(req.body.publicKey, req.body.privateKey);
    const identityProvider = req.body.identityProvider;
    const publickey = req.body.publicKey;
    const privateKey = req.body.privateKey;
    if (response.errors[0] != null && response.errors[0].message != null) {
        message = response.errors[0].message;
        logger.log(message);
        res.render("index", { publickey, identityProvider, message, privateKey });
    }
    else {
        essentials = new essentials_1.Essentials(response.authToken, req.body.identityProvider);
        message = "sucessfully aquired a key";
        logger.log(message);
        res.render("index", { publickey, identityProvider, message });
    }
});
app.get("/externalId", (req, res) => {
    if (essentials == null ||
        !essentials.authKey ||
        !essentials.identityProvider) {
        let error = "no valid key or no identityProvider";
        logger.log("error");
        res.redirect(`/?message=${error}`);
    }
    logger.log("render externalId");
    res.render("externalId");
});
app.get("/userInserter", async (req, res) => {
    if (essentials == null ||
        !essentials.authKey ||
        !essentials.identityProvider) {
        let error = "no valid key or no identityProvider";
        logger.log("redirect error :" + error);
        res.redirect(`/?message=${error}`);
    }
    logger.log("render UserInsterter");
    const users = await getAllUsers(essentials.authKey);
    const ids = [];
    users.forEach(user => {
        ids.push(user.id);
    });
    const UserExternalIds = await getAllExternalIds(essentials.authKey, ids);
    users.forEach(user => {
        const matchingExternalId = UserExternalIds.find(externalId => externalId.authUserId === user.id);
        if (matchingExternalId) {
            user.externalId = matchingExternalId.externalId;
            console.log("hi");
        }
    });
    const conflictedUsers = await convertUsersV2(users, { email: true, id: true });
    const successfulUsers = [];
    essentials.conflictedUsers = conflictedUsers;
    essentials.successfullUsers = successfulUsers;
    logger.log("render editor");
    res.render("editor", { conflictedUsers, successfulUsers });
});
app.post("/upload", upload.single("file"), async (req, res) => {
    const file = req.file;
    if (!file) {
        logger.log("render externalId");
        return res.render("externalId");
    }
    const filePath = file.path;
    const emails = await csvToEmails(filePath);
    const users = await getUsers(emails, essentials.authKey);
    const duplicates = await RemoveDuplicateEmails(users);
    const externals = await HasExternalId(duplicates.include, essentials.authKey);
    const externalset = await SetExternalIds(externals.usersWithoutExternalId, await readCsv(filePath));
    let csvData = await readCsv(filePath);
    let dups = new Map();
    csvData.forEach((key, value) => {
        duplicates.exclude.forEach((user) => {
            let email = user.email;
            if (value.toLowerCase == email.toLowerCase) {
                dups.set(user, key);
            }
        });
    });
    const conflictedUniqueUsers = await convertUsers(externals.usersWithExternalId, { email: true, id: false });
    const conflictedUsers = conflictedUniqueUsers.concat(await convertUsers(dups, { email: false, id: false }));
    const successfulUsers = await convertUsers(externalset, { email: true, id: true });
    essentials.conflictedUsers = conflictedUsers;
    essentials.successfullUsers = successfulUsers;
    logger.log("render editor");
    res.render("editor", { conflictedUsers, successfulUsers });
});
app.post("/forceUpload", async (req, res) => {
    await setExternalId(essentials.authKey, req.body.id, essentials.identityProvider, req.body.externalId);
    await setUserName(essentials.authKey, req.body.id, 22);
    if (req.body.userType != 2) {
        await setUserEmail(essentials.authKey, req.body.id, req.body.email);
    }
    else {
        await setConsultantEmail(essentials.authKey, req.body.id, req.body.email);
    }
    essentials.successfullUsers.forEach(user => {
        if (user.id == req.body.id) {
            const index = essentials.successfullUsers.indexOf(user);
            essentials.successfullUsers.splice(index, 1);
            send();
        }
    });
    essentials.conflictedUsers.forEach(user => {
        if (user.id == req.body.id) {
            const index = essentials.conflictedUsers.indexOf(user);
            essentials.conflictedUsers.splice(index, 1);
            send();
        }
    });
    function send() {
        essentials.successfullUsers.push(req.body);
        const conflictedUsers = essentials.conflictedUsers;
        const successfulUsers = essentials.successfullUsers;
        logger.log("render editor");
        res.render("editor", { conflictedUsers, successfulUsers });
    }
});
// Start the server
const server = app.listen(port, () => {
    logger.log(`Server listening on port ${port}`);
});
async function RemoveDuplicateEmails(users) {
    const uniqueEmails = [...new Set(users.map((user) => user.email))];
    const exclude = users
        .filter((user, index, arr) => {
        return arr.filter((u) => u.email === user.email).length > 1;
    })
        .map((user) => user.email);
    const include = uniqueEmails.filter((email) => {
        return !exclude.includes(email);
    });
    const uniqueExclude = [...new Set(exclude)];
    const result = {
        exclude: [],
        include: [],
    };
    users.forEach((user) => {
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
        users.forEach((user) => {
            let email = user.email;
            if (value.toLowerCase == email.toLowerCase) {
                data.set(user, key);
                setExternalId(essentials.authKey, user.id, essentials.identityProvider, key);
            }
        });
    });
    return data;
}
async function HasExternalId(users, authToken) {
    const userIds = users.map((user) => user.id);
    const result = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/get-users-external-ids", {
        authToken: authToken,
        userIds: userIds,
    });
    const usersWithExternalId = new Map();
    const usersWithoutExternalId = [];
    const usersCopy = [...users];
    usersWithoutExternalId.push(...usersCopy);
    if (result.data.usersExternalIds && result.data.usersExternalIds.length > 0) {
        users.forEach((user) => {
            result.data.usersExternalIds.forEach((external) => {
                if (user.id == external.authUserId) {
                    if (external.externalId != null) {
                        usersWithExternalId.set(user, external.externalId);
                        const index = usersWithoutExternalId.indexOf(user);
                        usersWithoutExternalId.splice(index, 1);
                    }
                }
            });
        });
    }
    return { usersWithExternalId, usersWithoutExternalId };
}
async function getAuthKey(apiKey, apiSecret) {
    const key = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/authenticate", {
        apiKey: apiKey,
        apiSecret: apiSecret,
    });
    return key.data;
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
    logger.log(response.data);
    return response.data.users;
}
async function getAllUsers(authKey) {
    const response = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/getusers", {
        authToken: authKey,
    });
    logger.log(response.data);
    return response.data.users;
}
async function getAllExternalIds(authKey, userIds) {
    const response = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/get-users-external-ids", {
        authToken: authKey,
        userIds: userIds
    });
    logger.log(response.data);
    return response.data.usersExternalIds;
}
async function setExternalId(authKey, userId, identityProvider, externalId) {
    const response = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/set-user-external-id", {
        authToken: authKey,
        userId: userId,
        identityProvider: identityProvider,
        externalId: externalId,
    });
    logger.log(response.data);
    return response.data.users;
}
async function setConsultantEmail(authKey, userId, email) {
    const response = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/editconsultant", {
        authToken: authKey,
        q4youID: userId,
        email: email,
    });
    logger.log(response.data);
    return response.data;
}
async function setUserEmail(authKey, userId, email) {
    const response = await axios.post("https://ontwikkel.q1000.nl/authenticator/api/edituser", {
        authToken: authKey,
        q4youID: userId,
        email: email
    });
    logger.log(response.data);
    return response.data;
}
async function setUserName(authKey, userId, values) {
    const response = await axios.post("https://ontwikkel.q1000.nl/q4u/api/getvalues", {
        authToken: authKey,
        q4youID: userId,
        itemType: 1,
        //values: values
    });
    logger.log(response.data);
    return response.data;
}
async function convertUsers(users, success) {
    let newUsers = [];
    users.forEach((key, value) => {
        newUsers.push({
            id: value.id,
            username: value.username,
            email: value.email,
            externalId: key,
            userType: value.userType,
            success: success
        });
    });
    return newUsers;
}
async function convertUsersV2(users, success) {
    let newUsers = [];
    users.forEach(user => {
        newUsers.push({
            id: user.id,
            username: user.userName,
            email: user.email,
            externalId: user.externalId,
            userType: user.userType,
            success: success
        });
    });
    return newUsers;
}
async function convertToUser(id, username, email, externalId, userType, successId, sucessEmail) {
    return {
        id: id,
        username: username,
        email: email,
        externalId: externalId,
        userType: userType,
        errors: {
            email: sucessEmail,
            externalId: successId
        }
    };
}
//# sourceMappingURL=index.js.map