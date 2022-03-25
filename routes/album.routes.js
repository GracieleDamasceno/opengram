const express = require("express");
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
var path = require('path');
var FormData = require('form-data');

const Album = require("../model/album.model.js");
const User = require("../model/user.model.js");
var ObjectId = require('mongoose').Types.ObjectId;

const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        var dir = JSON.parse(req.body.albumInfo);
        console.log(dir.albumLocation)
        fs.mkdirSync(dir.albumLocation, { recursive: true });
        cb(null, dir.albumLocation);
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
})


const upload = multer({ storage: multerStorage });

router.post("/album/create/", upload.single("photos"), async (req, res) => {
    console.log("[LOG] - Request to create album: ", req.body.albumInfo);
    const json = JSON.parse(req.body.albumInfo);

    const newAlbum = Album.create({
        albumName: json.albumName,
        albumDescription: json.albumDescription,
        albumFolder: json.albumLocation,
        albumThumbnail: req.file.filename,
        albumOwner: json.userId,
    });

    const user = await User.findByIdAndUpdate({ _id: json.userId }, { $inc: { albumNumber: 1 } }, { new: true });

    req.session.albumNumber = user.albumNumber;
    res.send(req.session);
    res.status(202).end();
});

router.post("/album", upload.any("photos"), async (req, res) => {
    console.log("[LOG] - Request to upload photos: ", req.body.albumInfo);
    res.status(202).end();
});


router.get("/album", async (req, res) => {
    var albums;
    if(req.query.pagination === "4"){
        albums = await Album.find({ albumOwner: new ObjectId(req.query.id) })
        .sort('-albumCreation')
        .limit(req.query.pagination);
    } else if(req.query.pagination === "9"){
        albums = await Album.find({ albumOwner: new ObjectId(req.query.id) })
        .sort('-albumCreation')
        .skip((req.query.page - 1) * req.query.pagination)
        .limit(req.query.pagination);
    } else {
        albums = await Album.find({ albumOwner: new ObjectId(req.query.id) });
    }
    res.send(albums);
});

router.get("/album/thumbnail", async (req, res) => {
    const fs = require("fs");
    var files = fs.readdirSync(req.query.albumFolder);
    var chosenFile = files[Math.floor(Math.random() * files.length)];
    var imagePath = `${req.query.albumFolder}/${chosenFile}`;

    var image = await sharp(imagePath)
        .resize({
            fit: sharp.fit.fill,
            width: 800,
            height: 450 
        })
        .toFormat('jpeg')
        .sharpen()
        .toBuffer();

    res.writeHead(200, {'Content-Type': 'image/jpeg'});
    res.end(image, 'base64');
});


router.get("/album/:id", async (req, res) => {
    var albums = await Album.findById(req.params.id);
    res.send(albums);
});

module.exports = router;