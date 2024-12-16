const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    
    TrackingID: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },
    
    Address_f: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },

    Address_t: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },

    Cost: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },

    Carrier: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },

    Size: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },

    Weight: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        lowercase: true,
    },

    PriorityStatus: {
        type: String,
        required: false,
        trim: true,
        unique: false,
        lowercase: true,
    },

    PaymentStatus: {
        type: String,
        required: false,
        trim: true,
        unique: false,
        lowercase: true,
    },

    OrderStatus: {
        type: String,
        required: false,
        trim: true,
        unique: false,
        lowercase: true,
    },

    Customer: {
        type: String,
        required: false,
        trim: true,
        unique: false,
        lowercase: true,
    },

    Manager: {
        type: String,
        required: false,
        trim: true,
        unique: false,
        lowercase: true,
    },

    Driver: {
        type: String,
        required: false,
        trim: true,
        unique: false,
        lowercase: true,
    },

    Location: {
        type: String,
        required: false,
        trim: true,
        unique: false,
        lowercase: true,
    },
},
{
timestamp: true,
}

);

module.exports = mongoose.model("Order", orderSchema);