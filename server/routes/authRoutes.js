const express = require('express');
const router = express.Router();
const { authUser, registerUser, authGoogle, demoLogin } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/google', authGoogle);
router.post('/demo-login', demoLogin);

module.exports = router;
