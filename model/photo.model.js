const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const photosSchema = new Schema({
    album: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Album"
    },
    photoTitle: String,
    photoPath: String,
    photoDescription: String,
    photoThumbnailWidth: Number,
    photoThumbnailHeight: Number,
    creationDate: { type: Date, default: Date.now },
});

