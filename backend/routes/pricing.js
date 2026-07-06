const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Pricing } = require('../models');

// @route   GET api/pricing
// @desc    Get all pricing tiers
router.get('/', async (req, res) => {
  try {
    let pricing = await Pricing.find();
    
    // Seed default data if empty
    if (pricing.length === 0) {
      const defaults = [
        { 
          tier: 'Basic', 
          usd: 120, 
          inr: 10000, 
          usersLimit: 2,
          features: ['Basic CRM Access', 'Lead Management', 'Email Automation', 'Basic Reporting', 'Email Support', '1 GB Storage'],
          setupInr: '2,50,000', 
          setupUsd: '3,000' 
        },
        { 
          tier: 'Growth', 
          usd: 181, 
          inr: 15000, 
          usersLimit: 5,
          features: ['Advanced CRM Access', 'Lead Management & Scoring', 'WhatsApp + Email Automation', 'Advanced Reporting', 'Priority Support', '5 GB Storage', 'API Access'],
          setupInr: '2,50,000', 
          setupUsd: '3,000' 
        },
        { 
          tier: 'Pro', 
          usd: 301, 
          inr: 25000, 
          usersLimit: 10,
          features: ['Full CRM Access', 'Advanced Automation Flows', 'Multi-Channel Integration', 'Custom Reporting Dashboard', 'Dedicated Support', '10 GB Storage', 'Custom Integrations', 'Employee Tracking'],
          setupInr: '5,00,000', 
          setupUsd: '6,000' 
        },
        {
          tier: 'SETUP_STANDARD',
          inr: 0, usd: 0, usersLimit: 0,
          setupInr: '2,50,000',
          setupUsd: '3,000'
        },
        {
          tier: 'SETUP_ADVANCED',
          inr: 0, usd: 0, usersLimit: 0,
          setupInr: '3,50,000 – 5,00,000',
          setupUsd: '4,200 – 6,000'
        }
      ];
      await Pricing.insertMany(defaults);
      pricing = await Pricing.find();
    }
    
    res.json(pricing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/pricing/:id
// @desc    Update pricing tier (Super Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ msg: 'Forbidden: Super Admin access required' });
    }

    const { inr, usd, usersLimit, setupInr, setupUsd } = req.body;

    const updateFields = {};
    if (inr !== undefined) updateFields.inr = inr;
    if (usd !== undefined) updateFields.usd = usd;
    if (usersLimit !== undefined) updateFields.usersLimit = usersLimit;
    if (setupInr !== undefined) updateFields.setupInr = setupInr;
    if (setupUsd !== undefined) updateFields.setupUsd = setupUsd;
    updateFields.updatedAt = Date.now();

    const pricing = await Pricing.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    res.json(pricing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/pricing/update
// @desc    Bulk update pricing tiers (Super Admin only)
router.post('/update', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ msg: 'Forbidden: Super Admin access required' });
    }

    const { tiers } = req.body;

    for (const item of tiers) {
      await Pricing.findOneAndUpdate(
        { tier: item.tier },
        {
          $set: {
            usd: item.usd,
            inr: item.inr,
            setupInr: item.setupInr,
            setupUsd: item.setupUsd,
            updatedAt: Date.now()
          }
        }
      );
    }

    res.json({ msg: 'Pricing tiers updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
