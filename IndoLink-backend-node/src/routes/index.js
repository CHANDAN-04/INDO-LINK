const { Router } = require('express');
const productRoutes = require('./product.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const analyticsRoutes = require('./analytics.routes');
const ordersRoutes = require('./orders.routes');
const paymentsRoutes = require('./payments.routes');
const sliderRoutes = require('./slider.routes');
const adminProductRoutes = require('./adminProduct.routes');
const brokerRoutes = require('./broker.routes');

const router = Router();

router.use('/products', productRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/slider', sliderRoutes);
router.use('/admin-products', adminProductRoutes);
router.use('/broker', brokerRoutes);

module.exports = router;


