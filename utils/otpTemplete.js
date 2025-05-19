const otpTemplate = otpCode => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
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
            .otp-code {
                font-size: 22px;
                font-weight: bold;
                color: #3a97d4;
                background: #f1f1f1;
                padding: 10px 20px;
                display: inline-block;
                border-radius: 5px;
                letter-spacing: 4px;
                margin-top: 15px;
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
            <img src="${process.env.BASE_URL}/images/logo.png" alt="Care Insight Logo" class="logo">
            <div class="header">Care Insight</div>
            <div class="message">
                Use the OTP below to reset your password. This code is valid for the next 10 minutes. If you didn't request a password reset, please ignore this email.
            </div>
            <div class="otp-code">${otpCode}</div>
            <div class="footer">
                <p>If you did not request this OTP, please <a href="${process.env.FRONTEND_URL}/contact">contact support</a> immediately.</p>
                <p>Best regards,<br>The Care Insight Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
export default otpTemplate;
