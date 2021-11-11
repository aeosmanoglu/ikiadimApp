/*jshint esversion: 6 */

const app = require("./app");
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT;

// Start the server
app.listen(port, () => {
    console.log("App listening at http://localhost:" + port);
});
