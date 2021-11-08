/* EXPRESS */
const express = require("express");
const app = express();

const { authenticator } = require("@otplib/preset-default"); // for Secret Key generation
const qr = require("qrcode"); // for QR Code generation
const ad2 = require('activedirectory2'); // for active directory login over LDAP

/* ENVIROMENT*/
const dotenv = require("dotenv");
dotenv.config();

/* Local variables and functions */
var isQRGenerated = false;

// TODO: Unit test this func with Jest
function isValidID(id) {
    regex = new RegExp(/^\d{7}$/);
    return regex.test(id);
}

/* End of requirements */


app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "pug");

app.post(
    "/",
    function(req, res) {
        const config = {
            url: process.env.LDAP_URL,
            baseDN: process.env.LDAP_BASE_DN,
            username: req.body.id,
            password: req.body.password,
        }
        const ad = new ad2(config);

        ad.authenticate(req.body.id, req.body.password, function(err, auth) {
            if (err) {
                console.log('ERROR: ' + JSON.stringify(err));
            }

            if (auth) {
                console.log('Authenticated!');
                res.render("index");
            } else {
                console.log('Authentication failed!');
                res.render("login", { message: "Kullanıcı adı veya parola hatalı" });

            }
        });
    }
);

// LOGOUT
app.get("/logout", (req, res) => {
    res.redirect("/");
});

// LOGIN
app.get("/", function(req, res) {
    res.render("login");
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