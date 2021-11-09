/*jshint esversion: 8 */

const express = require("express");
const app = express();
const { authenticator } = require("@otplib/preset-default");
const qr = require("qrcode");
const { authenticate } = require("ldap-authentication");
const dotenv = require("dotenv");
dotenv.config();
var isQRGenerated = false;
var user = {};

// TODO: Unit test this func with Jest
function isValidID(id) {
    regex = new RegExp(/[1-9][0-9]{6}/);
    return regex.test(id);
}

function now() {
    let timeElapsed = Date.now();
    let today = new Date(timeElapsed);
    return today.toString();
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "pug");

app.get("/", function(req, res) {
    res.render("login");
});

app.post('/', async(res, req) => {
    let b = res.body;
    if (!isValidID(b.id)) {
        req.render("login", { message: "what the hack are you doing?" });
        const ip = res.headers['x-forwarded-for'] || res.socket.remoteAddress;
        console.log("HACK  : " + ip + " - " + now());
        return;
    }
    let options = {
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
        user = await authenticate(options);

    } catch (error) {
        console.debug(error);
        req.render("login", { message: "Kullanıcı adı veya parola hatalı." });
        return;
    }

    if (user === {}) {
        req.render("login", { message: "Kullanıcı adı veya parola hatalı." });
    } else {
        let name = user.givenName;
        let surname = user.sn.substring(0, 1) + ".";
        req.render('index', { name: name + " " + surname });
        console.log("LOGIN : " + user.name + " - " + now());
    }
});

app.get("/logout", (res, req) => {
    req.render("login", { message: "Çıkış yapıldı" });
    console.log("LOGOUT: " + user.name + " - " + now());
    user = {};
});

app.post("/create", (req, res) => {
    let secret = authenticator.generateSecret();
    qr.toDataURL(
        "otpauth://totp/Jandarma?secret=" + secret, {
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
});

module.exports = app;