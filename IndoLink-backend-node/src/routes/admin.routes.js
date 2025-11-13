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

// Slider CRUD (admin)
router.get('/slider', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const items = await SliderItem.find({}).sort({ order: 1, created_at: -1 });
    return sendSuccess(res, items);
  } catch (err) { next(err); }
});

router.post('/slider', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const item = await SliderItem.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (err) { next(err); }
});

router.put('/slider/:id', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const item = await SliderItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return sendSuccess(res, item);
  } catch (err) { next(err); }
});

router.delete('/slider/:id', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const ok = await SliderItem.findByIdAndDelete(req.params.id);
    return sendSuccess(res, { deleted: !!ok });
  } catch (err) { next(err); }
});


