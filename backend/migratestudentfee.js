const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables
const Student = require('./models/studentsDB'); // Adjust path if necessary (e.g., ./models/student)

const MONGODB_URI = process.env.MONGO_URI; // Ensure this is set in your .env file

const migrateGender = async () => {
    if (!MONGODB_URI) {
        console.error("MONGO_URI is not defined in .env file. Please set it.");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            // useNewUrlParser: true, // Deprecated in recent Mongoose versions
            // useUnifiedTopology: true, // Deprecated in recent Mongoose versions
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        }); 
        console.log('MongoDB Connected for migration...');

        // Find students where gender is undefined or null (or an empty string if you initially allowed it)
        const filter = {
            $or: [
                { gender: { $exists: false } },
                { gender: null },
                { gender: '' } // Include empty strings if they might exist
            ]
        };

        // Update these students to set a default gender
        // You can change 'Other' to 'Male' or 'Female' if you have a reasonable default
        const update = {
            $set: { gender: 'Other' } // Set a default gender for missing ones
        };

        const result = await Student.updateMany(filter, update);

        console.log(`Migration Complete: Modified ${result.modifiedCount} student documents to set default gender.`);
        console.log(`Matched ${result.matchedCount} documents.`);

    } catch (err) {
        console.error('Gender migration failed:', err.message);
        console.error(err);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected.');
    }
};

migrateGender();
