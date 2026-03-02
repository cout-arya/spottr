const express = require('express');
const router = express.Router();
const { authUser, registerUser, authGoogle } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/google', authGoogle);

module.exports = router;
