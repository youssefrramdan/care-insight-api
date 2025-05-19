/* eslint-disable arrow-body-style */
/* eslint-disable import/prefer-default-export */

const emailTemplate = token => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 50px auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .logo {
                width: 120px;
                margin-bottom: 20px;
            }
            .header {
                font-size: 24px;
                font-weight: bold;
                color: #3a97d4;
            }
            .message {
                font-size: 16px;
                color: #666;
                margin: 20px 0;
            }
            .verify-button {
                display: inline-block;
                padding: 12px 20px;
                font-size: 18px;
                color: #ffffff;
                background-color: #3a97d4;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
            .footer {
                margin-top: 30px;
                font-size: 14px;
                color: #999;
            }
            .footer a {
                color: #3a97d4;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">Care Insight</div>
            <div class="message">
                Thank you for signing up with Care Insight, your trusted healthcare platform! Please confirm your email address by clicking the button below.
            </div>
            <a href="${process.env.BASE_URL}/api/users/verify/${token}" class="verify-button">Verify Email</a>
            <div class="footer">
                <p>If you did not create an account, please ignore this email or <a href="${process.env.FRONTEND_URL}">contact support</a>.</p>
                <p>Best regards,<br>The Care Insight Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
export default emailTemplate;
