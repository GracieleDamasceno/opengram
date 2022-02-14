const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    fullName: String,
    email: String,
    password: String,
    joined: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);