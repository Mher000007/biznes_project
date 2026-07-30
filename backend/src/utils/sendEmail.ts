import nodemailer from 'nodemailer';

interface SendEmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'ArmBiz Auth <no-reply@armbiz.am>';
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    console.warn(`[sendEmail] SMTP credentials not configured in env (SMTP_HOST/USER/PASS missing). Email to ${options.email} skipped.`);
    console.log(`[sendEmail Mock Output] Subject: "${options.subject}" -> Message:\n${options.message}`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<div style="font-family: sans-serif; padding: 20px;">${options.message.replace(/\n/g, '<br/>')}</div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent successfully to ${options.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.email}:`, error);
    return false;
  }
};
