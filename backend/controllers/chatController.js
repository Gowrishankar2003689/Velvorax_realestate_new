const { User, Lead, Chat, HotLead, Notification, StandardUser } = require("../models");
const nlpService = require("../services/nlpService");
const openaiService = require("../services/openaiService");

/**
 * POST /api/chat
 * Customer-Facing Chatbot Endpoint.
 */
async function handleCustomerChat(req, res) {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ error: "Message content cannot be blank." });
  }

  try {
    // 1. Locate User in DB
    let user = await User.findById(userId);
    if (!user) {
        user = await StandardUser.findById(userId);
    }
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const email = user.email;
    const name = user.name;
    const textLower = message.toLowerCase();
    let botReply = "";
    let isHotLeadDetected = false;
    let hotReason = "";

    // 2. Perform Hot Lead Detection
    const hotKeywords = ["urgent", "immediately", "enterprise", "high budget", "demo today", "need fast delivery"];
    const matchedKeyword = hotKeywords.find(kw => textLower.includes(kw));

    if (matchedKeyword) {
      isHotLeadDetected = true;
      hotReason = `Matched hot keyword: "${matchedKeyword}" in message: "${message}"`;
    }

    // 3. Locate or create a Lead entry for this customer
    let lead = await Lead.findOne({ email });
    if (!lead) {
      // Create a default lead profile
      lead = new Lead({
        name,
        email,
        phone: user.phone || "0000000000",
        company: "Individual",
        service: "Other",
        budget: 5000,
        timeline: "Flexible",
        status: "New",
        source: "AI Chatbot"
      });
    }

    // Capture questionnaire answers
    if (textLower.includes("crm") || textLower.includes("website") || textLower.includes("app") || textLower.includes("ai automation") || textLower.includes("marketing")) {
      if (textLower.includes("crm")) lead.service = "CRM";
      else if (textLower.includes("website")) lead.service = "Website";
      else if (textLower.includes("app")) lead.service = "App";
      else if (textLower.includes("ai automation")) lead.service = "AI Automation";
      else if (textLower.includes("marketing")) lead.service = "Marketing";
    }

    const budgetMatch = textLower.match(/(?:\$|budget\s+is\s+)?(\d{4,6})/);
    if (budgetMatch && budgetMatch[1]) {
      lead.budget = parseInt(budgetMatch[1]);
      if (lead.budget >= 50000) {
        isHotLeadDetected = true;
        hotReason = `High budget profile: $${lead.budget.toLocaleString()}`;
      }
    }

    if (textLower.includes("month") || textLower.includes("week") || textLower.includes("flexible") || textLower.includes("urgent")) {
      const timelineMatch = message.match(/(?:timeline\s+is\s+)?([a-zA-Z0-9\s]+(?:month|week|flexible|immediate))/i);
      if (timelineMatch) {
        lead.timeline = timelineMatch[1].trim();
      }
    }

    if (isHotLeadDetected) {
      lead.isHot = true;
      lead.urgent = true;
      lead.priority = 'Hot';
    }
    await lead.save();

    // 4. Handle actions if flagged as Hot Lead
    if (isHotLeadDetected) {
      const existingHotLog = await HotLead.findOne({ leadId: lead._id });
      if (!existingHotLog) {
        await HotLead.create({
          leadId: lead._id,
          reason: hotReason
        });

        await Notification.create({
          title: "🔥 Hot Lead Detected!",
          message: `${name} (${lead.company || "Individual"}) triggered a hot lead status. Reason: ${hotReason}`,
          type: "hot_lead"
        });
      }

      botReply = `🚨 **HOT LEAD SYSTEM ACTIVATED** 🚨\n\n` +
                 `Thank you, **${name.split(" ")[0]}**! I have flagged your project requirements as **High Priority** and notified our enterprise account architects.\n\n` +
                 `An expert from Velvorax Solutions will contact you at **${lead.email}** within the hour. ` +
                 `Meanwhile, what specific database or system integrations do you need?`;
    } else {
      const chatLog = await Chat.findOne({ userId: user._id });
      botReply = await openaiService.chatConversational(message, chatLog ? chatLog.messages : []);
    }

    // 5. Save message transcripts to MongoDB
    let chat = await Chat.findOne({ userId: user._id });
    if (!chat) {
      chat = new Chat({ userId: user._id, messages: [] });
    }
    chat.messages.push({ sender: "user", text: message, timestamp: new Date() });
    chat.messages.push({ sender: "bot", text: botReply, timestamp: new Date() });
    await chat.save();

    res.json({
      success: true,
      reply: botReply,
      promptUsage: req.promptUsage,
      leadStatus: {
        isHot: lead.isHot,
        service: lead.service,
        budget: lead.budget
      }
    });

  } catch (error) {
    console.error("Customer chat controller error:", error);
    res.status(500).json({ error: "Fail-safe: Chat processor encountered an internal error." });
  }
}

/**
 * POST /api/chat/admin
 */
async function handleAdminChat(req, res) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message content cannot be empty." });
  }

  try {
    const nlpResult = await nlpService.processCrmQuery(message);

    let finalReply = nlpResult.reply;
    if (openaiService.isEnabled() && nlpResult.data !== null) {
      finalReply = await openaiService.formatWithOpenAi(message, nlpResult.data, nlpResult.reply);
    }

    res.json({
      success: true,
      reply: finalReply,
      intent: nlpResult.intent,
      data: nlpResult.data
    });

  } catch (error) {
    console.error("Admin chatbot controller error:", error);
    res.status(500).json({ error: "Failed to process administrative assistant query." });
  }
}

module.exports = {
  handleCustomerChat,
  handleAdminChat
};
