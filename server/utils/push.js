import webpush from 'web-push';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

// Configure web-push
try {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@tripsang.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    console.log('Web Push Configured Successfully');
} catch (error) {
    console.error('Web Push Configuration Failed:', error.message);
}

/**
 * Send push notification to a user
 * @param {string} userId - ID of the user to notify
 * @param {Object} payload - Notification payload { title, body, url, icon }
 */
export const sendPushNotification = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
            // No subscriptions for this user
            return { success: false, reason: 'no_subscription' };
        }

        const notificationPayload = JSON.stringify(payload);
        const subscriptions = user.pushSubscriptions;

        // Send to all subscriptions (devices)
        const promiseArray = subscriptions.map(subscription => {
            return webpush.sendNotification(subscription, notificationPayload)
                .catch(error => {
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        // Subscription has expired or is no longer valid
                        return { subscription, remove: true };
                    }
                    console.error('Error sending push:', error);
                    return { subscription, remove: false, error };
                });
        });

        const results = await Promise.all(promiseArray);

        // Cleanup invalid subscriptions
        const subscriptionsToRemove = results
            .filter(r => r.remove)
            .map(r => r.subscription.endpoint);

        if (subscriptionsToRemove.length > 0) {
            await User.updateOne(
                { _id: userId },
                { $pull: { pushSubscriptions: { endpoint: { $in: subscriptionsToRemove } } } }
            );
        }

        return { success: true, sentCount: subscriptions.length - subscriptionsToRemove.length };

    } catch (error) {
        console.error('Push notification error:', error);
        return { success: false, error: error.message };
    }
};
