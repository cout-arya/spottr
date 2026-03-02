const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:matchId').get(protect, getMessages).post(protect, sendMessage);
router.route('/:matchId/read').put(protect, markAsRead);

module.exports = router;
