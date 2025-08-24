// Test script to demonstrate the dynamic memorization status issue

console.log('=== Testing Dynamic Memorization Status Updates ===\n');

// Mock initial state - no memorization
let mockMemorizedPages = {
  perfect: [],
  medium: [],
  bad: [],
  not_memorized: []
};

console.log('📚 INITIAL STATE:');
console.log('Perfect pages:', mockMemorizedPages.perfect.length);
console.log('Medium pages:', mockMemorizedPages.medium.length);
console.log('');

// Simulate 5-day schedule generation
const totalDays = 5;
const startDate = new Date('2025-08-10');

for (let day = 0; day < totalDays; day++) {
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + day);
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];
  
  console.log(`--- Day ${day + 1} (${dayOfWeek}) ---`);
  
  const assignments = [];
  
  // Calculate daily allocations
  const currentPerfectCount = mockMemorizedPages.perfect.length;
  const currentMediumCount = mockMemorizedPages.medium.length;
  const dailyPerfect = Math.ceil(currentPerfectCount / 10) || 0;
  const dailyMedium = Math.ceil(currentMediumCount / 10) || 0;
  
  console.log(`Available: ${currentPerfectCount} perfect, ${currentMediumCount} medium`);
  console.log(`Daily target: ${dailyPerfect} perfect, ${dailyMedium} medium`);
  
  // Perfect revision
  for (let i = 0; i < Math.min(dailyPerfect, mockMemorizedPages.perfect.length); i++) {
    const page = mockMemorizedPages.perfect[i];
    assignments.push({
      type: 'revision',
      status: 'perfect',
      surah: page.surahNumber,
      page: page.pageNumber,
      description: `Perfect revision (Day ${page.dayAssigned})`
    });
    console.log(`  📖 Perfect: Surah ${page.surahNumber}, Page ${page.pageNumber} (from Day ${page.dayAssigned})`);
  }
  // Remove assigned pages
  mockMemorizedPages.perfect = mockMemorizedPages.perfect.slice(Math.min(dailyPerfect, mockMemorizedPages.perfect.length));
  
  // Medium revision  
  for (let i = 0; i < Math.min(dailyMedium, mockMemorizedPages.medium.length); i++) {
    const page = mockMemorizedPages.medium[i];
    assignments.push({
      type: 'revision', 
      status: 'medium',
      surah: page.surahNumber,
      page: page.pageNumber,
      description: `Medium revision (Day ${page.dayAssigned})`
    });
    console.log(`  📝 Medium: Surah ${page.surahNumber}, Page ${page.pageNumber} (from Day ${page.dayAssigned})`);
  }
  // Remove assigned pages
  mockMemorizedPages.medium = mockMemorizedPages.medium.slice(Math.min(dailyMedium, mockMemorizedPages.medium.length));
  
  // New material (skip Fridays)
  if (dayOfWeek !== 'Friday') {
    // Simulate new material assignment - 3 short surahs
    const newPages = [
      { surahNumber: 114 - day * 3, pageNumber: 604, isContext: false },
      { surahNumber: 113 - day * 3, pageNumber: 604, isContext: false },
      { surahNumber: 112 - day * 3, pageNumber: 604, isContext: false }
    ];
    
    newPages.forEach(pageData => {
      assignments.push({
        type: 'new',
        surah: pageData.surahNumber,
        page: pageData.pageNumber,
        description: `New memorization - Surah ${pageData.surahNumber}`
      });
      console.log(`  🆕 New: Surah ${pageData.surahNumber}, Page ${pageData.pageNumber}`);
      
      // UPDATE DYNAMIC STATE: New pages become medium for tomorrow
      mockMemorizedPages.medium.unshift({
        surahNumber: pageData.surahNumber,
        pageNumber: pageData.pageNumber,
        lastUpdated: currentDate,
        dayAssigned: day + 1
      });
    });
    
    console.log(`  ➡️ Added ${newPages.length} pages to medium pool for tomorrow`);
  }
  
  console.log(`Total assignments: ${assignments.length}`);
  console.log(`Updated pools: ${mockMemorizedPages.perfect.length} perfect, ${mockMemorizedPages.medium.length} medium`);
  console.log('');
}

console.log('✅ FINAL STATE:');
console.log('Perfect pages:', mockMemorizedPages.perfect.length);
console.log('Medium pages:', mockMemorizedPages.medium.length);
console.log('');
console.log('🎯 KEY INSIGHT:');
console.log('Yesterday\'s new material becomes today\'s medium revision priority!');
console.log('This creates the recency-based prioritization you wanted.');
