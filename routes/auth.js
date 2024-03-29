const router = require('express').Router();
const User = require('../models/User');
const {registerValidation, loginValidation} = require('../validation');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');

// create a new user
router.post('/register', async (req, res) => {
    // validation data
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // check the email is already exist in DB
    const emailExist = await User.findOne({email: req.body.email});
    if(emailExist) return res.status(400).send('Email already exists');

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword
    });

    try{
        const savedUser = await user.save();
        res.status(201).send({user: user._id});
    }catch(err){
        res.status(400).send(err);
    }
});

// login
router.post('/login', async (req, res) => {
    // validation data
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // check the email is exist in DB
    const user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).send('Email is not found');

    // check the password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('Invalid password');

    // create and assign a token
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send(token);

    // res.send('Logged in!');
});

module.exports = router;