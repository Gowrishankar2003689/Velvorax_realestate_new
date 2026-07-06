const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { User, StandardUser, Task } = require('../models');

// @route   GET api/employee/stats
// @desc    Get employee stats (Isolated by Company and Role)
router.get('/stats', auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const isSuperAdmin = req.user.role === 'super_admin';
    const userId = req.user.id;
    const userType = req.user.type; // 'User' or 'StandardUser'

    console.log(`EMPLOYEE STATS REQUEST: User=${userId}, Type=${userType}, Role=${req.user.role}, Company=${companyId}`);

    let query = {};
    let userStaffQuery = { role: 'staff' };

    if (!isSuperAdmin) {
      if (!companyId) {
          console.error("Missing companyId in token for user:", userId);
          return res.json([]);
      }
      const cId = new mongoose.Types.ObjectId(companyId);

      // If the person logged in is a StandardUser, they ONLY see themselves
      if (userType === 'StandardUser') {
        query._id = new mongoose.Types.ObjectId(userId);
        userStaffQuery = { _id: new mongoose.Types.ObjectId(userId) };
      } else {
        // Business Client / Admin sees everyone in their company
        query.companyId = cId;
        userStaffQuery.companyId = cId;
      }
    }

    console.log("DB Queries:", { query, userStaffQuery });

    // Fetch both StandardUser and User (with staff role)
    const [standardStaff, userStaff] = await Promise.all([
      StandardUser.find(query).select('-password'),
      User.find(userStaffQuery).select('-password')
    ]);

    console.log(`Results: standardStaff=${standardStaff.length}, userStaff=${userStaff.length}`);

    const combinedStaff = [
      ...standardStaff.map(s => {
          const obj = s.toObject();
          return { ...obj, type: 'StandardUser' };
      }),
      ...userStaff.map(u => {
          const obj = u.toObject();
          return { ...obj, type: 'User' };
      })
    ];

    // For each staff member, calculate task progress and get task details
    const staffWithDetails = await Promise.all(combinedStaff.map(async (emp) => {
      // Find all tasks assigned to this person
      const tasks = await Task.find({ assignedTo: emp._id })
        .sort({ updatedAt: -1 })
        .limit(10); // Last 10 tasks for context

      const totalTasksCount = await Task.countDocuments({ assignedTo: emp._id });
      const completedTasksCount = await Task.countDocuments({ assignedTo: emp._id, status: 'Completed' });

      const progress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

      // Calculate total work hours from sessions
      let totalMinutes = 0;
      if (emp.workSessions) {
          emp.workSessions.forEach(s => {
              totalMinutes += (s.durationMinutes || 0);
          });
      }

      return {
        ...emp,
        taskProgress: progress,
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount,
        workMinutes: totalMinutes,
        recentTasks: tasks.map(t => ({
          title: t.title,
          status: t.status,
          percentage: t.completionPercentage || 0,
          priority: t.priority,
          updatedAt: t.updatedAt
        }))
      };
    }));

    res.json(staffWithDetails);
  } catch (err) {
    console.error("EMPLOYEE STATS ERROR:", err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/employee/update-location
// @desc    Update employee live location (Hit from Android App)
router.post('/update-location', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    if (!lat || !lng) {
      return res.status(400).json({ msg: 'Coordinates missing' });
    }

    let user;
    if (userType === 'StandardUser') {
      user = await StandardUser.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.location = {
      lat: Number(lat),
      lng: Number(lng),
      lastUpdated: new Date()
    };

    // Log this as a silent activity if needed
    if (!user.dailyActivityLog) user.dailyActivityLog = [];

    // Auto-log activity when location changes significantly (optional)
    // For now just save location
    await user.save();

    res.json({ msg: 'Location updated', location: user.location });
  } catch (err) {
    console.error("LOCATION UPDATE ERROR:", err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/employee/verify-face
// @desc    Log face authentication success from app
router.post('/verify-face', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    let user;
    if (userType === 'StandardUser') {
      user = await StandardUser.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!user.dailyActivityLog) user.dailyActivityLog = [];
    user.dailyActivityLog.push({
      activity: 'Face Authentication Successful',
      type: 'Security',
      time: new Date()
    });

    await user.save();
    res.json({ msg: 'Face authentication logged', time: new Date() });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/employee/activity
router.post('/activity', auth, async (req, res) => {
  try {
    const { userId, activity, type } = req.body;

    // Safety check: Don't allow logging activity for users in other companies
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (req.user.role !== 'super_admin' && user.companyId.toString() !== req.user.companyId.toString()) {
       return res.status(403).json({ msg: 'Unauthorized activity log' });
    }

    if (!user.dailyActivityLog) user.dailyActivityLog = [];
    user.dailyActivityLog.push({ activity, type });
    await user.save();
    res.json(user.dailyActivityLog);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
