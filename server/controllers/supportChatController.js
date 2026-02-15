import SupportChat from '../models/SupportChat.js';
import User from '../models/User.js';

/**
 * Create or get existing open support chat for the authenticated user
 * POST /api/support-chat
 */
export const createOrGetChat = async (req, res) => {
    try {
        const userId = req.user._id;

        // Check for existing open chat
        let chat = await SupportChat.findOne({ userId, status: 'open' })
            .populate('userId', 'name profilePicture email');

        if (chat) {
            return res.json({ success: true, chat, isNew: false });
        }

        // Create new support chat
        const user = await User.findById(userId).select('name profilePicture');
        const welcomeMessage = {
            sender: userId, // system message attributed to user for display
            senderRole: 'admin',
            senderName: 'TripSang Support',
            message: `Hi ${user?.name || 'there'}! 👋 Welcome to TripSang Support. How can we help you today?`,
            type: 'system',
            timestamp: new Date()
        };

        chat = await SupportChat.create({
            userId,
            subject: 'General Support',
            messages: [welcomeMessage],
            lastMessage: {
                text: welcomeMessage.message,
                sender: userId,
                senderRole: 'admin',
                timestamp: welcomeMessage.timestamp
            }
        });

        chat = await chat.populate('userId', 'name profilePicture email');

        res.status(201).json({ success: true, chat, isNew: true });
    } catch (error) {
        console.error('Create support chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to create support chat' });
    }
};

/**
 * Get the authenticated user's active support chat
 * GET /api/support-chat/my
 */
export const getMyChat = async (req, res) => {
    try {
        const chat = await SupportChat.findOne({ userId: req.user._id, status: 'open' })
            .populate('userId', 'name profilePicture email');

        res.json({ success: true, chat });
    } catch (error) {
        console.error('Get my support chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch support chat' });
    }
};

/**
 * Admin: Get all support chats sorted by latest activity
 * GET /api/support-chat/admin/all
 */
export const getAllChats = async (req, res) => {
    try {
        const { status = 'all' } = req.query;
        const filter = status !== 'all' ? { status } : {};

        const chats = await SupportChat.find(filter)
            .populate('userId', 'name profilePicture email')
            .sort({ 'lastMessage.timestamp': -1 })
            .select('-messages'); // Don't send all messages in listing

        res.json({ success: true, chats });
    } catch (error) {
        console.error('Get all support chats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch support chats' });
    }
};

/**
 * Admin: Get specific chat with all messages
 * GET /api/support-chat/admin/:id
 */
export const getChatById = async (req, res) => {
    try {
        const chat = await SupportChat.findById(req.params.id)
            .populate('userId', 'name profilePicture email');

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Support chat not found' });
        }

        res.json({ success: true, chat });
    } catch (error) {
        console.error('Get support chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch support chat' });
    }
};

/**
 * Admin: Close a support ticket
 * PATCH /api/support-chat/admin/:id/close
 */
export const closeChat = async (req, res) => {
    try {
        const chat = await SupportChat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Support chat not found' });
        }

        // Add system message
        const closeMessage = {
            sender: req.user._id,
            senderRole: 'admin',
            senderName: req.user.name,
            message: `Ticket closed by ${req.user.name}`,
            type: 'system',
            timestamp: new Date()
        };

        chat.messages.push(closeMessage);
        chat.status = 'closed';
        chat.closedBy = req.user._id;
        chat.closedAt = new Date();
        chat.lastMessage = {
            text: closeMessage.message,
            sender: req.user._id,
            senderRole: 'admin',
            timestamp: closeMessage.timestamp
        };

        await chat.save();

        res.json({ success: true, chat });
    } catch (error) {
        console.error('Close support chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to close support chat' });
    }
};

/**
 * Admin: Reopen a closed support ticket
 * PATCH /api/support-chat/admin/:id/reopen
 */
export const reopenChat = async (req, res) => {
    try {
        const chat = await SupportChat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Support chat not found' });
        }

        const reopenMessage = {
            sender: req.user._id,
            senderRole: 'admin',
            senderName: req.user.name,
            message: `Ticket reopened by ${req.user.name}`,
            type: 'system',
            timestamp: new Date()
        };

        chat.messages.push(reopenMessage);
        chat.status = 'open';
        chat.closedBy = null;
        chat.closedAt = null;
        chat.lastMessage = {
            text: reopenMessage.message,
            sender: req.user._id,
            senderRole: 'admin',
            timestamp: reopenMessage.timestamp
        };

        await chat.save();

        res.json({ success: true, chat });
    } catch (error) {
        console.error('Reopen support chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to reopen support chat' });
    }
};
