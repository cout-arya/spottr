const express = require('express');
const router = express.Router();
const { generateDietPlan, analyzeLog } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate-diet', protect, generateDietPlan);
router.post('/analyze-log', protect, analyzeLog);

module.exports = router;
