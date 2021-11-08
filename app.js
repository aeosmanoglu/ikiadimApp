/* EXPRESS */
const express = require("express");
const app = express();

const { authenticator } = require("@otplib/preset-default"); // for Secret Key generation
const qr = require("qrcode"); // for QR Code generation

/* PASSPORT */
const cookieSession = require('cookie-session')
const passport = require('passport')
const CustomStrategy = require('passport-custom').Strategy
const { authenticate } = require('ldap-authentication')

/* ENVIROMENT*/
const dotenv = require("dotenv");
dotenv.config();

/* Local variables and functions */
var isQRGenerated = false;
var key = authenticator.generateSecret();

// TODO: Unit test this func with Jest
function isValidID(id) {
    regex = new RegExp(/[1-9][0-9]{6}/);
    return regex.test(id);
}

passport.use('ldap', new CustomStrategy(
    async function(req, done) {
        try {
            if (!req.body.id || !req.body.password) {
                throw new Error('username and password are not provided')
            }

            let options = {
                ldapOpts: {
                    url: process.env.LDAP_URL
                },
                adminDn: process.env.ADMIN_DN,
                adminPassword: process.env.ADMIN_PASSWORD,
                userDn: "CN=" + req.body.id + process.env.USER_DN,
                userPassword: req.body.password,
                userSearchBase: process.env.USER_SEARCH_BASE,
                usernameAttribute: process.env.USERNAME_ATTR,
                username: req.body.id,
            }
            let user = await authenticate(options)
            done(null, user)
        } catch (error) {
            done(error, null)
        }
    }
))

passport.serializeUser(function(user, done) {
    done(null, user);
})
passport.deserializeUser(function(user, done) {
    done(null, user);
})

var sessionMiddleWare = cookieSession({
    name: 'session',
    keys: key,
    maxAge: 60 * 60 * 1000 // 1 hour
})

/* End of requirements */

app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleWare);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.set("view engine", "pug");

app.post('/login',
    passport.authenticate('ldap', { failureRedirect: '/' }),
    function(req, res) {
        res.redirect('/success');
    }
)

app.get('/success', (req, res) => {
    if (req.sessionCookies.keys === key) {
        res.render('index')
    } else {
        res.redirect('/')
    }
})

// LOGOUT
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
})

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