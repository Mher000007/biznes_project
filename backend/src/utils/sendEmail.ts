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
    console.log(`\n=================== [sendEmail Mock Output] ===================`);
    console.log(`TO:       ${options.email}`);
    console.log(`SUBJECT:  ${options.subject}`);
    console.log(`STATUS:   SMTP missing in .env -> Logged to terminal for testing`);
    console.log(`------------------- Email Content -------------------`);
    console.log(options.message);
    console.log(`===============================================================\n`);
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
