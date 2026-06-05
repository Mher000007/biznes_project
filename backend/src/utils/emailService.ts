export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  // Placeholder for email service integration
  // You can integrate with services like:
  // - SendGrid
  // - Mailgun
  // - AWS SES
  // - Gmail SMTP

  console.log(`Email to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`HTML: ${html}`);

  // Example using nodemailer (not included in dependencies by default)
  // import nodemailer from 'nodemailer';
  // const transporter = nodemailer.createTransport({...});
  // await transporter.sendMail({to, subject, html});
};

export const sendVerificationEmail = async (email: string, verificationLink: string): Promise<void> => {
  const html = `
    <h2>Verify Your Email</h2>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationLink}">Verify Email</a>
  `;
  await sendEmail(email, 'Email Verification', html);
};

export const sendPasswordResetEmail = async (email: string, resetLink: string): Promise<void> => {
  const html = `
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link will expire in 24 hours.</p>
  `;
  await sendEmail(email, 'Password Reset', html);
};

export const sendInquiryNotification = async (
  businessOwnerEmail: string,
  businessName: string,
  inquiryDetails: { name: string; email: string; subject: string }
): Promise<void> => {
  const html = `
    <h2>New Inquiry for ${businessName}</h2>
    <p><strong>From:</strong> ${inquiryDetails.name}</p>
    <p><strong>Email:</strong> ${inquiryDetails.email}</p>
    <p><strong>Subject:</strong> ${inquiryDetails.subject}</p>
  `;
  await sendEmail(businessOwnerEmail, `New Inquiry: ${inquiryDetails.subject}`, html);
};
