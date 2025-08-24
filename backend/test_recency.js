// Test script to demonstrate recency-based revision prioritization

// Mock data - simulate memorization statuses with different dates
const mockMemorizationStatuses = [
  // Perfect pages - different memorization dates
  { surahNumber: 2, pageNumber: 1, status: 'perfect', lastUpdated: new Date('2025-08-08'), createdAt: new Date('2025-08-08') }, // 2 days ago
  { surahNumber: 2, pageNumber: 2, status: 'perfect', lastUpdated: new Date('2025-08-05'), createdAt: new Date('2025-08-05') }, // 5 days ago
  { surahNumber: 2, pageNumber: 3, status: 'perfect', lastUpdated: new Date('2025-08-09'), createdAt: new Date('2025-08-09') }, // 1 day ago
  { surahNumber: 3, pageNumber: 1, status: 'perfect', lastUpdated: new Date('2025-08-01'), createdAt: new Date('2025-08-01') }, // 9 days ago
  
  // Medium pages - different memorization dates  
  { surahNumber: 4, pageNumber: 1, status: 'medium', lastUpdated: new Date('2025-08-07'), createdAt: new Date('2025-08-07') }, // 3 days ago
  { surahNumber: 4, pageNumber: 2, status: 'medium', lastUpdated: new Date('2025-08-10'), createdAt: new Date('2025-08-10') }, // Today
  { surahNumber: 5, pageNumber: 1, status: 'medium', lastUpdated: new Date('2025-08-03'), createdAt: new Date('2025-08-03') }, // 7 days ago
];

// Simulate the getMemorizedPagesByStatus function with recency sorting
const getMemorizedPagesByStatus = (statuses) => {
  const categorized = {
    perfect: [],
    medium: [],
    bad: [],
    not_memorized: [],
  };

  statuses.forEach((status) => {
    categorized[status.status].push({
      surahNumber: status.surahNumber,
      pageNumber: status.pageNumber,
      lastUpdated: status.lastUpdated,
      createdAt: status.createdAt
    });
  });

  // Sort each category by recency (most recently updated first)
  Object.keys(categorized).forEach(status => {
    categorized[status].sort((a, b) => {
      const dateA = a.lastUpdated || a.createdAt;
      const dateB = b.lastUpdated || b.createdAt;
      return new Date(dateB) - new Date(dateA); // Descending order (newest first)
    });
  });

  return categorized;
};

// Helper function to calculate days since memorized
const getDaysSinceMemorized = (lastUpdated, createdAt) => {
  const today = new Date('2025-08-10'); // Mock today's date
  const memDate = lastUpdated || createdAt;
  return Math.floor((today - memDate) / (1000 * 60 * 60 * 24));
};

// Test the function
console.log('=== Testing Recency-Based Revision Prioritization ===\n');

const memorizedPages = getMemorizedPagesByStatus(mockMemorizationStatuses);

console.log('📚 PERFECT PAGES (sorted by recency - most recent first):');
memorizedPages.perfect.forEach((page, index) => {
  const daysSince = getDaysSinceMemorized(page.lastUpdated, page.createdAt);
  const priority = index < 2 ? '🔥 HIGH PRIORITY' : '⭐ NORMAL';
  console.log(`  ${index + 1}. Surah ${page.surahNumber}, Page ${page.pageNumber} - ${daysSince} days ago ${priority}`);
});

console.log('\n📖 MEDIUM PAGES (sorted by recency - most recent first):');
memorizedPages.medium.forEach((page, index) => {
  const daysSince = getDaysSinceMemorized(page.lastUpdated, page.createdAt);
  const priority = index < 2 ? '🔥 HIGH PRIORITY' : '⭐ NORMAL';
  console.log(`  ${index + 1}. Surah ${page.surahNumber}, Page ${page.pageNumber} - ${daysSince} days ago ${priority}`);
});

console.log('\n🎯 REVISION SCHEDULE DEMONSTRATION:');
console.log('If we assign 2 perfect + 2 medium pages daily:');

// Simulate daily assignments for 3 days
let perfectIndex = 0;
let mediumIndex = 0;

for (let day = 1; day <= 3; day++) {
  console.log(`\n--- Day ${day} ---`);
  
  // Assign 2 perfect pages
  console.log('Perfect Revision:');
  for (let i = 0; i < 2 && perfectIndex < memorizedPages.perfect.length; i++) {
    const page = memorizedPages.perfect[perfectIndex];
    const daysSince = getDaysSinceMemorized(page.lastUpdated, page.createdAt);
    const freshness = daysSince <= 3 ? '🆕 FRESH' : daysSince <= 7 ? '📅 RECENT' : '⏰ OLD';
    console.log(`  Surah ${page.surahNumber}, Page ${page.pageNumber} (${daysSince} days ago) ${freshness}`);
    perfectIndex++;
  }
  
  // Assign 2 medium pages
  console.log('Medium Revision:');
  for (let i = 0; i < 2 && mediumIndex < memorizedPages.medium.length; i++) {
    const page = memorizedPages.medium[mediumIndex];
    const daysSince = getDaysSinceMemorized(page.lastUpdated, page.createdAt);
    const freshness = daysSince <= 3 ? '🆕 FRESH' : daysSince <= 7 ? '📅 RECENT' : '⏰ OLD';
    console.log(`  Surah ${page.surahNumber}, Page ${page.pageNumber} (${daysSince} days ago) ${freshness}`);
    mediumIndex++;
  }
}

console.log('\n✅ KEY BENEFITS:');
console.log('  🔥 Freshly memorized content gets prioritized (reviewed more frequently)');
console.log('  📚 Perfect memorization still has highest priority');
console.log('  🎯 Context pages (beginning of surahs) maintain second priority');
console.log('  ⏰ Old memorization gets reviewed but at lower frequency');
console.log('  🧠 This pattern reinforces recent learning while maintaining long-term retention');
