const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

mongoose.connection.once('open', () => {
  console.log(`Connected to database: ${mongoose.connection.name}`);
});



module.exports = connectDB;



// const mongoUrl  = "mongodb+srv://mercymelly:admin@cluster0.k00o4et.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
// mongoose
//   .connect(mongoUrl)
//   .then(() => console.log('Database connected'))
//   .catch(err => console.error('MongoDB connection error:', err));
