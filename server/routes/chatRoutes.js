const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:matchId').get(protect, getMessages).post(protect, sendMessage);

module.exports = router;
