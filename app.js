/*jshint esversion: 8 */

// Importing express
const express = require("express");
const app = express();

// Importing the required modules
const authenticator = require("@otplib/preset-default");
const qr = require("qrcode");
const { encrypt, decrypt, sha256 } = require("./controllers/crypto");
const now = require("./controllers/now");
const isValidID = require("./controllers/pbik-validator");

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

// Setting up the logger
const woodlotCustomLogger = require("woodlot").customLogger;
const logger = new woodlotCustomLogger({
    streams: ["./logs/custom.log"],
    stdout: false,
    format: {
        type: "json",
        options: {
            compact: false,
        },
    },
});

// Database setup
const db = require("./models");
const DataModel = db.datas;
db.mongoose
    .connect(db.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        logger.debug({ event: "Database connection established" });
    })
    .catch((err) => {
        logger.debug({ event: "Database connection failed", error: err });
        process.exit();
    }); // connect to database
// End database setup

// Setting up the helmet middleware
var helmet = require("helmet");
app.use(helmet());

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
    const ip = res.headers["x-forwarded-for"] || res.socket.remoteAddress;
    const b = res.body;
    if (!isValidID(b.id)) {
        req.render("login", { message: "what the hack are you doing?" });
        logger.warn({
            event: "ID input pattern removed from front-end. Somebody try to hack the system",
            ip: ip,
            id: b.id,
            password: b.password,
        });
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
        logger.error({ error: error, event: "LDAP authentication failed" });
        req.render("login", { message: "Kullanıcı adı veya parola hatalı." });
        return;
    }

    if (user === {}) {
        req.render("login", { message: "Kullanıcı adı veya parola hatalı." });
    } else {
        const name = user.givenName;
        const surname = user.sn.substring(0, 1) + ".";
        req.render("index", { name: name + " " + surname });
        logger.info({ event: "User logged in", user: user, ip: ip });
    }
}); // login

app.get("/logout", (res, req) => {
    const ip = res.headers["x-forwarded-for"] || res.socket.remoteAddress;
    req.render("login", { message: "Çıkış yapıldı" });
    logger.info({ event: "User logged out", user: user, ip: ip });
    user = {};
}); // logout

app.post("/create", (req, res) => {
    const ip = req.headers["x-forwarded-for"] || res.socket.remoteAddress;
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
    logger.debug({ event: "User requested a new QR code", user: user, ip: ip });

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
    )
        .then(
            logger.info({
                event: "User set or update a new secret",
                user: user,
                ip: ip,
                hash: hash,
            })
        )
        .catch((error) =>
            logger.error({
                error: error,
                event: "Database error when update or setting.",
                user: user,
                ip: ip,
            })
        );
}); // create

app.get("/api/check", (res, req) => {
    const ip = res.headers["x-forwarded-for"] || res.socket.remoteAddress;
    const q = res.query;
    var pbik = "";
    if (!q.code || !isValidID(q.id)) {
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
            const serverCode = authenticator.generate(key);
            const userCode = res.query.code;
            if (serverCode != userCode) {
                logger.warn({
                    event: "User entered wrong code",
                    user: res.query.id,
                    ip: ip,
                });
                req.statusCode = 401;
                req.statusMessage = "Unauthorized";
                const xssFilters = require("xss-filters");
                return req.send({
                    id: xssFilters.inHTMLData(res.query.id),
                    status: false,
                });
            } else {
                logger.info({
                    event: "User entered correct code",
                    user: res.query.id,
                    ip: ip,
                });
                req.statusCode = 200;
                req.statusMessage = "OK";
                const xssFilters = require("xss-filters");
                return req.send({
                    id: xssFilters.inHTMLData(res.query.id),
                    status: true,
                });
            }
        })
        .catch((error) => {
            req.statusCode = 500;
            req.statusMessage = "Database Error";
            logger.error({
                error: error,
                event: "Database error when checking code.",
                user: res.query.id,
                ip: ip,
            });
            return;
        });
}); // check

app.use(Sentry.Handlers.errorHandler());

module.exports = app;
