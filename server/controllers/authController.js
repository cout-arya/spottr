const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');

// The user named their env var "cid" based on the .env file contents
const client = new OAuth2Client(process.env.cid);

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profile: user.profile,
            gamification: user.gamification,
            preferences: user.preferences,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    console.log('Register request received:', { body: req.body });

    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        console.error('Missing required fields:', { name: !!name, email: !!email, password: !!password });
        res.status(400);
        throw new Error('Please provide name, email, and password');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error('Invalid email format:', email);
        res.status(400);
        throw new Error('Please provide a valid email address');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        console.log('User already exists:', email);
        res.status(400);
        throw new Error('User already exists');
    }

    try {
        const user = await User.create({
            name,
            email,
            password,
            profile: {
                location: {
                    type: 'Point',
                    coordinates: [0, 0]
                }
            }
        });

        if (user) {
            console.log('User created successfully:', user._id);
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                profile: user.profile,
                gamification: user.gamification,
                preferences: user.preferences,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(400);
        throw new Error(error.message || 'Failed to create user');
    }
});

// @desc    Auth user via Google
// @route   POST /api/auth/google
// @access  Public
const authGoogle = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('No token provided');
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.cid,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId, picture } = payload;

        let user = await User.findOne({ email });

        if (user) {
            // If user exists but no googleId, link it
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create a new user since one doesn't exist
            user = await User.create({
                name,
                email,
                googleId,
                // Generate random string for password since we don't need one for Google users
                password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
                profile: {
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    photos: picture ? [picture] : []
                }
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profile: user.profile,
            gamification: user.gamification,
            preferences: user.preferences,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401);
        throw new Error('Invalid Google token');
    }
});

module.exports = { authUser, registerUser, authGoogle };
