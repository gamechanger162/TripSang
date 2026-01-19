import 'dotenv/config'; // Load env vars before anything else
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';


const app = express();
const httpServer = createServer(app);

// CORS Configuration
const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://tripsang.com',
    'https://www.tripsang.com',
    'https://tripsang.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001'
].filter(Boolean); // Remove undefined values

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Configuration
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME || 'tripsang'
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

import jwt from 'jsonwebtoken';
import { Message, User } from './models/index.js';

// Socket.io Middleware for Authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('name _id');

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        socket.user = user;
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
    }
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.user.name} (${socket.id})`);

    // Join Room Event
    socket.on('join_room', async ({ tripId }) => {
        try {
            if (!tripId) return;

            socket.join(tripId);
            console.log(`👤 ${socket.user.name} joined room: ${tripId}`);

            // Fetch chat history
            const history = await Message.find({ tripId })
                .sort({ timestamp: 1 })
                .limit(50); // Limit to last 50 messages

            // Send history to user
            socket.emit('message_history', history);

            // Notify others in room
            socket.to(tripId).emit('user_joined', { userName: socket.user.name });

        } catch (error) {
            console.error('Join room error:', error);
        }
    });

    // Send Message Event
    socket.on('send_message', async (data) => {
        try {
            const { tripId, message } = data;

            if (!tripId || !message) return;

            // Save message to database
            const savedMessage = await Message.create({
                tripId,
                senderId: socket.user._id,
                senderName: socket.user.name,
                message,
                timestamp: new Date()
            });

            // Broadcast to everyone in room (including sender)
            io.to(tripId).emit('receive_message', savedMessage);

        } catch (error) {
            console.error('Send message error:', error);
        }
    });

    // Leave Room Event
    socket.on('leave_room', ({ tripId }) => {
        if (tripId) {
            socket.leave(tripId);
            socket.to(tripId).emit('user_left', { userName: socket.user.name });
            console.log(`👋 ${socket.user.name} left room: ${tripId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.user.name} (${socket.id})`);
    });
});

// Make io accessible to routes
app.set('io', io);

// Health Check Route
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'TripSang API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Import Routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import tripRoutes from './routes/trips.js';
import paymentRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviewRoutes.js';
import announcementRoutes from './routes/announcements.js';
import messageRoutes from './routes/messages.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
// app.use('/api/users', userRoutes); // TODO: Add user profile routes



// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Allowed Origins:`, allowedOrigins);
    });
};

startServer();

export { io };
