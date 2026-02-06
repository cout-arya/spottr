const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const migrateBenchmarks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all users with string benchmarks
        const users = await User.find({
            $or: [
                { 'profile.benchmarks.squat': { $type: 'string' } },
                { 'profile.benchmarks.bench': { $type: 'string' } },
                { 'profile.benchmarks.deadlift': { $type: 'string' } }
            ]
        });

        console.log(`Found ${users.length} users with string benchmarks`);

        for (const user of users) {
            // Convert string benchmarks to numbers
            if (user.profile.benchmarks) {
                const squat = user.profile.benchmarks.squat;
                const bench = user.profile.benchmarks.bench;
                const deadlift = user.profile.benchmarks.deadlift;

                user.profile.benchmarks.squat = (squat === 'None' || !squat) ? 0 : Number(String(squat).replace('kg', ''));
                user.profile.benchmarks.bench = (bench === 'None' || !bench) ? 0 : Number(String(bench).replace('kg', ''));
                user.profile.benchmarks.deadlift = (deadlift === 'None' || !deadlift) ? 0 : Number(String(deadlift).replace('kg', ''));

                user.markModified('profile.benchmarks');
                await user.save();
                console.log(`✅ Migrated benchmarks for user: ${user.name}`);
            }
        }

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateBenchmarks();
