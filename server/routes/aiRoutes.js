const express = require('express');
const router = express.Router();
const { generateDietPlan } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate-diet', protect, generateDietPlan);

module.exports = router;
