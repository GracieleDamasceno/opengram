const express = require("express");
const router = express.Router();

const User = require("../model/user.model.js");

router.post("/account/join", (req, res) => {
    console.log("[LOG] - Request to create a new user: ", req.body)
    const user = new User({
        username: req.body.username,
        fullName: req.body.fullName,
        email: req.body.email,
        password: req.body.password
    });

    user.save()
        .then(result => {
            res.status(202).json(result);
        })
        .catch(error => {
            res.status(500).json(error);
        });
});

module.exports = router;