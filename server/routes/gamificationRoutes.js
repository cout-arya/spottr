const express = require('express');
const router = express.Router();
const { logActivity, getLeaderboard } = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/log', protect, logActivity);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
