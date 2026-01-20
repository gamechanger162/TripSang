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
            const { tripId, message, type = 'text', imageUrl } = data;

            if (!tripId || (!message && type === 'text')) return;

            // Save message to database
            const savedMessage = await Message.create({
                tripId,
                senderId: socket.user._id,
                senderName: socket.user.name,
                message: message || '', // Text might be empty for images
                type,
                imageUrl,
                timestamp: new Date()
            });

            // Broadcast to everyone in room (including sender)
            io.to(tripId).emit('receive_message', savedMessage);

        } catch (error) {
            console.error('Send message error:', error);
        }
    });

    // Typing Indicator for Squad
    socket.on('typing_squad', ({ tripId, isTyping }) => {
        if (tripId) {
            socket.to(tripId).emit('user_typing_squad', {
                userId: socket.user._id,
                userName: socket.user.name,
                isTyping
            });
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

    // ========== DIRECT MESSAGING SOCKET EVENTS ==========

    // Join user-specific room for DM notifications
    socket.join(`user_${socket.user._id}`);

    // Join DM Conversation Event
    socket.on('join_dm_conversation', async ({ conversationId }) => {
        try {
            if (!conversationId) return;

            // Verify user is participant
            const { Conversation } = await import('./models/index.js');
            const conversation = await Conversation.findById(conversationId);

            if (!conversation || !conversation.participants.includes(socket.user._id)) {
                return socket.emit('error', { message: 'Unauthorized access to conversation' });
            }

            socket.join(`dm_${conversationId}`);
            console.log(`💬 ${socket.user.name} joined DM conversation: ${conversationId}`);
        } catch (error) {
            console.error('Join DM conversation error:', error);
            socket.emit('error', { message: 'Failed to join conversation' });
        }
    });

    // Send Direct Message Event
    socket.on('send_dm', async (data) => {
        try {
            const { conversationId, receiverId, message, type = 'text', imageUrl } = data;

            if (!conversationId || !receiverId || (!message && type === 'text')) {
                return socket.emit('error', { message: 'Missing required fields' });
            }

            const { Conversation, DirectMessage } = await import('./models/index.js');

            // Verify conversation exists and user is participant
            const conversation = await Conversation.findById(conversationId);
            if (!conversation || !conversation.participants.includes(socket.user._id)) {
                return socket.emit('error', { message: 'Unauthorized' });
            }

            // Save message to database
            const savedMessage = await DirectMessage.create({
                conversationId,
                sender: socket.user._id,
                receiver: receiverId,
                message: message || (type === 'image' ? 'Sent an image' : ''),
                type,
                imageUrl,
                timestamp: new Date()
            });

            // Update conversation lastMessage and increment unread for receiver
            conversation.lastMessage = {
                text: type === 'image' ? '📷 Sent an image' : message,
                sender: socket.user._id,
                timestamp: new Date()
            };
            conversation.incrementUnread(receiverId);
            await conversation.save();

            // Prepare message object for emit
            const messageData = {
                _id: savedMessage._id,
                conversationId,
                sender: socket.user._id.toString(),
                senderName: socket.user.name,
                receiver: receiverId,
                message: savedMessage.message,
                type: savedMessage.type,
                imageUrl: savedMessage.imageUrl,
                timestamp: savedMessage.timestamp,
                read: false
            };

            // Broadcast to conversation room (both sender and receiver if online)
            io.to(`dm_${conversationId}`).emit('receive_dm', messageData);

            // Send notification to receiver's user room (if not already in conversation)
            io.to(`user_${receiverId}`).emit('new_dm_notification', {
                conversationId,
                senderName: socket.user.name,
                senderId: socket.user._id,
                preview: type === 'image' ? '📷 Sent an image' : message.substring(0, 50),
                timestamp: new Date()
            });

            console.log(`📨 DM sent from ${socket.user.name} in conversation ${conversationId}`);
        } catch (error) {
            console.error('Send DM error:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Leave DM Conversation Event
    socket.on('leave_dm_conversation', ({ conversationId }) => {
        if (conversationId) {
            socket.leave(`dm_${conversationId}`);
            console.log(`💬 ${socket.user.name} left DM conversation: ${conversationId}`);
        }
    });

    // Typing Indicator for DM (optional)
    socket.on('typing_dm', ({ conversationId, isTyping }) => {
        if (conversationId) {
            socket.to(`dm_${conversationId}`).emit('user_typing_dm', {
                userId: socket.user._id,
                userName: socket.user.name,
                isTyping
            });
        }
    });

    // ========== END DM SOCKET EVENTS ==========

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
import uploadRoutes from './routes/upload.js';
import uploadRoutes from './routes/upload.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

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
