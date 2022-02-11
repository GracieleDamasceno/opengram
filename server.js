require('dotenv').config()
const mongo = require("./config/database")
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const userRoutes = require("./routes/user.router")

app.use(bodyParser.urlencoded({extended: true}));
app.use(userRoutes);

app.listen(process.env.APPLICATION_PORT  || 8080, () => {
    console.log("[LOG] - Application is running at port ", process.env.APPLICATION_PORT);
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});