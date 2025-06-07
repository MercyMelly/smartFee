const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/routes');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const reportsRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const otpRoutes = require('./routes/otpRoutes');

app.use('/api', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', otpRoutes);
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

app.listen(3000, '0.0.0.0', () => { console.log('Server running on http://0.0.0.0:3000'); });

