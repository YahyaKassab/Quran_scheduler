const staticSurahs = require('./data/surahs');

// Mock MemorizationStatus.find to simulate no memorized pages
const mockMemorizationStatus = {
  find: () => Promise.resolve([]) // No memorized pages
};

// Simulate the getNextPagesForMemorization function
const getNextPagesForMemorization = async (userId, totalDaysNeeded, newDirection = 'forward') => {
  const statuses = await mockMemorizationStatus.find({ userId });
  const memorizedPages = new Set();

  statuses.forEach((status) => {
    if (status.status !== 'not_memorized') {
      memorizedPages.add(`${status.surahNumber}-${status.pageNumber}`);
    }
  });

  // Sort surahs based on direction (use static data instead of database)
  const sortedSurahs = [...staticSurahs].sort((a, b) => 
    newDirection === 'forward' ? a.number - b.number : b.number - a.number
  );
  const allPages = [];

  // Find all unmemorized surahs (surahs that have any unmemorized pages)
  const unmemorizedSurahs = [];
  
  for (const surah of sortedSurahs) {
    let hasUnmemorizedPages = false;
    
    for (let page = surah.startPage; page <= surah.endPage; page++) {
      const pageKey = `${surah.number}-${page}`;
      if (!memorizedPages.has(pageKey)) {
        hasUnmemorizedPages = true;
        break;
      }
    }
    
    if (hasUnmemorizedPages) {
      // Use the corrected totalPages from static data
      unmemorizedSurahs.push({
        ...surah,
        totalPages: surah.totalPages
      });
    }
  }

  console.log(`\nFound ${unmemorizedSurahs.length} unmemorized surahs`);
  console.log('First 5 surahs in direction order:');
  unmemorizedSurahs.slice(0, 5).forEach(s => {
    console.log(`  Surah ${s.number} (${s.nameEnglish}): ${s.totalPages} pages`);
  });

  // For each day, try to fill up to 1 page worth of content
  for (let day = 0; day < totalDaysNeeded && unmemorizedSurahs.length > 0; day++) {
    let pagesCollectedToday = 0;
    const targetPagesPerDay = 1; // Aim for 1 page per day
    const todaysAssignments = [];
    
    console.log(`\n--- Day ${day + 1} ---`);
    console.log(`Target: ${targetPagesPerDay} pages`);
    
    while (pagesCollectedToday < targetPagesPerDay && unmemorizedSurahs.length > 0) {
      const currentSurah = unmemorizedSurahs[0]; // Take first unmemorized surah
      
      // Check if adding this surah would make us go too far over the target
      // Only add if we're still under target OR if this addition wouldn't exceed 1.2x target
      const wouldExceedTarget = pagesCollectedToday + currentSurah.totalPages > targetPagesPerDay * 1.2;
      const alreadyAtReasonableAmount = pagesCollectedToday >= targetPagesPerDay * 0.9; // 90% of target
      
      if (wouldExceedTarget && alreadyAtReasonableAmount) {
        console.log(`  Would exceed target (${(pagesCollectedToday + currentSurah.totalPages).toFixed(2)} > ${(targetPagesPerDay * 1.2).toFixed(2)}) and already at reasonable amount (${pagesCollectedToday.toFixed(2)} >= ${(targetPagesPerDay * 0.9).toFixed(2)}), stopping`);
        break; // Stop adding surahs for today
      }
      
      console.log(`Adding Surah ${currentSurah.number} (${currentSurah.nameEnglish}) - ${currentSurah.totalPages} pages`);
      
      // Add all pages from beginning of this surah
      for (let page = currentSurah.startPage; page <= currentSurah.endPage; page++) {
        const pageKey = `${currentSurah.number}-${page}`;
        const isAlreadyMemorized = memorizedPages.has(pageKey);
        
        const assignment = {
          surahNumber: currentSurah.number,
          pageNumber: page,
          surahName: currentSurah.nameEnglish,
          isNewContext: isAlreadyMemorized,
          isActuallyNew: !isAlreadyMemorized,
          dayNumber: day + 1,
          surahTotalPages: currentSurah.totalPages
        };
        
        allPages.push(assignment);
        todaysAssignments.push(assignment);
      }
      
      pagesCollectedToday += currentSurah.totalPages;
      console.log(`  Running total: ${pagesCollectedToday.toFixed(2)} pages`);
      unmemorizedSurahs.shift(); // Remove this surah as it's now completed
      
      // If this surah was >= 1 page, stop for today
      if (currentSurah.totalPages >= targetPagesPerDay) {
        console.log(`  Surah is >= 1 page, stopping for today`);
        break;
      }
    }
    
    console.log(`Day ${day + 1} total: ${pagesCollectedToday.toFixed(2)} pages`);
    console.log(`Surahs assigned:`, todaysAssignments.map(a => `${a.surahNumber}(${a.surahName})`).join(', '));
  }

  return allPages;
};

// Test the algorithm
async function testAlgorithm() {
  console.log('Testing algorithm with reverse direction (Nas -> Baqarah)');
  console.log('Target: 1 page per day for 3 days');
  
  const result = await getNextPagesForMemorization('test_user', 3, 'reverse');
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total assignments: ${result.length}`);
  
  // Group by day
  const byDay = {};
  result.forEach(assignment => {
    if (!byDay[assignment.dayNumber]) {
      byDay[assignment.dayNumber] = [];
    }
    byDay[assignment.dayNumber].push(assignment);
  });
  
  Object.keys(byDay).forEach(day => {
    const assignments = byDay[day];
    const totalPages = assignments.reduce((sum, a) => sum + a.surahTotalPages, 0);
    const uniqueSurahs = [...new Set(assignments.map(a => a.surahNumber))];
    
    console.log(`\nDay ${day}: ${totalPages.toFixed(2)} pages`);
    console.log(`  Surahs: ${uniqueSurahs.map(num => {
      const assignment = assignments.find(a => a.surahNumber === num);
      return `${num}(${assignment.surahName},${assignment.surahTotalPages}p)`;
    }).join(', ')}`);
  });
}

testAlgorithm().catch(console.error);
