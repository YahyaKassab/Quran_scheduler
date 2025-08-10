const staticSurahs = require('./data/surahs');

// Test direction logic
console.log('=== TESTING DIRECTION LOGIC ===');

const forward = [...staticSurahs].sort((a, b) => a.number - b.number);
const reverse = [...staticSurahs].sort((a, b) => b.number - a.number);

console.log('\nForward first 5 surahs:');
forward.slice(0, 5).forEach(s => console.log(`${s.number}. ${s.nameEnglish} pages: ${s.startPage}-${s.endPage}`));

console.log('\nReverse first 5 surahs:');
reverse.slice(0, 5).forEach(s => console.log(`${s.number}. ${s.nameEnglish} pages: ${s.startPage}-${s.endPage}`));

// Test a long surah's pages - should ALWAYS be sequential
const testSurah = staticSurahs.find(s => s.number === 2); // Al-Baqarah
console.log(`\n=== ${testSurah.nameEnglish} Pages (should be 2,3,4,5...) ===`);
for (let page = testSurah.startPage; page <= Math.min(testSurah.startPage + 5, testSurah.endPage); page++) {
  console.log(`Page ${page}`);
}

// Test short surahs at the end
const shortSurahs = staticSurahs.filter(s => s.number >= 110);
console.log('\n=== Short Surahs (should have correct page order) ===');
shortSurahs.forEach(s => {
  console.log(`${s.number}. ${s.nameEnglish} pages: ${s.startPage}-${s.endPage}`);
});
