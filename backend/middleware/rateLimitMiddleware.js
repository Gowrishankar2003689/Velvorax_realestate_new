const { PromptUsage, User } = require("../models");

/**
 * Checks and increments prompt usage counts per user per day.
 * Returns a 429 status code if usage limits are exceeded.
 */
async function checkPromptLimit(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Authentication credentials required." });
  }

  // Get user to check email and role
  let user;
  try {
    user = await User.findById(req.user.id);
    if (!user) {
        // Might be a StandardUser
        const StandardUser = require('../models/StandardUser');
        user = await StandardUser.findById(req.user.id);
    }
  } catch (err) {
      console.error("Rate Limit Middleware: User lookup error", err);
  }

  if (!user) {
      return res.status(401).json({ error: "User not found." });
  }

  const email = user.email;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const MAX_LIMIT = 20;

  try {
    // 1. Check if user is an admin; Admins have unlimited queries
    if (user && (user.role === "admin" || user.role === "super_admin")) {
      req.promptUsage = {
        limit: Infinity,
        count: 0,
        remaining: Infinity,
        isAdmin: true
      };
      return next();
    }

    // 2. Find or upsert usage log for today
    let usage = await PromptUsage.findOne({ email, date: today });
    if (!usage) {
      // Use findOneAndUpdate with upsert to prevent double-insert race conditions
      usage = await PromptUsage.findOneAndUpdate(
        { email, date: today },
        { $setOnInsert: { count: 0 } },
        { upsert: true, new: true }
      );
    }

    // 3. Enforce maximum limit
    if (usage.count >= MAX_LIMIT) {
      return res.status(429).json({
        error: "Daily prompt limit reached. You can send up to 20 messages per day. Please try again tomorrow!",
        limitReached: true,
        limit: MAX_LIMIT,
        count: usage.count,
        remaining: 0
      });
    }

    // 4. Increment count for successful checks
    usage.count += 1;
    await usage.save();

    // 5. Append limits tracking info to req
    req.promptUsage = {
      limit: MAX_LIMIT,
      count: usage.count,
      remaining: MAX_LIMIT - usage.count,
      isAdmin: false
    };

    next();
  } catch (error) {
    console.error("Error evaluating prompt rate limits:", error);
    // Fail-open strategy: let user chat if there is a DB error to avoid blocking the system
    req.promptUsage = {
      limit: MAX_LIMIT,
      count: 0,
      remaining: MAX_LIMIT,
      errorOccurred: true
    };
    next();
  }
}

module.exports = { checkPromptLimit };
