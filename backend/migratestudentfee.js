// migrateStudentsFeeDetails.js

const mongoose = require('mongoose');
const Student = require('./models/studentsDB'); // Adjust this path to your Student model
const dotenv = require('dotenv');

dotenv.config();
// IMPORTANT: Replace with your actual MongoDB connection string
const mongoURI = process.env.MONGO_URI ; 

async function runMigration() {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected for feeDetails migration.');

        // Find all student documents where 'feeDetails' sub-document is missing
        // and add it with default values for 'feesPaid' and 'remainingBalance'.
        const result = await Student.updateMany(
            { 'feeDetails': { $exists: false } }, // Condition: where feeDetails does not exist
            {
                $set: {
                    'feeDetails.feesPaid': 0,        // Initialize feesPaid
                    'feeDetails.remainingBalance': 0 // Initialize remainingBalance
                }
            }
        );

        console.log(`Migration complete: Matched ${result.matchedCount} students, modified ${result.modifiedCount}.`);
        mongoose.disconnect();
    } catch (error) {
        console.error('Migration failed:', error);
        mongoose.disconnect();
    }
}

runMigration();