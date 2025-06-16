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
    },
    gradeLevel: {
        type: String,
        required: true,
        trim: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
    },
    boardingStatus: {
        type: String,
        enum: ['Day', 'Boarding'],
        required: true,
    },
    hasTransport: {
        type: Boolean,
        required: true,
        default: false,
    },
    transportRoute: {
        type: String,
        trim: true,
        default: '',
    },
    parentName: {
        type: String,
        required: true,
        trim: true,
    },
    parentPhone: {
        type: String,
        required: true,
        trim: true,
    },
    parentEmail: {
        type: String,
        trim: true,
        default: '',
    },
    parentAddress: {
        type: String,
        trim: true,
        default: '',
    },
    feeDetails: {
        feesPaid: {
            type: Number,
            default: 0 
        },
        remainingBalance: {
            type: Number,
            default: 0 
        },
        // You might consider adding a 'totalFeeExpected' here for better tracking
        // totalFeeExpected: { type: Number, default: 0 }
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);