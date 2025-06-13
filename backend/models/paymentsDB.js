
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
        enum: ['Bank Transfer', 'M-Pesa', 'In-Kind']
    },
    transactionReference: { 
        type: String,
        trim: true,
        sparse: true 
    },
    payerName: {
        type: String,
        trim: true
    },
    inKindItemType: { 
        type: String,
        trim: true,
        required: function() { return this.paymentMethod === 'In-Kind'; } 
    },
    inKindQuantity: {
        type: Number,
        min: 0.01,
        required: function() { return this.paymentMethod === 'In-Kind'; } 
    },
    notes: { 
        type: String,
        trim: true
    },
}, {
    timestamps: true
});

paymentSchema.index({ student: 1 });
paymentSchema.index({ admissionNumber: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);