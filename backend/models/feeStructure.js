


const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  gradeLevel: { type: String, required: true },
  boardingStatus: { type: String, required: true },
  hasTransport: { type: Boolean, required: true },
  transportRoutes: Object, 
  termlyComponents: [{
    name: String,
    amount: Number
  }],
  totalCalculated: Number
}, {
  // Optional: Add timestamps for created/updated dates
  timestamps: true
});

// IMPORTANT CHANGE HERE:
// Pass 'feeStructure' as the third argument to mongoose.model()
// This forces Mongoose to use the exact collection name 'feeStructure'
module.exports = mongoose.model('FeeStructure', feeStructureSchema, 'feeStructure');
