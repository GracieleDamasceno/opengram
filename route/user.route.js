module.exports = app =>{
    const userController = require('../controller/user.controller.js');
    var router = require("express").Router();

    router.post("/create", userController.create);
    router.get("/", userController.find);
};