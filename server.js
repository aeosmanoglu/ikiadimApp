/*jshint esversion: 8 */

let app = require("./app");
let dotenv = require("dotenv");
dotenv.config();
let port = process.env.PORT;

app.listen(port, () => {
    console.log("App listening at http://localhost:" + port);
});