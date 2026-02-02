import nodemailer from 'nodemailer';
import sanitizeHtml from 'sanitize-html';
import { GlobalConfig } from '../models/index.js';

/**
 * Configure Nodemailer Transporter
 * Using environment variables for SMTP settings
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: process.env.SMTP_PORT || 465,
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true, // Default to true for Hostinger (465)
        auth: {
            user: process.env.SMTP_USER || 'support@tripsang.com',
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * Handle Support Form Submission
 * POST /api/support/contact
 */
export const contactSupport = async (req, res) => {
    try {
        const { name, email, message, subject } = req.body;

        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required.'
            });
        }

        // Sanitize input to prevent injection
        const cleanName = sanitizeHtml(name);
        const cleanEmail = sanitizeHtml(email); // Basic sanitization, regex below handles validation
        const cleanMessage = sanitizeHtml(message);
        const cleanSubject = subject ? sanitizeHtml(subject) : 'General Support Request';

        // Basic Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        const transporter = createTransporter();
        const supportEmail = process.env.SMTP_USER || 'support@tripsang.com';

        // 1. Send email TO Support (Admin)
        const adminMailOptions = {
            from: `"TripSang Contact Form" <${supportEmail}>`, // Sent from our own server authentication
            to: supportEmail, // Send to ourselves
            replyTo: `"${cleanName}" <${cleanEmail}>`, // Reply directly to the user
            subject: `[TripSang Support] ${cleanSubject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">New Support Request</h2>
                    <p><strong>From:</strong> ${cleanName} (<a href="mailto:${cleanEmail}">${cleanEmail}</a>)</p>
                    <p><strong>Subject:</strong> ${cleanSubject}</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <h3>Message:</h3>
                    <p style="white-space: pre-wrap; background-color: #f9fafb; padding: 15px; border-radius: 8px;">${cleanMessage}</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This email was sent via the TripSang contact form.</p>
                </div>
            `
        };

        // 2. Send Auto-Reply TO User
        const userMailOptions = {
            from: `"TripSang Support" <${supportEmail}>`,
            to: cleanEmail,
            subject: `We received your request: ${cleanSubject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Thanks for contacting TripSang!</h2>
                    <p>Hi ${cleanName},</p>
                    <p>We have received your message regarding "<strong>${cleanSubject}</strong>".</p>
                    <p>Our support team will review your inquiry and get back to you as soon as possible (usually within 24-48 hours).</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p><strong>Your Message:</strong></p>
                    <p style="font-style: italic; color: #555;">"${cleanMessage}"</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p>Best regards,<br>The TripSang Team</p>
                    <p style="font-size: 12px; color: #999;">Reference: <a href="https://tripsang.com">tripsang.com</a></p>
                </div>
            `
        };

        // Send both emails in parallel
        await Promise.all([
            transporter.sendMail(adminMailOptions),
            transporter.sendMail(userMailOptions)
        ]);

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully! We will be in touch soon.'
        });

    } catch (error) {
        console.error('Support email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later or email us directly at support@tripsang.com.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
