const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://spottr-1.onrender.com'
];

dotenv.config(); // Load env vars
// Force Restart Trigger v2

connectDB();

const app = express();

// Log environment diagnostics
console.log('=================================');
console.log('Environment Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 5000);
console.log('MONGO_URI:', process.env.MONGO_URI ? '✓ Set' : '✗ Not Set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Not Set');
console.log('=================================');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Error handling middleware - must be after routes
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;




const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set('io', io);

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

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));
});

// Server is running (Restart Triggered v3)
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
