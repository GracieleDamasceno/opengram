const express = require("express");
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const Album = require("../model/album.model.js");
const User = require("../model/user.model.js");
var path = require('path');
var ObjectId = require('mongoose').Types.ObjectId;
var Jimp = require('jimp');
const thumbnailPercentage = 20;

///
// Multer configurations
///
const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        var request = JSON.parse(req.body.albumInfo);
        fs.mkdirSync(request.albumLocation, { recursive: true });
        cb(null, request.albumLocation);
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage: multerStorage });

///
// Endpoint used to create an album and upload its thumbnail
///
router.post("/album/create/", upload.single("photos"), async (req, res) => {
    console.log("[LOG] - Request to create album: ", req.body.albumInfo);
    try {
        const request = JSON.parse(req.body.albumInfo);
        const image = await Jimp.read(`${req.file.destination}/${req.file.filename}`);

        const albumThumbnail = {
            file: req.file.filename,
            thumbnailWidth: Math.round(image.bitmap.width * thumbnailPercentage / 100),
            thumbnailHeight: Math.round(image.bitmap.height * thumbnailPercentage / 100)
        };

        const album = new Album({
            name: request.albumName,
            description: request.albumDescription,
            path: req.file.destination,
            owner: request.userId,
            thumbnail: req.file.filename,
            photos: [albumThumbnail]
        });

        await album.save(function (error) {
            if (error) {
                throw new Error("Error saving album " + request.albumName + ": " + error)
            }
        });

        const user = await User.findByIdAndUpdate({ _id: new ObjectId(request.userId) }, { $inc: { albumNumber: 1 } }, { new: true });
        req.session.albumNumber = user.albumNumber;
        res.send(req.session);
        res.status(202).end();
    } catch (error) {
        //TODO: Add rollback system in cases that an error occurs
        console.error(error);
        res.status(500).end();
    }
});


///
// Endpoint used to upload photos into a specific album
///
router.post("/photos", upload.any("photos"), async (req, res) => {
    console.log("[LOG] - Request to upload photos: ", req.body.albumInfo);
    try {
        const request = JSON.parse(req.body.albumInfo);
        const photosToUpload = req.files;

        await Promise.all(photosToUpload.map(async (file) => {
            var image = await Jimp.read(`${file.destination}/${file.filename}`);

            var photo = {
                file: file.filename,
                thumbnailWidth: Math.round(image.bitmap.width * thumbnailPercentage / 100),
                thumbnailHeight: Math.round(image.bitmap.height * thumbnailPercentage / 100)
            };

            var album = await Album.findById(request.id);
            album.photos.push(photo);
            album.save(function (error) {
                if (error) {
                    throw new Error("Error uploading photo into album " + request.albumName + ": " + error)
                }
            });
        }));

        res.status(202).end();
    } catch (error) {
        //TODO: Add rollback system in cases that an error occurs
        console.error(error);
        res.status(500).end();
    }
});

///
// Endpoint used to retrieve albums based on pagination
///
router.get("/album", async (req, res) => {
    try {
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
    } catch (error) {
        //TODO: Add rollback system in cases that an error occurs
        console.error(error);
        res.status(500).end();
    }
});

///
// Endpoint used to retrieve albums thumbnails
///
router.get("/album/thumbnail", async (req, res) => {
    try {
        if (!req.query.photoId) {
            const album = await Album.findOne({ _id: new ObjectId(req.query.albumId) });
            var imagePath = `${album.path}/${album.thumbnail}`;

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
                .toBuffer();

            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(image, 'base64');

        } else if (req.query.photoId && req.query.albumId) {
            const album = await Album.findOne({ _id: new ObjectId(req.query.albumId) });
            const photo = album.photos.id(req.query.photoId);

            const thumbnailHeight = photo.thumbnailHeight;
            const thumbnailWidth = photo.thumbnailWidth;
            var imagePath = `${album.path}/${photo.file}`;

            var image = await sharp(imagePath)
                .rotate()
                .resize(thumbnailWidth, thumbnailHeight)
                .sharpen()
                .toBuffer();

            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(image, 'base64');
        }

    } catch (error) {
        console.log(error);
        res.status(500).end();
    }

});

/** 
 * MAJOR REFACTORING HAPPENING ABOVE! FUNCTIONS TEMPORARILY COMMENTED
**/

// ///
// // Endpoint used to retrieve photos info of a specific album
// ///
// router.get("/photos", async (req, res) => {
//     //console.log("[LOG] - Request to load photos: ", req.query.albumFolder, " ", req.query.id);
//     const photosList = await Photo.find({ album: new ObjectId(req.query.id) });
//     res.send(photosList);
// });


// ///
// // Endpoint used to retrieve photos file of a specific album
// ///
// router.get("/photos/file", async (req, res) => {
//     //console.log("[LOG] - Request to load photos files: ", req.query.path);
//     const fs = require("fs");

//     fs.readFile(req.query.path, function (err, data) {
//         if (err) {
//             res.status(500).end();
//         }
//         res.writeHead(200, { 'Content-Type': 'image/jpeg' });
//         res.end(data, 'base64');
//     });
// });

// ///
// // Endpoint used to retrieve information of an album
// ///
// router.get("/album/:id", async (req, res) => {
//     var albums = await Album.findById(req.params.id);
//     res.send(albums);
// });

// ///
// // Endpoint used to delete album and all of its photos
// ///
// router.delete("/album/:id", async (req, res) => {
//     console.log("[LOG] - Request to delete album: ", req.params.id);
//     const album = await Album.findById(req.params.id);
//     const fs = require("fs");

//     fs.rmdir(album.albumFolder, { recursive: true }, (errorDeletingFolder) => {
//         if (errorDeletingFolder) {
//             console.log("Error while deleting folder: " + errorDeletingFolder)
//             res.status(500).end();
//         }
//     });

//     const albumPromise = await Album.findByIdAndRemove(album.id);
//     if (albumPromise) {
//         const photoPromise = await Photo.deleteMany({ album: new ObjectId(album.id) })
//         if (!photoPromise) {
//             console.log("Error while deleting album: " + errorDeletingAlbum)
//             res.status(500).end();
//         }
//     } else {
//         console.log("Error while deleting album: " + errorDeletingAlbum)
//         res.status(500).end();
//     }
//     res.status(200).end();

// });

// ///
// // Endpoint used to delete photos
// ///
// router.delete("/photo/", async (req, res) => {
//     console.log("[LOG] - Request to delete photo: ", req.body.photoList);
//     const photoList = JSON.parse(req.body.photosList);

//     await Promise.all(photoList.map(async (photo) => {
//         const photoInfo = Photo.findOne(photo.id);
//         fs.unlink(photoInfo.photoPath, (errorDeletingPhoto) => {
//             if (errorDeletingPhoto) {
//                 console.log("Error while deleting photo: " + errorDeletingPhoto)
//                 res.status(500).end();
//             }
//             const photoPromise = Photo.findByIdAndRemove(photo._id);
//             if (!photoPromise) {
//                 console.log("Error while deleting photo")
//                 res.status(500).end();
//             }
//         });
//     }));
//     res.status(200).end();

// });

module.exports = router;