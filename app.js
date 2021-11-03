const express = require("express");
const app = express();
const { authenticator } = require("@otplib/preset-default");
const qr = require("qrcode");
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT;
const bodyParser = require("body-parser");
var isQRGenerated = false;

app.set("view engine", "pug");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
    res.render("login");
});

app.post("/", function bodyParser(req, res) {
    console.log(req.body.id + " giriş yaptı");
    res.render("index");
});

app.get("/home", function (req, res) {
    res.render("index", { isQRGenerated });
});

app.post("/home", function bodyParser(req, res) {
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
});

app.listen(port, () => {
    console.log("App listening at http://localhost:" + port);
});
