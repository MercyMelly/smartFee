
const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  tuition: { type: Number, default: 0 },
  boarding: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  dayScholar: { type: Boolean, default: true }, 
});

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  admissionNumber: { type: String, required: true, unique: true },
  class: { type: String, required: true }, 
  parentName: { type: String, required: true },
  parentPhone: { type: String, required: true },
  
  feeStructure: {
    type: feeStructureSchema,
    default: () => ({})
  },
  
  totalFees: { type: Number, required: true, default: 0 },
  balance: { type: Number, required: true, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Student', studentSchema);


// const mongoose = require('mongoose');

// const paymentSchema = new mongoose.Schema({
//   type: { type: String, enum: ['produce', 'mpesa', 'bank'], required: true },
//   amount: { type: Number, required: true },
//   date: { type: Date, default: Date.now },
//   produce: String,
//   quantity: Number,
//   unit: String,
//   pricePerUnit: Number,
//   reference: String,
//   method: String,
//   bankName: String
// });

// const studentSchema = new mongoose.Schema({
//   fullName: String,
//   admissionNumber: String,
//   class: String,
//   parentName: String,
//   parentPhone: String,
//   totalFees: Number,
//   balance: Number,
//   payments: [paymentSchema]
// });

// module.exports = mongoose.model('Student', studentSchema);
