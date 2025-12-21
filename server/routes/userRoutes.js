const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/search').get(protect, searchUsers);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

module.exports = router;
