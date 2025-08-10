const Schedule = require('../models/Schedule');
const MemorizationStatus = require('../models/MemorizationStatus');
const Surah = require('../models/Surah');
const staticSurahs = require('../data/surahs');

// Helper function to get day of week
const getDayOfWeek = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Helper function to get all memorized pages by status (sorted by recency - most recent first)
const getMemorizedPagesByStatus = async (userId) => {
  const statuses = await MemorizationStatus.find({ userId });
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

// Helper function to get next pages for new memorization with dynamic state tracking
const getNextPagesForMemorization = async (userId, pagesNeededToday, newDirection = 'forward', memorizedPagesSet = null) => {
  if (!memorizedPagesSet) {
    const statuses = await MemorizationStatus.find({ userId });
    memorizedPagesSet = new Set();
    statuses.forEach((status) => {
      if (status.status !== 'not_memorized') {
        memorizedPagesSet.add(`${status.surahNumber}-${status.pageNumber}`);
      }
    });
  }

  // Sort surahs by direction (forward: 1,2,3... reverse: 114,113,112...)
  const sortedSurahs = [...staticSurahs].sort((a, b) => 
    newDirection === 'forward' ? a.number - b.number : b.number - a.number
  );
  
  const pagesForToday = [];
  let pagesCollected = 0;

  // Find the first unmemorized page across all surahs
  for (const surah of sortedSurahs) {
    if (pagesCollected >= pagesNeededToday) break;
    
    // ALWAYS iterate pages in ascending order within each surah (basic math!)
    for (let page = surah.startPage; page <= surah.endPage; page++) {
      if (pagesCollected >= pagesNeededToday) break;
      
      const pageKey = `${surah.number}-${page}`;
      if (!memorizedPagesSet.has(pageKey)) {
        pagesForToday.push({
          surahNumber: surah.number,
          pageNumber: page,
          surahName: surah.nameEnglish,
          surahNameArabic: surah.nameArabic,
          isNewContext: false,
          isActuallyNew: true,
          dayNumber: 1,
          surahTotalPages: surah.totalPages
        });
        pagesCollected++;
      }
    }
  }

  return pagesForToday;
};

// Main schedule generation function with dynamic memorization tracking
const generateSchedule = async (req, res) => {
  try {
    const { name, startDate, totalDays, dailyNewPages, newDirection = 'forward' } = req.body;
    const userId = req.body.userId || 'default_user';

    if (!name || !startDate || !totalDays || !dailyNewPages) {
      return res.status(400).json({
        message: 'Missing required fields: name, startDate, totalDays, dailyNewPages',
      });
    }

    if (!['forward', 'reverse'].includes(newDirection)) {
      return res.status(400).json({ message: 'Invalid newDirection value' });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + totalDays - 1);
    
    // Get surahs in default order for revision (always forward)
    const surahs = await Surah.find().sort({ number: 1 });
    const memorizedPages = await getMemorizedPagesByStatus(userId);

    // Create dynamic memorization tracking
    let dynamicMemorizedPages = {
      perfect: [...memorizedPages.perfect],
      medium: [...memorizedPages.medium],
      bad: [...memorizedPages.bad],
      not_memorized: [...memorizedPages.not_memorized]
    };

    // Build initial memorized pages set
    const initialStatuses = await MemorizationStatus.find({ userId });
    let memorizedPagesSet = new Set();
    initialStatuses.forEach(status => {
      if (status.status !== 'not_memorized') {
        memorizedPagesSet.add(`${status.surahNumber}-${status.pageNumber}`);
      }
    });

    const dailySchedule = [];

    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);
      const dayOfWeek = getDayOfWeek(currentDate);

      const assignments = [];

      // Dynamic daily allocations
      const currentPerfectCount = dynamicMemorizedPages.perfect.length;
      const currentMediumCount = dynamicMemorizedPages.medium.length;
      const dailyPerfect = Math.ceil(currentPerfectCount / 10) || 0;
      const dailyMedium = Math.ceil(currentMediumCount / 10) || 0;

      // Perfect revision
      for (let i = 0; i < Math.min(dailyPerfect, dynamicMemorizedPages.perfect.length); i++) {
        const page = dynamicMemorizedPages.perfect[i];
        const surahObj = surahs.find((s) => s.number === page.surahNumber);
        const daysSinceMemorized = Math.floor((new Date() - new Date(page.lastUpdated || page.createdAt)) / (1000 * 60 * 60 * 24));
        assignments.push({
          type: 'revision',
          surahNumber: page.surahNumber,
          surahNameArabic: surahObj ? surahObj.nameArabic : '',
          surahNameEnglish: surahObj ? surahObj.nameEnglish : '',
          pageNumber: page.pageNumber,
          status: 'perfect',
          description: `Perfect revision (${daysSinceMemorized} days ago)`,
          lastUpdated: page.lastUpdated,
          daysSinceMemorized: daysSinceMemorized
        });
      }
      dynamicMemorizedPages.perfect = dynamicMemorizedPages.perfect.slice(Math.min(dailyPerfect, dynamicMemorizedPages.perfect.length));

      // Medium revision
      for (let i = 0; i < Math.min(dailyMedium, dynamicMemorizedPages.medium.length); i++) {
        const page = dynamicMemorizedPages.medium[i];
        const surahObj = surahs.find((s) => s.number === page.surahNumber);
        const daysSinceMemorized = Math.floor((new Date() - new Date(page.lastUpdated || page.createdAt)) / (1000 * 60 * 60 * 24));
        assignments.push({
          type: 'revision',
          surahNumber: page.surahNumber,
          surahNameArabic: surahObj ? surahObj.nameArabic : '',
          surahNameEnglish: surahObj ? surahObj.nameEnglish : '',
          pageNumber: page.pageNumber,
          status: 'medium',
          description: `Medium revision (${daysSinceMemorized} days ago)`,
          lastUpdated: page.lastUpdated,
          daysSinceMemorized: daysSinceMemorized
        });
      }
      dynamicMemorizedPages.medium = dynamicMemorizedPages.medium.slice(Math.min(dailyMedium, dynamicMemorizedPages.medium.length));

      // New material (skip Fridays)
      if (dailyNewPages > 0 && dayOfWeek !== 'Friday') {
        const newPagesForToday = await getNextPagesForMemorization(userId, dailyNewPages, newDirection, memorizedPagesSet);
        
        newPagesForToday.forEach(pageData => {
          const surahObj = surahs.find((s) => s.number === pageData.surahNumber);
          const description = pageData.isNewContext 
            ? `Context - ${pageData.surahName}` 
            : `New memorization - ${pageData.surahName}`;
          
          assignments.push({
            type: 'new',
            surahNumber: pageData.surahNumber,
            surahNameArabic: surahObj ? surahObj.nameArabic : '',
            surahNameEnglish: surahObj ? surahObj.nameEnglish : '',
            pageNumber: pageData.pageNumber,
            status: pageData.isNewContext ? 'perfect' : 'not_memorized',
            description: description,
            isContext: pageData.isNewContext || false,
          });
          
          // DYNAMIC UPDATE: New pages become medium for tomorrow
          if (!pageData.isNewContext) {
            const todayDate = new Date(currentDate);
            dynamicMemorizedPages.medium.push({  // Changed from unshift to push to maintain order
              surahNumber: pageData.surahNumber,
              pageNumber: pageData.pageNumber,
              lastUpdated: todayDate,
              createdAt: todayDate
            });
            
            memorizedPagesSet.add(`${pageData.surahNumber}-${pageData.pageNumber}`);
          }
        });
      }

      // Friday Al-Kahf
      if (dayOfWeek === 'Friday') {
        const alKahf = staticSurahs.find((s) => s.number === 18);
        if (alKahf) {
          for (let page = alKahf.startPage; page <= alKahf.endPage; page++) {
            assignments.push({
              type: 'special',
              surahNumber: 18,
              surahNameArabic: alKahf.nameArabic,
              surahNameEnglish: alKahf.nameEnglish,
              pageNumber: page,
              status: 'special',
              description: 'Friday Al-Kahf',
            });
          }
        }
      }

      dailySchedule.push({
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: dayOfWeek,
        assignments: assignments,
      });
    }

    const schedule = new Schedule({
      name,
      userId,
      startDate: start,
      endDate: end,
      totalDays,
      dailyNewPages,
      newDirection,
      dailySchedule,
      status: 'active',
    });

    await schedule.save();

    res.status(201).json({
      message: 'Schedule generated successfully with dynamic memorization tracking!',
      schedule: schedule,
    });

  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({
      message: 'Failed to generate schedule',
      error: error.message,
    });
  }
};

