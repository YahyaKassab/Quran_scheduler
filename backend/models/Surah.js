const mongoose = require('mongoose');

const SurahSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 114
  },
  nameArabic: {
    type: String,
    required: true
  },
  nameEnglish: {
    type: String,
    required: true
  },
  nameTransliteration: {
    type: String,
    required: true
  },
  totalPages: {
    type: Number,
    required: true,
    min: 1
  },
  startPage: {
    type: Number,
    required: true,
    min: 1,
    max: 604
  },
  endPage: {
    type: Number,
    required: true,
    min: 1,
    max: 604
  },
  totalVerses: {
    type: Number,
    required: true,
    min: 1
  },
  revelationType: {
    type: String,
    enum: ['Meccan', 'Medinan'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Surah', SurahSchema);