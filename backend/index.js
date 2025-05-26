// const mongoose = require('mongoose');

// // Connect to MongoDB
// mongoose.connect('mongodb://192.168.56.1:27017/myAppDB', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => {
//   console.log('✅ Connected to MongoDB');
// }).catch((err) => {
//   console.error('❌ Error connecting to MongoDB', err);
// });

// // Define the User schema
// const userSchema = new mongoose.Schema({
//   fullName: {
//     type: String,
//     required: true,
//     minlength: 2,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     match: /.+\@.+\..+/,
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 8,
//   },
//   role: {
//     type: String,
//     enum: ['admin', 'bursar'],
//     required: true,
//   },
//   phoneNumber: {
//     type: String,
//     required: true,
//     match: /^\+?[0-9]{10,15}$/,
//   },
// });

// // Create the User model
// const User = mongoose.model('User', userSchema);

// // Create and save a user
// const user = new User({
//   fullName: 'Mercy Melly',
//   email: 'mercy@example.com',
//   password: 'StrongP@ss123',
//   role: 'admin',
//   phoneNumber: '+254700000000',
// });

// user.save()
//   .then(() => console.log('✅ User saved'))
//   .catch((err) => console.error('❌ Error saving user:', err));
