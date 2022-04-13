const express = require("express");
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const Album = require("../model/album.model.js");
const Photo = require("../model/photo.model.js");
const User = require("../model/user.model.js");
var path = require('path');
var ObjectId = require('mongoose').Types.ObjectId;
var Jimp = require('jimp');
const { rejects } = require("assert");
const thumbnailPercentage = 20;

const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        var dir = JSON.parse(req.body.albumInfo);
        fs.mkdirSync(dir.albumLocation, { recursive: true });
        cb(null, dir.albumLocation);
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
})

const upload = multer({ storage: multerStorage });

///
// Endpoint used to create an album and upload its thumbnail
///
router.post("/album/create/", upload.single("photos"), async (req, res) => {
    console.log("[LOG] - Request to create album: ", req.body.albumInfo);
    const json = JSON.parse(req.body.albumInfo);
    var image = await Jimp.read(`${json.albumLocation}/${req.file.filename}`);
    const newAlbum = new Album({
        albumName: json.albumName,
        albumDescription: json.albumDescription,
        albumFolder: json.albumLocation,
        albumThumbnail: `${json.albumLocation}/${req.file.filename}`,
        albumThumbnailWidth: Math.round(image.bitmap.width * thumbnailPercentage / 100),
        albumThumbnailHeight: Math.round(image.bitmap.height * thumbnailPercentage / 100),
        albumOwner: json.userId,
    });

    await newAlbum.save(function (err) {
        if (err) {
            console.log(err)
            res.status(500).end();
        }
    });

    try {
        const user = await User.findByIdAndUpdate({ _id: new ObjectId(json.userId) }, { $inc: { albumNumber: 1 } }, { new: true });
        req.session.albumNumber = user.albumNumber;
        res.send(req.session);
        res.status(202).end();
    } catch (error) {
        console.log(err)
        res.status(500).end();
    }
});

///
// Endpoint used to upload photos into a specific album
///
router.post("/photos", upload.any("photos"), async (req, res) => {
    console.log("[LOG] - Request to upload photos: ", req.body.albumInfo);
    const json = JSON.parse(req.body.albumInfo);
    const uploadedFiles = req.files;

    await Promise.all(uploadedFiles.map(async (file) => {
        var image = await Jimp.read(`${file.destination}/${file.filename}`);
        const photos = new Photo({
            album: json.id,
            photoPath: `${file.destination}/${file.filename}`,
            photoThumbnailWidth: Math.round(image.bitmap.width * thumbnailPercentage / 100),
            photoThumbnailHeight: Math.round(image.bitmap.height * thumbnailPercentage / 100),
        });
        photos.save(function (err) {
            if (err) {
                res.status(500).end();
            }
            res.status(202).end();
        });
    }));
});

///
// Endpoint used to retrieve albums based on pagination
///
router.get("/album", async (req, res) => {
    var albums;
    if (req.query.pagination === "4") {
        albums = await Album.find({ albumOwner: new ObjectId(req.query.id) })
            .sort('-albumCreation')
            .limit(req.query.pagination);
    } else if (req.query.pagination === "9") {
        albums = await Album.find({ albumOwner: new ObjectId(req.query.id) })
            .sort('-albumCreation')
            .skip((req.query.page - 1) * req.query.pagination)
            .limit(req.query.pagination);
    } else {
        albums = await Album.find({ albumOwner: new ObjectId(req.query.id) });
    }
    res.send(albums);
});

///
// Endpoint used to retrieve albums thumbnails
///
router.get("/album/thumbnail", async (req, res) => {
    var imagePath = "";
    var thumbnailWidth;
    var thumbnailHeight;
    var image;

    try {
        if (req.query.albumThumbnail) {
            const id = req.query.albumThumbnail;
            const album = await Album.findOne({ _id: new ObjectId(id) });
            imagePath = album.albumThumbnail;
            thumbnailHeight = album.albumThumbnailHeight;
            thumbnailWidth = album.albumThumbnailWidth;

            var image = await sharp(imagePath)
                .rotate()
                .resize({
                    fit: sharp.fit.cover,
                    position: sharp.position.top,
                    width: 800,
                    height: 450
                })
                //.resize(thumbnailWidth, thumbnailHeight)
                .sharpen()
                .toBuffer()

        } else if (req.query.photoThumbnail) {
            const id = req.query.photoThumbnail;
            const photo = await Photo.findOne({ _id: new ObjectId(id) });
            thumbnailHeight = photo.photoThumbnailHeight;
            thumbnailWidth = photo.photoThumbnailWidth;
            imagePath = `${photo.photoPath}`;

            var image = await sharp(imagePath)
                .rotate()
                .resize(thumbnailWidth, thumbnailHeight)
                .sharpen()
                .toBuffer()
        }

        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(image, 'base64');
    } catch (error) {
        console.log(error);
        res.status(500).end();
    }

});

///
// Endpoint used to retrieve photos info of a specific album
///
router.get("/photos", async (req, res) => {
    //console.log("[LOG] - Request to load photos: ", req.query.albumFolder, " ", req.query.id);
    const photosList = await Photo.find({ album: new ObjectId(req.query.id) });
    res.send(photosList);
});


///
// Endpoint used to retrieve photos file of a specific album
///
router.get("/photos/file", async (req, res) => {
    //console.log("[LOG] - Request to load photos files: ", req.query.path);
    const fs = require("fs");

    fs.readFile(req.query.path, function (err, data) {
        if (err) {
            res.status(500).end();
        }
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data, 'base64');
    });
});

///
// Endpoint used to retrieve information of an album
///
router.get("/album/:id", async (req, res) => {
    var albums = await Album.findById(req.params.id);
    res.send(albums);
});

///
// Endpoint used to delete album and all of its photos
///
router.delete("/album/:id", async (req, res) => {
    console.log("[LOG] - Request to delete album: ", req.params.id);
    const album = await Album.findById(req.params.id);
    const fs = require("fs");

    fs.rmdir(album.albumFolder, { recursive: true }, (errorDeletingFolder) => {
        if (errorDeletingFolder) {
            console.log("Error while deleting folder: " + errorDeletingFolder)
            res.status(500).end();
        }
    });

    const albumPromise = await Album.findByIdAndRemove(album.id);
    if (albumPromise) {
        const photoPromise = await Photo.deleteMany({ album: new ObjectId(album.id) })
        if (!photoPromise) {
            console.log("Error while deleting album: " + errorDeletingAlbum)
            res.status(500).end();
        }
    } else {
        console.log("Error while deleting album: " + errorDeletingAlbum)
        res.status(500).end();
    }
    res.status(200).end();

});

module.exports = router;