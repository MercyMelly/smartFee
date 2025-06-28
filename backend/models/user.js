const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Needed for password hashing and comparison

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please use a valid email address'] // Basic email regex
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        // Added 'parent' to the existing roles
        enum: ['director', 'admin', 'bursar', 'parent'], // Define roles for your school
        default: 'bursar' // A sensible default if not explicitly set
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    dateJoined: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);



// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs'); // Needed for password hashing and comparison

// const userSchema = new mongoose.Schema({
//     fullName: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//         lowercase: true,
//         match: [/.+@.+\..+/, 'Please use a valid email address'] // Basic email regex
//     },
//     password: {
//         type: String,
//         required: true
//     },
//     role: {
//         type: String,
//         enum: ['director', 'admin', 'bursar'], // Define roles for your school
//         default: 'bursar' // A sensible default if not explicitly set
//     },
//     phoneNumber: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     dateJoined: {
//         type: Date,
//         default: Date.now
//     },
//     // Remove the 'school' reference as we are now single-school focused
//     // school: {
//     //     type: mongoose.Schema.Types.ObjectId,
//     //     ref: 'School',
//     //     required: true
//     // },
//     lastLogin: {
//         type: Date
//     }
// });

// // Hash password before saving
// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) {
//         next();
//     }
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
// });

// // Method to compare entered password with hashed password in DB
// userSchema.methods.matchPassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema);

