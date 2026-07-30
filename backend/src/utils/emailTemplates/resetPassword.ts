export interface EmailTemplateOptions {
  name: string;
  link: string;
  lang?: 'hy' | 'en' | 'ru';
}

export function getResetPasswordTemplate({ name, link, lang = 'hy' }: EmailTemplateOptions) {
  const translations = {
    hy: {
      subject: 'Վերականգնեք Ձեր գաղտնաբառը — ArmBiz',
      heading: 'Վերականգնեք Ձեր գաղտնաբառը',
      greeting: `Բարև ${name},`,
      body: 'Դուք ուղարկել եք Ձեր ArmBiz հաշվի գաղտնաբառը վերականգնելու հարցում: Սեղմեք ստորև նշված կոճակը՝ նոր գաղտնաբառ սահմանելու համար:',
      buttonText: 'Վերականգնել Գաղտնաբառը',
      expiryNote: '⏳ Այս հղումը վավեր է <strong>1 ժամ</strong>:',
      fallbackText: 'Եթե կոճակը չի աշխատում, պատճենեք և տեղադրեք այս հղումը Ձեր կրկնօրինակի (browser) մեջ.',
      securityNotice: 'Եթե Դուք չեք ուղարկել այս հարցումը, կարող եք ապահով անտեսել այս էլ. նամակը — Ձեր գաղտնաբառը չի փոխվի:',
      rights: 'Բոլոր իրավունքները պաշտպանված են:',
    },
    en: {
      subject: 'Reset your password — ArmBiz',
      heading: 'Reset your password',
      greeting: `Hello ${name},`,
      body: 'You requested a password reset for your ArmBiz account. Click the button below to set a new password:',
      buttonText: 'Reset Password',
      expiryNote: '⏳ This password reset link will expire in <strong>1 hour</strong>.',
      fallbackText: "If the button above doesn't work, copy and paste this link into your browser:",
      securityNotice: "If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.",
      rights: 'All rights reserved.',
    },
    ru: {
      subject: 'Сброс пароля — ArmBiz',
      heading: 'Сброс пароля',
      greeting: `Здравствуйте, ${name}!`,
      body: 'Вы запросили сброс пароля для вашего аккаунта ArmBiz. Нажмите кнопку ниже, чтобы установить новый пароль:',
      buttonText: 'Сбросить пароль',
      expiryNote: '⏳ Ссылка действительна в течение <strong>1 часа</strong>.',
      fallbackText: 'Если кнопка выше не работает, скопируйте и вставьте эту ссылку в браузер:',
      securityNotice: 'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо — ваш пароль останется прежним.',
      rights: 'Все права защищены.',
    },
  };

  const t = translations[lang] || translations.hy;

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.heading}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header Branding -->
          <tr>
            <td align="center" style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                    Arm<span style="color: #2563eb;">Biz</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                ${t.heading}
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                ${t.greeting}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                ${t.body}
              </p>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${link}" target="_blank" style="display: inline-block; width: 100%; max-width: 280px; background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 24px; border-radius: 10px; text-align: center; box-sizing: border-box;">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Banner -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; text-align: center;">
                    ${t.expiryNote}
                  </td>
                </tr>
              </table>

              <!-- Direct URL Fallback -->
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                ${t.fallbackText}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; color: #2563eb; word-break: break-all; font-family: monospace;">
                ${link}
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <!-- Security Disclaimer -->
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                ${t.securityNotice}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              © 2026 ArmBiz. ${t.rights} • <a href="https://armbiz.am" style="color: #64748b; text-decoration: underline;">armbiz.am</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${t.heading}\n\n${t.greeting}\n${t.body}\n\n${t.buttonText}: ${link}\n\n${t.expiryNote.replace(/<[^>]*>/g, '')}\n${t.securityNotice}`;

  return {
    subject: t.subject,
    html,
    text,
  };
}