const getAllSchedules = async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const schedules = await Schedule.find({ userId }).sort({ createdAt: -1 });
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Failed to fetch schedules', error: error.message });
  }
};

const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Failed to fetch schedule', error: error.message });
  }
};

const updateAssignmentCompletion = async (req, res) => {
  try {
    const { scheduleId, date, assignmentIndex, completed } = req.body;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    const daySchedule = schedule.dailySchedule.find(day => day.date === date);
    if (!daySchedule) {
      return res.status(404).json({ message: 'Day not found in schedule' });
    }
    if (assignmentIndex >= daySchedule.assignments.length) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    daySchedule.assignments[assignmentIndex].completed = completed;
    await schedule.save();
    res.json({ message: 'Assignment updated successfully', schedule });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Failed to update assignment', error: error.message });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Failed to delete schedule', error: error.message });
  }
};

const getTodaysAssignments = async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const today = new Date().toISOString().split('T')[0];
    const schedules = await Schedule.find({ userId, status: 'active' });
    let todaysAssignments = [];
    schedules.forEach(schedule => {
      const daySchedule = schedule.dailySchedule.find(day => day.date === today);
      if (daySchedule) {
        todaysAssignments = todaysAssignments.concat(
          daySchedule.assignments.map(assignment => ({
            ...assignment,
            scheduleName: schedule.name,
            scheduleId: schedule._id
          }))
        );
      }
    });
    res.json(todaysAssignments);
  } catch (error) {
    console.error('Error fetching today\'s assignments:', error);
    res.status(500).json({ message: 'Failed to fetch today\'s assignments', error: error.message });
  }
};

const testAlKahf = async (req, res) => {
  try {
    const alKahf = staticSurahs.find((s) => s.number === 18);
    res.json({
      message: 'Al-Kahf test successful',
      alKahf: alKahf,
      staticSurahsCount: staticSurahs.length
    });
  } catch (error) {
    console.error('Error in Al-Kahf test:', error);
    res.status(500).json({ message: 'Al-Kahf test failed', error: error.message });
  }
};

module.exports = {
  generateSchedule,
  getAllSchedules,
  getScheduleById,
  updateAssignmentCompletion,
  deleteSchedule,
  getTodaysAssignments,
  testAlKahf
};
