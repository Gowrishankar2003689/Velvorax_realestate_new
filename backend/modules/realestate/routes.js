const express = require('express');
const mongoose = require('mongoose');
const auth = require('../../middleware/auth');
const Company = require('../../models/Company');
const models = require('./models');

const router = express.Router();

async function getCompanyId(req) {
  if (req.user?.companyId && mongoose.Types.ObjectId.isValid(req.user.companyId)) {
    return new mongoose.Types.ObjectId(req.user.companyId);
  }
  const company = await Company.findOne({ approvalStatus: 'Approved' }).sort({ createdAt: 1 });
  return company?._id;
}

function resourceRoutes(name, Model) {
  router.get(`/${name}`, auth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) return res.status(403).json({ message: 'No company is available for this account' });
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
      const [items, total] = await Promise.all([
        Model.find({ companyId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Model.countDocuments({ companyId })
      ]);
      res.json({ items, total, page, limit });
    } catch (err) {
      res.status(500).json({ message: 'Error loading records', error: err.message });
    }
  });

  router.post(`/${name}`, auth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) return res.status(403).json({ message: 'No company is available for this account' });
      const item = await new Model({ ...req.body, companyId }).save();
      res.status(201).json(item);
    } catch (err) {
      res.status(400).json({ message: 'Error creating record', error: err.message });
    }
  });

  router.patch(`/${name}/:id`, auth, async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid record ID' });
      const companyId = await getCompanyId(req);
      if (!companyId) return res.status(403).json({ message: 'No company is available for this account' });
      const allowed = { ...req.body };
      delete allowed.companyId;
      const item = await Model.findOneAndUpdate(
        { _id: req.params.id, companyId },
        { $set: allowed },
        { new: true, runValidators: true }
      );
      if (!item) return res.status(404).json({ message: 'Record not found' });
      res.json(item);
    } catch (err) {
      res.status(400).json({ message: 'Error updating record', error: err.message });
    }
  });
}

resourceRoutes('projects', models.ReProject);
resourceRoutes('properties', models.ReProperty);
resourceRoutes('leads', models.ReLead);
resourceRoutes('contacts', models.ReContact);
resourceRoutes('site-visits', models.ReSiteVisit);
resourceRoutes('opportunities', models.ReOpportunity);
resourceRoutes('bookings', models.ReBooking);
resourceRoutes('payment-schedules', models.RePaymentSchedule);
resourceRoutes('partners', models.RePartner);
resourceRoutes('activities', models.ReActivity);
resourceRoutes('payment-transactions', models.RePaymentTransaction);
resourceRoutes('commissions', models.ReCommission);
resourceRoutes('documents', models.ReDocument);
resourceRoutes('automation-rules', models.ReAutomationRule);
resourceRoutes('integrations', models.ReIntegration);

router.get('/dashboard/summary', auth, async (req, res) => {
  try {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(403).json({ message: 'No company is available for this account' });
    const [projects, availableUnits, leads, hotLeads, visits, bookings] = await Promise.all([
      models.ReProject.countDocuments({ companyId }),
      models.ReProperty.countDocuments({ companyId, status: 'available' }),
      models.ReLead.countDocuments({ companyId }),
      models.ReLead.countDocuments({ companyId, 'score.temperature': 'hot' }),
      models.ReSiteVisit.countDocuments({ companyId, status: 'scheduled' }),
      models.ReBooking.countDocuments({ companyId, status: 'booked' })
    ]);
    res.json({ projects, availableUnits, leads, hotLeads, scheduledVisits: visits, bookings });
  } catch (err) {
    res.status(500).json({ message: 'Error loading dashboard', error: err.message });
  }
});

module.exports = router;
