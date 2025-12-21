const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config(); // Load env vars
// Force Restart Trigger

connectDB();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;




const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*", // Allow all for dev
    }
});

io.on('connection', (socket) => {
    console.log('Connected to socket.io');

    socket.on('setup', (userData) => {
        socket.join(userData._id);
        console.log(userData._id);
        socket.emit('connected');
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('User Joined Room: ' + room);
    });

    socket.on('new message', (newMessageRecieved) => {
        var chat = newMessageRecieved.matchId; // Assuming matchId is the room

        if (!chat) return console.log('chat.users not defined');

        // In a real app we'd iterate users and emit, but here simple room emit
        // socket.in(chat).emit('message received', newMessageRecieved);
        // Actually simpler: 
        socket.to(newMessageRecieved.matchId).emit('message received', newMessageRecieved);
    });
});

// Server is running (Restart Triggered v2)
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
