const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.listen(8080, () => {
    console.log("IT IS ON!");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/account/join", (req, res) => {
    console.log(req.body)
    res.send(req.body)
});