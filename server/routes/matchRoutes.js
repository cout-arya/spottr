const express = require('express');
const router = express.Router();
const { getRecommendations, swipe, getMatches, resetInteractions, getLikedUsers } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/recommendations', protect, getRecommendations);
router.get('/liked', protect, getLikedUsers);
router.post('/swipe', protect, swipe);
router.get('/', protect, getMatches);
router.post('/reset-interactions', protect, resetInteractions);

module.exports = router;
