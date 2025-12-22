const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const users = [
    {
        name: 'The Beast',
        email: 'beast@example.com',
        password: 'password123',
        profile: {
            age: 28,
            gender: 'Male',
            city: 'Metro City',
            fitnessLevel: 'Advanced',
            gymType: 'Powerlifting Gym',
            goals: ['Strength', 'Muscle Gain'],
            availability: ['Evening', 'Weekends'],
            bio: 'Bench, Deadlift, Squat. That is all.',
            photos: ['https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1887&auto=format&fit=crop'],
            location: { type: 'Point', coordinates: [-118.2437, 34.0522] },
            benchmarks: { squat: '100kg+', bench: '100kg+', deadlift: '100kg+' },
            lifestyle: { smoker: 'No', alcohol: 'Occasional', sleep: 'Early' },
            commitment: 'Hardcore',
            gymPersonality: 'Motivator',
            experienceYears: 7
        },
        gamification: { level: 25, streak: 112, badges: ['Warrior', 'Heavy Lifter'] }
    },
    {
        name: 'Newbie Nancy',
        email: 'nancy@example.com',
        password: 'password123',
        profile: {
            age: 23,
            gender: 'Female',
            city: 'Metro City',
            fitnessLevel: 'Beginner',
            dietaryPreference: 'Vegetarian',
            gymType: 'Commercial',
            goals: ['General fitness', 'Fat loss'],
            availability: ['Morning'],
            bio: 'Just started my journey! Looking for a friendly gym buddy.',
            photos: ['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1770&auto=format&fit=crop'],
            location: { type: 'Point', coordinates: [-118.2450, 34.0530] },
            benchmarks: { squat: 'None', bench: 'None', deadlift: 'None' },
            lifestyle: { smoker: 'No', alcohol: 'Occasional', sleep: 'Late' },
            commitment: 'Casual',
            gymPersonality: 'Learner',
            experienceYears: 0
        },
        gamification: { level: 2, streak: 3, badges: ['Newbie'] }
    },
    {
        name: 'CrossFit Chris',
        email: 'chris@example.com',
        password: 'password123',
        profile: {
            age: 26,
            gender: 'Male',
            city: 'Metro City',
            fitnessLevel: 'Advanced',
            gymType: 'CrossFit',
            dietaryPreference: 'Non-vegetarian',
            goals: ['Endurance', 'Strength'],
            availability: ['Early Morning', 'Weekends'],
            bio: 'WODs and community. Let\'s crush it together.',
            photos: ['https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1770&auto=format&fit=crop'],
            location: { type: 'Point', coordinates: [-118.2500, 34.0600] },
            benchmarks: { squat: '100kg+', bench: '60-100kg', deadlift: '100kg+' },
            lifestyle: { smoker: 'No', alcohol: 'None', sleep: 'Early' },
            commitment: 'Consistent',
            gymPersonality: 'Social',
            experienceYears: 4
        },
        gamification: { level: 12, streak: 45, badges: ['Early Bird'] }
    },
    {
        name: 'Yogi Yasmin',
        email: 'yasmin@example.com',
        password: 'password123',
        profile: {
            age: 29,
            gender: 'Female',
            city: 'Metro City',
            fitnessLevel: 'Intermediate',
            gymType: 'Commercial',
            goals: ['Flexibility', 'General fitness'],
            dietaryPreference: 'Eggetarian',
            availability: ['Morning', 'Evening'],
            bio: 'Balance is key. Yoga and light weights.',
            photos: ['https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1770&auto=format&fit=crop'],
            location: { type: 'Point', coordinates: [-118.2400, 34.0500] },
            benchmarks: { squat: '<60kg', bench: '<60kg', deadlift: '<60kg' },
            lifestyle: { smoker: 'No', alcohol: 'Frequent', sleep: 'Early' },
            commitment: 'Consistent',
            gymPersonality: 'Planner',
            experienceYears: 3
        },
        gamification: { level: 8, streak: 20, badges: ['Zen Master'] }
    },
    {
        name: 'Balanced Bob',
        email: 'bob@example.com',
        password: 'password123',
        profile: {
            age: 32,
            gender: 'Male',
            city: 'Metro City',
            fitnessLevel: 'Intermediate',
            gymType: 'Commercial',
            goals: ['Muscle Gain', 'General fitness'],
            availability: ['Afternoon'],
            bio: 'Headphones on, world off. Just getting the work done.',
            photos: ['https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1769&auto=format&fit=crop'],
            location: { type: 'Point', coordinates: [-118.2300, 34.0400] },
            benchmarks: { squat: '60-100kg', bench: '60-100kg', deadlift: '60-100kg' },
            lifestyle: { smoker: 'Yes', alcohol: 'Occasional', sleep: 'Irregular' },
            commitment: 'Consistent',
            gymPersonality: 'Silent grinder',
            experienceYears: 5
        },
        gamification: { level: 10, streak: 15, badges: ['Consistent'] }
    }
];

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clean up existing test users first
        // Clean up all existing users for a fresh start
        await User.deleteMany({});
        console.log('Cleaned old test users');

        // Check if users already exist to avoid dupes (by email) - actually we just deleted them so create fresh
        for (const user of users) {
            // Note: User model pre-save hook handles hashing
            // We verify this by logging
            const newUser = new User(user);
            await newUser.save();
            console.log(`Created user: ${user.name}`);
        }

        console.log('Seeding complete!');
        process.exit();
    } catch (error) {
        console.error('Error seeding users:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
};

seedUsers();
