/*jshint esversion: 8 */

let express = require("express");
let app = express();
let { authenticator } = require("@otplib/preset-default");
let qr = require("qrcode");
let { authenticate } = require("ldap-authentication");
let { encrypt, decrypt, shax } = require("./controllers/crypto");
let isValidID = require("./controllers/pbik-validator");
let now = require("./controllers/now");
let dotenv = require("dotenv");
dotenv.config();
var isQRGenerated = false;
var user = {};



let db = require("./models");
let DataModel = db.datas;
db.mongoose
    .connect(db.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Connected to the database!");
    })
    .catch(err => {
        console.log("Cannot connect to the database!", err);
        process.exit();
    });




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
        let ip = res.headers['x-forwarded-for'] || res.socket.remoteAddress;
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

    let hash = encrypt(secret);
    let pbik = shax(user.sAMAccountName);

    DataModel.findOneAndUpdate({ pbik: pbik }, {
            $set: {
                pbik: pbik,
                iv: hash.iv,
                content: hash.content
            }
        }, {
            upsert: true
        })
        .catch(error => console.error(error));

});

app.get("/api/check", (res, req) => {
    let pbik = shax(res.query.id);
    DataModel.find({ pbik: pbik })
        .then(data => {
            let hash = { iv: data[0].iv, content: data[0].content };
            let key = decrypt(hash);
            let serverKey = process.env.KEY;
            let serverCode = authenticator.generate(key);
            let userKey = res.query.key;
            let userCode = res.query.code;
            let ip = res.headers['x-forwarded-for'] || res.socket.remoteAddress;

            if (userKey != serverKey) {
                req.statusCode = 400;
                req.statusMessage = "NOT OK";
                return req.send();
            } else if (serverCode != userCode) {
                console.log("CHCKED: " + ip + " - " + res.query.id + " - " + now() + " - " + false);
                return req.send({ "id": res.query.id, "status": false });
            } else {
                console.log("CHCKED: " + ip + " - " + res.query.id + " - " + now() + " - " + true);
                return req.send({ "id": res.query.id, "status": true });
            }
        })
        .catch(error => {
            req.statusCode = 500;
            req.statusMessage = "Database Error";
            return console.error(error);
        });
});

module.exports = app;