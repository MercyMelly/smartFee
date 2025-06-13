// studentsDB.js (Updated Schema)

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
    // --- CRITICAL ADDITION: The feeDetails sub-document ---
    feeDetails: {
        feesPaid: {
            type: Number,
            default: 0 // Ensures 'feesPaid' is always a number, defaults to 0
        },
        remainingBalance: {
            type: Number,
            default: 0 // Ensures 'remainingBalance' is always a number, defaults to 0
        },
        // You might consider adding a 'totalFeeExpected' here for better tracking
        // totalFeeExpected: { type: Number, default: 0 }
    },
    // --- You had 'totalFees' and 'balance' at the top level.
    // If 'feeDetails.remainingBalance' is now your primary balance,
    // you might remove the top-level 'balance' to avoid redundancy and potential confusion.
    // However, if your aggregations still rely on a top-level 'balance',
    // ensure you update both, or update your aggregations to use 'feeDetails.remainingBalance'.
    // For simplicity, I'm assuming 'feeDetails.remainingBalance' replaces the top-level 'balance'.
    // If you need 'totalFees' for anything else, keep it.
}, {
    timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);