const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    admissionNumber: {
        type: String,
        required: true,
        unique: true, 
        trim: true,
        uppercase: true,
    },
    gradeLevel: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true,
    },
    boardingStatus: {
        type: String,
        enum: ['Day', 'Boarding'],
        required: true,
        index: true,
    },
    hasTransport: {
        type: Boolean,
        required: true,
        default: false,
        index: true,
    },
    transportRoute: {
        type: String,
        trim: true,
        default: '',
        required: function() { return this.hasTransport === true; },
        index: true,
    },
    parent: {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: { 
            type: String,
            required: true, 
            trim: true,
            match: [/^\+254\d{9}$/, 'Please use a valid Kenyan phone number starting with +254 followed by 9 digits (e.g., +254712345678)']
        },
        email: {
            type: String,
            trim: true,
            default: '',
            lowercase: true,
            match: [/^$|.+@.+\..+/, 'Please use a valid email address if provided']
        },
        address: {
            type: String,
            trim: true,
            default: '',
        },
    },
    feeDetails: {
        feesPaid: {
            type: Number,
            default: 0,
            min: 0,
            index: true,
        },
        remainingBalance: {
            type: Number,
            default: 0,
            index: true,
        },
        totalFees: {
            type: Number,
            default: 0,
            min: 0,
            index: true,
        }
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Student', studentSchema);
