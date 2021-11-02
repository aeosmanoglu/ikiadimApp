const express = require("express");
const app = express();
const port = 3000;

app.set("view engine", "pug");
app.use(express.static("public"));

app.get("/", function (req, res) {
    res.render("login");
});

app.get("/a", function (req, res) {
    res.render("index");
});

app.listen(port, () => {
    console.log("App listening at http://localhost:%d", port);
});
