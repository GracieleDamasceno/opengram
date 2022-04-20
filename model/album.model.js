const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const photoSchema = new Schema({
    file: String,
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
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    photos: [photoSchema]
});

module.exports = mongoose.model('Photos', photoSchema);
module.exports = mongoose.model('Album', albumSchema);