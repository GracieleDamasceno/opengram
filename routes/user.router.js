const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const User = require("../model/user.model.js");

router.post("/account/join", async (req, res) => {
    console.log("[LOG] - Request to create a new user: ", req.body)
    try {
        //TODO: Remove e-mail address and promote login by username
        const userEmail = await User.findOne({ email: req.body.email });
        const userUsername = await User.findOne({ username: req.body.username });
        if (!userEmail && !userUsername) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const insertUser = await User.create({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword,
            });

            const userAlbum = path.join(__dirname, '..', "/files/albums/" + insertUser._id);
            fs.mkdir(userAlbum, { recursive: true }, function (error) {
                if (error) {
                    console.log('Error while creating folder', error);
                    res.send(500);
                }
            });

            await User.findByIdAndUpdate(insertUser._id, { albumPath: userAlbum });
            res.statusMessage = "User successfully created";
            res.status(202).end();
        } else {
            if (userEmail) {
                res.status(409).send({ error: "E-mail address already registered." });
            } else if (userUsername) {
                res.status(409).send({ error: "Username address already registered." });
            }
        }

    } catch (error) {
        //TODO: Implement rollback and improve creation flow
        console.log("[LOG] - Error creating a new user: ", error);
        res.status(500).json(error);
    }
});

router.post("/account/sign-in", async (req, res) => {
    console.log("[LOG] - Request to log-in user: ", req.body.email)
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            const comparison = await bcrypt.compare(req.body.password, user.password);
            if (comparison) {
                req.session.userId = user._id.toString();
                req.session.username = user.username;
                req.session.email = user.email;
                req.session.firstName = user.firstName;
                req.session.lastName = user.lastName;
                req.session.albumsNumber = user.albumsNumber;
                req.session.photosNumber = user.photosNumber;
                req.session.videosNumber = user.videosNumber;
                res.send(req.session);
            } else {
                res.statusMessage = "Wrong password or e-mail address";
                res.status(401).end();
            }
        } else {
            res.statusMessage = "Wrong password or e-mail address";
            res.status(401).end();
        }
    } catch (error) {
        console.log("[LOG] - Error at log-in: ", error);
        res.statusMessage = "Error while logging in: " + error;
        res.status(500).end();
    }
});

//TODO: add possibility of change password
router.patch("/profile/update", async (req, res) => {
    try {
        console.log("[LOG] - Updating profile of: ", req.body.email)

        const updateUser = await User.findByIdAndUpdate(req.body.id, { $set: req.body }, { new: true });
        req.session.username = updateUser.username;
        req.session.email = updateUser.email;
        req.session.firstName = updateUser.firstName;
        req.session.lastName = updateUser.lastName;
        res.send(req.session);
    } catch (error) {
        console.log("[LOG] - Error while updating profile: ", error);
        res.statusMessage = "Error while updating profile: " + error;
        res.status(500).end();
    }

})
module.exports = router;