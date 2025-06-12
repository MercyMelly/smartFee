// // const mongoose = require('mongoose');

// // const feeStructureSchema = new mongoose.Schema({
// //   tuition: { type: Number, default: 0 },
// //   boarding: { type: Number, default: 0 },
// //   transport: { type: Number, default: 0 },
// //   dayScholar: { type: Boolean, default: true }, 
// // });

// // const studentSchema = new mongoose.Schema({
// //   fullName: { type: String, required: true },
// //   admissionNumber: { type: String, required: true, unique: true },
// //   class: { type: String, required: true }, 
// //   parentName: { type: String, required: true },
// //   parentPhone: { type: String, required: true },
  
// //   feeStructure: {
// //     type: feeStructureSchema,
// //     default: () => ({})
// //   },
  
// //   totalFees: { type: Number, required: true, default: 0 },
// //   balance: { type: Number, required: true, default: 0 },
  
// //   createdAt: { type: Date, default: Date.now },
// // });

// // module.exports = mongoose.model('Student', studentSchema);


// // models/Student.js
// const mongoose = require('mongoose');

// const studentSchema = new mongoose.Schema({
//   studentId: { // Unique identifier, e.g., Admission Number
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//   },
//   firstName: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   lastName: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   gradeLevel: { // e.g., "Grade 1", "PP2", "Grade 10"
//     type: String,
//     required: true,
//     trim: true,
//   },
//   boardingStatus: { // "Day" or "Boarding"
//     type: String,
//     required: true,
//     enum: ['Day', 'Boarding'],
//   },
//   hasTransport: { // Boolean, true if they use school transport
//     type: Boolean,
//     required: true,
//     default: false,
//   },
//   transportRoute: { // Specific route if hasTransport is true, e.g., "maraba"
//     type: String,
//     trim: true,
//     default: '', // Empty string if no transport or not a Day scholar
//   },
//   currentBalance: { // Track outstanding balance
//     type: Number,
//     default: 0,
//   },
//   // You might add more fields like:
//   // parentName: String,
//   // parentContact: String,
//   // admissionDate: { type: Date, default: Date.now },
// }, {
//   timestamps: true // Adds createdAt and updatedAt fields
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

  totalFees: {
    type: Number,
    default: 0,
  },
  balance: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
