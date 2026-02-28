import nodemailer from 'nodemailer';

// Create a transporter using Gmail SMTP
// Note: To use this in production, you MUST use an "App Password" from Google
// Create a transporter using Gmail SMTP with more robust settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL (port 465)
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // Your Gmail "App Password"
  },
  pool: true, // Use a pool of connections
  family: 4,  // FORCE IPv4 (Fixes ENETUNREACH errors on cloud servers like Render)
});

interface EmailVerificationParams {
  to: string;
  subject: string;
  verificationUrl: string;
  userName?: string;
}

interface PasswordResetParams {
  to: string;
  subject: string;
  resetUrl: string;
  userName?: string;
}

export const sendVerificationEmail = async ({
  to,
  subject,
  verificationUrl,
  userName = 'there'
}: EmailVerificationParams) => {
  try {
    console.log('🔄 Attempting to send verification email via Gmail to:', to);

    const mailOptions = {
      from: `"AgroTech" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">🌱 AgroTech</h1>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to AgroTech!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Hi ${userName},
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thank you for joining AgroTech! Please verify your email address to complete your registration.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, copy and paste this link:
          </p>
          
          <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; 
                    font-size: 14px; color: #4b5563;">
            ${verificationUrl}
          </p>
          
          <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">© 2026 AgroTech</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully via Gmail:', info.messageId);
    return info;

  } catch (error) {
    console.error('❌ Error in sendVerificationEmail (Gmail):', error);
    throw error;
  }
};

export const sendResetPasswordEmail = async ({
  to,
  subject,
  resetUrl,
  userName = 'there'
}: PasswordResetParams) => {
  try {
    const mailOptions = {
      from: `"AgroTech" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">🌱 AgroTech</h1>
          </div>
          <h2 style="color: #333;">Password Reset</h2>
          <p>Hi ${userName}, click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Reset Password</a>
          </div>
          <p>Link: ${resetUrl}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Password reset email sent successfully via Gmail:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error in sendResetPasswordEmail (Gmail):', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (to: string, userName: string, userRole: string) => {
  try {
    const mailOptions = {
      from: `"AgroTech" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Welcome to AgroTech, ${userName}! 🌱`,
      html: `<h1>Welcome to AgroTech!</h1><p>Hi ${userName}, your account as a ${userRole} is now active.</p>`,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Welcome email sent successfully via Gmail:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error in sendWelcomeEmail (Gmail):', error);
    throw error;
  }
};