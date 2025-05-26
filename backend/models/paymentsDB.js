
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['produce', 'mpesa', 'bank'],
    required: true
  },
  produceType: {
    type: String,
    required: function () {
      return this.paymentMethod === 'produce';
    }
  },
  quantity: {
    type: Number,
    required: function () {
      return this.paymentMethod === 'produce';
    }
  },
  unitValue: {
    type: Number,
    required: function () {
      return this.paymentMethod === 'produce';
    }
  },
  bankName: {
    type: String,
    required: function () {
      return this.paymentMethod === 'bank';
    }
  },
  referenceNumber: {
    type: String,
    required: function () {
      return this.paymentMethod === 'mpesa' || this.paymentMethod === 'bank';
    }
  },
  amount: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
