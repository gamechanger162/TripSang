import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Common email header with TripSang logo
const getEmailHeader = () => `
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px 20px; text-align: center;">
        <img src="${process.env.CLIENT_URL || 'https://tripsang.com'}/logo-text.png" alt="TripSang" style="height: 50px; margin-bottom: 10px;" />
        <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Your Adventure Awaits</p>
    </div>
`;

// Common email footer
const getEmailFooter = () => `
    <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 10px 0;">
            <a href="${process.env.CLIENT_URL || 'https://tripsang.com'}" style="color: #6366f1; text-decoration: none;">Visit TripSang</a> |
            <a href="${process.env.CLIENT_URL || 'https://tripsang.com'}/help-support" style="color: #6366f1; text-decoration: none;">Help & Support</a>
        </p>
        &copy; ${new Date().getFullYear()} TripSang. All rights reserved.<br>
        Made with ❤️ in India
    </div>
`;

// Email template wrapper
const wrapEmailContent = (content) => `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        ${getEmailHeader()}
        <div style="padding: 30px 20px;">
            ${content}
        </div>
        ${getEmailFooter()}
    </div>
`;

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 */
export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        // Log SMTP config for debugging (without password)
        console.log('📧 Attempting to send email to:', to);
        console.log('📧 SMTP Config:', {
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: process.env.SMTP_PORT || 465,
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER ? '✓ Set' : '✗ NOT SET',
            pass: process.env.SMTP_PASS ? '✓ Set' : '✗ NOT SET'
        });

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('❌ SMTP credentials not configured!');
            return { success: false, error: 'SMTP credentials not configured' };
        }

        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'TripSang'}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html
        });

        console.log('✅ Email sent successfully: %s to %s', info.messageId, to);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email to %s:', to, error.message);
        console.error('❌ Full error:', error);
        // Don't throw error to prevent breaking the flow
        return { success: false, error: error.message };
    }
};

/**
 * Test SMTP connection
 */
