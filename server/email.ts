import nodemailer from 'nodemailer';
import { User } from '../shared/schema';

// Create a test account for development (Ethereal Email)
let testAccount: nodemailer.TestAccount | null = null;
let transporter: nodemailer.Transporter | null = null;

// Initialize the transporter
export async function initializeEmailService() {
  if (process.env.NODE_ENV === 'production') {
    // Using real email service in production
    // Configure with your SMTP settings
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });
  } else {
    // For development/testing, use Ethereal (catches emails rather than sending them)
    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
    }
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

// Send a welcome email to a new user
export async function sendWelcomeEmail(user: User) {
  if (!transporter) {
    await initializeEmailService();
  }
  
  if (!transporter) {
    console.error('Email transporter not initialized');
    return;
  }
  
  const message = {
    from: process.env.EMAIL_FROM || '"DebateMate" <app.debatemate@gmail.com>',
    to: user.email,
    subject: 'Welcome to DebateMate!',
    text: `Hello ${user.displayName},\n\nWelcome to DebateMate! Your account has been created successfully.\n\nYou can now log in and start debating with other mates.\n\nBest regards,\nThe DebateMate Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #f59e0b; margin-bottom: 20px;">Welcome to DebateMate!</h2>
          <p>Hello ${user.displayName},</p>
          <p>Welcome to DebateMate! Your account has been created successfully.</p>
          <p>You can now log in and start debating with other mates.</p>
          <p style="margin-top: 30px;">Best regards,<br>The DebateMate Team</p>
        </div>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(message);
    
    if (testAccount) {
      // Log the URL to view the email in development
      console.log(`Email sent: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

// Send a password reset email with token
export async function sendPasswordResetEmail(user: User, token: string, resetUrl: string) {
  if (!transporter) {
    await initializeEmailService();
  }
  
  if (!transporter) {
    console.error('Email transporter not initialized');
    return;
  }
  
  const message = {
    from: process.env.EMAIL_FROM || '"DebateMate" <app.debatemate@gmail.com>',
    to: user.email,
    subject: 'Password Reset Request',
    text: `Hello ${user.displayName},\n\nYou requested a password reset for your DebateMate account.\n\nYour verification code is: ${token}\n\nThis code will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe DebateMate Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #f59e0b; margin-bottom: 20px;">Password Reset Request</h2>
          <p>Hello ${user.displayName},</p>
          <p>You requested a password reset for your DebateMate account.</p>
          <p>Your verification code is: <strong style="font-size: 18px; color: #f59e0b;">${token}</strong></p>
          <p>This code will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
          <p style="margin-top: 30px;">Best regards,<br>The DebateMate Team</p>
        </div>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(message);
    
    if (testAccount) {
      // Log the URL to view the email in development
      console.log(`Email sent: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

// Generate a random 6-digit token for password reset
export function generateResetToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}