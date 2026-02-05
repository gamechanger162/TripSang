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
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'TripSang'}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw error to prevent breaking the flow (e.g. signup should succeed even if email fails)
        return { success: false, error: error.message };
    }
};

/**
 * Send Welcome Email
 * @param {string} email - User email
 * @param {string} name - User name
 */
export const sendWelcomeEmail = async (email, name) => {
    const subject = 'Welcome to TripSang - Your Adventure Begins!';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #6366f1; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Welcome to TripSang!</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                <h2>Namaste, ${name}! 🙏</h2>
                <p>We're thrilled to have you join our community of travelers and adventure seekers.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #4b5563;">🎉 Special Gift: 30-Day Free Premium Trial!</h3>
                    <p style="margin-bottom: 0;">As a welcome gift, we've activated a <strong>30-day free trial</strong> of TripSang Premium on your account. Enjoy unlimited trip creation, exclusive badges, and more!</p>
                </div>

                <h3>Here's what you can do next:</h3>
                <ul>
                    <li><strong>Create your first trip</strong> and invite friends</li>
                    <li><strong>Explore trending destinations</strong> and join public trips</li>
                    <li><strong>Complete your profile</strong> to get verified</li>
                </ul>

                <p style="margin-top: 30px;">
                    <a href="${process.env.CLIENT_URL || 'https://tripsang.com'}/trips/create" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Your Journey</a>
                </p>

                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                    Need help? Reply to this email or contact support@tripsang.com
                </p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} TripSang. All rights reserved.<br>
                Made with ❤️ in India
            </div>
        </div>
    `;

    return sendEmail({ to: email, subject, html });
};
