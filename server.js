require('dotenv').config()
const mongo = require("./config/database")
const express = require("express");
var cors = require('cors');
const app = express();
const userRoutes = require("./routes/user.router")
const albumRoutes = require("./routes/album.routes.js")
const oneDay = 1000 * 60 * 60 * 24;
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
var corsOptions = {
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(sessions({
    name: "session",
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}));

app.use(userRoutes);
app.use(albumRoutes);

app.use((error, req, res, next) => {
    console.log("[ERROR] - Something wrong happened: " + error);
    res.sendStatus(500);
});

app.listen(process.env.APPLICATION_PORT || 8080, () => {
    console.log("[LOG] - Application is running at port ", process.env.APPLICATION_PORT);
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");

});