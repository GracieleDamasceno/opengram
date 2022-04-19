const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const photoSchema = new Schema({
    title: String,
    description: String,
    creationDate: { type: Date, default: Date.now },
    thumbnailWidth: Number,
    thumbnailHeight: Number
});


const albumSchema = new Schema({
    name: String,
    creationDate: { type: Date, default: Date.now },
    description: String,
    path: String,
    thumbnail: String,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    photos: [photoSchema]
});

module.exports = mongoose.model('Photo', photoSchema);
module.exports = mongoose.model('Album', albumSchema);