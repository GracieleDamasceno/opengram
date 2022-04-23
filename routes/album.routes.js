const express = require("express");
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const Album = require("../model/album.model.js");
const User = require("../model/user.model.js");
const path = require('path');
const ObjectId = require('mongoose').Types.ObjectId;
const Jimp = require('jimp');
const thumbnailPercentage = 20;

///
// Multer configurations
///
const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        //TODO: implement albumLocation recovery through user instead of front/album
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
router.post("/photo", upload.any("photos"), async (req, res) => {
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
// Endpoint used to retrieve albums info based on pagination
///
router.get("/album", async (req, res) => {
    //TODO: Adjust pagination
    try {
        var albums;
        if (req.query.pagination === "4") {
            albums = await Album.find({ albumOwner: new ObjectId(req.query.id) })
                .sort('-albumCreation')
                .select('name description thumbnail')
                .limit(req.query.pagination);
        } else if (req.query.pagination === "9") {
            albums = await Album.find({ albumOwner: new ObjectId(req.query.id) })
                .sort('-albumCreation')
                .select('name description thumbnail')
                .skip((req.query.page - 1) * req.query.pagination)
                .limit(req.query.pagination);
        } else {
            albums = await Album.find({ albumOwner: new ObjectId(req.query.id) })
                .select('name description thumbnail');
        }
        res.send(albums);
    } catch (error) {
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

            if (!album) {
                res.status(404).end();
            }

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

///
// Endpoint used to retrieve information of an album
///
router.get("/album/:id", async (req, res) => {
    try {
        const album = await Album.findById(req.params.id);
        res.send(album);
    } catch (error) {
        console.log(error);
        res.status(500).end();
    }
});

///
// Endpoint used to retrieve photos file of a specific album
///
router.get("/photo/file", async (req, res) => {
    try {
        const album = await Album.findById(req.query.albumId);

        if (!album) {
            res.status(404).end();
        }

        const photo = album.photos.id(req.query.photoId);
        const imagePath = `${album.path}/${photo.file}`;

        fs.readFile(imagePath, function (error, data) {
            if (error) {
                throw new Error("Error retrieving photo: " + error);
            }
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data, 'base64');
        });


    } catch (error) {
        console.log(error);
        res.status(500).end();
    }
});

//TODO: Create files to place those functions

async function deleteAllFilesPromise(album) {
    return new Promise((resolve, reject) => {
        try {
            const photos = album.photos;
            photos.map(async (photo) => {
                const imagePath = `${album.path}/${photo.file}`;
                fs.unlink(imagePath, err => {
                    if (err) {
                        throw err;
                    }
                });
            });
            resolve("Photos deleted");
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}

async function deleteFilesPromise(album, photos) {
    return new Promise((resolve, reject) => {
        try {
            photos.map(async (photo) => {
                const photoInfo = album.photos.id(photo.id);
                const imagePath = `${album.path}/${photoInfo.file}`;
                fs.unlink(imagePath, err => {
                    if (err) {
                        throw err;
                    }
                });
            });
            resolve("Photos deleted");
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}

async function deleteAlbumPromise(album) {
    return Album.findByIdAndRemove(album.id);
}

async function deletePhotosPromise(album, photos) {
    return new Promise((resolve, reject) => {
        try {
            photos.map(async (photo) => {
                album.photos.pull(photo.id);
            });
            album.save(function (error) {
                if (error) {
                    throw new Error("Error deleting photos from album " + album._id + ": " + error)
                }
            });
            resolve("Photos deleted");
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}

///
// Endpoint used to delete album and all of its photos
///
router.delete("/album/:id", async (req, res) => {
    console.log("[LOG] - Request to delete album: ", req.params.id);
    try {
        const album = await Album.findById(req.params.id);

        if (!album) {
            res.status(404).end();
        }

        Promise.all([deleteAllFilesPromise(album), deleteAlbumPromise(album)])
            .then(res.status(200).end());

    } catch (error) {
        console.log(error);
        res.status(500).end();
    }

});

///
// Endpoint used to delete photos
///
router.delete("/photo/:id", async (req, res) => {
    console.log("[LOG] - Request to delete photos: ", req.body.photos);
    try {
        const album = await Album.findById(req.params.id);

        if (!album) {
            res.status(404).end();
        }

        const photos = req.body.photos;

        Promise.all([deleteFilesPromise(album, photos), deletePhotosPromise(album, photos)])
            .then(res.status(200).end());

    } catch (error) {
        console.log(error);
        res.status(500).end();
    }

});

module.exports = router;