import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testGmail() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;

    console.log('--- Testing Gmail SMTP ---');
    console.log('User:', user);
    // Do not log the full password, just its existence and length
    console.log('Pass existence:', !!pass);
    console.log('Pass length:', pass?.length);

    if (!user || !pass) {
        console.error('Error: GMAIL_USER or GMAIL_PASS is missing in your .env file!');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: { user, pass },
    });

    try {
        console.log('🔄 Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP connection is verified and ready!');

        console.log('🔄 Sending test email to', user, '...');
        const info = await transporter.sendMail({
            from: `"AgroTech Test" <${user}>`,
            to: user,
            subject: "AgroTech Gmail Test ✔",
            text: "If you received this, your Gmail SMTP is working perfectly!",
            html: "<b>If you received this, your Gmail SMTP is working perfectly!</b>",
        });

        console.log('✅ Test email sent successfully!');
        console.log('Email ID:', info.messageId);
    } catch (error) {
        console.error('❌ Gmail Test FAILED:');
        console.error(error);
    }
}

testGmail();
