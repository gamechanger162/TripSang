import 'dotenv/config'; // Load env vars before anything else
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

// Rate limiting middleware
import { apiLimiter, authLimiter, uploadLimiter, createLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sendPushNotification } from './utils/push.js';


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

// Make io accessible to our router
app.set('io', io);

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
import { Message, User, Trip } from './models/index.js';

// Socket.io Middleware for Authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('name _id profilePicture');

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
                .limit(50)
                .populate('replyTo', 'senderName message type imageUrl'); // Limit to last 50 messages

            // Send history to user
            socket.emit('message_history', history);

            // Fetch and send pinned message if exists
            const trip = await Trip.findById(tripId).populate('pinnedMessage');
            if (trip && trip.pinnedMessage) {
                socket.emit('pinned_message', {
                    messageId: trip.pinnedMessage._id,
                    senderName: trip.pinnedMessage.senderName,
                    message: trip.pinnedMessage.message,
                    type: trip.pinnedMessage.type,
                    imageUrl: trip.pinnedMessage.imageUrl
                });
            }

            // Notify others in room
            socket.to(tripId).emit('user_joined', { userName: socket.user.name });

        } catch (error) {
            console.error('Join room error:', error);
        }
    });

    // Send Message Event
    socket.on('send_message', async (data) => {
        try {
            const { tripId, message, type = 'text', imageUrl, replyTo } = data;

            if (!tripId || (!message && type === 'text')) return;

            // Handle replyTo if it's an object (client sends object sometimes)
            let replyToId = replyTo;
            if (replyTo && typeof replyTo === 'object' && replyTo._id) {
                replyToId = replyTo._id;
            }

            // Save message to database
            const savedMessage = await Message.create({
                tripId,
                senderId: socket.user._id,
                senderName: socket.user.name,
                message: message || '', // Text might be empty for images
                type,
                imageUrl,
                replyTo: replyToId,
                timestamp: new Date()
            });

            // Populate replyTo and SENDER info
            const populatedMessage = await Message.findById(savedMessage._id)
                .populate('replyTo', 'senderName message type imageUrl')
                .populate('senderId', 'name profilePicture'); // Ensure sender profile pic is sent

            // Broadcast to everyone in room (including sender)
            io.to(tripId).emit('receive_message', populatedMessage);

            // Fetch Trip to get squad members for list updates
            // Also update trip's updatedAt to ensure it jumps to top of list on refresh
            const now = new Date();
            const trip = await Trip.findByIdAndUpdate(
                tripId,
                { $set: { updatedAt: now } },
                { new: true, runValidators: false }
            ).select('squadMembers updatedAt title');

            console.log(`📝 Updated trip "${trip?.title}" updatedAt to ${now.toISOString()}, saved: ${trip?.updatedAt?.toISOString()}`);

            if (trip && trip.squadMembers) {
                console.log(`📢 Broadcasting squad update to ${trip.squadMembers.length} members for trip ${tripId}`);
                trip.squadMembers.forEach(memberId => {
                    // Send list update to user's personal room
                    io.to(`user_${memberId}`).emit('squad_list_update', {
                        tripId,
                        message: message || (type === 'image' ? 'Sent an image' : 'New message'),
                        timestamp: new Date(),
                        senderName: socket.user.name,
                        unreadCount: 1 // Hint for frontend to increment
                    });
                    console.log(`   -> Sent to user_${memberId}`);
                });
            } else {
                console.log('⚠️ Trip not found or no squad members for broadcast');
            }

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

    // ========== MESSAGE PINNING EVENTS ==========
    socket.on('pin_message', async ({ tripId, messageId }) => {
        try {
            if (!tripId || !messageId) return;

            const Trip = mongoose.model('Trip');
            const trip = await Trip.findById(tripId);

            if (!trip) {
                return socket.emit('error', { message: 'Trip not found' });
            }

            // Check if user is squad member or creator
            const isSquadMember = trip.squadMembers.some(m => m.toString() === socket.user._id.toString());
            const isCreator = trip.creator.toString() === socket.user._id.toString();

            if (!isSquadMember && !isCreator) {
                return socket.emit('error', { message: 'Only squad members can pin messages' });
            }

            // Get the message to pin
            const pinnedMsg = await Message.findById(messageId);
            if (!pinnedMsg) {
                return socket.emit('error', { message: 'Message not found' });
            }

            // Update trip with pinned message and who pinned it
            trip.pinnedMessage = messageId;
            trip.pinnedBy = socket.user._id;
            await trip.save();

            // Broadcast to all in room
            io.to(tripId).emit('message_pinned', {
                messageId,
                message: pinnedMsg.message,
                senderName: pinnedMsg.senderName,
                type: pinnedMsg.type,
                imageUrl: pinnedMsg.imageUrl,
                pinnedBy: socket.user.name,
                pinnedById: socket.user._id.toString()
            });

            console.log(`📌 Message pinned in trip ${tripId} by ${socket.user.name}`);
        } catch (error) {
            console.error('Pin message error:', error);
            socket.emit('error', { message: 'Failed to pin message' });
        }
    });

    socket.on('unpin_message', async ({ tripId }) => {
        try {
            if (!tripId) return;

            const Trip = mongoose.model('Trip');
            const trip = await Trip.findById(tripId);

            if (!trip) {
                return socket.emit('error', { message: 'Trip not found' });
            }

            // Check if user is the one who pinned the message OR the trip creator
            const isPinner = trip.pinnedBy && trip.pinnedBy.toString() === socket.user._id.toString();
            const isCreator = trip.creator.toString() === socket.user._id.toString();

            if (!isPinner && !isCreator) {
                return socket.emit('error', { message: 'Only the person who pinned or trip creator can unpin' });
            }

            // Clear pinned message and pinnedBy
            trip.pinnedMessage = null;
            trip.pinnedBy = null;
            await trip.save();

            // Broadcast to all in room
            io.to(tripId).emit('message_unpinned', {
                unpinnedBy: socket.user.name
            });

            console.log(`📌 Message unpinned in trip ${tripId} by ${socket.user.name}`);
        } catch (error) {
            console.error('Unpin message error:', error);
            socket.emit('error', { message: 'Failed to unpin message' });
        }
    });

    // ========== MESSAGE DELETION EVENTS ==========
    socket.on('delete_message', async ({ tripId, messageId }) => {
        try {
            if (!tripId || !messageId) return;

            const Trip = mongoose.model('Trip');
            const trip = await Trip.findById(tripId);

            if (!trip) {
                return socket.emit('error', { message: 'Trip not found' });
            }

            const message = await Message.findById(messageId);
            if (!message) {
                return socket.emit('error', { message: 'Message not found' });
            }

            // Check permissions: sender OR trip creator
            const isSender = message.senderId.toString() === socket.user._id.toString();
            const isCreator = trip.creator.toString() === socket.user._id.toString();

            if (!isSender && !isCreator) {
                return socket.emit('error', { message: 'Unauthorized to delete this message' });
            }

            // Delete message from DB
            await Message.findByIdAndDelete(messageId);

            // If this was the pinned message, clear it
            if (trip.pinnedMessage && trip.pinnedMessage.toString() === messageId) {
                trip.pinnedMessage = null;
                trip.pinnedBy = null;
                await trip.save();
                io.to(tripId).emit('message_unpinned', { unpinnedBy: 'System' });
            }

            // Broadcast to all in room
            io.to(tripId).emit('message_deleted', { messageId });
            console.log(`🗑️ Message ${messageId} deleted in trip ${tripId} by ${socket.user.name}`);

        } catch (error) {
            console.error('Delete message error:', error);
            socket.emit('error', { message: 'Failed to delete message' });
        }
    });

    // ========== COLLABORATIVE MAP EVENTS ==========
    socket.on('map_action', async ({ tripId, waypoints }) => {
        try {
            if (!tripId || !waypoints) return;

            // Broadcast to others in the room immediately for real-time feel
            socket.to(tripId).emit('map_update', { waypoints, updatedBy: socket.user.name });

            // Persist to database
            const Trip = mongoose.model('Trip');
            await Trip.findByIdAndUpdate(tripId, { waypoints });
            console.log(`🗺️ Map updated for trip ${tripId}, saved ${waypoints.length} waypoints.`);

        } catch (error) {
            console.error('Map action error:', error);
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

            if (!conversation || !conversation.participants.some(p => p.toString() === socket.user._id.toString())) {
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
            console.log('--- send_dm received ---');
            console.log('Data:', JSON.stringify(data, null, 2));
            console.log('Socket User:', socket.user ? socket.user._id : 'No socket user');

            const { conversationId, receiverId, message, type = 'text', imageUrl, replyTo } = data;

            if (!conversationId || !receiverId || (!message && type === 'text')) {
                console.error('Missing required fields:', { conversationId, receiverId, message, type });
                return socket.emit('error', { message: 'Missing required fields' });
            }

            const { Conversation, DirectMessage, User } = await import('./models/index.js');

            // Check if either user has blocked the other
            const sender = await User.findById(socket.user._id);
            const receiver = await User.findById(receiverId);

            if (!receiver) {
                console.error('Recipient not found:', receiverId);
                return socket.emit('error', { message: 'Recipient not found' });
            }

            console.log('Sender:', sender._id, 'Receiver:', receiver._id);

            // Check if sender has blocked receiver
            const senderBlockedReceiver = sender.blockedUsers?.some(
                id => id.toString() === receiverId.toString()
            ) || false;

            // Check if receiver has blocked sender
            const receiverBlockedSender = receiver.blockedUsers?.some(
                id => id.toString() === socket.user._id.toString()
            ) || false;

            if (senderBlockedReceiver) {
                return socket.emit('error', { message: 'You have blocked this user. Unblock to send messages.' });
            }

            if (receiverBlockedSender) {
                return socket.emit('error', { message: 'You cannot send messages to this user.' });
            }

            // Verify conversation exists and user is participant
            const conversation = await Conversation.findById(conversationId);
            if (!conversation || !conversation.participants.some(p => p.toString() === socket.user._id.toString())) {
                console.error('Unauthorized conversation access:', conversationId);
                return socket.emit('error', { message: 'Unauthorized' });
            }

            // Save message to database
            // Extract replyTo messageId - handle both object format and string format
            let replyToId = null;
            if (replyTo) {
                if (typeof replyTo === 'object' && replyTo.messageId) {
                    replyToId = replyTo.messageId;
                } else if (typeof replyTo === 'string') {
                    replyToId = replyTo;
                }
            }

            console.log('Creating DirectMessage...');
            const savedMessage = await DirectMessage.create({
                conversationId,
                sender: socket.user._id.toString(), // Ensure sender is string
                receiver: receiverId,
                message: message || (type === 'image' ? 'Sent an image' : ''),
                type,
                imageUrl,
                replyTo: replyToId || undefined,
                timestamp: new Date()
            });
            console.log('Message saved:', savedMessage._id);

            // Populate replyTo if it exists
            const populatedMessage = await DirectMessage.findById(savedMessage._id)
                .populate({
                    path: 'replyTo',
                    select: 'sender message type imageUrl',
                    populate: { path: 'sender', select: 'name' }
                });

            // Update conversation lastMessage and increment unread for receiver
            conversation.lastMessage = {
                text: type === 'image' ? '📷 Sent an image' : message,
                sender: socket.user._id.toString(), // Ensure sender is string
                timestamp: new Date()
            };
            conversation.incrementUnread(receiverId);
            await conversation.save();
            console.log('Conversation updated');

            // Format replyTo for frontend (flatten sender.name to senderName)
            let formattedReplyTo = null;
            if (populatedMessage.replyTo) {
                formattedReplyTo = {
                    _id: populatedMessage.replyTo._id,
                    message: populatedMessage.replyTo.message,
                    type: populatedMessage.replyTo.type,
                    imageUrl: populatedMessage.replyTo.imageUrl,
                    senderName: populatedMessage.replyTo.sender ? populatedMessage.replyTo.sender.name : 'Unknown'
                };
            }

            // Prepare message object for emit
            const messageData = {
                _id: savedMessage._id,
                conversationId,
                sender: socket.user._id.toString(),
                senderName: socket.user.name,
                senderProfilePicture: socket.user.profilePicture, // Include profile picture
                receiver: receiverId,
                message: savedMessage.message,
                type: savedMessage.type,
                imageUrl: savedMessage.imageUrl,
                replyTo: formattedReplyTo,
                timestamp: savedMessage.timestamp,
                read: false
            };

            // Broadcast to conversation room (both sender and receiver if online)
            io.to(`dm_${conversationId}`).emit('receive_dm', messageData);

            io.to(`user_${receiverId}`).emit('new_dm_notification', {
                conversationId,
                senderName: socket.user.name,
                senderId: socket.user._id,
                preview: type === 'image' ? '📷 Sent an image' : message.substring(0, 50),
                timestamp: new Date()
            });

            // Send Push Notification
            const pushPayload = {
                title: `New message from ${socket.user.name}`,
                body: type === 'image' ? '📷 Sent an image' : message,
                url: `/messages/${socket.user._id}`
            };
            sendPushNotification(receiverId, pushPayload).catch(err => console.error('Push failed:', err));

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

    // ========== COMMUNITY SOCKET EVENTS ==========

    // Join Community Room
    socket.on('join_community', async ({ communityId }) => {
        console.log(`🔌 Request to join community: ${communityId} by ${socket.user.name} (${socket.user._id})`);
        try {
            if (!communityId) {
                console.error('❌ No communityId provided');
                return socket.emit('error', { message: 'Community ID required' });
            }

            const Community = (await import('./models/Community.js')).default;
            const community = await Community.findById(communityId);

            if (!community) {
                console.error(`❌ Community not found: ${communityId}`);
                return socket.emit('error', { message: 'Community not found' });
            }

            console.log(`✅ Found community: ${community.name}. Checking membership...`);
            const isMember = community.members.some(m => m.toString() === socket.user._id.toString());

            if (!isMember) {
                console.error(`❌ User ${socket.user._id} is NOT a member of ${communityId}`);
                return socket.emit('error', { message: 'Not a member of this community' });
            }

            socket.join(`community_${communityId}`);
            console.log(`🏘️ ${socket.user.name} successfully joined community room: community_${communityId}`);
            socket.emit('joined_community', { communityId, name: community.name });
        } catch (error) {
            console.error('❌ Join community CRITICAL error:', error);
            socket.emit('error', { message: 'Server error joining community: ' + error.message });
        }
    });

    // Leave Community Room
    socket.on('leave_community', ({ communityId }) => {
        if (communityId) {
            socket.leave(`community_${communityId}`);
            console.log(`🏘️ ${socket.user.name} left community room: ${communityId}`);
        }
    });

    // Send Community Message
    socket.on('send_community_message', async ({ communityId, message, type, imageUrl, replyTo }) => {
        try {
            const Community = (await import('./models/Community.js')).default;
            const CommunityMessage = (await import('./models/CommunityMessage.js')).default;

            const community = await Community.findById(communityId);
            if (!community || !community.members.some(m => m.toString() === socket.user._id.toString())) {
                return socket.emit('error', { message: 'Not a member' });
            }

            // Only allow text and image (no audio/video per requirements)
            if (type !== 'text' && type !== 'image') {
                return socket.emit('error', { message: 'Community chat only supports text and images' });
            }

            let savedMessage = await CommunityMessage.create({
                communityId,
                sender: socket.user._id,
                message: message || '',
                type: type || 'text',
                imageUrl: type === 'image' ? imageUrl : null,
                replyTo: replyTo || null,
                timestamp: new Date()
            });

            // Populate replyTo if exists
            if (savedMessage.replyTo) {
                savedMessage = await savedMessage.populate({
                    path: 'replyTo',
                    select: 'sender message type imageUrl',
                    populate: { path: 'sender', select: 'name' }
                });
            }

            // Update community lastMessage
            community.lastMessage = {
                message: type === 'image' ? '📷 Sent an image' : message,
                senderName: socket.user.name,
                timestamp: new Date(),
                type
            };
            await community.save();

            const messageData = {
                _id: savedMessage._id,
                communityId,
                sender: socket.user._id,
                senderName: socket.user.name,
                senderProfilePicture: socket.user.profilePicture || null,
                message: savedMessage.message,
                type: savedMessage.type,
                imageUrl: savedMessage.imageUrl,
                timestamp: savedMessage.timestamp,
                replyTo: savedMessage.replyTo ? {
                    _id: savedMessage.replyTo._id,
                    senderName: savedMessage.replyTo.sender?.name || 'Unknown',
                    message: savedMessage.replyTo.message,
                    type: savedMessage.replyTo.type,
                    imageUrl: savedMessage.replyTo.imageUrl
                } : null
            };

            // Broadcast to all community members in the room
            io.to(`community_${communityId}`).emit('receive_community_message', messageData);
            console.log(`📢 Community message from ${socket.user.name} in ${community.name}`);
        } catch (error) {
            console.error('Send community message error:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Community Typing Indicator
    socket.on('typing_community', ({ communityId, isTyping }) => {
        if (communityId) {
            socket.to(`community_${communityId}`).emit('user_typing_community', {
                userId: socket.user._id,
                userName: socket.user.name,
                isTyping
            });
        }
    });

    // ========== END COMMUNITY SOCKET EVENTS ==========

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
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import friendRoutes from './routes/friends.js';
import memoryRoutes from './routes/memories.js';
import reportRoutes from './routes/reports.js';
import supportRoutes from './routes/support.js';
import communityRoutes from './routes/community.js';

// API Routes with Rate Limiting
app.use('/api/auth', authLimiter, authRoutes);  // Strict limit for auth
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/trips', apiLimiter, tripRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);
app.use('/api/reviews', createLimiter, reviewRoutes);  // Rate limit reviews
app.use('/api/announcements', apiLimiter, announcementRoutes);
app.use('/api/messages', apiLimiter, messageRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);  // Strict limit for uploads
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/friends', apiLimiter, friendRoutes);
app.use('/api/memories', createLimiter, memoryRoutes);  // Rate limit memory creation
app.use('/api/reports', createLimiter, reportRoutes);  // Rate limit reports
app.use('/api/support', apiLimiter, supportRoutes);
app.use('/api/communities', apiLimiter, communityRoutes);

// Keep-Alive Mechanism for Render Free Tier
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (render sleeps after 15)
const SELF_URL = 'https://tripsang.onrender.com/health';

if (process.env.NODE_ENV === 'production') {
    console.log('⏰ Keep-Alive: configured to ping every 14 min');
    setInterval(() => {
        console.log('⏰ Keep-Alive: Pinging self...');
        fetch(SELF_URL)
            .then(res => console.log(`⏰ Keep-Alive: Ping status ${res.status}`))
            .catch(err => console.error('⏰ Keep-Alive: Ping failed', err.message));
    }, PING_INTERVAL);
}

// 404 Handler - use imported handler
app.use(notFoundHandler);

// Global Error Handler - use imported handler
app.use(errorHandler);

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
