const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const auth = require("../middleware/auth");
const { checkPromptLimit } = require("../middleware/rateLimitMiddleware");

// Middleware to check if user is admin
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: "Restricted: Administrative access required." });
    }
    next();
};

// POST /api/chat - For customers chatting with the lead-capture chatbot (rate-limited)
router.post("/chat", auth, checkPromptLimit, chatController.handleCustomerChat);

// POST /api/chat/admin - For admin/business owners querying the CRM database (restricted to Admin role)
router.post("/chat/admin", auth, verifyAdmin, chatController.handleAdminChat);

module.exports = router;
