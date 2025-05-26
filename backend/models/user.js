const mongoose = require('mongoose');
const UserDetailSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: {
    type: String,
    enum: ['admin', 'bursar','Admin', 'Bursar'],
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^\+?[0-9]{10,15}$/,
  },
} ,
{collection: 'userInfo'}

);



module.exports = mongoose.model('userInfo', UserDetailSchema);
