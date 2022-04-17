const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    profilePhoto: String,
    albumPath: String,
    albumNumber: { type: Number, default: 0},
    photosNumber: { type: Number, default: 0 },
    videosNumber: { type: Number, default: 0 },
    joined: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);