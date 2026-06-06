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

export const sendReportResolutionEmail = async (
  businessOwnerEmail: string,
  businessName: string,
  reviewComment: string,
  resolution: 'keep' | 'delete',
  adminReply: string
): Promise<void> => {
  const html = `
    <h2>Review Report Resolution for ${businessName}</h2>
    <p>An admin has moderated a report you submitted regarding a review on your business page.</p>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
    <p><strong>Review Content:</strong> <span style="color: #666; font-style: italic;">"${reviewComment}"</span></p>
    <p><strong>Decision:</strong> The review has been <strong>${resolution === 'delete' ? 'removed from' : 'kept on'}</strong> the platform.</p>
    <p><strong>Admin Explanation:</strong> ${adminReply}</p>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
    <p style="font-size: 11px; color: #999;">This is an automated notification. Thank you for helping keep our platform safe and reliable.</p>
  `;
  await sendEmail(
    businessOwnerEmail,
    `Review Report Resolution: ${businessName}`,
    html
  );
};
