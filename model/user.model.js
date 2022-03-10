const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    about: String,
    albumNumber: { type: Number, default: 1 },
    joined: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);