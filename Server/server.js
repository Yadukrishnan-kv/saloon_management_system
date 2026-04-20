const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const seedAdmin = require('./config/seedAdmin');

dotenv.config();
connectDB().then(() => seedAdmin());

const app = express();
app.set('trust proxy', true);
const clientBuildPath = path.join(__dirname, '..', 'Client', 'build');
const hasClientBuild = fs.existsSync(path.join(clientBuildPath, 'index.html'));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Relax CSP and remove CORP for /uploads, then serve static files with CORS
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src *; img-src * data:; script-src 'self'; style-src 'self' 'unsafe-inline'");
  res.removeHeader && res.removeHeader('Cross-Origin-Resource-Policy');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/uploads', cors({ origin: '*', credentials: false }), express.static(path.join(__dirname, 'uploads')));

// Serve React build files when a production build is available
if (hasClientBuild) {
  app.use(express.static(clientBuildPath));
}

// API routes
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/subcategories', require('./routes/subCategoryRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
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
app.use('/api/mobileapp/complaints', require('./routes/mobileappComplaintRoutes'));

// Health check
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'Salon server is running 🚀' });
});

// Catch-all: Serve React app for non-API routes
app.get(/^(?!\/api).*$/, (req, res) => {
  if (!hasClientBuild) {
    return res.status(404).json({
      message: 'Client build not found. Run the client separately in development or build it for production.',
    });
  }

  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
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
