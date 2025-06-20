
// const mongoose = require('mongoose');

// const paymentSchema = new mongoose.Schema({
//     student: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Student',
//         required: true
//     },
//     admissionNumber: { 
//         type: String,
//         required: true,
//         trim: true
//     },
//     amountPaid: {
//         type: Number,
//         required: true,
//         min: 0.01 
//     },
//     paymentDate: {
//         type: Date,
//         default: Date.now
//     },
//     paymentMethod: {
//         type: String,
//         required: true,
//         enum: ['Bank Transfer', 'M-Pesa', 'In-Kind']
//     },
//     transactionReference: { 
//         type: String,
//         trim: true,
//         sparse: true 
//     },
//     payerName: {
//         type: String,
//         trim: true
//     },
//     inKindItemType: { 
//         type: String,
//         trim: true,
//         required: function() { return this.paymentMethod === 'In-Kind'; } 
//     },
//     inKindQuantity: {
//         type: Number,
//         min: 0.01,
//         required: function() { return this.paymentMethod === 'In-Kind'; } 
//     },
//     notes: { 
//         type: String,
//         trim: true
//     },
// }, {
//     timestamps: true
// });

// paymentSchema.index({ student: 1 });
// paymentSchema.index({ admissionNumber: 1, paymentDate: -1 });

// module.exports = mongoose.model('Payment', paymentSchema);


const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    admissionNumber: {
        type: String,
        required: true,
        trim: true
    },
    amountPaid: {
        type: Number,
        required: true,
        min: 0.01
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Bank Transfer', 'M-Pesa', 'In-Kind', 'Cash'] // Added 'Cash' as a common method
    },
    transactionReference: { // For M-Pesa or Bank Transfer reference
        type: String,
        trim: true,
        sparse: true, // Allows multiple nulls, but unique for non-null values
        required: function() { return this.paymentMethod === 'Bank Transfer' || this.paymentMethod === 'M-Pesa'; }
    },
    payerName: { // Who made the payment (e.g., Parent, Guardian)
        type: String,
        trim: true,
        required: true // Payer name is generally important
    },
    inKindItemType: { // Required if paymentMethod is 'In-Kind'
        type: String,
        trim: true,
        required: function() { return this.paymentMethod === 'In-Kind'; }
    },
    inKindQuantity: { // Required if paymentMethod is 'In-Kind'
        type: Number,
        min: 0.01,
        required: function() { return this.paymentMethod === 'In-Kind'; }
    },
    academicYear: { // <--- Re-added: Crucial for fee structure application
        type: String,
        required: true,
        trim: true,
        default: new Date().getFullYear().toString() // Sensible default
    },
    term: { // <--- Re-added: Crucial for fee structure application
        type: String,
        required: true,
        enum: ['Term 1', 'Term 2', 'Term 3'],
        default: function() { // Sensible default based on current month
            const month = new Date().getMonth();
            if (month >= 0 && month <= 3) return 'Term 1'; // Jan-Apr
            if (month >= 4 && month <= 7) return 'Term 2'; // May-Aug
            if (month >= 8 && month <= 11) return 'Term 3'; // Sep-Dec
            return 'Term 1'; // Fallback
        }
    },
    paymentFor: { // <--- Re-added: Specifies what the payment covers (e.g., "Full Fees", "Tuition", "Uniform")
        type: String,
        trim: true,
        default: 'School Fees'
    },
    notes: {
        type: String,
        trim: true
    },
    recordedBy: { // <--- Re-added: Essential for auditing, who recorded this payment
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Now referencing the 'User' model
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Indexes for efficient querying
paymentSchema.index({ student: 1 });
paymentSchema.index({ admissionNumber: 1, paymentDate: -1 });
paymentSchema.index({ academicYear: 1, term: 1 }); // Useful for reports

module.exports = mongoose.model('Payment', paymentSchema);