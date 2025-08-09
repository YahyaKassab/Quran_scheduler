const express = require('express');
const router = express.Router();
const {
  generateSchedule,
  getAllSchedules,
  getScheduleById,
  updateAssignmentCompletion,
  deleteSchedule,
  getTodaysAssignments,
  testAlKahf
} = require('../controllers/scheduleController');

// Generate new schedule
router.post('/generate', generateSchedule);

// Test Al-Kahf generation
router.get('/test-alkahf', testAlKahf);

// Get all schedules
router.get('/', getAllSchedules);

// Get today's assignments
router.get('/today', getTodaysAssignments);

// Get single schedule by ID
router.get('/:id', getScheduleById);

// Update assignment completion status
router.put('/assignment/complete', updateAssignmentCompletion);

// Delete schedule
router.delete('/:id', deleteSchedule);

module.exports = router;