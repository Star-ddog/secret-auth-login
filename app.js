require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const Register = require('./userSchem');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require("passport");
const findOrCreate = require('mongoose-find-or-create')

const saltRounds = 10;

const connectDB = require('./db');
connectDB();

const app = express();

const PORT = process.env.PORT || 5000; 


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(require("express-session")({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  
  passport.serializeUser(function(user, cb) {
    cb(null, user.id); // Use user.id for serialization
  });
  
  passport.deserializeUser(function(id, cb) {
    Register.findById(id)
      .then(user => {
        cb(null, user);
      })
      .catch(err => {
        cb(err);
      });
  });
  
  

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    Register.findOne({ googleId: profile.id }).exec()
    .then(user => {
      if (user) {
        return cb(null, user);
      } else {
        // If the user doesn't exist, create a new one here if needed
        // and then return it via cb
         
        const newUser = new Register({ googleId: profile.id });
                 return newUser.save().then(newUser => cb(null, newUser));
      }
    })
    .catch(err => {
      return cb(err);
    });
  
  }
));

app.get("/", function(req, res) {
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
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

        bcrypt.compare(password, foundItem.password).then(function(result) {
    if (result === true) {
        res.render('secrets');
    } else {
        res.send("Invalid username or password");
  }
});


        } else {
            res.send("Invalid username or password"); 
        }
    } catch (error) {
        console.log(error);
    }
});

app.get("/logout", function (req, res) {
    req.logout(function(err) {
        if (err) {
            // Handle any errors that occur during logout
            console.error(err);
        }
        res.redirect("/");
    });
});


app.listen(PORT, function() {
    console.log(`Server started on port ${PORT}`);
});
