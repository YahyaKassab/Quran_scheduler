const Schedule = require('../models/Schedule');
const MemorizationStatus = require('../models/MemorizationStatus');
const Surah = require('../models/Surah');

// Helper function to get day of week
const getDayOfWeek = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Helper function to get all memorized pages by status
const getMemorizedPagesByStatus = async (userId) => {
  const statuses = await MemorizationStatus.find({ userId });
  const categorized = {
    perfect: [],
    medium: [],
    bad: [],
    not_memorized: []
  };
  
  statuses.forEach(status => {
    categorized[status.status].push({
      surahNumber: status.surahNumber,
      pageNumber: status.pageNumber
    });
  });
  
  return categorized;
};

// Helper function to get next pages for new memorization
const getNextPagesForMemorization = async (userId, count, direction = 'forward') => {
  const statuses = await MemorizationStatus.find({ userId });
  const memorizedSurahs = new Set();
  const partiallyMemorizedSurahs = new Set();
  
  // Track which surahs are completely memorized or partially memorized
  statuses.forEach(status => {
    if (status.status !== 'not_memorized') {
      partiallyMemorizedSurahs.add(status.surahNumber);
    }
  });
  
  // Check which surahs are completely memorized
  const surahs = await Surah.find().sort({ number: direction === 'forward' ? 1 : -1 });
  
  for (const surah of surahs) {
    const surahStatuses = statuses.filter(s => s.surahNumber === surah.number);
    const totalPages = surah.endPage - surah.startPage + 1;
    const memorizedPages = surahStatuses.filter(s => s.status !== 'not_memorized').length;
    
    if (memorizedPages === totalPages) {
      memorizedSurahs.add(surah.number);
    }
  }
  
  const nextPages = [];
  
  // Find next unmemorized surahs and start from their beginning
  for (const surah of surahs) {
    if (nextPages.length >= count) break;
    
    // Skip completely memorized surahs
    if (memorizedSurahs.has(surah.number)) continue;
    
    // For partially memorized surahs, find next unmemorized pages
    if (partiallyMemorizedSurahs.has(surah.number)) {
      const surahStatuses = statuses.filter(s => s.surahNumber === surah.number);
      const memorizedPageNumbers = new Set(
        surahStatuses
          .filter(s => s.status !== 'not_memorized')
          .map(s => s.pageNumber)
      );
      
      // Add unmemorized pages from this surah
      const pages = direction === 'forward' 
        ? Array.from({length: surah.endPage - surah.startPage + 1}, (_, i) => surah.startPage + i)
        : Array.from({length: surah.endPage - surah.startPage + 1}, (_, i) => surah.endPage - i);
        
      for (const page of pages) {
        if (nextPages.length >= count) break;
        if (!memorizedPageNumbers.has(page)) {
          nextPages.push({
            surahNumber: surah.number,
            pageNumber: page,
            surahName: surah.nameEnglish
          });
        }
      }
    } else {
      // For completely unmemorized surahs, start from the beginning (or end if reverse)
      const startPage = direction === 'forward' ? surah.startPage : surah.endPage;
      const endPage = direction === 'forward' ? surah.endPage : surah.startPage;
      const step = direction === 'forward' ? 1 : -1;
      
      for (let page = startPage; 
           direction === 'forward' ? page <= endPage : page >= endPage; 
           page += step) {
        if (nextPages.length >= count) break;
        nextPages.push({
          surahNumber: surah.number,
          pageNumber: page,
          surahName: surah.nameEnglish
        });
      }
    }
  }
  
  return nextPages.slice(0, count);
};

