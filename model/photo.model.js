const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const photosSchema = new Schema({
    album: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Album"
    },
    photoName: String,
    photoDescription: String,
    photoUpload: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Photo', photosSchema);