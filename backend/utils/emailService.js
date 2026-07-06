const nodemailer = require('nodemailer');
const dns = require('dns');

/**
 * Sends an email with an attachment
 * @param {Object} options - Email options (to, subject, text, html, attachments)
 */
const sendEmail = async (options) => {
    console.log('Attempting to send email to:', options.to);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // Port 587 uses STARTTLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Force IPv4 to prevent ENETUNREACH on IPv6-enabled environments like Render
        family: 4,
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 20000,
        // Enhanced lookup to strictly force IPv4
        lookup: (hostname, options, callback) => {
            dns.resolve4(hostname, (err, addresses) => {
                if (err || !addresses || addresses.length === 0) {
                    // Fallback to standard lookup if resolve4 fails (e.g. for local hosts)
                    return dns.lookup(hostname, { family: 4 }, callback);
                }
                // Return the first IPv4 address found
                callback(null, addresses[0], 4);
            });
        },
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
            // Ensure servername is set for certificate verification when using custom lookup
            servername: process.env.SMTP_HOST || 'smtp.gmail.com'
        }
    });

    try {
        const mailOptions = {
            from: `"Velvorax CRM" <${process.env.SMTP_USER || 'info.velvorax@gmail.com'}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
            attachments: options.attachments || []
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Nodemailer Error:', error.message);
        throw error;
    }
};

const sendLeadNotificationToAdmin = async (adminEmail, leadData) => {
    const emailOptions = {
        to: adminEmail,
        subject: `🔔 New Lead Captured: ${leadData.name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
                <h2 style="color: #FFD700; text-align: center; background: #000; padding: 15px; border-radius: 8px;">New Lead Alert</h2>
                <p>Hello,</p>
                <p>A new lead has just submitted a form.</p>
                <div style="background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${leadData.name}</p>
                    <p><strong>Email:</strong> ${leadData.email || 'Not provided'}</p>
                    <p><strong>Phone:</strong> ${leadData.phone || 'Not provided'}</p>
                </div>
                <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">Velvorax Enterprise CRM Automation</p>
            </div>
        `
    };
    return await sendEmail(emailOptions);
};

const sendLeadAutoResponseToLead = async (leadEmail, leadName) => {
    const emailOptions = {
        to: leadEmail,
        subject: 'Thank you for your inquiry - Velvorax',
        html: `<p>Hello ${leadName}, Thank you for reaching out to us. We have received your inquiry.</p>`
    };
    return await sendEmail(emailOptions);
};

const sendRegistrationNotification = async (registrationData, pdfPath) => {
    const adminEmails = process.env.SUPER_ADMIN_EMAILS ? process.env.SUPER_ADMIN_EMAILS.split(',') : [];
    if (adminEmails.length === 0) return;

    const emailOptions = {
        to: adminEmails,
        subject: `[AWAITING APPROVAL] New Project Registration: ${registrationData.companyName}`,
        html: `<p>A new client has registered: ${registrationData.name} from ${registrationData.companyName}.</p>`,
        attachments: [{ filename: `Registration.pdf`, path: pdfPath }]
    };
    return await sendEmail(emailOptions);
};

const sendRegistrationConfirmation = async (toEmail, userName) => {
    const emailOptions = {
        to: toEmail,
        subject: 'Registration Successful - Velvorax AI',
        html: `<p>Hello ${userName}, Thank you for registering with Velvorax.</p>`
    };
    return await sendEmail(emailOptions);
};

const sendApprovalNotification = async (toEmail, userName, status) => {
    const isApproved = status === 'Approved';
    const emailOptions = {
        to: toEmail,
        subject: isApproved ? 'Account Approved!' : 'Account Status Update',
        html: `<p>Hello ${userName}, Your account has been ${status}.</p>`
    };
    return await sendEmail(emailOptions);
};

const sendBlogApprovalNotification = async (toEmail, authorName, blogTitle) => {
    const emailOptions = {
        to: toEmail,
        subject: `🎉 Article Approved: ${blogTitle}`,
        html: `<p>Hello ${authorName}, Your article "${blogTitle}" is live!</p>`
    };
    return await sendEmail(emailOptions);
};

const sendBlogSubmissionNotification = async (toEmail, authorName, blogTitle) => {
    const emailOptions = {
        to: toEmail,
        subject: `Thank you for publishing: ${blogTitle}`,
        html: `<p>Hello ${authorName}, Thank you for submitting your article.</p>`
    };
    return await sendEmail(emailOptions);
};

const sendPasswordResetEmail = async (toEmail, userName, resetLink) => {
    const emailOptions = {
        to: toEmail,
        subject: 'Password Reset Request - Velvorax Security',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 15px; background: #030308; color: #ffffff;">
                <h1 style="color: #facc15; text-align: center;">Velvorax Security</h1>
                <p>Hello <strong>${userName}</strong>,</p>
                <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: #facc15; color: #000; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset My Password</a>
                </div>
                <p style="font-size: 12px; color: #6b7280;">If you didn't request this, please ignore this email.</p>
            </div>
        `
    };
    return await sendEmail(emailOptions);
};

module.exports = {
    sendEmail,
    sendRegistrationNotification,
    sendRegistrationConfirmation,
    sendApprovalNotification,
    sendLeadNotificationToAdmin,
    sendLeadAutoResponseToLead,
    sendBlogApprovalNotification,
    sendBlogSubmissionNotification,
    sendPasswordResetEmail
};
