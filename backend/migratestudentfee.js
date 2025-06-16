
const mongoose = require('mongoose');
const Student = require('./models/studentsDB');
const dotenv = require('dotenv');

dotenv.config();
const mongoURI = process.env.MONGO_URI ; 

async function runMigration() {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected for feeDetails migration.');
        const result = await Student.updateMany(
            { 'feeDetails': { $exists: false } }, 
            {
                $set: {
                    'feeDetails.feesPaid': 0,      
                    'feeDetails.remainingBalance': 0 
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