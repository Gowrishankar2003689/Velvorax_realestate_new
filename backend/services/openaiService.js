const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;
const ONBOARDING_FORM_LINK = "https://velvorax-alkc.onrender.com/public_form.html?id=69fc2fa55bd0711053d8832c";

// Initialize Gemini if key exists
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("ℹ️ Gemini AI initialized.");
}

/**
 * Handles conversational queries.
 * Priority: Gemini AI -> Local Fallback with Form Link.
 */
async function chatConversational(message, history = []) {
  const textLower = message.toLowerCase();

  // 1. TRY GEMINI (If configured and key is valid)
  if (genAI) {
    try {
      // Use 'gemini-1.5-flash' which is the standard model name
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const chat = model.startChat({
        history: history.slice(-6).map(msg => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
      });

      const result = await chat.sendMessage(message + "\n\n(Note: Always remind the user that they can complete their detailed profile at this link: " + ONBOARDING_FORM_LINK + ")");
      const responseText = result.response.text().trim();

      if (responseText) return responseText;
    } catch (err) {
      console.error("Gemini AI Error:", err.message);
    }
  }

  // 2. SMART LOCAL FALLBACK (This will be used since your Gemini Key is currently returning 404)
  const formMessage = `<br><br>To get started with your project and receive a custom quote, please fill out our official onboarding form here: <br><a href="${ONBOARDING_FORM_LINK}" target="_blank" style="color: #facc15; font-weight: bold; text-decoration: underline;">Complete Onboarding Form</a>`;

  if (textLower.includes("budget") || textLower.includes("price") || textLower.includes("cost")) {
    return "Our services are tailored to your specific needs. To help us calculate a precise budget for your project, please complete this form: " + formMessage;
  }

  if (textLower.includes("timeline") || textLower.includes("how long") || textLower.includes("duration")) {
    return "We deliver prototypes in 3-4 weeks. For a detailed project timeline based on your requirements, please fill out this form: " + formMessage;
  }

  if (textLower.includes("service") || textLower.includes("offer") || textLower.includes("what do you do")) {
    return "Velvorax specializes in Custom CRMs, Web Apps, and AI Automation. You can see our full catalog and select services by completing your profile here: " + formMessage;
  }

  if (textLower.includes("demo") || textLower.includes("contact") || textLower.includes("call")) {
    return "I'd love to schedule a demo! To help our team prepare for the call, please share your details in this form: " + formMessage;
  }

  // Default response for any other message
  return "Thanks for your message! To better assist you with your request and provide the right solutions for your business, please take a moment to fill out our onboarding form: " + formMessage;
}

/**
 * Formats raw data into premium text.
 */
async function formatWithOpenAi(userMessage, rawData, defaultReply) {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Format this CRM data professionally: ${JSON.stringify(rawData)}. Context: ${userMessage}. Link: ${ONBOARDING_FORM_LINK}`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.error("Gemini Format Error:", err.message);
    }
  }
  return defaultReply;
}

module.exports = {
  isEnabled: () => !!genAI,
  formatWithOpenAi,
  chatConversational
};
