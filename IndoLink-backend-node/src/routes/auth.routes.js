const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/token/refresh', controller.refresh);
router.post('/logout', controller.logout);

router.get('/profile', protect, controller.profile);
router.put('/profile/update', protect, controller.updateProfile);

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes are working' });
});

router.get('/razorpay-details', protect, controller.getRazorpayDetails);
router.put('/razorpay-details', protect, controller.updateRazorpayDetails);

module.exports = router;


