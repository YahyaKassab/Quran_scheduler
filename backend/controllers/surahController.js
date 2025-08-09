const Surah = require('../models/Surah');
const MemorizationStatus = require('../models/MemorizationStatus');
const surahs = require('../data/surahs');

// Initialize database with surah data
const initializeSurahs = async (req, res) => {
  try {
    const count = await Surah.countDocuments();
    if (count === 0) {
      await Surah.insertMany(surahs);
      console.log('Surahs initialized in database');
    }
    res.json({ message: 'Surahs initialized successfully', count: await Surah.countDocuments() });
  } catch (error) {
    console.error('Error initializing surahs:', error);
    res.status(500).json({ message: 'Error initializing surahs', error: error.message });
  }
};

// Get all surahs
const getAllSurahs = async (req, res) => {
  try {
    const surahs = await Surah.find().sort({ number: 1 });
    res.json(surahs);
  } catch (error) {
    console.error('Error fetching surahs:', error);
    res.status(500).json({ message: 'Error fetching surahs', error: error.message });
  }
};

// Get single surah by number
const getSurahByNumber = async (req, res) => {
  try {
    const { number } = req.params;
    const surah = await Surah.findOne({ number: parseInt(number) });
    
    if (!surah) {
      return res.status(404).json({ message: 'Surah not found' });
    }
    
    res.json(surah);
  } catch (error) {
    console.error('Error fetching surah:', error);
    res.status(500).json({ message: 'Error fetching surah', error: error.message });
  }
};

// Get memorization status for all surahs/pages
const getMemorizationStatus = async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const statuses = await MemorizationStatus.find({ userId }).sort({ surahNumber: 1, pageNumber: 1 });
    
    // Group by surah for easier frontend consumption
    const statusBySurah = {};
    statuses.forEach(status => {
      if (!statusBySurah[status.surahNumber]) {
        statusBySurah[status.surahNumber] = {};
      }
      statusBySurah[status.surahNumber][status.pageNumber] = status.status;
    });
    
    res.json(statusBySurah);
  } catch (error) {
    console.error('Error fetching memorization status:', error);
    res.status(500).json({ message: 'Error fetching memorization status', error: error.message });
  }
};

// Update memorization status for a surah/page
const updateMemorizationStatus = async (req, res) => {
  try {
    const { surahNumber, pageNumber, status } = req.body;
    const userId = req.body.userId || 'default_user';
    
    if (!surahNumber || !pageNumber || !status) {
      return res.status(400).json({ message: 'Missing required fields: surahNumber, pageNumber, status' });
    }
    
    if (!['perfect', 'medium', 'bad', 'not_memorized'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be: perfect, medium, bad, or not_memorized' });
    }
    
    const memStatus = await MemorizationStatus.findOneAndUpdate(
      { userId, surahNumber, pageNumber },
      { status, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    
    res.json(memStatus);
  } catch (error) {
    console.error('Error updating memorization status:', error);
    res.status(500).json({ message: 'Error updating memorization status', error: error.message });
  }
};

// Batch update memorization statuses
const batchUpdateMemorizationStatus = async (req, res) => {
  try {
    const { updates } = req.body;
    const userId = req.body.userId || 'default_user';
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates must be an array' });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { surahNumber, pageNumber, status } = update;
      
      if (!surahNumber || !pageNumber || !status) {
        continue; // Skip invalid updates
      }
      
      const memStatus = await MemorizationStatus.findOneAndUpdate(
        { userId, surahNumber, pageNumber },
        { status, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
      
      results.push(memStatus);
    }
    
    res.json({ message: `Updated ${results.length} memorization statuses`, results });
  } catch (error) {
    console.error('Error batch updating memorization status:', error);
    res.status(500).json({ message: 'Error batch updating memorization status', error: error.message });
  }
};

// Get pages for a specific surah with their memorization status
const getSurahPages = async (req, res) => {
  try {
    const { number } = req.params;
    const userId = req.query.userId || 'default_user';
    
    const surah = await Surah.findOne({ number: parseInt(number) });
    if (!surah) {
      return res.status(404).json({ message: 'Surah not found' });
    }
    
    const pages = [];
    for (let page = surah.startPage; page <= surah.endPage; page++) {
      const status = await MemorizationStatus.findOne({ userId, surahNumber: surah.number, pageNumber: page });
      pages.push({
        pageNumber: page,
        status: status ? status.status : 'not_memorized',
        lastUpdated: status ? status.lastUpdated : null
      });
    }
    
    res.json({
      surah: {
        number: surah.number,
        nameArabic: surah.nameArabic,
        nameEnglish: surah.nameEnglish,
        nameTransliteration: surah.nameTransliteration,
        totalPages: surah.totalPages
      },
      pages
    });
  } catch (error) {
    console.error('Error fetching surah pages:', error);
    res.status(500).json({ message: 'Error fetching surah pages', error: error.message });
  }
};

module.exports = {
  initializeSurahs,
  getAllSurahs,
  getSurahByNumber,
  getMemorizationStatus,
  updateMemorizationStatus,
  batchUpdateMemorizationStatus,
  getSurahPages
};