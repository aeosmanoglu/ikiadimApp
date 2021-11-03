const { authenticator } = require("@otplib/preset-default");
const express = require("express");
const app = express();
const qr = require("qrcode");
const port = 3000;
var isQRGenerated = false;

app.set("view engine", "pug");
app.use(express.static("public"));

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/", function bodyParser(req, res) {
    const secret = authenticator.generateSecret();
    qr.toDataURL(
        "otpauth://totp/Jandarma?secret=%d" + secret,
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

app.get("/", function (req, res) {
    res.render("index", { isQRGenerated });
});

app.listen(port, () => {
    console.log("App listening at http://localhost:%d", port);
});
