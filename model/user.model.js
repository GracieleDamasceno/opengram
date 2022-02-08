const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserSchema = new Schema ({
    username: {type: String, required: true, max:30},
    name: {type: String, required: true, max: 100},
    email: {type:String, required: true}
},
{
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);