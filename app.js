require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const Register = require('./userSchem');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const connectDB = require('./db');
connectDB();

const app = express();

const PORT = process.env.PORT || 5000; 





app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.post('/register', async (req, res) => {
    
    const email = req.body.username;
    const password =req.body.password;


    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password, salt, async function(err, hash) {

            
            const newUser = new Register({
                email: email,
                password: hash
            });

            try {
                await newUser.save();
                console.log("User successfully created");
                res.render("secrets");
            } catch (error) {
                console.log(error);
            }
        });
    });


   
});

app.post('/login', async function (req, res) {

    
    const username = req.body.username;
    const password = req.body.password;

    try {
        const foundItem = await Register.findOne({ email: username }); 

        if (foundItem && foundItem.password === password) { 

            bcrypt.compare(foundItem.password, hash).then(function(result) {
               if ( result === true){
                res.render('secrets');
               }
            });

        } else {
            res.send("Invalid username or password"); 
        }
    } catch (error) {
        console.log(error);
    }
});

app.listen(PORT, function() {
    console.log(`Server started on port ${PORT}`);
});
