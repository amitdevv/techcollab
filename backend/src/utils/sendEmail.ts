import nodemailer from 'nodemailer';
import config from '../config/config';

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text email content
 * @param {string} html - HTML email content
 */
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<void> => {
  try {
    // Create a test account if in development
    let transporter;

    if (process.env.NODE_ENV === 'development') {
      // Create a test account using Ethereal
      const testAccount = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      // Use actual SMTP configuration in production
      transporter = nodemailer.createTransport({
        host: config.emailHost,
        port: config.emailPort,
        secure: config.emailPort === 465,
        auth: {
          user: config.emailUser,
          pass: config.emailPassword,
        },
      });
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.appName}" <${config.emailFrom}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);

    // Log URL for test emails in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
