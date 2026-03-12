/**
 * Demo Account Seeder
 * 
 * Run: node server/scripts/seedDemo.js
 * 
 * Creates a demo account with 5 friends, matches, messages,
 * and gamification data for recruiter testing.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load env from server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const { Interaction, Match } = require('../models/Match');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');

const DEMO_EMAIL = 'demo@spottr.com';

// ── Demo Users Data ──────────────────────────────────────────────
const demoUser = {
    name: 'Arjun Mehta',
    email: DEMO_EMAIL,
    password: 'demo123',
    profile: {
        age: 24,
        gender: 'Male',
        location: { type: 'Point', coordinates: [77.1025, 28.7041] },
        state: 'Delhi',
        city: 'New Delhi',
        height: 178,
        weight: 76,
        dietaryPreference: 'Non-vegetarian',
        fitnessLevel: 'Intermediate',
        goals: ['Muscle Gain', 'Strength Training', 'General Fitness'],
        gymType: 'Gym',
        diet: 'High Protein',
        availability: ['Morning', 'Evening'],
        bio: 'Pushing iron and pushing limits. Looking for a consistent training partner who takes PRs seriously. Let\'s grow together 💪',
        photos: [
            'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400&h=400&fit=crop&crop=face',
        ],
        experienceYears: 3,
        benchmarks: { squat: 120, bench: 85, deadlift: 150 },
        commitment: 'Consistent',
        lifestyle: { smoker: 'No', alcohol: 'Occasional', sleep: 'Early' },
        gymPersonality: 'Motivator',
    },
    gamification: {
        xp: 3750,
        level: 6,
        streak: 14,
        badges: ['Streak Master 🔥', 'Dedicated 🛡️'],
        lastActivity: new Date(),
    },
    preferences: {
        gender: 'Any',
        ageRange: { min: 18, max: 35 },
        maxDistance: 25,
    },
    plans: {
        diet: {
            calories: 2400,
            protein: 180,
            meals: [
                {
                    name: 'Breakfast',
                    food: 'Paneer Bhurji with Multigrain Roti + Whey Shake',
                    calories: 650,
                    protein: 48,
                    suggestion: 'Add a handful of almonds for healthy fats and sustained energy throughout the morning.',
                },
                {
                    name: 'Lunch',
                    food: 'Grilled Chicken Breast with Brown Rice & Rajma',
                    calories: 700,
                    protein: 52,
                    suggestion: 'Include a side of cucumber raita for better digestion.',
                },
                {
                    name: 'Snack',
                    food: 'Sprouts Chaat with Peanut Butter Toast',
                    calories: 350,
                    protein: 25,
                    suggestion: 'Great pre-workout option. Have this 45 min before hitting the gym.',
                },
                {
                    name: 'Dinner',
                    food: 'Egg Curry (4 eggs) with Quinoa Pulao',
                    calories: 700,
                    protein: 55,
                    suggestion: 'Keep dinner at least 2 hours before sleep for optimal recovery.',
                },
            ],
            advice: 'You\'re on an intermediate bulk phase. Focus on hitting 180g protein daily and keep carb timing around your workouts for maximum gains.',
        },
    },
};

const buddyUsers = [
    {
        name: 'Rahul Sharma',
        email: 'demo_buddy1@spottr.com',
        password: 'demo123',
        profile: {
            age: 26,
            gender: 'Male',
            location: { type: 'Point', coordinates: [77.1025, 28.7041] },
            state: 'Delhi',
            city: 'New Delhi',
            height: 182,
            weight: 88,
            dietaryPreference: 'Non-vegetarian',
            fitnessLevel: 'Advanced',
            goals: ['Powerlifting', 'Strength Training'],
            gymType: 'Gym',
            diet: 'High Protein',
            availability: ['Morning'],
            bio: 'National-level powerlifter. Chasing a 200kg deadlift. Need a spotter who doesn\'t skip Mondays.',
            photos: [
                'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=400&fit=crop&crop=face',
            ],
            experienceYears: 6,
            benchmarks: { squat: 180, bench: 130, deadlift: 195 },
            commitment: 'Hardcore',
            lifestyle: { smoker: 'No', alcohol: 'None', sleep: 'Early' },
            gymPersonality: 'Silent grinder',
        },
        gamification: {
            xp: 5200,
            level: 7,
            streak: 21,
            badges: ['Streak Master 🔥', 'Dedicated 🛡️', 'The Machine 🤖'],
            lastActivity: new Date(),
        },
        preferences: { gender: 'Any', ageRange: { min: 20, max: 35 }, maxDistance: 20 },
    },
    {
        name: 'Priya Iyer',
        email: 'demo_buddy2@spottr.com',
        password: 'demo123',
        profile: {
            age: 23,
            gender: 'Female',
            location: { type: 'Point', coordinates: [77.1025, 28.7041] },
            state: 'Delhi',
            city: 'New Delhi',
            height: 165,
            weight: 58,
            dietaryPreference: 'Vegetarian',
            fitnessLevel: 'Intermediate',
            goals: ['Yoga', 'Flexibility', 'Weight Loss'],
            gymType: 'Yoga Studio',
            diet: 'Balanced',
            availability: ['Morning', 'Evening'],
            bio: 'Yoga practitioner transitioning into strength training. Looking for someone to guide me through compounds.',
            photos: [
                'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&crop=face',
            ],
            experienceYears: 2,
            benchmarks: { squat: 50, bench: 25, deadlift: 60 },
            commitment: 'Consistent',
            lifestyle: { smoker: 'No', alcohol: 'None', sleep: 'Early' },
            gymPersonality: 'Learner',
        },
        gamification: {
            xp: 2800,
            level: 5,
            streak: 9,
            badges: ['Streak Master 🔥', 'Early Bird 🌅'],
            lastActivity: new Date(),
        },
        preferences: { gender: 'Any', ageRange: { min: 20, max: 30 }, maxDistance: 15 },
    },
    {
        name: 'Vikram Rajput',
        email: 'demo_buddy3@spottr.com',
        password: 'demo123',
        profile: {
            age: 28,
            gender: 'Male',
            location: { type: 'Point', coordinates: [77.1025, 28.7041] },
            state: 'Delhi',
            city: 'New Delhi',
            height: 175,
            weight: 82,
            dietaryPreference: 'Eggetarian',
            fitnessLevel: 'Advanced',
            goals: ['CrossFit', 'Endurance', 'Functional Fitness'],
            gymType: 'CrossFit Box',
            diet: 'Keto',
            availability: ['Evening'],
            bio: 'CrossFit addict. If it doesn\'t involve a barbell, a rope, or a wall ball, count me out. WOD partners welcome.',
            photos: [
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop&crop=face',
            ],
            experienceYears: 5,
            benchmarks: { squat: 140, bench: 95, deadlift: 170 },
            commitment: 'Hardcore',
            lifestyle: { smoker: 'No', alcohol: 'Occasional', sleep: 'Late' },
            gymPersonality: 'Social',
        },
        gamification: {
            xp: 4100,
            level: 6,
            streak: 12,
            badges: ['Streak Master 🔥', 'Dedicated 🛡️'],
            lastActivity: new Date(),
        },
        preferences: { gender: 'Any', ageRange: { min: 20, max: 35 }, maxDistance: 30 },
    },
    {
        name: 'Sneha Kulkarni',
        email: 'demo_buddy4@spottr.com',
        password: 'demo123',
        profile: {
            age: 25,
            gender: 'Female',
            location: { type: 'Point', coordinates: [77.1025, 28.7041] },
            state: 'Delhi',
            city: 'New Delhi',
            height: 168,
            weight: 62,
            dietaryPreference: 'Vegan',
            fitnessLevel: 'Intermediate',
            goals: ['Bodybuilding', 'Muscle Gain', 'Physique'],
            gymType: 'Gym',
            diet: 'Plant-Based High Protein',
            availability: ['Morning', 'Afternoon'],
            bio: 'Vegan bodybuilder proving plants build muscle too 🌱 Looking for training partners who push hard.',
            photos: [
                'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&h=400&fit=crop&crop=face',
            ],
            experienceYears: 4,
            benchmarks: { squat: 90, bench: 50, deadlift: 110 },
            commitment: 'Consistent',
            lifestyle: { smoker: 'No', alcohol: 'None', sleep: 'Early' },
            gymPersonality: 'Planner',
        },
        gamification: {
            xp: 3200,
            level: 5,
            streak: 7,
            badges: ['Streak Master 🔥', 'Dedicated 🛡️', 'Early Bird 🌅'],
            lastActivity: new Date(),
        },
        preferences: { gender: 'Any', ageRange: { min: 20, max: 30 }, maxDistance: 20 },
    },
    {
        name: 'Aditya Nair',
        email: 'demo_buddy5@spottr.com',
        password: 'demo123',
        profile: {
            age: 22,
            gender: 'Male',
            location: { type: 'Point', coordinates: [77.1025, 28.7041] },
            state: 'Delhi',
            city: 'New Delhi',
            height: 172,
            weight: 70,
            dietaryPreference: 'Non-vegetarian',
            fitnessLevel: 'Beginner',
            goals: ['General Fitness', 'Weight Loss', 'Muscle Gain'],
            gymType: 'Gym',
            diet: 'Balanced',
            availability: ['Evening', 'Night'],
            bio: 'Just started my fitness journey 3 months ago. Down 8kg already! Need a buddy to keep me accountable.',
            photos: [
                'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=400&fit=crop&crop=face',
            ],
            experienceYears: 0,
            benchmarks: { squat: 40, bench: 30, deadlift: 50 },
            commitment: 'Casual',
            lifestyle: { smoker: 'No', alcohol: 'Occasional', sleep: 'Irregular' },
            gymPersonality: 'Learner',
        },
        gamification: {
            xp: 1500,
            level: 3,
            streak: 5,
            badges: ['Early Bird 🌅'],
            lastActivity: new Date(),
        },
        preferences: { gender: 'Any', ageRange: { min: 18, max: 30 }, maxDistance: 15 },
    },
];

// ── Messages between demo user and each buddy ────────────────────
const conversationTemplates = [
    // Buddy 0: Rahul Sharma (Powerlifter)
    [
        { fromDemo: false, content: 'Bhai, what\'s your current deadlift PR?' },
        { fromDemo: true, content: 'Hit 150 last week! Trying for 160 this month 💪' },
        { fromDemo: false, content: 'Nice! I\'m at 195, let\'s train together Saturday?' },
        { fromDemo: true, content: 'Done! Morning 7am works for me. Which gym?' },
        { fromDemo: false, content: 'Golds Gym, Rajouri Garden. See you there 🔥' },
    ],
    // Buddy 1: Priya Iyer (Yoga → Strength)
    [
        { fromDemo: true, content: 'Hey Priya! Saw you\'re getting into strength training. Happy to help!' },
        { fromDemo: false, content: 'That would be amazing! I\'m so lost with barbell exercises 😅' },
        { fromDemo: true, content: 'No worries, we all start somewhere. Let\'s begin with squats and deadlifts?' },
        { fromDemo: false, content: 'Yes please! When are you free this week?' },
    ],
    // Buddy 2: Vikram Rajput (CrossFit)
    [
        { fromDemo: false, content: 'Bro, tried this WOD today — 21-15-9 thrusters and pull-ups. Absolutely destroyed me.' },
        { fromDemo: true, content: 'Haha that\'s Fran! Classic CrossFit benchmark. What was your time?' },
        { fromDemo: false, content: '8:42. Need to get under 7 mins 😤' },
        { fromDemo: true, content: 'Let\'s do it together next week. Competition makes it faster!' },
        { fromDemo: false, content: 'You\'re on! Saturday 6pm at the box.' },
    ],
    // Buddy 3: Sneha Kulkarni (Vegan Bodybuilder)
    [
        { fromDemo: true, content: 'Your physique is insane for being fully vegan! What do you eat for protein?' },
        { fromDemo: false, content: 'Thanks! Lots of tofu, tempeh, lentils, and soy protein shakes 🌱' },
        { fromDemo: true, content: 'I definitely need to add more plant protein. Any meal prep tips?' },
        { fromDemo: false, content: 'I meal prep every Sunday. DM me and I\'ll share my full plan!' },
    ],
    // Buddy 4: Aditya Nair (Beginner)
    [
        { fromDemo: false, content: 'Hey! I\'m new to the gym and saw your profile. Can you help me with form?' },
        { fromDemo: true, content: 'Of course bro! What exercises are you doing currently?' },
        { fromDemo: false, content: 'Mostly machines and some dumbbell stuff. Too scared to try barbell 😂' },
        { fromDemo: true, content: 'Haha don\'t worry. Light weight + good form = progress. Let\'s start tomorrow?' },
        { fromDemo: false, content: 'You\'re a lifesaver! See you at 6pm 🙌' },
    ],
];

// ── Main Seeder Function ─────────────────────────────────────────
async function seedDemo() {
    try {
        console.log('🌱 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // ── Step 1: Clean up previous demo data ──
        console.log('\n🧹 Cleaning up previous demo data...');
        const demoEmails = [DEMO_EMAIL, ...buddyUsers.map(b => b.email)];
        const existingUsers = await User.find({ email: { $in: demoEmails } });
        const existingIds = existingUsers.map(u => u._id);

        if (existingIds.length > 0) {
            await Interaction.deleteMany({
                $or: [
                    { actorId: { $in: existingIds } },
                    { targetId: { $in: existingIds } },
                ],
            });
            await Match.deleteMany({ users: { $in: existingIds } });
            await Message.deleteMany({
                $or: [
                    { senderId: { $in: existingIds } },
                ],
            });
            await ActivityLog.deleteMany({ userId: { $in: existingIds } });
            await User.deleteMany({ email: { $in: demoEmails } });
            console.log(`   Removed ${existingIds.length} old demo users and related data.`);
        }

        // ── Step 2: Create users ──
        console.log('\n👤 Creating demo users...');

        // Hash passwords manually to avoid the pre-save hook double-hashing issues
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('demo123', salt);

        const mainUser = await User.create({
            ...demoUser,
            password: hashedPassword,
        });
        // Bypass the pre-save password hashing since we already hashed
        mainUser.isModified = () => false;
        console.log(`   ✅ Created: ${mainUser.name} (${mainUser.email})`);

        const createdBuddies = [];
        for (const buddy of buddyUsers) {
            const created = await User.create({
                ...buddy,
                password: hashedPassword,
            });
            created.isModified = () => false;
            createdBuddies.push(created);
            console.log(`   ✅ Created: ${created.name} (${created.email})`);
        }

        // ── Step 3: Create mutual interactions + matches ──
        console.log('\n🤝 Creating matches...');
        const createdMatches = [];

        for (const buddy of createdBuddies) {
            // Both like each other
            await Interaction.create({ actorId: mainUser._id, targetId: buddy._id, type: 'like' });
            await Interaction.create({ actorId: buddy._id, targetId: mainUser._id, type: 'like' });

            // Create match
            const match = await Match.create({ users: [mainUser._id, buddy._id] });
            createdMatches.push(match);
            console.log(`   ✅ Matched: ${mainUser.name} ↔ ${buddy.name}`);
        }

        // ── Step 4: Seed messages ──
        console.log('\n💬 Seeding conversations...');
        for (let i = 0; i < createdMatches.length; i++) {
            const match = createdMatches[i];
            const buddy = createdBuddies[i];
            const convo = conversationTemplates[i];

            for (let j = 0; j < convo.length; j++) {
                const msg = convo[j];
                const senderId = msg.fromDemo ? mainUser._id : buddy._id;
                // Stagger timestamps so messages appear in order
                const timestamp = new Date(Date.now() - (convo.length - j) * 3600000); // 1 hour apart

                await Message.create({
                    matchId: match._id,
                    senderId,
                    content: msg.content,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                });
            }
            console.log(`   ✅ ${convo.length} messages seeded for chat with ${buddy.name}`);
        }

        // ── Done ──
        console.log('\n════════════════════════════════════════');
        console.log('🎉 Demo seeding complete!');
        console.log('════════════════════════════════════════');
        console.log(`\n   Demo Login: ${DEMO_EMAIL}`);
        console.log(`   Password:   demo123`);
        console.log(`   Main User:  ${mainUser.name} (ID: ${mainUser._id})`);
        console.log(`   Friends:    ${createdBuddies.map(b => b.name).join(', ')}`);
        console.log(`   Matches:    ${createdMatches.length}`);
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedDemo();
