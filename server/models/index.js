/**
 * TripSang Models Index
 * Central export point for all Mongoose models
 */

import User from './User.js';
import Trip from './Trip.js';
import Payment from './Payment.js';
import GlobalConfig from './GlobalConfig.js';
import Review from './Review.js';
import Message from './Message.js';
import Announcement from './Announcement.js';

export {
    User,
    Trip,
    Payment,
    GlobalConfig,
    Review,
    Message,
    Announcement
};

export default {
    User,
    Trip,
    Review
};
