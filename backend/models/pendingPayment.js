const mongoose = require('mongoose');

const PendingPaymentSchema = new mongoose.Schema({
    gatewayTransactionId: { // Paystack transaction reference
        type: String,
        required: true,
        unique: true
    },
    student: { // To link to your Student model's _id
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: false // Can be false if student lookup fails initially
    },
    admissionNumberUsed: { // The account number entered by the parent (student ID)
        type: String,
        required: false, // It might be empty or invalid
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'KES'
    },
    paymentMethod: { // M-Pesa (from Paystack webhook)
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'failed'],
        default: 'pending' // Default status, awaiting bursar confirmation
    },
    payerDetails: { // Details from Paystack webhook
        email: String,
        phone: String,
        name: String // If available
    },
    paidAt: { // Timestamp from Paystack
        type: Date,
        default: Date.now
    },
    // Optional: store full webhook data for debugging
    paystackMetadata: {
        type: Object
    },
    // Who confirmed it (if confirmed)
    confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Assuming your bursar users are in a 'User' model
    },
    confirmedAt: {
        type: Date
    },
    notes: { // Bursar can add notes during confirmation
        type: String
    }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = mongoose.model('PendingPayment', PendingPaymentSchema);