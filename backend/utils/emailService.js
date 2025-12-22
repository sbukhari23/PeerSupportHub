const nodemailer = require('nodemailer');

/**
 * Email service for sending verification and password reset emails
 * Configure with your email provider (Gmail, SendGrid, etc.)
 */

// Create reusable transporter
const createTransporter = () => {
  // For development: Use Ethereal (fake SMTP service)
  // For production: Use real SMTP service (Gmail, SendGrid, AWS SES, etc.)
  
  if (process.env.NODE_ENV === 'production') {
    // Production: Use real SMTP
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Use Ethereal or console log
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'test',
      },
    });
  }
};

/**
 * Send verification email
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (email, name, token) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"Peer Support Hub" <${process.env.SMTP_FROM || 'noreply@peersupporthub.com'}>`,
      to: email,
      subject: 'Verify Your Email - Peer Support Hub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Peer Support Hub! 🎉</h2>
          <p>Hi ${name},</p>
          <p>Thank you for joining Peer Support Hub. To complete your registration and start building consistent habits with our community, please verify your email address.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #6b7280; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This verification link will expire in 24 hours.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't create an account with Peer Support Hub, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            Peer Support Hub - Building Habits, Finding Accountability
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Verification email sent (Preview URL):', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} token - Reset token
 */
const sendPasswordResetEmail = async (email, name, token) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"Peer Support Hub" <${process.env.SMTP_FROM || 'noreply@peersupporthub.com'}>`,
      to: email,
      subject: 'Reset Your Password - Peer Support Hub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password for your Peer Support Hub account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #6b7280; word-break: break-all;">${resetUrl}</p>
          <p style="color: #dc2626; font-size: 14px; margin-top: 30px;">
            ⚠️ This reset link will expire in 1 hour.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            Peer Support Hub - Building Habits, Finding Accountability
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Password reset email sent (Preview URL):', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email after verification
 * @param {string} email - User email
 * @param {string} name - User name
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
    
    const mailOptions = {
      from: `"Peer Support Hub" <${process.env.SMTP_FROM || 'noreply@peersupporthub.com'}>`,
      to: email,
      subject: 'Welcome to Peer Support Hub! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome Aboard, ${name}! 🎉</h2>
          <p>Your email has been verified successfully. You're now part of the Peer Support Hub community!</p>
          <h3>Here's what you can do now:</h3>
          <ul style="line-height: 2;">
            <li>📝 Set up your first habit and start tracking</li>
            <li>👥 Join peer groups for accountability</li>
            <li>🤝 Find an accountability buddy</li>
            <li>💬 Connect with mentors for guidance</li>
            <li>🏆 Participate in community challenges</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Need help getting started? Check out our <a href="${process.env.FRONTEND_URL}/how-it-works">How It Works</a> guide.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            Peer Support Hub - Building Habits, Finding Accountability
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
