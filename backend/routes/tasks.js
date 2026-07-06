const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { Task, User, Lead, StandardUser } = require('../models');

// ================= USERS LIST =================
router.get('/users/list', auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const isSuperAdmin = req.user.role === 'super_admin';

    console.log('USERS LIST FETCH:', { companyId, isSuperAdmin, role: req.user.role });

    const query = isSuperAdmin ? {} : { companyId: new mongoose.Types.ObjectId(companyId) };

    const users = await User.find(query, 'name email role');
    const standardUsers = await StandardUser.find(query, 'name email role');

    const combined = [
      ...users.map(u => ({ _id: u._id, name: u.name, role: u.role, type: 'User' })),
      ...standardUsers.map(u => ({ _id: u._id, name: u.name, role: u.role, type: 'StandardUser' }))
    ];

    console.log(`Found ${combined.length} users`);
    res.json(combined);
  } catch (err) {
    console.error('USERS LIST ERROR:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// ================= LEADS LIST =================
router.get('/leads/list', auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const isSuperAdmin = req.user.role === 'super_admin';

    const leads = isSuperAdmin
      ? await Lead.find({}, 'leadId name').sort({ createdAt: -1 })
      : await Lead.find({ companyId }, 'leadId name').sort({ createdAt: -1 });

    res.json(leads);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ================= GET TASKS =================
router.get('/', auth, async (req, res) => {
  try {
    const role = req.user?.role;
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    const userType = req.user?.type;

    let query = {};

    if (role === 'super_admin') {
      // Sees all
    } else {
      if (!companyId) return res.status(403).json({ msg: 'Unauthorized' });
      query.companyId = new mongoose.Types.ObjectId(companyId);

      // If standard user, only show tasks assigned to them
      if (userType === 'StandardUser') {
        query.assignedTo = new mongoose.Types.ObjectId(userId);
      }
    }

    const tasks = await Task.find(query)
      .populate('leadId', 'leadId name')
      .populate({
        path: 'assignedTo',
        select: 'name email role'
      })
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error('Population Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ================= CREATE TASK =================
router.post('/', auth, async (req, res) => {
  try {
    const { title, leadId, relatedTo, dueDate, priority, status, assignedTo, assignedToModel, completionPercentage } = req.body;

    const newTask = new Task({
      title,
      leadId: leadId || null,
      relatedTo: relatedTo || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'Medium',
      status: status || 'Pending',
      completionPercentage: completionPercentage || 0,
      companyId: req.user.companyId,
      assignedBy: req.user.id,
      assignedTo: assignedTo || null,
      assignedToModel: assignedToModel || 'User'
    });

    const savedTask = await newTask.save();

    // Immediately populate and return so UI shows the name
    const populated = await Task.findById(savedTask._id)
      .populate('leadId', 'leadId name')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role');

    res.json(populated);
  } catch (err) {
    console.error('Task Creation Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;
    const role = req.user.role;

    let task = await Task.findById(id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Access control
    if (role !== 'super_admin') {
      if (task.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ msg: 'Unauthorized' });
      }
      if (userType === 'StandardUser' && task.assignedTo.toString() !== userId) {
        return res.status(403).json({ msg: 'Unauthorized' });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(id, { $set: req.body }, { new: true })
      .populate('leadId', 'leadId name')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role');
    res.json(updatedTask);
  } catch (err) {
    console.error('Task Patch Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;
    const role = req.user.role;

    let task = await Task.findById(id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Access control
    if (role !== 'super_admin') {
      if (task.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ msg: 'Unauthorized' });
      }
      // Usually standard users shouldn't delete tasks, or only their own?
      // Let's say only admin or the person who assigned it can delete.
      // For now, let's keep it simple: same as patch but maybe more restrictive.
      if (userType === 'StandardUser') {
          return res.status(403).json({ msg: 'Staff cannot delete tasks' });
      }
    }

    await Task.findByIdAndDelete(id);
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
