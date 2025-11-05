
'use server';
// Keep this import here if it's used in types, but it's safer to move it if it causes issues.
// For now, we will move the main import inside the functions.

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const DEVELOPER_EMAILS = ['paudelsgroup@gmail.com', 'paudelsunil16@gmail.com'];

let mailerConfigError: string | null = null;
if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  mailerConfigError = 'One or more email environment variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS) are missing. Emails will not be sent.';
  console.warn(`[Mailer] ${mailerConfigError}`);
} else {
  console.log('[Mailer] Nodemailer transport is configured.');
}


type InquiryData = {
  name: string;
  email: string;
  message: string;
};

// --- Email Styling and Templates ---

const getEmailStyles = () => `
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f4f8; }
    .container { max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 8px; background-color: #ffffff; border: 1px solid #e0e0e0; }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
    h2 { color: #224957; }
    .brand { color: #224957; font-weight: bold; }
    p { line-height: 1.6; font-size: 16px; }
    blockquote { border-left: 4px solid #7FB77E; padding-left: 15px; margin: 15px 0; color: #555; font-style: italic; background-color: #f9f9f9; padding: 10px; border-radius: 4px;}
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .details-table td { padding: 12px 0; border-bottom: 1px solid #eee; font-size: 16px; vertical-align: top;}
    .details-table td:first-child { font-weight: bold; color: #555; width: 120px;}
</style>
`;

function generateAdminNotificationHtml(inquiry: InquiryData): string {
    return `
    <!DOCTYPE html><html><head><title>New ResumePilot Inquiry</title>${getEmailStyles()}</head><body>
    <div class="container">
        <div class="header"><h2>New Inquiry from ResumePilot Contact Form</h2></div>
        <p>A new message has been submitted through the website.</p>
        <table class="details-table"><tbody>
            <tr><td>Name:</td><td>${inquiry.name}</td></tr>
            <tr><td>Email:</td><td><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
            <tr><td>Message:</td><td><blockquote>${inquiry.message.replace(/\n/g, '<br>')}</blockquote></td></tr>
        </tbody></table>
        <div class="footer"><p>This is an automated notification from ResumePilot.</p></div>
    </div></body></html>`;
}

function generateUserConfirmationHtml(inquiry: InquiryData): string {
    return `
    <!DOCTYPE html><html><head><title>We've Received Your Message</title>${getEmailStyles()}</head><body>
    <div class="container">
        <div class="header"><h2>Thanks for contacting <span class="brand">ResumePilot</span>!</h2></div>
        <p>Hi ${inquiry.name},</p>
        <p>This is an automated confirmation that we've received your message. Our team will get back to you as soon as possible.</p>
        <p>Here's a copy of the message you sent:</p>
        <blockquote>${inquiry.message.replace(/\n/g, '<br>')}</blockquote>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} ResumePilot. All rights reserved.</p></div>
    </div></body></html>`;
}


/**
 * Sends inquiry emails to both the developers and a confirmation to the sender.
 */
export async function sendInquiryEmails(inquiry: InquiryData) {
  // Dynamically import nodemailer ONLY on the server.
  const nodemailer = (await import('nodemailer')).default;
  let transporter: import('nodemailer').Transporter | null = null;
  
  if (!mailerConfigError) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: Number(EMAIL_PORT) === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  if (!transporter) {
    console.error(`[Mailer] Cannot send inquiry email: ${mailerConfigError}`);
    // Silently fail in production if not configured, but throw in dev
    if (process.env.NODE_ENV === 'development') {
        throw new Error(mailerConfigError || "Mailer is not configured.");
    }
    return;
  }

  // --- Email to Developers ---
  const developerMailOptions = {
    from: `"ResumePilot Contact" <${EMAIL_USER}>`,
    to: DEVELOPER_EMAILS.join(', '),
    subject: `New ResumePilot Inquiry from ${inquiry.name}`,
    html: generateAdminNotificationHtml(inquiry),
  };

  // --- Email to Sender (Confirmation) ---
  const senderMailOptions = {
    from: `"ResumePilot Team" <${EMAIL_USER}>`,
    to: inquiry.email,
    subject: "We've received your message | ResumePilot",
    html: generateUserConfirmationHtml(inquiry),
  };

  try {
    // Send both emails in parallel
    const developerEmailPromise = transporter.sendMail(developerMailOptions);
    const senderEmailPromise = transporter.sendMail(senderMailOptions);

    await Promise.all([
        developerEmailPromise,
        senderEmailPromise,
    ]);
    
    console.log(`[Mailer] Inquiry emails sent successfully for user ${inquiry.email}.`);

  } catch (error: any) {
    let specificError = error.message;
    if (error.code === 'EAUTH' || (error.responseCode && error.responseCode === 535)) {
        specificError = "Authentication failed. Check your email credentials in your .env file. If using Gmail, ensure you have an App Password.";
        console.error(`[Mailer] Authentication Error: ${specificError}`);
    } else if (error.code === 'ECONNECTION') {
        specificError = "Connection to email server failed. Check your network or firewall settings.";
        console.error(`[Mailer] Connection Error: ${specificError}`);
    } else {
        console.error(`[Mailer] Error sending inquiry emails to ${inquiry.email}:`, error);
    }
    // This error will be caught by the server action, which will inform the user.
    throw new Error('An error occurred while trying to send your message. Please try again later.');
  }
}
