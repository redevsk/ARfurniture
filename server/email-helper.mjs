/**
 * Email helper for AR Furniture using Brevo SMTP API
 * Modern, responsive email templates with inline CSS for maximum compatibility
 */

/**
 * Send email using Brevo API (HTTPS-based)
 * @param {Object} emailData - Email configuration
 * @param {Object} emailData.sender - Sender information
 * @param {Array} emailData.to - Array of recipients
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.htmlContent - HTML content
 * @param {string} emailData.textContent - Plain text content
 * @returns {Promise<Object>} Result of the email sending operation
 */
async function sendEmailViaBrevoAPI(emailData) {
  try {
    const { sender, to, subject, htmlContent, textContent } = emailData;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: sender,
        to: to,
        subject: subject,
        htmlContent: htmlContent,
        textContent: textContent,
        headers: {
          'X-Mailer': 'AR Furniture v1.0',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Email sent successfully via Brevo API:', data.messageId);

    return {
      success: true,
      messageId: data.messageId,
      data: data
    };

  } catch (error) {
    console.error('Error sending email via Brevo API:', error);

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send password reset email with verification code
 * @param {Object} resetData - Password reset information
 * @param {string} resetData.email - User's email address
 * @param {string} resetData.fullName - User's full name
 * @param {string} resetData.resetCode - 6-digit verification code
 * @returns {Promise<Object>} Result of the email sending operation
 */
export async function sendPasswordResetEmail(resetData) {
  try {
    const { email, fullName, resetCode } = resetData;

    if (!email) {
      throw new Error('Email address is required');
    }

    // Ultra-modern, premium email HTML template
    const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Notification - AR Furniture</title>
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }
    
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content { padding: 32px 24px !important; }
      .header { padding: 40px 24px !important; }
      .footer { padding: 32px 24px !important; }
      .code-text { font-size: 32px !important; letter-spacing: 4px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">Reset your password for AR Furniture. Your code is ${resetCode}</div>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table class="container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td class="header" align="center" style="background: #111827; padding: 48px 40px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.02em;">Reset your password</h1>
              <p style="color: #9ca3af; margin: 8px 0 0; font-size: 15px; font-weight: 400;">We received a request to reset your password</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="content" style="padding: 40px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.5;">Hi ${fullName},</p>
              <p style="margin: 0 0 32px; font-size: 15px; color: #6b7280; line-height: 1.5;">Use the code below to reset your password. This code will expire in <span style="color: #111827; font-weight: 500;">15 minutes</span>.</p>
              
              <!-- Code Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 32px 24px;">
                    <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280; font-weight: 500;">Your verification code</p>
                    <div class="code-text" style="font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; font-size: 36px; font-weight: 600; color: #111827; letter-spacing: 6px; background-color: #ffffff; padding: 16px 28px; border-radius: 6px; border: 1px solid #e5e7eb; display: inline-block;">${resetCode}</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">If you didn't request a password reset, you can safely ignore this email.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">&copy; ${new Date().getFullYear()} AR Furniture</p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This email was sent automatically. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Modern plain text version
    const textContent = `
AR FURNITURE: PASSWORD RESET
---------------------------------
Hello ${fullName},

We received a request to reset your password. Use the code below to proceed:

RESET CODE: ${resetCode}

This code expires in 15 minutes.

If you did not request this, please ignore this email. Never share your reset code.

Best regards,
The AR Furniture Team
    `.trim();

    // Prepare email data for Brevo API
    const emailData = {
      sender: {
        name: process.env.BREVO_FROM_NAME || 'AR Furniture Security',
        email: process.env.BREVO_FROM_EMAIL
      },
      to: [{ email: email }],
      subject: 'Verification Code - AR Furniture',
      htmlContent: htmlContent,
      textContent: textContent
    };

    const result = await sendEmailViaBrevoAPI(emailData);
    if (result.success) {
      console.log('Password reset email sent successfully:', result.messageId);
    }
    return result;

  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetConfirmationEmail(confirmationData) {
  try {
    const { email, fullName } = confirmationData;

    if (!email) {
      throw new Error('Email address is required');
    }

    // Ultra-modern, premium confirmation HTML template
    const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Update - AR Furniture</title>
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }
    
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content { padding: 32px 24px !important; }
      .header { padding: 40px 24px !important; }
      .footer { padding: 32px 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">Your AR Furniture password has been updated successfully.</div>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table class="container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td class="header" align="center" style="background: #111827; padding: 48px 40px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.02em;">Password updated</h1>
              <p style="color: #9ca3af; margin: 8px 0 0; font-size: 15px; font-weight: 400;">Your password has been successfully changed</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="content" style="padding: 40px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.5;">Hi ${fullName},</p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #6b7280; line-height: 1.5;">Your password has been updated successfully. You can now sign in with your new password.</p>
              
              <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">If you didn't make this change, please contact us immediately at support@arfurniture.com</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">&copy; ${new Date().getFullYear()} AR Furniture</p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This email was sent automatically. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Modern plain text version
    const textContent = `
AR FURNITURE: PASSWORD UPDATED
---------------------------------
Hello ${fullName},

Your password has been changed successfully.

If you did not make this change, please contact our support team immediately at support@arfurniture.com.

Best regards,
The AR Furniture Team
    `.trim();

    // Prepare email data for Brevo API
    const emailData = {
      sender: {
        name: process.env.BREVO_FROM_NAME || 'AR Furniture Security',
        email: process.env.BREVO_FROM_EMAIL
      },
      to: [{ email: email }],
      subject: 'Security Update: Password Changed - AR Furniture',
      htmlContent: htmlContent,
      textContent: textContent
    };

    const result = await sendEmailViaBrevoAPI(emailData);
    if (result.success) {
      console.log('Confirmation email sent successfully:', result.messageId);
    }
    return result;

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
}

