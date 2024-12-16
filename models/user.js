const mongoose = require('mongoose');
const uuidv1 = require('uuidv1');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    
    userType: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },
    
    username: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },
    hashedPassword: {
        type: String,
        require: true,
    },
    resetToken: String,
    expireToken: Date,
    
    otp : {
        type : String,
    },
    expireotp :{
        type : Date,
    },
    salt: String,
},
{
timestamp: true,
}

);

// virtual field
userSchema.virtual("password").set(function (password){
    // create temp variable called _password
    this._password = password;

    // generate a timstamp, uuidv1 gives us the timestamp
    this.salt = uuidv1();

    // encrypt the passowrd function call
    this.hashedPassword = this.encryptPassword(password);

});

// methods
userSchema.methods = {
    encryptPassword: function (password) {
        if (!password) return "";

        try {
            return crypto.createHmac("sha256", this.salt).update(password).digest("hex");
        } catch(err){
            return "";
        }
    },
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashedPassword;
    },
}

module.exports = mongoose.model("User", userSchema);

