const express = require('express');
const router = express.Router();
const { generateDietPlan, analyzeLog, regenerateMeal } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate-diet', protect, generateDietPlan);
router.post('/analyze-log', protect, analyzeLog);
router.post('/regenerate-meal', protect, regenerateMeal);

module.exports = router;
