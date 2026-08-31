const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
let razorpay;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay initialized successfully');
  } else {
    console.warn('⚠️ Razorpay credentials missing. Payment gateway will not work.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Razorpay:', error.message);
}

// POST /api/payment/create-order
// Creates a Razorpay order before the payment dialog opens
router.post('/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ msg: 'Payment gateway is currently unavailable' });
    }
    const { amount, currency, plan } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({ msg: 'Amount and currency are required' });
    }

    // Razorpay amount must be in paise (INR) or cents (USD)
    const options = {
      amount: Math.round(Number(amount) * 100), // convert to smallest unit
      currency: currency.toUpperCase(),          // INR or USD
      receipt: `receipt_${Date.now()}`,
      notes: {
        plan: plan || 'Velvorax Plan',
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ msg: 'Failed to create payment order', error: err.message });
  }
});

// POST /api/payment/verify
// Verifies Razorpay payment signature after successful payment
router.post('/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ msg: 'Missing payment verification fields' });
    }

    // Generate expected signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment is verified successfully
      res.json({
        success: true,
        msg: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      res.status(400).json({ success: false, msg: 'Payment verification failed - signature mismatch' });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ msg: 'Payment verification error', error: err.message });
  }
});

module.exports = router;
