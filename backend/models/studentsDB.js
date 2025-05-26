const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  type: { type: String, enum: ['produce', 'mpesa', 'bank'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  produce: String,
  quantity: Number,
  unit: String,
  pricePerUnit: Number,
  reference: String,
  method: String,
  bankName: String
});

const studentSchema = new mongoose.Schema({
  fullName: String,
  admissionNumber: String,
  class: String,
  parentName: String,
  parentPhone: String,
  totalFees: Number,
  balance: Number,
  payments: [paymentSchema]
});

module.exports = mongoose.model('Student', studentSchema);
