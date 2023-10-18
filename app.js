require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const Register = require('./userSchem');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require("passport");
const localStrategy		= require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
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
 // Passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await Register.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});


passport.use(new localStrategy(function (email, password, done) {
  Register.findOne({ email: email })
      .then(user => {
          if (!user) {
              return done(null, false, { message: 'Incorrect username.' });
          }

          bcrypt.compare(password, user.password)
              .then(res => {
                  if (res === false) {
                      return done(null, false, { message: 'Incorrect password.' });
                  }
                  return done(null, user);
              })
              .catch(err => {
                  return done(err);
              });
      })
      .catch(err => {
          return done(err);
      });
}));

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


passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:5000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    Register.findOne({ facebookId: profile.id  }).exec()
    .then(user => {
      if (user) {
        return cb(null, user);
      } else {
        // If the user doesn't exist, create a new one here if needed
        // and then return it via cb
         
        const newUser = new Register({ facebookId: profile.id  });
                 return newUser.save().then(newUser => cb(null, newUser));
      }
    })
    .catch(err => {
      return cb(err);
    });
  
  }
));
 
const isAuthenticated = (req, res, next) => {
  // Check if the user is authenticated (e.g., by checking if a user is stored in the session)
  if (req.session && req.session.user) {
      next(); // User is authenticated, proceed to the next middleware/route handler
  } else {
      res.redirect("/login"); // User is not authenticated, redirect to the login page
  }
};

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

  app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
    console.log(`seccussfully created ${_id}`)
  });


app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

// app.get("/secrets", async function (req, res) {
//   if(req.isAuthenticated()){
//     try {
//       // const foundUser = await Register.find();
//       const foundUsers = await Register.find({ "secret": { $ne: null }}).exec();
//       res.render("secrets", { usersWithSecrets: foundUsers });
//   } catch (error) {
//       console.error(error);
//       // Handle the error here, e.g., show an error page or redirect to a different route
//   }
//   }else{
//     res.redirect("/login");
//   }
// }); 


app.get("/secrets", async function (req, res) {
  if (req.isAuthenticated()) {
    try {
      const userWithSecret = await Register.findById(req.user.id).exec();
      if (userWithSecret && userWithSecret.secret) {
        res.render("secrets", { userWithSecrets: userWithSecret });
      } else {
        // Handle the case when the user doesn't have a secret
        res.render("secrets", { userWithSecrets: null });
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    res.redirect("/login");
  }
});




app.get("/submit", function (req, res) {
  if(req.isAuthenticated){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

app.post('/submit', async function (req, res) {
  const submitSecret = req.body.secret;
  try {
    let foundUser = await Register.findById(req.user.id).exec();
    if (foundUser) {
      foundUser.secret = submitSecret;
      foundUser.save()
        .then(() => res.redirect('/secrets'))
        .catch(error => {
          console.log(error);
          res.redirect('/secrets');
        });
    }
  } catch (error) {
    console.log(error);
    res.redirect('/secrets');
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
                res.redirect("/login");
            } catch (error) {
                console.log(error);
            }
        });
    });


   
});

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err); // Handle errors
    }
    if (!user) {
      return res.redirect('/login?error=true'); // Redirect on failed authentication
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err); // Handle errors
      }
      return res.redirect('/secrets'); // Redirect on successful login
    });
  })(req, res, next);
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

