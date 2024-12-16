const mongoose = require('mongoose');

const useraccessSchema = new mongoose.Schema({
    
    userType: {
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

},
{
timestamp: true,
}

);

module.exports = mongoose.model("Useraccess", useraccessSchema);