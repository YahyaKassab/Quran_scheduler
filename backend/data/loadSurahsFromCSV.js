const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Utility to load surah data from CSV
function loadSurahsFromCSV(csvPath) {
  return new Promise((resolve, reject) => {
    const surahs = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        surahs.push({
          nameTransliteration: row.Surah,
          nameArabic: row.Arabic,
          nameEnglish: row.English,
          totalPages: parseInt(row.Length),
          startPage: parseInt(row.Page),
        });
      })
      .on('end', () => {
        // Add surah number and endPage
        surahs.forEach((s, i) => {
          s.number = i + 1;
          s.endPage = s.startPage + s.totalPages - 1;
        });
        resolve(surahs);
      })
      .on('error', reject);
  });
}

module.exports = loadSurahsFromCSV;
