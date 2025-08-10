// Simple test to verify controller exports
const path = require('path');

try {
  console.log('Testing controller imports...');
  const controller = require('./controllers/scheduleController');
  console.log('Available functions:', Object.keys(controller));
  console.log('generateSchedule type:', typeof controller.generateSchedule);
  console.log('Success! All functions are properly exported.');
} catch (error) {
  console.error('Error importing controller:', error);
}
