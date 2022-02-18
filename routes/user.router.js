const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../model/user.model.js");

var session;

router.post("/account/join", async (req, res) => {
    console.log("[LOG] - Request to create a new user: ", req.body)
    try{
        const user = await User.findOne({email:req.body.email});
        if(!user){
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const insertUser = await User.create({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword
            
            });
            res.status(202).send(insertUser);
        }else{
            res.status(409).json({error:"E-mail address already registered"});
        }
       
    } catch(error){
        console.log("[LOG] - Error creating a new user: ", error);
        res.status(500).json(error);
    }
});

router.post("/account/sign-in", async (req, res) =>{
    console.log("[LOG] - Request to log-in user: ", req.body.email)
    try{
        console.log(req.body)
        const user = await User.findOne({email:req.body.email});
        if(user){
            const comparison = await bcrypt.compare(req.body.password, user.password);
            if(comparison){
                console.log(req.session);
                session = req.session;
                session.email = req.body.email;
                res.status(200).json({message:"Successfully in!"});
            }else{
                res.status(401).json({error:"Wrong password or e-mail address"});
            }
        }else{
            res.status(401).json({error:"Wrong password or e-mail address"});
        }
    }catch(error){
        console.log("[LOG] - Error at log-in: ", error);
        res.status(500).json(error);
    }
});

router.post("/account/logout", async (req, res) =>{
    req.session.destroy();
    res.redirect("/");
});
module.exports = router;