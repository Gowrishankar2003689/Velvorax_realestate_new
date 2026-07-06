const { Lead, HotLead, User } = require("../models");

/**
 * Parses natural language CRM questions and maps them to database operations.
 * Returns a markdown reply and a structured data object.
 */
async function processCrmQuery(message) {
  const query = message.toLowerCase().trim();

  try {
    // 1. Leads added today
    if (query.includes("leads added today") || query.includes("added today") || query.includes("new leads today")) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const leads = await Lead.find({ createdAt: { $gte: startOfToday } });
      const count = leads.length;

      let reply = `📊 **Today's Lead Enrollment**\n\n`;
      if (count === 0) {
        reply += `There have been **no new leads** registered today.`;
      } else {
        reply += `We registered **${count} new lead(s)** today:\n`;
        leads.forEach((l, i) => {
          reply += `${i + 1}. **${l.name}** (${l.company || 'Individual'}) - Service: *${l.service || 'N/A'}* | Budget: *$${(l.budget || 0).toLocaleString()}*\n`;
        });
      }
      return { reply, intent: "leads_today", data: leads };
    }

    // 2. Top Tele-caller / Added most leads
    if (query.includes("tele-caller") || query.includes("telecaller") || query.includes("most leads")) {
      const aggregates = await Lead.aggregate([
        { $group: { _id: "$teleCaller", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      let reply = `📞 **Tele-caller Lead Allocation Summary**\n\n`;
      if (aggregates.length === 0) {
        reply += `No leads have been assigned to tele-callers yet.`;
      } else {
        reply += `Here is the performance ranking by lead assignment count:\n\n`;
        aggregates.forEach((item, index) => {
          const badge = index === 0 ? "🥇" : (index === 1 ? "🥈" : "🥉");
          reply += `${badge} **${item._id || 'Unassigned'}**: assigned **${item.count} leads**\n`;
        });
      }
      return { reply, intent: "telecaller_performance", data: aggregates };
    }

    // 3. Status of a specific lead
    if (query.includes("status of") || query.includes("where is lead") || query.includes("details for")) {
      const namePattern = /(?:status of|where is lead|details for)\s+([a-zA-Z\s]+)/i;
      const match = message.match(namePattern);

      if (match && match[1]) {
        const searchName = match[1].trim();
        const lead = await Lead.findOne({ name: { $regex: new RegExp(searchName, "i") } });

        if (!lead) {
          return {
            reply: `🔍 I couldn't find a CRM lead matching the name **"${searchName}"**. Please verify spelling and try again.`,
            intent: "lead_status_not_found",
            data: null
          };
        }

        const dateStr = new Date(lead.createdAt).toLocaleDateString();
        const hotBadge = lead.isHot ? " 🔥 **[HOT LEAD]**" : "";
        let reply = `👤 **Lead Profile: ${lead.name}**${hotBadge}\n\n` +
                    `- **Company:** ${lead.company || 'N/A'}\n` +
                    `- **Service Required:** ${lead.service || 'N/A'}\n` +
                    `- **Est. Budget:** $${(lead.budget || 0).toLocaleString()}\n` +
                    `- **Timeline:** ${lead.timeline || 'N/A'}\n` +
                    `- **Current Status:** \`${lead.status}\`\n` +
                    `- **Assigned Tele-caller:** ${lead.teleCaller || 'Unassigned'}\n` +
                    `- **Registered On:** ${dateStr}\n` +
                    `- **Vending Checklist Info:** *${lead.vendingDetails || 'N/A'}*`;

        return { reply, intent: "lead_status_found", data: lead };
      }
    }

    // 4. Show today's business performance summary
    if (query.includes("business performance") || query.includes("today's summary") || query.includes("performance summary")) {
      const totalLeads = await Lead.countDocuments();
      const hotLeadsCount = await Lead.countDocuments({ isHot: true });
      const closedWon = await Lead.countDocuments({ status: "Closed" }); // Status might be 'Closed' in this project

      const revenueAgg = await Lead.aggregate([
        { $match: { status: "Closed" } },
        { $group: { _id: null, total: { $sum: "$budget" } } }
      ]);
      const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

      const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

      let reply = `🚀 **Velvorax Business Performance Overview**\n\n` +
                  `Here is a summary of our active CRM database performance:\n\n` +
                  `- 💼 **Total Leads Captured:** **${totalLeads}**\n` +
                  `- 🔥 **Hot Leads Identified:** **${hotLeadsCount}**\n` +
                  `- 🤝 **Successfully Closed Deals:** **${closedWon}**\n` +
                  `- 📊 **Sales Conversion Rate:** **${conversionRate}%**\n` +
                  `- 💰 **Generated Closed Revenue:** **$${totalRevenue.toLocaleString()}**\n\n` +
                  `💡 *Need more granular detail? Search for a specific lead status.*`;

      return {
        reply,
        intent: "business_summary",
        data: { totalLeads, hotLeadsCount, closedWon, totalRevenue, conversionRate }
      };
    }

    // 5. Show hot leads
    if (query.includes("hot leads") || query.includes("show hot") || query.includes("list hot")) {
      const leads = await Lead.find({ isHot: true });
      let reply = `🔥 **High-Interest Hot Leads**\n\n`;
      if (leads.length === 0) {
        reply += `There are currently no leads classified as **Hot**.`;
      } else {
        reply += `I detected **${leads.length} Hot Lead(s)** requiring immediate callback attention:\n\n`;
        leads.forEach((l, i) => {
          reply += `${i + 1}. **${l.name}** (${l.company || 'Individual'})\n` +
                   `   - Budget: **$${(l.budget || 0).toLocaleString()}** | Service: *${l.service || 'N/A'}*\n` +
                   `   - Urgency Reason: *${l.urgent ? "Marked Urgent" : "High Budget Profile"}*\n` +
                   `   - Handler: *${l.teleCaller || 'Unassigned'}* | Status: *${l.status}*\n\n`;
        });
      }
      return { reply, intent: "hot_leads", data: leads };
    }

    // 6. Help command
    if (query.includes("help") || query === "?" || query.includes("what can you do") || query.includes("hello") || query.includes("hi")) {
      let reply = `👋 **Welcome to Velvorax Smart Business Assistant!**\n\n` +
                  `I am your direct link to the CRM database. You can query me in natural language to inspect performance, leads, and follow-ups. Here are examples of questions you can ask:\n\n` +
                  `- 📈 *"Show today's business performance summary"* or *"Show conversion statistics"*\n` +
                  `- 👤 *"What is the status of Diana Prince?"*\n` +
                  `- 🔥 *"Show hot leads"* or *"Show inactive leads"*\n` +
                  `- 📞 *"Which tele-caller added the most leads?"* or *"How many leads were added today?"*\n\n` +
                  `How can I assist you today?`;
      return { reply, intent: "help", data: null };
    }

    // Default conversational reply mapping
    return {
      reply: `I understand you are asking about: "${message}".\n\n` +
             `As the CRM Business Assistant, I can fetch real-time lead metrics, statuses, and performance values. ` +
             `Type **'help'** to see a full list of database query examples I can handle!`,
      intent: "general_crm",
      data: null
    };

  } catch (error) {
    console.error("NLP service error:", error);
    return {
      reply: "⚠️ An error occurred while interpreting your database query. Please check my connection logs.",
      intent: "error",
      data: null
    };
  }
}

module.exports = { processCrmQuery };
