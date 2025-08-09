const express = require('express');
const router = express.Router();

// Test routes - minimal
router.get('/', (req, res) => {
  res.json({ message: 'Surahs endpoint working' });
});

router.get('/test/:id', (req, res) => {
  res.json({ message: 'Test param route', id: req.params.id });
});

module.exports = router;