// Main schedule generation function
const generateSchedule = async (req, res) => {
  try {
    const { name, startDate, totalDays, dailyNewPages, direction = 'forward' } = req.body;
    const userId = req.body.userId || 'default_user';
    
    if (!name || !startDate || !totalDays || !dailyNewPages) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, startDate, totalDays, dailyNewPages' 
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + totalDays - 1);
    
    // Get categorized memorization status
    const memorizedPages = await getMemorizedPagesByStatus(userId);
    
    // Calculate total revision content
    const totalPerfect = memorizedPages.perfect.length;
    const totalMedium = memorizedPages.medium.length;
    const totalBad = memorizedPages.bad.length;
    
    // Calculate daily revision amounts (adjusting to finish all memorized content in 10 days)
    const dailyPerfect = Math.ceil(totalPerfect / 10);
    const dailyMedium = Math.ceil(totalMedium / 10);
    
    const dailySchedule = [];
    let perfectIndex = 0;
    let mediumIndex = 0;
    let newPagesConsumed = 0;
    
    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);
      const dayOfWeek = getDayOfWeek(currentDate);
      
      const assignments = [];
      
      // Add revision from perfect memorized content (60% priority)
      const perfectToAdd = Math.min(dailyPerfect, totalPerfect - perfectIndex);
      for (let i = 0; i < perfectToAdd; i++) {
        if (perfectIndex < memorizedPages.perfect.length) {
          const page = memorizedPages.perfect[perfectIndex];
          assignments.push({
            type: 'revision',
            surahNumber: page.surahNumber,
            pageNumber: page.pageNumber,
            status: 'perfect',
            description: 'Perfect revision'
          });
          perfectIndex++;
        }
      }
      
      // Add revision from medium memorized content (15% priority)
      const mediumToAdd = Math.min(dailyMedium, totalMedium - mediumIndex);
      for (let i = 0; i < mediumToAdd; i++) {
        if (mediumIndex < memorizedPages.medium.length) {
          const page = memorizedPages.medium[mediumIndex];
          assignments.push({
            type: 'revision',
            surahNumber: page.surahNumber,
            pageNumber: page.pageNumber,
            status: 'medium',
            description: 'Medium revision'
          });
          mediumIndex++;
        }
      }
      
      // Add new material (10-20%)
      if (dailyNewPages > 0) {
        const newPages = await getNextPagesForMemorization(userId, dailyNewPages, direction);
        const startIndex = newPagesConsumed;
        const endIndex = Math.min(startIndex + dailyNewPages, newPages.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          if (newPages[i]) {
            assignments.push({
              type: 'new',
              surahNumber: newPages[i].surahNumber,
              pageNumber: newPages[i].pageNumber,
              status: 'not_memorized',
              description: `New memorization - ${newPages[i].surahName}`
            });
          }
        }
        newPagesConsumed += (endIndex - startIndex);
      }
      
      // Special Friday rule: Add Al-Kahf (Surah 18)
      if (dayOfWeek === 'Friday') {
        const alKahfStatus = await MemorizationStatus.find({ 
          userId, 
          surahNumber: 18 
        });
        
        if (alKahfStatus.length > 0) {
          // If any part is memorized, add for revision
          assignments.push({
            type: 'special',
            surahNumber: 18,
            pageNumber: 293, // Start page of Al-Kahf
            status: 'special',
            description: 'Al-Kahf - Friday Sunnah (Revision)'
          });
        } else {
          // If not memorized, add for reading
          assignments.push({
            type: 'special',
            surahNumber: 18,
            pageNumber: 293,
            status: 'special',
            description: 'Al-Kahf - Friday Sunnah (Reading)'
          });
        }
      }
      
      // Reset indices if we've finished all content (for rotation)
      if (perfectIndex >= memorizedPages.perfect.length) perfectIndex = 0;
      if (mediumIndex >= memorizedPages.medium.length) mediumIndex = 0;
      
      dailySchedule.push({
        date: currentDate,
        dayOfWeek,
        assignments
      });
    }
    
    // Create and save schedule
    const schedule = new Schedule({
      name,
      startDate: start,
      endDate: end,
      dailyNewPages,
      totalDays,
      direction,
      dailySchedule,
      userId
    });
    
    await schedule.save();
    
    res.json({
      message: 'Schedule generated successfully',
      schedule: {
        id: schedule._id,
        name: schedule.name,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        totalDays: schedule.totalDays,
        dailyNewPages: schedule.dailyNewPages,
        direction: schedule.direction,
        dailySchedule: schedule.dailySchedule
      }
    });
    
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ message: 'Error generating schedule', error: error.message });
  }
};

// Get all schedules
const getAllSchedules = async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const schedules = await Schedule.find({ userId }).sort({ createdAt: -1 });
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Error fetching schedules', error: error.message });
  }
};

// Get single schedule
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
    res.status(500).json({ message: 'Error fetching schedule', error: error.message });
  }
};

// Update assignment completion status
const updateAssignmentCompletion = async (req, res) => {
  try {
    const { scheduleId, dateString, assignmentIndex, completed } = req.body;
    
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    const daySchedule = schedule.dailySchedule.find(day => 
      day.date.toISOString().split('T')[0] === dateString
    );
    
    if (!daySchedule) {
      return res.status(404).json({ message: 'Day not found in schedule' });
    }
    
    if (assignmentIndex >= daySchedule.assignments.length) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    daySchedule.assignments[assignmentIndex].completed = completed;
    
    // Update completed days count
    const completedDays = schedule.dailySchedule.filter(day => 
      day.assignments.every(assignment => assignment.completed)
    ).length;
    
    schedule.completedDays = completedDays;
    
    // Update status
    if (completedDays === schedule.totalDays) {
      schedule.status = 'completed';
    }
    
    await schedule.save();
    
    res.json({ 
      message: 'Assignment updated successfully',
      completedDays: schedule.completedDays,
      status: schedule.status
    });
    
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};

// Delete schedule
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
    res.status(500).json({ message: 'Error deleting schedule', error: error.message });
  }
};

// Get today's assignments for active schedules
const getTodaysAssignments = async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeSchedules = await Schedule.find({ 
      userId, 
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    
    const todaysAssignments = [];
    
    activeSchedules.forEach(schedule => {
      const daySchedule = schedule.dailySchedule.find(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      });
      
      if (daySchedule) {
        todaysAssignments.push({
          scheduleId: schedule._id,
          scheduleName: schedule.name,
          date: daySchedule.date,
          dayOfWeek: daySchedule.dayOfWeek,
          assignments: daySchedule.assignments
        });
      }
    });
    
    res.json(todaysAssignments);
  } catch (error) {
    console.error('Error fetching today\'s assignments:', error);
    res.status(500).json({ message: 'Error fetching today\'s assignments', error: error.message });
  }
};

module.exports = {
  generateSchedule,
  getAllSchedules,
  getScheduleById,
  updateAssignmentCompletion,
  deleteSchedule,
  getTodaysAssignments
};