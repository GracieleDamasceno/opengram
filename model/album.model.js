const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const albumSchema = new Schema({
    albumName: String,
    albumCreation: { type: Date, default: Date.now },
    albumDescription: String,
    albumFolder: String,
    albumThumbnail: String,
    albumOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    photos: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photo",
    }
});

module.exports = mongoose.model('Album', albumSchema);