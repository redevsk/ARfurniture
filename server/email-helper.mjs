/**
 * Email helper for AR Furniture using Brevo SMTP API
 * Similar to SET-2 System implementation
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

    // Email HTML template - Styled for AR Furniture
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - AR Furniture</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f1f5f9;
            padding: 24px 16px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: #ffffff;
            padding: 40px 32px;
            text-align: center;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.3) 0%, transparent 50%);
            pointer-events: none;
          }
          
          .header-content {
            position: relative;
            z-index: 1;
          }
          
          .header-icon {
            width: 64px;
            height: 64px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
            backdrop-filter: blur(10px);
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #ffffff;
            letter-spacing: -0.5px;
          }
          
          .header p {
            font-size: 16px;
            margin: 0;
            opacity: 0.95;
            font-weight: 400;
          }
          
          .content {
            padding: 32px;
          }
          
          .greeting {
            font-size: 18px;
            font-weight: 500;
            color: #1e293b;
            margin-bottom: 16px;
          }
          
          .intro-text {
            font-size: 16px;
            color: #475569;
            margin-bottom: 24px;
            line-height: 1.6;
          }
          
          .reset-code-box {
            background: linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%);
            border-radius: 12px;
            padding: 32px 24px;
            margin: 24px 0;
            border: 2px solid #8b5cf6;
            text-align: center;
          }
          
          .reset-code-box h2 {
            color: #6d28d9;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 20px 0;
          }
          
          .reset-code {
            display: inline-block;
            background-color: #ffffff;
            border: 2px solid #8b5cf6;
            border-radius: 12px;
            padding: 20px 32px;
            font-size: 36px;
            font-weight: 700;
            color: #6d28d9;
            font-family: 'Courier New', 'Roboto Mono', monospace;
            letter-spacing: 8px;
            margin: 16px 0;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
          }
          
          .expiry-notice {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
          }
          
          .expiry-notice p {
            color: #d97706;
            font-size: 14px;
            margin: 0;
            font-weight: 500;
          }
          
          .security-notice {
            background-color: #fee2e2;
            border: 1px solid #ef4444;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
          }
          
          .security-notice h3 {
            color: #dc2626;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px 0;
          }
          
          .security-notice p {
            color: #b91c1c;
            font-size: 14px;
            margin: 8px 0;
            line-height: 1.5;
          }
          
          .footer {
            background-color: #f8fafc;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer p {
            color: #64748b;
            font-size: 12px;
            margin: 6px 0;
            line-height: 1.5;
          }
          
          .footer-brand {
            font-weight: 600;
            color: #4f46e5;
            margin-top: 16px;
          }
          
          @media only screen and (max-width: 600px) {
            body {
              padding: 12px 8px;
            }
            
            .header {
              padding: 32px 24px;
            }
            
            .content {
              padding: 24px;
            }
            
            .reset-code-box {
              padding: 24px 16px;
            }
            
            .reset-code {
              font-size: 28px;
              letter-spacing: 4px;
              padding: 16px 24px;
            }
            
            .footer {
              padding: 20px 24px;
            }
            
            .header h1 {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <div class="header-content">
              <div class="header-icon">🔐</div>
              <h1>Password Reset Request</h1>
              <p>AR Furniture Security</p>
            </div>
          </div>
          
          <!-- Content -->
          <div class="content">
            <p class="greeting">Hello, <strong>${fullName}</strong></p>
            
            <p class="intro-text">
              We received a request to reset the password for your AR Furniture account. 
              Use the verification code below to proceed with your password reset.
            </p>
            
            <!-- Reset Code Box -->
            <div class="reset-code-box">
              <h2>Your Verification Code</h2>
              <div class="reset-code">${resetCode}</div>
              <p style="color: #6d28d9; font-size: 14px; margin: 0;">
                Enter this code on the password reset page to continue.
              </p>
            </div>
            
            <!-- Expiry Notice -->
            <div class="expiry-notice">
              <p>⏰ This verification code will expire in <strong>15 minutes</strong> for security reasons.</p>
            </div>
            
            <!-- Security Notice -->
            <div class="security-notice">
              <h3>⚠️ Security Alert</h3>
              <p>
                If you did not request this password reset, please ignore this email and 
                contact our support team immediately.
              </p>
              <p>
                Your account security is important to us. Never share your verification 
                code with anyone.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>This is an automated security message from AR Furniture.</p>
            <p>Please do not reply to this email.</p>
            <p>For assistance, please contact our support team.</p>
            <p class="footer-brand">© ${new Date().getFullYear()} AR Furniture • All rights reserved</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textContent = `
╔══════════════════════════════════════════════════════════════╗
║           PASSWORD RESET REQUEST - AR FURNITURE              ║
╚══════════════════════════════════════════════════════════════╝

Hello ${fullName},

We received a request to reset the password for your AR Furniture account.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 YOUR VERIFICATION CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                        ${resetCode}

⏰ This code expires in 15 minutes for security reasons.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 HOW TO RESET YOUR PASSWORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Return to the password reset page
2. Enter the 6-digit verification code shown above
3. Create a new, secure password
4. Confirm your new password
5. Click "Reset Password" to complete the process

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  SECURITY ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you did not request this password reset, please ignore this 
email and contact our support team immediately.

Your account security is important to us. Never share your 
verification code with anyone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated security message from AR Furniture.
Please do not reply to this email.

For assistance, please contact our support team.

© ${new Date().getFullYear()} AR Furniture. All rights reserved.
    `.trim();

    // Prepare email data for Brevo API
    const emailData = {
      sender: {
        name: process.env.BREVO_FROM_NAME || 'AR Furniture Security',
        email: process.env.BREVO_FROM_EMAIL
      },
      to: [{ email: email }],
      subject: 'Password Reset Request - AR Furniture',
      htmlContent: htmlContent,
      textContent: textContent
    };

    // Send email using Brevo API
    const result = await sendEmailViaBrevoAPI(emailData);

    if (result.success) {
      console.log('Password reset email sent successfully:', result.messageId);
    }

    return result;

  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send password reset confirmation email
 * @param {Object} confirmationData - Password reset confirmation information
 * @param {string} confirmationData.email - User's email address
 * @param {string} confirmationData.fullName - User's full name
 * @returns {Promise<Object>} Result of the email sending operation
 */
