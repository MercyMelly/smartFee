
const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  gradeLevel: { type: String, required: true },
  boardingStatus: { type: String, required: true, enum: ['Day', 'Boarding'] },
  hasTransport: { type: Boolean, required: true },
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
  totalCalculated: { 
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


feeStructureSchema.index({ gradeLevel: 1, boardingStatus: 1, hasTransport: 1 }, { unique: true });


module.exports = mongoose.model('FeeStructure', feeStructureSchema, 'feeStructure');