const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;

// Initialize or update Gemini client
function initAI(apiKey) {
  if (apiKey && apiKey.trim() !== "") {
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log("Gemini API initialized successfully.");
    } catch (err) {
      console.error("Failed to initialize Gemini API:", err);
      genAI = null;
    }
  } else {
    genAI = null;
    console.log("Gemini API client cleared (running in mock demo mode).");
  }
}

// Highly robust mock generator for when Gemini is not configured or fails
function generateMockEmail(recipient, sender, prompt, tone, length, bullets, refinementHistory = []) {
  console.log("Using fall-back mock AI generator");

  const recipientName = recipient.name || "there";
  const recipientCompany = recipient.company || "your company";
  const senderName = sender.senderName || "Alex Mercer";
  const senderTitle = sender.senderTitle || "Growth Manager";
  const senderCompany = sender.senderCompany || "ApexCRM Labs";
  const signature = sender.signature || `${senderName}\n${senderTitle} | ${senderCompany}`;

  let subject = "";
  let body = "";

  // Decide core message based on prompt and tone
  const promptLower = prompt.toLowerCase();

  if (promptLower.includes("follow up") || promptLower.includes("followup")) {
    subject = `Quick follow up - ${senderCompany} / ${recipientCompany}`;
    body = `Hi ${recipientName},\n\nI hope you're having a great week.\n\nI wanted to follow up on our previous conversation regarding your team's workflow optimization. Based on your goals at ${recipientCompany}, I'm confident our advanced automation suite can solve the manual bottlenecks we discussed.\n\n${bullets ? `Here are a few quick points we should keep in mind:\n${bullets.split('\n').map(b => `• ${b}`).join('\n')}\n\n` : ''}Do you have 10 minutes for a brief call this Thursday at 2 PM to explore this further?\n\nBest regards,\n\n${signature}`;
  } else if (promptLower.includes("intro") || promptLower.includes("introduce") || promptLower.includes("cold")) {
    subject = `Unlocking sales efficiency for ${recipientCompany}`;
    body = `Hi ${recipientName},\n\nI've been following ${recipientCompany}'s recent growth in the market, and I noticed that scaling team communications often becomes a bottleneck at this stage.\n\nAt ${senderCompany}, we help organizations like yours streamline outreach, saving teams an average of 8-10 hours per week while boosting customer response rates by 25%.\n\n${bullets ? `Specifically, we can help with:\n${bullets.split('\n').map(b => `• ${b}`).join('\n')}\n\n` : ''}Are you open to a brief chat next week to see if this aligns with your Q3 targets?\n\nRegards,\n\n${signature}`;
  } else if (promptLower.includes("thank") || promptLower.includes("meeting")) {
    subject = `Great connecting with you today, ${recipientName}!`;
    body = `Hi ${recipientName},\n\nThank you so much for taking the time to connect with me today. It was great learning more about your strategic priorities and current initiatives at ${recipientCompany}.\n\n${bullets ? `As discussed, I wanted to summarize the key items:\n${bullets.split('\n').map(b => `• ${b}`).join('\n')}\n\n` : ''}I've attached our enterprise security brief for your review. Let's touch base again once your team has had a chance to look over the proposal.\n\nWarmly,\n\n${signature}`;
  } else {
    // General fallback template
    subject = `Strategic discussion: ${senderCompany} & ${recipientCompany}`;
    body = `Hi ${recipientName},\n\nI hope this email finds you well.\n\nI am writing to connect regarding our mutual opportunities in the space. Knowing your role as ${recipient.title || "Leader"} at ${recipientCompany}, I believe there is an excellent alignment between your goals and our solutions at ${senderCompany}.\n\n${bullets ? `Here are the core details we should highlight:\n${bullets.split('\n').map(b => `• ${b}`).join('\n')}\n\n` : ''}Regarding: "${prompt}"\n\nI would appreciate the opportunity to share some insights that have worked well for other companies in your industry. When is a convenient time for a quick 15-minute introductory sync?\n\nBest,\n\n${signature}`;
  }

  // Adjust for Tones
  if (tone === "Friendly" || tone === "Warm") {
    subject = `👋 ${subject}`;
    body = body.replace(/Hi /g, "Hi 👋 ").replace(/Regards|Best regards/g, "Warmly").replace(/I hope you're having a great week\./g, "Hope you're having a wonderful day!");
  } else if (tone === "Persuasive") {
    body = `🔥 **Double your team's output** with zero extra hassle.\n\n` + body;
  } else if (tone === "Urgent") {
    subject = `⚠️ Action Required: ${subject}`;
    body = body.replace(/When is a convenient time/g, "Since slots are filling up quickly this week, let's lock in a quick call tomorrow if possible");
  }

  // Adjust for Lengths
  if (length === "short") {
    // Cut body down
    const paragraphs = body.split("\n\n");
    body = paragraphs[0] + "\n\n" + (paragraphs[2] || paragraphs[1] || "") + "\n\n" + paragraphs[paragraphs.length - 1];
  } else if (length === "long") {
    body = body.replace(/Best regards|Regards|Warmly/g, "I appreciate your time and consideration. I understand you are busy, but I genuinely believe we can drive significant value together. Let me know what works best for you and your team.\n\nSincerely");
  }

  // Refinement tweaks simulation
  if (refinementHistory.length > 0) {
    const lastRefinement = refinementHistory[refinementHistory.length - 1].instruction.toLowerCase();
    if (lastRefinement.includes("shorter") || lastRefinement.includes("condense")) {
      body = body.split("\n\n").filter((_, i) => i !== 1 && i !== 2).join("\n\n");
    } else if (lastRefinement.includes("longer") || lastRefinement.includes("elaborate")) {
      body = body.replace(/Hi/g, "I hope you are doing well. Hi").replace(/Regards/g, "Please let me know if you need any adjustments or additional documentation before our chat. Looking forward to speaking. Regards");
    } else if (lastRefinement.includes("cta") || lastRefinement.includes("call to action")) {
      body = body.replace(/Are you open to a brief chat|Do you have 10 minutes/g, "Let's book a quick 10-minute slot on my calendar here (calendly.com/apex-demo) so we can jumpstart this!");
    } else if (lastRefinement.includes("subject")) {
      subject = `🚀 Let's transform ${recipientCompany} together`;
    }
  }

  return { subject, body, isMock: true };
}

// Main AI Email Generator function
async function generateEmail({ recipient, sender, prompt, tone, length, bullets, refinements = [], apiKey }) {
  // If an API key is provided directly or global client is initialized
  const activeKey = apiKey || process.env.GEMINI_API_KEY;
  if (activeKey && activeKey.trim() !== "") {
    initAI(activeKey);
  }

  if (!genAI) {
    return generateMockEmail(recipient, sender, prompt, tone, length, bullets, refinements);
  }

  try {
    // Using a reliable model like gemini-1.5-flash or gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format refinements history
    let refinementsText = "";
    if (refinements && refinements.length > 0) {
      refinementsText = refinements.map((ref, idx) =>
        `[Draft #${idx + 1}]:\nSubject: ${ref.subject}\nBody: ${ref.body}\nInstruction to change it: "${ref.instruction}"`
      ).join("\n\n");
    }

    const systemPrompt = `
You are an expert sales copywriter and professional business communication designer. Your goal is to write a highly compelling, personalized business email.

Recipient details:
- Name: ${recipient.name}
- Email: ${recipient.email}
- Job Title: ${recipient.title || "Professional"}
- Company: ${recipient.company || "their company"}

Sender details:
- Name: ${sender.senderName || "Alex Mercer"}
- Title: ${sender.senderTitle || "Enterprise Growth Manager"}
- Company: ${sender.senderCompany || "ApexCRM Labs"}
- Signature:
${sender.signature || `${sender.senderName}\n${sender.senderTitle}`}

Email Request:
- Goal/Prompt: ${prompt}
- Tone: ${tone} (e.g., Professional, Friendly, Persuasive, Cold Outreach, Urgent, Warm)
- Length: ${length} (short, medium, long)
- Specific Bullet Points to Include:\n${bullets || "None specified"}

Refinements History:
${refinementsText || "This is the first draft. No previous revisions exist."}

Rules:
1. Output format MUST strictly contain SUBJECT on the first line and BODY on the lines below, like this:
SUBJECT: [compelling subject line]
BODY:
[complete, formatted email body text, using appropriate double line breaks for paragraphs. Do not use markdown headers inside the body, keep it looking like a real rich-text email.]

2. DO NOT use generic placeholders like [My Name] or [Your Company]. Always use the actual provided sender and recipient details.
3. If there is a refinement instruction, update the last draft (revising it carefully) to satisfy the new instruction, while maintaining the contextual relevance of the recipient, sender, and primary goal.
4. Tones match standard business communication:
   - Professional: Clear, respectful, and authoritative.
   - Friendly: Warm, engaging, and collaborative.
   - Persuasive: Benefits-focused, strategic value-adds.
   - Cold Outreach: High curiosity, low-friction, extremely punchy.
   - Urgent: Clear time constraints and call to action.
   - Warm: Genuine relationship-oriented tone.
5. Length matching:
   - short: 1-2 concise paragraphs.
   - medium: 3-4 structured paragraphs.
   - long: detailed, comprehensive layout with bulleted list itemizations if helpful.
`;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    console.log("Raw Gemini Output received.");

    // Parse the output for SUBJECT: and BODY:
    let subject = "";
    let body = "";

    const subjectMatch = text.match(/SUBJECT:\s*(.*)/i);
    const bodyMatch = text.match(/BODY:\s*([\s\S]*)/i);

    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    } else {
      // Fallback parse
      const lines = text.split("\n");
      subject = lines[0].replace(/subject:/i, "").trim();
    }

    if (bodyMatch) {
      body = bodyMatch[1].trim();
    } else {
      // Fallback body parse
      const lines = text.split("\n");
      body = lines.slice(1).join("\n").replace(/body:/i, "").trim();
    }

    // Clean up markdown markers if Gemini returned them
    subject = subject.replace(/^\*\*|\*\*$/g, "").replace(/^#\s*/g, "");

    return {
      subject,
      body,
      isMock: false
    };

  } catch (error) {
    console.error("Gemini Generation failed, falling back to local template engine:", error);
    return generateMockEmail(recipient, sender, prompt, tone, length, bullets, refinements);
  }
}

module.exports = {
  initAI,
  generateEmail
};
