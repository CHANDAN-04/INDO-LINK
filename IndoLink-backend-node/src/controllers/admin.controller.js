const createError = require('http-errors');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const { sendSuccess } = require('../utils/response');

async function getAdminStats(req, res, next) {
  try {
    // Get total products
    const total_products = await Product.countDocuments();
    
    // Get active sellers (users with role SELLER who have at least one product)
    const sellersWithProducts = await Product.distinct('seller');
    const active_sellers = sellersWithProducts.length;
    
    // Get platform revenue (sum of all admin purchases)
    const revenueResult = await Order.aggregate([
      { $match: { type: 'ADMIN_PURCHASE', payment_status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const revenue = revenueResult[0]?.total || 0;
    
    // Get total orders
    const total_orders = await Order.countDocuments();
    
    // Get recent activity (products added in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent_products = await Product.countDocuments({
      created_at: { $gte: thirtyDaysAgo }
    });
    
    // Get products by status
    const active_products = await Product.countDocuments({ status: 'ACTIVE' });
    const sold_products = await Product.countDocuments({ status: 'SOLD' });
    const inactive_products = await Product.countDocuments({ status: 'INACTIVE' });
    
    return sendSuccess(res, {
      total_products,
      active_sellers,
      revenue,
      total_orders,
      recent_products,
      active_products,
      sold_products,
      inactive_products,
    });
  } catch (err) {
    next(err);
  }
}

async function getSellers(req, res, next) {
  try {
    const sellers = await User.find({ role: 'SELLER' })
      .select('-password_hash')
      .sort({ created_at: -1 })
      .lean();
    
    // Get product counts for each seller
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const productCount = await Product.countDocuments({ seller: seller._id });
        const activeProductCount = await Product.countDocuments({ 
          seller: seller._id, 
          status: 'ACTIVE' 
        });
        return {
          ...seller,
          product_count: productCount,
          active_product_count: activeProductCount,
        };
      })
    );
    
    return sendSuccess(res, { sellers: sellersWithStats });
  } catch (err) {
    next(err);
  }
}

async function getBuyers(req, res, next) {
  try {
    const buyers = await User.find({ role: 'BUYER' })
      .select('-password_hash')
      .sort({ created_at: -1 })
      .lean();
    
    // Get order counts for each buyer
    const buyersWithStats = await Promise.all(
      buyers.map(async (buyer) => {
        const orderCount = await Order.countDocuments({ buyer: buyer._id });
        return {
          ...buyer,
          order_count: orderCount,
        };
      })
    );
    
    return sendSuccess(res, { buyers: buyersWithStats });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    // Don't allow password updates through this endpoint
    delete updates.password;
    delete updates.password_hash;
    
    // Don't allow role changes (should be separate endpoint if needed)
    delete updates.role;
    
    const user = await User.findByIdAndUpdate(id, updates, { new: true })
      .select('-password_hash');
    
    if (!user) {
      throw createError(404, 'User not found');
    }
    
    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    
    // Prevent deleting admin users
    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }
    
    if (user.role === 'ADMIN') {
      throw createError(403, 'Cannot delete admin users');
    }
    
    await User.findByIdAndDelete(id);
    
    return sendSuccess(res, { message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminStats,
  getSellers,
  getBuyers,
  updateUser,
  deleteUser,
};
