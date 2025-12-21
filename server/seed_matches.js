const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const { Interaction, Match } = require('./models/Match');

dotenv.config();

const seedMatches = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        if (users.length < 2) {
            console.log('Not enough users to match.');
            process.exit();
        }

        let matchCount = 0;

        // Simple strategy: Match everyone with everyone else
        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                const userA = users[i];
                const userB = users[j];

                // Create Interactions A -> B
                await Interaction.findOneAndUpdate(
                    { actorId: userA._id, targetId: userB._id },
                    { type: 'like' },
                    { upsert: true, new: true }
                );

                // Create Interactions B -> A
                await Interaction.findOneAndUpdate(
                    { actorId: userB._id, targetId: userA._id },
                    { type: 'like' },
                    { upsert: true, new: true }
                );

                // Create Match
                // Check if match exists already
                const existingMatch = await Match.findOne({
                    users: { $all: [userA._id, userB._id] }
                });

                if (!existingMatch) {
                    await Match.create({
                        users: [userA._id, userB._id]
                    });
                    console.log(`Matched: ${userA.name} <-> ${userB.name}`);
                    matchCount++;
                }
            }
        }

        console.log(`Seeding complete! Created ${matchCount} new matches.`);
        process.exit();
    } catch (error) {
        console.error('Error seeding matches:', error);
        process.exit(1);
    }
};

seedMatches();
