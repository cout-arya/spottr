const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Match, Interaction } = require('./models/Match');
const Message = require('./models/Message');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const clearData = async () => {
    await connectDB();

    try {
        await Match.deleteMany({});
        console.log('Matches cleared.');

        await Interaction.deleteMany({});
        console.log('Interactions cleared.');

        await Message.deleteMany({});
        console.log('Messages cleared.');

        console.log('All chat and notification test data destroyed.');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

clearData();
