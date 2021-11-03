const express = require("express");
const app = express();
const { authenticator } = require("@otplib/preset-default");
const qr = require("qrcode");
const cookieSession = require("cookie-session");
const passport = require("passport");
const CustomStrategy = require("passport-custom").Strategy;
const { authenticate } = require("ldap-authentication");
const dotenv = require("dotenv");
dotenv.config();
var isQRGenerated = false;

// Create the passport custom stragegy and name it `ldap`
passport.use(
    "ldap",
    new CustomStrategy(async function (req, done) {
        try {
            if (!req.body.id || !req.body.password) {
                throw new Error("username and password are not provided");
            }
            // construct the parameter to pass in authenticate() function
            let ldapBaseDn = process.env.LDAP_BASE_DN;
            let options = {
                ldapOpts: {
                    url: process.env.LDAP_URL,
                },
                // note in this example it only use the user to directly
                // bind to the LDAP server. You can also use an admin
                // here. See the document of ldap-authentication.
                userDn: `uid=${req.body.username},${ldapBaseDn}`,
                userPassword: req.body.password,
                userSearchBase: ldapBaseDn,
                usernameAttribute: "uid",
                username: req.body.id,
            };
            // ldap authenticate the user
            let user = await authenticate(options);
            // success
            done(null, user);
        } catch (error) {
            // authentication failure
            done(error, null);
        }
    })
);

// passport requires
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});

// passport requires a session
var sessionMiddleWare = cookieSession({
    name: "session",
    keys: [authenticator.generateSecret()],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

// The order of the following middleware is very important for passport!!
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleWare);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));

app.set("view engine", "pug");

app.get("*", (req, res) => {
    res.render("login");
});

// user post username and password
app.post(
    "/login",
    passport.authenticate("ldap", {
        failureRedirect:
            ("/login", { message: "Kullanıcı Adı veya Parola Hatalı" }),
    }),
    function (req, res) {
        res.redirect("/success");
    }
);

// success page
app.get("/success", (req, res) => {
    let user = req.user;
    if (!user) {
        res.redirect("/");
        return;
    }
    res.render("success", {
        userDisplayName: user.cn,
        userObject: JSON.stringify(user, null, 2),
    });
});

// passport standard logout call.
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

// the login page
app.get("/", function (req, res) {
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

module.exports = app;
