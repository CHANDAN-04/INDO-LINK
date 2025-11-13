const createError = require('http-errors');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const { Broker } = require('../models/broker.model');
const { sendSuccess } = require('../utils/response');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { username, email, password, first_name, last_name, role, phone_number, address, broker_id } = req.body;
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) throw createError(409, 'User already exists');
    
    // Validate broker_id if provided
    if (broker_id) {
      const broker = await Broker.findOne({ broker_code: broker_id });
      if (!broker) {
        throw createError(400, 'Invalid broker code');
      }
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      email, 
      first_name, 
      last_name, 
      role: role || 'BUYER', 
      phone_number, 
      address, 
      password_hash,
      broker_id: broker_id || null
    });
    
    // If user is registering as a broker, create broker profile
    if (user.role === 'BROKER') {
      try {
        const broker = await Broker.create({ user: user._id });
        user.broker_code = broker.broker_code;
        await user.save();
      } catch (brokerError) {
        console.error('Error creating broker profile:', brokerError);
        // If broker creation fails, we can still proceed with user creation
        // The broker profile can be created later
      }
    }
    
    const tokens = {
      access: signAccessToken({ sub: user._id.toString(), role: user.role }),
      refresh: signRefreshToken({ sub: user._id.toString(), role: user.role }),
    };
    return sendSuccess(res, { user, tokens }, 201);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { username, email, identifier, password } = req.body;
    const loginIdentifier = identifier || username || email;
    if (!loginIdentifier || !password) {
      throw createError(400, 'Username or email and password are required');
    }
    const query = email ? { email } : username ? { username } : { $or: [{ username: loginIdentifier }, { email: loginIdentifier }] };
    const user = await User.findOne(query);
    if (!user) throw createError(400, 'Invalid credentials');
    const ok = await user.comparePassword(password);
    if (!ok) throw createError(400, 'Invalid credentials');
    const tokens = {
      access: signAccessToken({ sub: user._id.toString(), role: user.role }),
      refresh: signRefreshToken({ sub: user._id.toString(), role: user.role }),
    };
    return sendSuccess(res, { user, tokens });
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const { refresh } = req.body;
    if (!refresh) throw createError(400, 'Refresh token required');
    const payload = verifyRefreshToken(refresh);
    const user = await User.findById(payload.sub);
    if (!user) throw createError(401, 'Invalid token');
    const access = signAccessToken({ sub: user._id.toString(), role: user.role });
    return sendSuccess(res, { access });
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    // Stateless JWT: client should delete tokens
    return sendSuccess(res, { message: 'Logged out' });
  } catch (err) { next(err); }
}

async function profile(req, res, next) {
  try {
    return sendSuccess(res, req.user);
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.password_hash;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    return sendSuccess(res, user);
  } catch (err) { next(err); }
}

async function updateRazorpayDetails(req, res, next) {
  try {
    const { razorpay_key_id, razorpay_key_secret } = req.body;
    
    if (!razorpay_key_id || !razorpay_key_secret) {
      throw createError(400, 'Both Razorpay Key ID and Secret are required');
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { razorpay_key_id, razorpay_key_secret }, 
      { new: true }
    );
    
    if (!user) {
      throw createError(404, 'User not found');
    }
    
    return sendSuccess(res, { 
      message: 'Razorpay details updated successfully',
      has_razorpay_details: !!(user.razorpay_key_id && user.razorpay_key_secret)
    });
  } catch (err) { next(err); }
}

async function getRazorpayDetails(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('razorpay_key_id razorpay_key_secret');
    
    if (!user) {
      throw createError(404, 'User not found');
    }
    
    return sendSuccess(res, {
      has_razorpay_details: !!(user.razorpay_key_id && user.razorpay_key_secret),
      razorpay_key_id: user.razorpay_key_id || '',
      // Don't send the secret key for security
      razorpay_key_secret: user.razorpay_key_secret ? '***HIDDEN***' : ''
    });
  } catch (err) { 
    next(err); 
  }
}

module.exports = { register, login, refresh, logout, profile, updateProfile, updateRazorpayDetails, getRazorpayDetails };


