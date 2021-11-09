/*jshint esversion: 8 */

const express = require("express");
const app = express();
const { authenticator } = require("@otplib/preset-default");
const qr = require("qrcode");
const { authenticate } = require("ldap-authentication");
const dotenv = require("dotenv");
dotenv.config();
var isQRGenerated = false;
let key = authenticator.generateSecret();

// TODO: Unit test this func with Jest
function isValidID(id) {
    regex = new RegExp(/[1-9][0-9]{6}/);
    return regex.test(id);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "pug");

app.get("/", function(req, res) {
    res.render("login");
});

app.post('/', async function(res, req) {
    var user = null;
    let b = res.body;
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
        console.log(error);
    }

    if (user === null) {
        req.render("login", { message: "Kullanıcı adı veya parola hatalı." });
    } else {
        let name = user.displayName.split(" ");
        let shortName = name.shift() + " " + name.pop().charAt(0) + ".";
        req.render('index', { name: shortName });
    }
});


//////////////////////////////////////////////////////////////////////////

// app.get("/home", function (req, res) {
//     res.render("index", { isQRGenerated });
// });

// app.post("/home", function bodyParser(req, res) {
//     const secret = authenticator.generateSecret();
//     qr.toDataURL(
//         "otpauth://totp/Jandarma?secret=" + secret,
//         {
//             errorCorrectionLevel: "H",
//             width: 500,
//             margin: 0,
//             color: { light: "#FFFFFF00" },
//         },
//         (err, src) => {
//             isQRGenerated = true;
//             res.render("index", { src, isQRGenerated });
//         }
//     );
// });

// TODO: redirect to other views to "/""

module.exports = app;