const express = require("express");
const router = express.Router();
const multer = require('multer')
var path = require('path')
const fs = require('fs')

const Album = require("../model/album.model.js");
const User = require("../model/user.model.js");
var ObjectId = require('mongoose').Types.ObjectId; 
var albumLocation = "";

const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        var dir = JSON.parse(req.body.albumInfo);
        albumLocation = "E:/Public/Opengram/Albums/" + dir.albumNumber;
        fs.mkdirSync(albumLocation, { recursive: true });
        cb(null, albumLocation);
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
})


const upload = multer({ storage: multerStorage });

router.post("/album/create/", upload.any("photos"), async (req, res) => {
    console.log("[LOG] - Request to upload photos: ", req.body);
    const json = JSON.parse(req.body.albumInfo);

    const newAlbum = Album.create({
        albumName: json.albumName,
        albumDescription: json.albumDescription,
        albumFolder: albumLocation,
        albumOwner: json.userId,
    });

    const user = User.findByIdAndUpdate(
        { _id: json.userId }, { $inc: { albumNumber: 1 } }, { new: true }
    );

    req.session.albumNumber = user.albumNumber;
    res.send(req.session);
    res.status(202).end();
});

router.get("/album", async (req, res) => {
    var mockedOwnerId = "6227f2e8f16889334383f13f";
    const albums = await Album.find({ albumOwner: new ObjectId(mockedOwnerId) });
    res.send(albums);
});

router.post("/album/thumbnail", async (req, res) => {
    const fs = require("fs");
    var files = fs.readdirSync(req.body.albumFolder);
    var chosenFile = files[Math.floor(Math.random() * files.length)];
    var imagePath = `${req.body.albumFolder}/${chosenFile}`;
    res.sendFile(imagePath);
});

module.exports = router;