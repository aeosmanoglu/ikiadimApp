/*jshint esversion: 8 */

// Importing express
const express = require("express");
const app = express();

// Importing the required modules
const authenticator = require("@otplib/preset-default");
const qr = require("qrcode");
const { encrypt, decrypt, sha256 } = require("./controllers/crypto");
const now = require("./controllers/now");

// Set up environment variables
const dotenv = require("dotenv");
dotenv.config();

// Setting the global variables
var isQRGenerated = false;
var user = {};

// Sentry error reporting setup (optional)
// https://sentry.io/ for more info on Sentry error reporting
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
Sentry.init({
    dsn: process.env.DSN,
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
});
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
// End Sentry error reporting setup

// Database setup
const db = require("./models");
const DataModel = db.datas;
db.mongoose
    .connect(db.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to the database!");
    })
    .catch((err) => {
        console.log("Cannot connect to the database!", err);
        process.exit();
    }); // connect to database
// End database setup

// Set up rate limiter: maximum of 60 requests per minute
const rateLimit = require("express-rate-limit");
var limiter = new rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60,
});
app.use(limiter);
// End rate limiter

// app config
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "pug");

// routes
app.get("/", function (req, res) {
    res.render("login");
}); // login page

app.post("/", async (res, req) => {
    const b = res.body;
    const isValidID = require("./controllers/pbik-validator");
    if (!isValidID(b.id)) {
        req.render("login", { message: "what the hack are you doing?" });
        const ip = res.headers["x-forwarded-for"] || res.socket.remoteAddress;
        console.log("HACK  : " + ip + " - " + now());
        return;
    }
    const options = {
        ldapOpts: { url: process.env.LDAP_URL },
        adminDn: process.env.ADMIN_DN,
        adminPassword: process.env.ADMIN_PASSWORD,
        userPassword: b.password,
        userSearchBase: process.env.USER_SEARCH_BASE,
        usernameAttribute: process.env.USERNAME_ATTR,
        username: b.id,
        // starttls: false
    };

    try {
        const authenticate = require("ldap-authentication");
        user = await authenticate(options);
    } catch (error) {
        console.debug(error);
        req.render("login", { message: "Kullanıcı adı veya parola hatalı." });
        return;
    }

    if (user === {}) {
        req.render("login", { message: "Kullanıcı adı veya parola hatalı." });
    } else {
        const name = user.givenName;
        const surname = user.sn.substring(0, 1) + ".";
        req.render("index", { name: name + " " + surname });
        console.log("LOGIN : " + user.name + " - " + now());
    }
}); // login

app.get("/logout", (res, req) => {
    req.render("login", { message: "Çıkış yapıldı" });
    console.log("LOGOUT: " + user.name + " - " + now());
    user = {};
}); // logout

app.post("/create", (req, res) => {
    const secret = authenticator.generateSecret();
    qr.toDataURL(
        "otpauth://totp/Jandarma?secret=" + secret,
        {
            errorCorrectionLevel: "H",
            width: 500,
            margin: 0,
            color: { light: "#FFFFFF00" },
        },
        (err, src) => {
            isQRGenerated = true;
            res.render("index", { src, isQRGenerated });
        }
    );
    console.log("QR GEN: " + user.name + " - " + now());

    const hash = encrypt(secret);
    const pbik = sha256(user.sAMAccountName);

    DataModel.findOneAndUpdate(
        { pbik: pbik },
        {
            $set: {
                pbik: pbik,
                iv: hash.iv,
                content: hash.content,
            },
        },
        {
            upsert: true,
        }
    ).catch((error) => console.error(error));
}); // create

app.get("/api/check", (res, req) => {
    const q = res.query;
    var pbik = "";
    if (!q.id || !q.code || !q.key) {
        req.statusCode = 400;
        req.statusMessage = "Bad Request";
        return req.send();
    } else {
        pbik = sha256(res.query.id);
    }

    DataModel.find({ pbik: pbik })
        .then((data) => {
            const hash = { iv: data[0].iv, content: data[0].content };
            const key = decrypt(hash);
            const serverKey = process.env.KEY;
            const serverCode = authenticator.generate(key);
            const userKey = res.query.key;
            const userCode = res.query.code;
            const ip =
                res.headers["x-forwarded-for"] || res.socket.remoteAddress;

            if (userKey != serverKey) {
                req.statusCode = 401;
                req.statusMessage = "Unauthorized";
                return req.send();
            } else if (serverCode != userCode) {
                console.log(
                    "CHCKED: " +
                        ip +
                        " - " +
                        res.query.id +
                        " - " +
                        now() +
                        " - " +
                        false
                );
                const xssFilters = require("xss-filters");
                return req.send({
                    id: xssFilters.inHTMLData(res.query.id),
                    status: false,
                });
            } else {
                console.log(
                    "CHCKED: " +
                        ip +
                        " - " +
                        res.query.id +
                        " - " +
                        now() +
                        " - " +
                        true
                );
                return req.send({ id: res.query.id, status: true });
            }
        })
        .catch((error) => {
            req.statusCode = 500;
            req.statusMessage = "Database Error";
            return console.error(error);
        });
}); // check

app.use(Sentry.Handlers.errorHandler());

module.exports = app;
