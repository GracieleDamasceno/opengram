require('dotenv').config()
const mongo = require("./config/database")
const express = require("express");
const app = express();
const userRoutes = require("./routes/user.router")
const oneDay = 1000 * 60 * 60 * 24;
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(userRoutes);
app.use(cookieParser());
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

app.listen(process.env.APPLICATION_PORT  || 8080, () => {
    console.log("[LOG] - Application is running at port ", process.env.APPLICATION_PORT);
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");

});