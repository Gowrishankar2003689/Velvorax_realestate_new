const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const dns = require("dns");
const { initAI, generateEmail } = require("../services/ai");
const { Lead } = require("../models");
const auth = require("../middleware/auth");

// Initialize AI from environment
initAI(process.env.GEMINI_API_KEY);

// 1. AI Email Generation trigger
router.post("/generate-email", async (req, res) => {
  const { contactId, customRecipient, prompt, tone, length, bullets, refinements } = req.body;

  let recipient = { name: "Prospect", email: "", company: "their company", title: "Professional" };

  if (contactId) {
    try {
      const lead = await Lead.findById(contactId);
      if (lead) {
        recipient = {
          name: lead.name,
          email: lead.email,
          company: lead.company,
          title: lead.designation || "Professional"
        };
      }
    } catch (err) {
      console.error("Error fetching lead for AI generation:", err);
    }
  } else if (customRecipient) {
    recipient = {
      name: customRecipient.name || "Prospect",
      email: customRecipient.email || "",
      company: customRecipient.company || "their company",
      title: customRecipient.title || "Professional"
    };
  }

  const sender = {
    senderName: process.env.SENDER_NAME || "Velvorax AI",
    senderTitle: process.env.SENDER_TITLE || "Enterprise Manager",
    senderCompany: process.env.SENDER_COMPANY || "Velvorax",
    signature: process.env.SENDER_SIGNATURE || "Velvorax Team"
  };

  try {
    const emailResult = await generateEmail({
      recipient,
      sender,
      prompt,
      tone,
      length,
      bullets,
      refinements,
      apiKey: process.env.GEMINI_API_KEY
    });

    res.json(emailResult);
  } catch (error) {
    console.error("AI Generation request failed:", error);
    res.status(500).json({ error: "Failed to generate email content." });
  }
});

// 2. Send Email via SMTP
router.post("/send-email", async (req, res) => {
  const { recipientEmail, subject, body } = req.body;

  // READ DIRECTLY FROM process.env INSIDE ROUTE TO ENSURE RENDER VALUES ARE USED
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  console.log(`RENDER ATTEMPT: Sending email to ${recipientEmail} using ${smtpUser}`);

  if (!smtpUser || !smtpPass) {
    return res.status(400).json({ error: "SMTP_USER and SMTP_PASS are not configured in environment variables." });
  }

  try {
    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass
        },
        // EXTREMELY IMPORTANT: Bypass Render's IPv6 issue
        lookup: (hostname, options, callback) => {
            dns.lookup(hostname, { family: 4 }, (err, address, family) => {
                callback(err, address, family);
            });
        },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
      from: `"Velvorax AI" <${smtpUser}>`,
      to: recipientEmail,
      subject: subject,
      text: body
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email Transmitted Success:", info.messageId);
    res.json({ message: "Email transmitted successfully!", messageId: info.messageId });

  } catch (error) {
    console.error("SMTP Transmission Error:", error.message);
    res.status(500).json({ error: `Connection Error: ${error.message}` });
  }
});

module.exports = router;
