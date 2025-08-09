const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const MemorizationStatus = require('../models/MemorizationStatus');

// Get progress statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    
    // Get memorization statistics
    const statusCounts = await MemorizationStatus.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const stats = {
      perfect: 0,
      medium: 0,
      bad: 0,
      not_memorized: 0
    };
    
    statusCounts.forEach(item => {
      stats[item._id] = item.count;
    });
    
    // Get schedule statistics
    const scheduleStats = await Schedule.aggregate([
      { $match: { userId } },
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 },
        totalDays: { $sum: '$totalDays' },
        completedDays: { $sum: '$completedDays' }
      }}
    ]);
    
    const scheduleData = {
      active: { count: 0, totalDays: 0, completedDays: 0 },
      completed: { count: 0, totalDays: 0, completedDays: 0 },
      paused: { count: 0, totalDays: 0, completedDays: 0 }
    };
    
    scheduleStats.forEach(item => {
      scheduleData[item._id] = {
        count: item.count,
        totalDays: item.totalDays,
        completedDays: item.completedDays
      };
    });
    
    res.json({
      memorization: stats,
      schedules: scheduleData,
      totalPages: stats.perfect + stats.medium + stats.bad + stats.not_memorized
    });
    
  } catch (error) {
    console.error('Error fetching progress stats:', error);
    res.status(500).json({ message: 'Error fetching progress stats', error: error.message });
  }
});

// Get recent activity
router.get('/recent', async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recently updated memorization statuses
    const recentStatuses = await MemorizationStatus.find({ userId })
      .sort({ lastUpdated: -1 })
      .limit(limit)
      .populate('surahNumber');
    
    // Get recent schedule activities
    const recentSchedules = await Schedule.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5);
    
    res.json({
      recentMemorization: recentStatuses,
      recentSchedules: recentSchedules.map(schedule => ({
        id: schedule._id,
        name: schedule.name,
        status: schedule.status,
        completedDays: schedule.completedDays,
        totalDays: schedule.totalDays,
        updatedAt: schedule.updatedAt
      }))
    });
    
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Error fetching recent activity', error: error.message });
  }
});

module.exports = router;