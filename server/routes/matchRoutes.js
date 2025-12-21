const express = require('express');
const router = express.Router();
const { getRecommendations, swipe, getMatches } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/recommendations', protect, getRecommendations);
router.post('/swipe', protect, swipe);
router.get('/', protect, getMatches);

module.exports = router;
