const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quran_scheduler';

mongoose.connect(MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('MongoDB connection error:', error));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Quran Memorization Scheduler API' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Import and use routes
try {
  const surahRoutes = require('./routes/surahs');
  app.use('/api/surahs', surahRoutes);
  console.log('Surah routes loaded successfully');
} catch (error) {
  console.error('Error loading surah routes:', error);
}

try {
  const scheduleRoutes = require('./routes/schedules');
  app.use('/api/schedules', scheduleRoutes);
  console.log('Schedule routes loaded successfully');
} catch (error) {
  console.error('Error loading schedule routes:', error);
}

try {
  const progressRoutes = require('./routes/progress');
  app.use('/api/progress', progressRoutes);
  console.log('Progress routes loaded successfully');
} catch (error) {
  console.error('Error loading progress routes:', error);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});