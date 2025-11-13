const express = require('express');
const { getDashboard, getUsers, getEarnings, updateProfile } = require('../controllers/broker.controller');
const { protect, requireRoles } = require('../middleware/auth');

const router = express.Router();

// All broker routes require authentication and broker role
router.use(protect);
router.use(requireRoles('BROKER'));

// Dashboard routes
router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/earnings', getEarnings);
router.put('/profile', updateProfile);

module.exports = router;
