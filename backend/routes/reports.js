const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Invoice, Opportunity, Task, Lead, User, StandardUser, DailyReport } = require('../models');
const multer = require('multer');
const path = require('path');

// Configure Multer for Memory Storage (Doesn't save to PC disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST api/reports/upload
// @desc    Upload daily PDF report from Android app (Saved to DB only)
router.post('/upload', auth, upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const newReport = new DailyReport({
      userId: req.user.id,
      userModel: req.user.type || 'User',
      companyId: req.user.companyId,
      filename: req.file.originalname || `report-${Date.now()}.pdf`,
      fileData: req.file.buffer, // Binary data stored in MongoDB
      contentType: req.file.mimetype
    });

    await newReport.save();

    res.json({
      msg: 'Daily report saved to database successfully',
      reportId: newReport._id,
      filename: newReport.filename
    });
  } catch (err) {
    console.error('REPORT UPLOAD ERROR:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/reports/daily
// @desc    Get all daily reports metadata (Admin/Super Admin only)
router.get('/daily', auth, async (req, res) => {
    try {
        const { role, companyId } = req.user;
        let query = {};

        if (role !== 'super_admin') {
            if (!companyId) return res.status(403).json({ msg: 'Unauthorized' });
            query.companyId = companyId;
        }

        // We exclude fileData here to keep the list response fast/small
        const reports = await DailyReport.find(query)
            .select('-fileData')
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (err) {
        console.error('FETCH DAILY REPORTS ERROR:', err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/reports/download/:id
// @desc    Download a specific daily report from DB
router.get('/download/:id', auth, async (req, res) => {
    try {
        const report = await DailyReport.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });

        // Access control: Ensure user belongs to same company or is super_admin
        if (req.user.role !== 'super_admin' && report.companyId?.toString() !== req.user.companyId?.toString()) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        res.set({
            'Content-Type': report.contentType,
            'Content-Disposition': `attachment; filename="${report.filename}"`,
            'Content-Length': report.fileData.length
        });

        res.send(report.fileData);
    } catch (err) {
        console.error('DOWNLOAD REPORT ERROR:', err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/reports/invoice
router.get('/invoice', auth, async (req, res) => {
  try {
    const { role, companyId } = req.user;
    let query = {};

    if (role !== 'super_admin') {
      if (!companyId) return res.status(403).json({ message: 'Unauthorized' });
      query.companyId = companyId;
    }

    const invoices = await Invoice.find(query);
    
    // Total Invoiced, Collected, Outstanding
    const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.total, 0);
    const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.total, 0);
    const outstanding = totalInvoiced - totalCollected;

    // Aging (Simplified)
    const aging = {
      '1-30 Days': invoices.filter(i => i.status === 'Sent').reduce((acc, curr) => acc + curr.total, 0),
      '31-60 Days': 0,
      '61-90 Days': 0,
      '90+ Days': 0
    };

    // Revenue Over Time (Group by month)
    const revenueOverTime = {};
    invoices.forEach(i => {
      const month = new Date(i.createdAt).toLocaleString('default', { month: 'short' });
      revenueOverTime[month] = (revenueOverTime[month] || 0) + i.total;
    });

    res.json({
      totalInvoiced,
      totalCollected,
      outstanding,
      aging,
      revenueOverTime
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/tasks
// For business client: company tasks
// For super admin: all tasks
router.get('/tasks', auth, async (req, res) => {
  try {
    const { role, companyId, id } = req.user;
    let query = {};

    if (role === 'super_admin') {
      // Sees all
    } else if (role === 'admin' || role === 'client') {
      if (!companyId) return res.status(403).json({ message: 'Unauthorized' });
      query.companyId = companyId;
    } else {
      // Staff sees only their own or assigned tasks
      if (!companyId) return res.status(403).json({ message: 'Unauthorized' });
      query.companyId = companyId;
      query.$or = [
        { assignedTo: id },
        { assignedBy: id }
      ];
    }

    const tasks = await Task.find(query)
      .populate('leadId', 'leadId name')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 });

    // Summary statistics for the report
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length,
      pending: tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length,
      highPriority: tasks.filter(t => t.priority === 'High' || t.priority === 'Urgent').length,
      myTasks: tasks.filter(t => t.assignedTo?._id?.toString() === id).length
    };

    res.json({
      stats,
      tasks
    });
  } catch (err) {
    console.error("TASK REPORT ERROR:", err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
