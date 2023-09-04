require('dotenv').config();
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");
const findOrCreate = require('mongoose-find-or-create')

const Schema = mongoose.Schema;
const RegisterSchema = new Schema({

  email: {
    type: String,
  
  },
  password: {
    type: String,
   
  }
});

RegisterSchema.plugin(findOrCreate)
// encryption.....

//  RegisterSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

module.exports = mongoose.model('Register', RegisterSchema);
