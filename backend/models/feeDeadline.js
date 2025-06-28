const mongoose = require('mongoose');

const feeDeadlineSchema = new mongoose.Schema({
    academicYear: {
        type: String,
        required: true,
        trim: true,
    },
    term: {
        type: String,
        enum: ['Term 1', 'Term 2', 'Term 3'], // Or dynamically fetch terms if they change
        required: true,
    },
    deadlineDate: {
        type: Date,
        required: true,
    },
    notes: {
        type: String,
        trim: true,
        default: '',
    },
    // You could also add gradeLevel here if deadlines vary by grade
    // gradeLevel: { type: String, trim: true },
}, {
    timestamps: true
});

// Ensure unique deadlines per term and academic year
feeDeadlineSchema.index({ academicYear: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('FeeDeadline', feeDeadlineSchema);