export async function sendPasswordResetConfirmationEmail(confirmationData) {
  try {
    const { email, fullName } = confirmationData;

    if (!email) {
      throw new Error('Email address is required');
    }

    // Email HTML template for confirmation
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful - AR Furniture</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f1f5f9;
            padding: 24px 16px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            padding: 40px 32px;
            text-align: center;
            position: relative;
          }
          
          .header-content {
            position: relative;
            z-index: 1;
          }
          
          .header-icon {
            width: 64px;
            height: 64px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #ffffff;
          }
          
          .content {
            padding: 32px;
          }
          
          .greeting {
            font-size: 18px;
            font-weight: 500;
            color: #1e293b;
            margin-bottom: 16px;
          }
          
          .success-box {
            background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border: 2px solid #10b981;
            text-align: center;
          }
          
          .success-box h2 {
            color: #047857;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 12px 0;
          }
          
          .success-box p {
            color: #065f46;
            font-size: 14px;
            margin: 0;
          }
          
          .footer {
            background-color: #f8fafc;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer p {
            color: #64748b;
            font-size: 12px;
            margin: 6px 0;
          }
          
          .footer-brand {
            font-weight: 600;
            color: #4f46e5;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="header-icon">✅</div>
              <h1>Password Reset Successful</h1>
            </div>
          </div>
          
          <div class="content">
            <p class="greeting">Hello, <strong>${fullName}</strong></p>
            
            <div class="success-box">
              <h2>Your Password Has Been Reset</h2>
              <p>Your AR Furniture account password has been successfully changed. You can now log in with your new password.</p>
            </div>
            
            <p style="color: #475569; font-size: 14px; margin-top: 24px;">
              If you did not make this change, please contact our support team immediately to secure your account.
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from AR Furniture.</p>
            <p class="footer-brand">© ${new Date().getFullYear()} AR Furniture • All rights reserved</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textContent = `
╔══════════════════════════════════════════════════════════════╗
║         PASSWORD RESET SUCCESSFUL - AR FURNITURE             ║
╚══════════════════════════════════════════════════════════════╝

Hello ${fullName},

✅ YOUR PASSWORD HAS BEEN RESET SUCCESSFULLY

Your AR Furniture account password has been successfully changed. 
You can now log in with your new password.

If you did not make this change, please contact our support team 
immediately to secure your account.

© ${new Date().getFullYear()} AR Furniture. All rights reserved.
    `.trim();

    // Prepare email data for Brevo API
    const emailData = {
      sender: {
        name: process.env.BREVO_FROM_NAME || 'AR Furniture Security',
        email: process.env.BREVO_FROM_EMAIL
      },
      to: [{ email: email }],
      subject: 'Password Reset Successful - AR Furniture',
      htmlContent: htmlContent,
      textContent: textContent
    };

    // Send email using Brevo API
    const result = await sendEmailViaBrevoAPI(emailData);

    if (result.success) {
      console.log('Password reset confirmation email sent successfully:', result.messageId);
    }

    return result;

  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}
