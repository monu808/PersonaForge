import { Router } from 'express';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

// POST /submit
router.post('/submit', [
  // Validation middleware
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('category').optional().isString(),
  body('priority').optional().isString(),

  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { name, email, subject, message, category, priority } = req.body;

      // Send email notification
      await sendEmailNotification({
        name,
        email,
        subject,
        message,
        category,
        priority
      });

      res.json({
        success: true,
        message: 'Support request submitted successfully'
      });

    } catch (error) {
      console.error('Error submitting support request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit support request'
      });
    }
  }
]);

// Email notification function
async function sendEmailNotification(data: any) {
  const nodemailer = require('nodemailer');

  // Configure your email transporter
  const transporter = nodemailer.createTransporter({
    // Gmail example (you can use any email service)
    service: 'gmail',
    auth: {
      user: process.env.SUPPORT_EMAIL_USER, // your-email@gmail.com
      pass: process.env.SUPPORT_EMAIL_PASS  // your-app-password
    }
    // Or use SMTP settings for other providers
    // host: 'smtp.yourdomain.com',
    // port: 587,
    // secure: false,
    // auth: {
    //   user: process.env.SMTP_USER,
    //   pass: process.env.SMTP_PASS
    // }
  });

  const mailOptions = {
    from: process.env.SUPPORT_EMAIL_USER,
    to: 'monu80850raj@gmail.com', // Your admin email
    subject: `[Support] ${data.subject}`,
    html: `
      <h2>New Support Request</h2>
      <p><strong>From:</strong> ${data.name} (${data.email})</p>
      <p><strong>Category:</strong> ${data.category || 'Not specified'}</p>
      <p><strong>Priority:</strong> ${data.priority || 'Not specified'}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <div>
        <strong>Message:</strong>
        <p style="border-left: 3px solid #ccc; padding-left: 15px; margin: 10px 0;">
          ${data.message.replace(/\n/g, '<br>')}
        </p>
      </div>
      <hr>
      <p><small>Sent from PersonaForge Support Form</small></p>
    `
  };

  await transporter.sendMail(mailOptions);
}

export default router;