export const testSMTPConnection = async () => {
    try {
        console.log('🔍 Testing SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
        return { success: true, message: 'SMTP connection is working' };
    } catch (error) {
        console.error('❌ SMTP connection failed:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send Welcome Email
 * @param {string} email - User email
 * @param {string} name - User name
 */
export const sendWelcomeEmail = async (email, name) => {
    const subject = '🎉 Welcome to TripSang - Your Adventure Begins!';
    const content = `
        <h2 style="color: #1f2937; margin-top: 0;">Namaste, ${name}! 🙏</h2>
        <p style="color: #4b5563; line-height: 1.6;">We're thrilled to have you join our community of travelers and adventure seekers.</p>
        
        <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 20px; border-radius: 12px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #6366f1;">🎉 Special Gift: 30-Day Free Premium Trial!</h3>
            <p style="margin-bottom: 0; color: #4b5563;">As a welcome gift, we've activated a <strong>30-day free trial</strong> of TripSang Premium on your account. Enjoy unlimited trip creation, exclusive badges, and more!</p>
        </div>

        <h3 style="color: #1f2937;">Here's what you can do next:</h3>
        <ul style="color: #4b5563; line-height: 1.8;">
            <li><strong>Create your first trip</strong> and invite friends</li>
            <li><strong>Explore trending destinations</strong> and join public trips</li>
            <li><strong>Complete your profile</strong> to get verified</li>
            <li><strong>Join communities</strong> with fellow travelers</li>
        </ul>

        <p style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://tripsang.com'}/trips/create" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Your Journey →</a>
        </p>

        <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
            Need help? Contact us at <a href="mailto:support@tripsang.com" style="color: #6366f1;">support@tripsang.com</a>
        </p>
    `;

    return sendEmail({ to: email, subject, html: wrapEmailContent(content) });
};

/**
 * Send Verification Approved Email
 * @param {string} email - User email  
 * @param {string} name - User name
 */
export const sendVerificationApprovedEmail = async (email, name) => {
    const subject = '✅ Identity Verified - You\'re Now a Verified Traveler!';
    const content = `
        <div style="text-align: center; margin-bottom: 25px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✓</span>
            </div>
            <h2 style="color: #10b981; margin: 0;">Congratulations, ${name}! 🎉</h2>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; text-align: center;">Your identity has been successfully verified. You're now a <strong>Verified Traveler</strong> on TripSang!</p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #065f46;">What this means for you:</h3>
            <ul style="color: #047857; margin-bottom: 0;">
                <li>Blue verification badge on your profile</li>
                <li>Increased trust from other travelers</li>
                <li>Priority for trip matching</li>
                <li>Access to verified-only trips</li>
            </ul>
        </div>

        <p style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://tripsang.com'}/profile" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Your Profile →</a>
        </p>
    `;

    return sendEmail({ to: email, subject, html: wrapEmailContent(content) });
};

/**
 * Send Verification Rejected Email
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} reason - Rejection reason from admin
 */
export const sendVerificationRejectedEmail = async (email, name, reason) => {
    const subject = '⚠️ Verification Update - Action Required';
    const content = `
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${name},</h2>
        
        <p style="color: #4b5563; line-height: 1.6;">We've reviewed your identity verification request and unfortunately, we couldn't verify your identity at this time.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ef4444;">
            <h3 style="margin-top: 0; color: #991b1b;">Reason:</h3>
            <p style="color: #dc2626; margin-bottom: 0;">${reason || 'The submitted documents could not be verified. Please ensure all information is clear and matches your profile.'}</p>
        </div>

        <h3 style="color: #1f2937;">What you can do:</h3>
        <ul style="color: #4b5563; line-height: 1.8;">
            <li>Ensure your ID document is valid and not expired</li>
            <li>Take a clear photo with good lighting</li>
            <li>Make sure all text is readable</li>
            <li>Ensure the name matches your TripSang profile</li>
        </ul>

        <p style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://tripsang.com'}/verify/id" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Try Again →</a>
        </p>

        <p style="margin-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
            If you believe this was a mistake, please contact <a href="mailto:support@tripsang.com" style="color: #6366f1;">support@tripsang.com</a>
        </p>
    `;

    return sendEmail({ to: email, subject, html: wrapEmailContent(content) });
};

/**
 * Send New Message Notification Email
 * @param {string} email - Recipient email
 * @param {string} recipientName - Recipient name
 * @param {string} senderName - Sender name
 * @param {string} messagePreview - Preview of the message
 */
export const sendNewMessageEmail = async (email, recipientName, senderName, messagePreview = '') => {
    const subject = `💬 New message from ${senderName}`;
    const content = `
        <h2 style="color: #1f2937; margin-top: 0;">Hey ${recipientName}! 👋</h2>
        
        <p style="color: #4b5563; line-height: 1.6;">You have a new message from <strong>${senderName}</strong> on TripSang.</p>
        
        ${messagePreview ? `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #6366f1;">
            <p style="color: #4b5563; margin: 0; font-style: italic;">"${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''}"</p>
        </div>
        ` : ''}

        <p style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://tripsang.com'}/messages" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Message →</a>
        </p>
    `;

    return sendEmail({ to: email, subject, html: wrapEmailContent(content) });
};

/**
 * Send Mention Notification Email
 * @param {string} email - Recipient email
 * @param {string} recipientName - Recipient name
 * @param {string} mentionerName - Person who mentioned
 * @param {string} context - Where they were mentioned (trip title, etc.)
 */
export const sendMentionEmail = async (email, recipientName, mentionerName, context = 'a conversation') => {
    const subject = `🔔 ${mentionerName} mentioned you on TripSang`;
    const content = `
        <h2 style="color: #1f2937; margin-top: 0;">Hey ${recipientName}! 👋</h2>
        
        <p style="color: #4b5563; line-height: 1.6;"><strong>${mentionerName}</strong> mentioned you in ${context}.</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0;">Don't miss out on the conversation! Tap below to see what's happening.</p>
        </div>

        <p style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://tripsang.com'}/messages" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Conversation →</a>
        </p>
    `;

    return sendEmail({ to: email, subject, html: wrapEmailContent(content) });
};
