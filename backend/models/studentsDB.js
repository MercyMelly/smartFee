// const mongoose = require('mongoose');

// const studentSchema = new mongoose.Schema({
//     fullName: {
//         type: String,
//         required: true,
//         trim: true,
//     },
//     admissionNumber: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//     },
//     gradeLevel: {
//         type: String,
//         required: true,
//         trim: true,
//     },
//     gender: {
//         type: String,
//         enum: ['Male', 'Female'],
//     },
//     boardingStatus: {
//         type: String,
//         enum: ['Day', 'Boarding'],
//         required: true,
//     },
//     hasTransport: {
//         type: Boolean,
//         required: true,
//         default: false,
//     },
//     transportRoute: {
//         type: String,
//         trim: true,
//         default: '',
//     },
//     parentName: {
//         type: String,
//         required: true,
//         trim: true,
//     },
//     parentPhone: {
//         type: String,
//         required: true,
//         trim: true,
//     },
//     parentEmail: {
//         type: String,
//         trim: true,
//         default: '',
//     },
//     parentAddress: {
//         type: String,
//         trim: true,
//         default: '',
//     },
//     feeDetails: {
//         feesPaid: {
//             type: Number,
//             default: 0 
//         },
//         remainingBalance: {
//             type: Number,
//             default: 0 
//         },
//         // You might consider adding a 'totalFeeExpected' here for better tracking
//         // totalFeeExpected: { type: Number, default: 0 }
//     },
// }, {
//     timestamps: true
// });

// module.exports = mongoose.model('Student', studentSchema);




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
        unique: true, // Ensures unique admission numbers across the single school
        trim: true,
        uppercase: true, // Often admission numbers are uppercase
    },
    gradeLevel: { // Renamed from currentClass
        type: String,
        required: true,
        trim: true,
        index: true, // Add index for query performance
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'], // Added 'Other' for flexibility
        required: true, // Gender should be required
    },
    boardingStatus: {
        type: String,
        enum: ['Day', 'Boarding'],
        required: true,
        index: true, // Add index for query performance
    },
    hasTransport: {
        type: Boolean,
        required: true,
        default: false,
        index: true, // Add index for query performance
    },
    transportRoute: {
        type: String,
        trim: true,
        default: '', // Default to empty string if no transport
        required: function() { return this.hasTransport === true; }, // Required if hasTransport is true
        index: true, // Add index for query performance
    },
    parentName: {
        type: String,
        required: true,
        trim: true,
    },
    parentPhone: { // Renamed from parentPhoneNumber for consistency
        type: String,
        required: true,
        trim: true,
        match: [/^\+?[0-9]{10,15}$/, 'Please use a valid phone number format'] // Basic phone number validation
    },
    parentEmail: {
        type: String,
        trim: true,
        default: '', // Default to empty string if not provided
        lowercase: true,
        match: [/^$|.+@.+\..+/, 'Please use a valid email address if provided'] // Allows empty string or valid email
    },
    parentAddress: {
        type: String,
        trim: true,
        default: '',
    },
    feeDetails: { // Sub-document for fee tracking on the student
        feesPaid: {
            type: Number,
            default: 0,
            min: 0,
            index: true, // Add index for aggregation/query performance
        },
        remainingBalance: {
            type: Number,
            default: 0,
            // min: 0 // Removed min:0 to allow negative values for overpayment, as seen in your logs (-33500)
            index: true, // Add index for aggregation/query performance
        },
        // >>>>> FIX: UNCOMMENT AND DEFINE totalFees HERE <<<<<
        totalFees: { // This will store the total expected fees for the student (based on current fee structure)
            type: Number,
            default: 0,
            min: 0,
            index: true, // Crucial index for the dashboard summary query
        }
    },
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Student', studentSchema);
