const createError = require('http-errors');
const { Broker, BrokerEarning } = require('../models/broker.model');
const User = require('../models/user.model');
const { sendSuccess } = require('../utils/response');

// Get broker dashboard data
async function getDashboard(req, res, next) {
  try {
    let broker = await Broker.findOne({ user: req.user._id }).populate('user');
    
    // If broker profile doesn't exist, create it
    if (!broker) {
      broker = await Broker.create({ user: req.user._id });
      await broker.populate('user');
    }

    // Get total users (buyers and sellers) associated with this broker
    const totalUsers = await User.countDocuments({ 
      broker_id: broker.broker_code,
      role: { $in: ['BUYER', 'SELLER'] }
    });

    // Get total earnings
    const totalEarnings = await BrokerEarning.aggregate([
      { $match: { broker: broker._id, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$commission_amount' } } }
    ]);

    // Get recent earnings
    const recentEarnings = await BrokerEarning.find({ broker: broker._id })
      .populate('order', 'order_number created_at')
      .populate('product', 'name sellingPrice')
      .populate('seller', 'username')
      .populate('buyer', 'username')
      .sort({ created_at: -1 })
      .limit(10);

    // Get monthly earnings for chart
    const monthlyEarnings = await BrokerEarning.aggregate([
      { $match: { broker: broker._id, status: 'PAID' } },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' }
          },
          total: { $sum: '$commission_amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    const dashboardData = {
      broker_code: broker.broker_code,
      total_users: totalUsers,
      total_earnings: totalEarnings[0]?.total || 0,
      total_commission_paid: broker.total_commission_paid,
      recent_earnings: recentEarnings,
      monthly_earnings: monthlyEarnings,
      is_active: broker.is_active
    };

    return sendSuccess(res, dashboardData);
  } catch (err) {
    next(err);
  }
}

// Get broker's users list
async function getUsers(req, res, next) {
  try {
    let broker = await Broker.findOne({ user: req.user._id });
    
    // If broker profile doesn't exist, create it
    if (!broker) {
      broker = await Broker.create({ user: req.user._id });
    }

    const users = await User.find({ 
      broker_id: broker.broker_code,
      role: { $in: ['BUYER', 'SELLER'] }
    }).select('username email first_name last_name role created_at');

    return sendSuccess(res, { users });
  } catch (err) {
    next(err);
  }
}

// Get broker's earnings history
async function getEarnings(req, res, next) {
  try {
    let broker = await Broker.findOne({ user: req.user._id });
    
    // If broker profile doesn't exist, create it
    if (!broker) {
      broker = await Broker.create({ user: req.user._id });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const earnings = await BrokerEarning.find({ broker: broker._id })
      .populate('order', 'order_number created_at')
      .populate('product', 'name sellingPrice purchasePrice')
      .populate('seller', 'username')
      .populate('buyer', 'username')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BrokerEarning.countDocuments({ broker: broker._id });

    return sendSuccess(res, {
      earnings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

// Update broker profile
async function updateProfile(req, res, next) {
  try {
    let broker = await Broker.findOne({ user: req.user._id });
    
    // If broker profile doesn't exist, create it
    if (!broker) {
      broker = await Broker.create({ user: req.user._id });
    }

    const updates = { ...req.body };
    delete updates.user; // Prevent changing user reference
    delete updates.broker_code; // Prevent changing broker code
    delete updates.total_earnings; // Prevent manual earnings manipulation
    delete updates.total_users; // Prevent manual user count manipulation

    const updatedBroker = await Broker.findByIdAndUpdate(
      broker._id,
      updates,
      { new: true }
    ).populate('user');

    return sendSuccess(res, updatedBroker);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getUsers,
  getEarnings,
  updateProfile
};
