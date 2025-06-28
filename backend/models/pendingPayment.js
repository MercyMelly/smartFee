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


// // backend/models/pendingPayment.js
// const mongoose = require('mongoose');

// const PendingPaymentSchema = new mongoose.Schema({
//     gatewayTransactionId: { // Paystack reference or similar unique ID from gateway
//         type: String,
//         required: true,
//         unique: true,
//         index: true
//     },
//     amount: {
//         type: Number,
//         required: true
//     },
//     currency: {
//         type: String,
//         default: 'KES' // or 'GHS' or whatever your primary currency is
//     },
//     paymentMethod: {
//         type: String, // e.g., 'Paystack Online', 'M-Pesa Webhook', 'Bank Transfer (manual match)'
//         required: true
//     },
//     paymentDate: {
//         type: Date,
//         default: Date.now
//     },
//     payerEmail: {
//         type: String,
//         trim: true,
//         lowercase: true,
//         match: [/.+@.+\..+/, 'Please use a valid email address'],
//         required: false // May not always be available or reliable
//     },
//     payerPhone: {
//         type: String,
//         trim: true,
//         required: false // May not always be available or reliable
//     },
//     payerName: {
//         type: String,
//         trim: true,
//         required: false
//     },
//     status: {
//         type: String,
//         enum: ['pending_review', 'linked', 'processed', 'ignored'], // 'pending_review' initially, then 'linked' after bursar links, 'processed' after confirmation
//         default: 'pending_review'
//     },
//     // Reference to the Student document, null if not yet linked
//     student: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Student',
//         default: null
//     },
//     // Store original metadata from webhook for debugging/review
//     rawWebhookData: {
//         type: mongoose.Schema.Types.Mixed,
//         required: false
//     },
//     notes: {
//         type: String,
//         trim: true
//     }
// }, {
//     timestamps: true // Adds createdAt and updatedAt
// });

// module.exports = mongoose.model('PendingPayment', PendingPaymentSchema);
