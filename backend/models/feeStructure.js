const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    gradeLevel: { type: String, required: true, index: true }, // Added index
    boardingStatus: { type: String, required: true, enum: ['Day', 'Boarding'], index: true }, // Added index
    hasTransport: { type: Boolean, required: true, index: true }, // Added index
    transportRoutes: {
        type: Map,
        of: Number,
        default: {}
    },
    termlyComponents: [{
        name: { type: String, required: true },
        amount: { type: Number, required: true }
    }],
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    totalCalculated: { // This field should hold the sum of all fixed components
        type: Number,
        required: true,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound unique index to ensure only one fee structure per combination
feeStructureSchema.index({ gradeLevel: 1, boardingStatus: 1, hasTransport: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema, 'feeStructure');
