const createError = require('http-errors');
const Order = require('../models/order.model');
const { sendSuccess } = require('../utils/response');

async function getSellerOrders(req, res, next) {
  try {
    const sellerId = req.user._id;
    
    const orders = await Order.find({ 
      seller: sellerId,
      type: 'ADMIN_PURCHASE' 
    })
      .populate('admin', 'username email')
      .populate('items.product', 'name description image')
      .sort({ created_at: -1 })
      .lean();

    const formattedOrders = orders.map(order => ({
      id: order._id,
      order_number: order.order_number,
      type: order.type,
      admin: {
        name: order.admin?.username || 'Admin',
        email: order.admin?.email || '',
      },
      items: order.items.map(item => ({
        product: {
          id: item.product?._id,
          name: item.product?.name || 'Product',
          description: item.product?.description || '',
          image: item.product?.image || '',
        },
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
      })),
      total_amount: order.total_amount,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
    }));

    return sendSuccess(res, formattedOrders);
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('seller', 'username email')
      .populate('admin', 'username email')
      .populate('buyer', 'username email')
      .populate('items.product', 'name description image')
      .lean();

    if (!order) {
      throw createError(404, 'Order not found');
    }

    // Check if user has access to this order
    const userId = req.user._id.toString();
    const hasAccess = 
      order.seller?._id?.toString() === userId ||
      order.admin?._id?.toString() === userId ||
      order.buyer?._id?.toString() === userId ||
      req.user.role === 'ADMIN';

    if (!hasAccess) {
      throw createError(403, 'Access denied');
    }

    return sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
}

async function getAllOrders(req, res, next) {
  try {
    if (req.user.role !== 'ADMIN') {
      throw createError(403, 'Admin access required');
    }

    const orders = await Order.find()
      .populate('seller', 'username email')
      .populate('admin', 'username email')
      .populate('buyer', 'username email')
      .populate('items.product', 'name description image')
      .sort({ created_at: -1 })
      .lean();

    return sendSuccess(res, orders);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSellerOrders,
  getOrderById,
  getAllOrders,
};
