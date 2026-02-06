const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const debugBenchmarks = async () => {
    await connectDB();

    console.log('Connected to DB');

    // 1. Create a dummy user
    const email = 'debug_bench_' + Date.now() + '@test.com';
    const user = await User.create({
        name: 'Debug User',
        email: email,
        password: 'password123',
        profile: {
            benchmarks: { squat: '0', bench: '0', deadlift: '0' }
        }
    });

    console.log('Created user:', user.profile.benchmarks);

    // 2. Simulate Update Payload (Numeric values, like frontend)
    const reqBody = {
        profile: {
            benchmarks: {
                squat: 100,
                bench: 80,
                deadlift: 120
            }
        }
    };

    // 3. Simulate Controller Logic
    // Loop update
    for (const key in reqBody.profile) {
        user.profile[key] = reqBody.profile[key];
    }

    // Explicit nested update (my fix)
    if (reqBody.profile.benchmarks) {
        user.profile.benchmarks = {
            ...user.profile.benchmarks,
            ...reqBody.profile.benchmarks
        };
    }

    user.markModified('profile');

    console.log('Before Save (In Memory):', user.profile.benchmarks);

    try {
        await user.save();
        console.log('Saved successfully');
    } catch (err) {
        console.error('Save failed:', err);
    }

    // 4. Refetch
    const fetchedUser = await User.findById(user._id);
    console.log('Fetched from DB:', fetchedUser.profile.benchmarks);

    // Cleanup
    await User.deleteOne({ _id: user._id });
    console.log('Cleaned up');
    process.exit();
};

debugBenchmarks();
