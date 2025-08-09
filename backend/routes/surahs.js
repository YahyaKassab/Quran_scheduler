const express = require('express');
const router = express.Router();
const {
  initializeSurahs,
  getAllSurahs,
  getSurahByNumber,
  getMemorizationStatus,
  updateMemorizationStatus,
  batchUpdateMemorizationStatus,
  getSurahPages
} = require('../controllers/surahController');

// Initialize surahs in database
router.post('/initialize', initializeSurahs);

// Get all surahs
router.get('/', getAllSurahs);

// Get memorization status for all surahs (put before :number to avoid conflicts)
router.get('/status/all', getMemorizationStatus);

// Get single surah by number
router.get('/:number', getSurahByNumber);

// Get pages for a specific surah with memorization status
router.get('/:number/pages', getSurahPages);

// Update memorization status for a single page
router.put('/status', updateMemorizationStatus);

// Batch update memorization statuses
router.put('/status/batch', batchUpdateMemorizationStatus);

module.exports = router;