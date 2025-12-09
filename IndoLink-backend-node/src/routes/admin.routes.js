const { Router } = require('express');
const { protect, requireRoles } = require('../middleware/auth');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const { sendSuccess } = require('../utils/response');
const SliderItem = require('../models/slider.model');
const adminController = require('../controllers/admin.controller');

const router = Router();

router.get('/stats', protect, requireRoles('ADMIN'), adminController.getAdminStats);

// User management routes
router.get('/sellers', protect, requireRoles('ADMIN'), adminController.getSellers);
router.get('/buyers', protect, requireRoles('ADMIN'), adminController.getBuyers);
router.put('/users/:id', protect, requireRoles('ADMIN'), adminController.updateUser);
router.delete('/users/:id', protect, requireRoles('ADMIN'), adminController.deleteUser);

module.exports = router;


