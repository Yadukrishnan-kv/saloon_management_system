const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
const seedAdmin = require('./config/seedAdmin');

dotenv.config();
connectDB().then(() => seedAdmin());

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React build files
app.use(express.static(path.join(__dirname, 'build')));

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/beauticians', require('./routes/beauticianRoutes'));
app.use('/api', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api', require('./routes/contentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin', require('./routes/adminExtendedRoutes'));

// Mobile App API routes
app.use('/api/mobileapp/auth', require('./routes/mobileappAuthRoutes'));
app.use('/api/mobileapp/user', require('./routes/mobileappUserRoutes'));
app.use('/api/mobileapp/services', require('./routes/mobileappServiceRoutes'));
app.use('/api/mobileapp/bookings', require('./routes/mobileappBookingRoutes'));
app.use('/api/mobileapp/beautician', require('./routes/mobileappBeauticianRoutes'));
app.use('/api/mobileapp/reviews', require('./routes/mobileappReviewRoutes'));
app.use('/api/mobileapp/payment', require('./routes/mobileappPaymentRoutes'));
app.use('/api/mobileapp/notifications', require('./routes/mobileappNotificationRoutes'));
app.use('/api/mobileapp/location', require('./routes/mobileappLocationRoutes'));
app.use('/api/mobileapp/cosmetics', require('./routes/mobileappCosmeticRoutes'));

// Health check
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'Salon server is running 🚀' });
});

// Catch-all: Serve React app for non-API routes
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'), (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Server error');
    }
  });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
