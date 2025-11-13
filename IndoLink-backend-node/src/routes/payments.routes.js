const { Router } = require('express');
const crypto = require('crypto');
const { protect, requireRoles } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const Order = require('../models/order.model');
const paymentController = require('../controllers/payment.controller');

const router = Router();

// Create Razorpay order for buyer payments using admin's Razorpay configuration
router.post('/razorpay/create-order', protect, requireRoles('BUYER'), async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order || String(order.buyer) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Find an admin user to get Razorpay configuration
    const User = require('../models/user.model');
    const admin = await User.findOne({ role: 'ADMIN' }).select('razorpay_key_id razorpay_key_secret');
    
    if (!admin || !admin.razorpay_key_id || !admin.razorpay_key_secret) {
      // Fallback: just return payload to simulate checkout
      return sendSuccess(res, {
        provider: 'razorpay',
        mode: 'fallback',
        amount: Math.round(order.total_amount * 100),
        currency: 'INR',
        orderId: order._id,
      });
    }

    const Razorpay = require('razorpay');
    const rp = new Razorpay({ 
      key_id: admin.razorpay_key_id, 
      key_secret: admin.razorpay_key_secret 
    });
    
    const rpOrder = await rp.orders.create({
      amount: Math.round(order.total_amount * 100),
      currency: 'INR',
      receipt: order.order_number,
      notes: { 
        type: order.type,
        buyer_id: req.user._id.toString(),
        order_id: order._id.toString()
      },
    });
    
    order.razorpay_order_id = rpOrder.id;
    order.payment_status = 'CREATED';
    await order.save();
    
    return sendSuccess(res, { 
      id: rpOrder.id, 
      amount: rpOrder.amount, 
      currency: rpOrder.currency, 
      keyId: admin.razorpay_key_id 
    });
  } catch (err) { next(err); }
});

// Verify Razorpay signature and capture success using admin's Razorpay configuration
router.post('/razorpay/verify', protect, requireRoles('BUYER'), async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order || order.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Order mismatch' });
    }

    // Find admin user to get Razorpay secret for verification
    const User = require('../models/user.model');
    const admin = await User.findOne({ role: 'ADMIN' }).select('razorpay_key_secret');
    
    if (admin && admin.razorpay_key_secret) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto.createHmac('sha256', admin.razorpay_key_secret).update(body).digest('hex');
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }
    
    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    order.payment_status = 'PAID';
    order.status = 'CONFIRMED';
    await order.save();
    
    return sendSuccess(res, { ok: true, message: 'Payment verified successfully' });
  } catch (err) { next(err); }
});

// Admin payment routes for purchasing from sellers
router.post('/admin/create-order', protect, requireRoles('ADMIN'), paymentController.createPaymentOrder);
router.post('/admin/verify', protect, requireRoles('ADMIN'), paymentController.verifyPayment);
router.get('/admin/status/:orderId', protect, requireRoles('ADMIN'), paymentController.getPaymentStatus);

module.exports = router;


