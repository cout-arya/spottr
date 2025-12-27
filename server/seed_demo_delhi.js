const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { Match, Interaction } = require('./models/Match');
const Message = require('./models/Message');
const ActivityLog = require('./models/ActivityLog');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedDelhiDemo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Delhi Demo Seed');

        // 1. Cleanup specific demo users (by email pattern or just clear all for clean slate?)
        // Let's clear ALL for a perfect walkthrough state
        await User.deleteMany({});
        await Match.deleteMany({});
        await Message.deleteMany({});
        await ActivityLog.deleteMany({});
        await Interaction.deleteMany({});
        console.log('🧹 Cleaned existing data');

        // 2. Create Main Demo User "Delhi Dave"
        const mainUser = await User.create({
            name: 'Dave Delhi',
            email: 'dave@example.com',
            password: 'password123',
            profile: {
                age: 25,
                gender: 'Male',
                city: 'New Delhi',
                fitnessLevel: 'Intermediate',
                gymType: 'Commercial',
                goals: ['Muscle Gain', 'Strength'],
                dietaryPreference: 'Non-vegetarian',
                availability: ['Evening'],
                bio: 'Looking for a spotter at Gold\'s Gym CP. Serious training only.',
                photos: ['https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1769&auto=format&fit=crop'],
                location: { type: 'Point', coordinates: [77.2090, 28.6139] },
                experienceYears: 3,
                benchmarks: { squat: '100kg', bench: '80kg', deadlift: '140kg' },
                lifestyle: { smoker: 'No', alcohol: 'Occasional', sleep: 'Early' },
                commitment: 'Consistent',
                gymPersonality: 'Motivator',
                weight: 78,
                height: 178
            },
            gamification: {
                xp: 1250,
                level: 5,
                streak: 12,
                badges: ['Consistent', 'Early Bird']
            },
            plans: {
                diet: {
                    dailyCalories: 2600,
                    macros: { protein: '180g', carbs: '300g', fats: '80g' },
                    meals: [
                        { name: 'Breakfast', items: ['Oats', 'Whey Protein', 'Almonds'] },
                        { name: 'Lunch', items: ['Grilled Chicken', 'Rice', 'Broccoli'] },
                        { name: 'Dinner', items: ['Fish', 'Quinoa', 'Salad'] }
                    ]
                },
                workout: {
                    split: 'Push Pull Legs',
                    schedule: ['Push', 'Pull', 'Legs', 'Rest']
                }
            }
        });
        console.log('✅ Created Main User: Delhi Dave');

        // 3. Create 4 Other Delhi Users
        const usersData = [
            {
                name: 'Priya Power',
                email: 'priya@example.com',
                password: 'password123',
                profile: {
                    age: 24,
                    gender: 'Female',
                    city: 'New Delhi',
                    fitnessLevel: 'Advanced',
                    gymType: 'Iron Paradise',
                    goals: ['Strength'],
                    bio: 'Powerlifting state champ. Need a spotter for squats.',
                    photos: ['https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=1887&auto=format&fit=crop'],
                    location: { type: 'Point', coordinates: [77.2100, 28.6100] },
                    experienceYears: 5
                },
                gamification: { xp: 3000, level: 12 }
            },
            {
                name: 'Rahul Runner',
                email: 'rahul@example.com',
                password: 'password123',
                profile: {
                    age: 27,
                    gender: 'Male',
                    city: 'New Delhi',
                    fitnessLevel: 'Beginner',
                    gymType: 'Anytime Fitness',
                    goals: ['Endurance', 'Fat Loss'],
                    bio: 'Training for my first half marathon.',
                    photos: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1740&auto=format&fit=crop'],
                    location: { type: 'Point', coordinates: [77.2200, 28.6200] },
                    experienceYears: 1
                },
                gamification: { xp: 500, level: 2 }
            },
            {
                name: 'Amit Abs',
                email: 'amit@example.com',
                password: 'password123',
                profile: {
                    age: 29,
                    gender: 'Male',
                    city: 'New Delhi',
                    fitnessLevel: 'Advanced',
                    gymType: 'Cult Fit',
                    goals: ['Aesthetics'],
                    bio: 'Aesthetics over everything. Shredded life.',
                    photos: ['https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1770&auto=format&fit=crop'],
                    location: { type: 'Point', coordinates: [77.2000, 28.6000] },
                    experienceYears: 6
                },
                gamification: { xp: 2100, level: 8 }
            },
            {
                name: 'Simran Squat',
                email: 'simran@example.com',
                password: 'password123',
                profile: {
                    age: 26,
                    gender: 'Female',
                    city: 'New Delhi',
                    fitnessLevel: 'Intermediate',
                    gymType: 'Gold\'s Gym',
                    goals: ['Glule Growth', 'Toning'],
                    bio: 'Leg day is the best day. Let\'s train!',
                    photos: ['https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1887&auto=format&fit=crop'], // Reusing a gym pic
                    location: { type: 'Point', coordinates: [77.2300, 28.6300] },
                    experienceYears: 3
                },
                gamification: { xp: 1500, level: 6 }
            }
        ];

        const createdUsers = [];
        for (const u of usersData) {
            createdUsers.push(await User.create(u));
        }
        console.log('✅ Created 4 Delhi Users');

        // 4. Create Matches (Dave with Priya and Rahul)
        const match1 = await Match.create({ users: [mainUser._id, createdUsers[0]._id] }); // Priya
        const match2 = await Match.create({ users: [mainUser._id, createdUsers[1]._id] }); // Rahul
        console.log('✅ Created Matches');

        // 5. Create Messages
        await Message.create({ matchId: match1._id, senderId: createdUsers[0]._id, content: 'Hey Dave! Saw you lift heavy today.' });
        await Message.create({ matchId: match1._id, senderId: mainUser._id, content: 'Thanks Priya! Trying to PR on squats.' });
        await Message.create({ matchId: match1._id, senderId: createdUsers[0]._id, content: 'Nice! I can spot you tomorrow if you want.' });

        await Message.create({ matchId: match2._id, senderId: mainUser._id, content: 'Yo Rahul, running today?' });
        await Message.create({ matchId: match2._id, senderId: createdUsers[1]._id, content: 'Yeah, hitting Lodhi Garden in the evening. Join?' });
        console.log('✅ Created Chats');

        // 6. Create Interactions (for "already met" logic)
        await Interaction.create({ actorId: mainUser._id, targetId: createdUsers[0]._id, type: 'like' });
        await Interaction.create({ actorId: createdUsers[0]._id, targetId: mainUser._id, type: 'like' });

        await Interaction.create({ actorId: mainUser._id, targetId: createdUsers[1]._id, type: 'like' });
        await Interaction.create({ actorId: createdUsers[1]._id, targetId: mainUser._id, type: 'like' });
        // Simran liked Dave (Dave hasn't seen yet - for Notification)
        await Interaction.create({ actorId: createdUsers[3]._id, targetId: mainUser._id, type: 'like' });

        // 7. Create Activity Logs
        await ActivityLog.create({ userId: mainUser._id, type: 'workout', xpEarned: 100, details: 'Heavy Chest Day' });
        await ActivityLog.create({ userId: mainUser._id, type: 'meal', xpEarned: 20, details: 'Logged Lunch: Chicken Salad' });
        await ActivityLog.create({ userId: mainUser._id, type: 'match', xpEarned: 50, details: 'New Match: Priya Power' });
        console.log('✅ Created Logs');

        console.log('🎉 Setup Complete!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedDelhiDemo();
