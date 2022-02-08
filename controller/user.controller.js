const database = require("../configuration/connection.configuration.js");
const User = require("../model/user.model.js")

exports.create = (req, res) => {
    let user = new User({
        username: req.body.username,
        name: req.body.name,
        email: req.body.email
    });
    user.save(function (err) {
        if (err) {
            return next(err);
        }
        res.send('User created successfully')
    })
};
exports.update = (req, res) => {
  
};
exports.delete = (req, res) => {
  
};

exports.find = (req, res) => {
    res.send("Opengram is up and running!")
}