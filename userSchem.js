require('dotenv').config();
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");

const Schema = mongoose.Schema;
const RegisterSchema = new Schema({

  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  }
});

// encryption.....

//  RegisterSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

module.exports = mongoose.model('Register', RegisterSchema);
