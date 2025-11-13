const createError = require('http-errors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const AdminProduct = require('../models/adminProduct.model');
const { sendSuccess } = require('../utils/response');

async function createPaymentOrder(req, res, next) {
  try {
    const { productId, quantity = 1, sellingPrice } = req.body;
    
    if (!productId) {
      throw createError(400, 'Product ID is required');
    }
    
    if (!quantity || quantity < 1) {
      throw createError(400, 'Quantity must be at least 1');
    }
    
    if (!sellingPrice || sellingPrice <= 0) {
      throw createError(400, 'Selling price is required and must be greater than 0');
    }

    // Get the product and seller details
    const product = await Product.findById(productId).populate('seller');
    if (!product) {
      throw createError(404, 'Product not found');
    }

    // Get seller's Razorpay details
    const seller = await User.findById(product.seller._id);
    if (!seller) {
      throw createError(404, 'Seller not found');
    }
    
    if (!seller.razorpay_key_id || !seller.razorpay_key_secret) {
      throw createError(400, 'Seller has not configured Razorpay payment details');
    }
    
    // Check if seller has enough quantity
    if (product.quantity < quantity) {
      throw createError(400, `Not enough quantity available. Available: ${product.quantity}, Requested: ${quantity}`);
    }

    // Initialize Razorpay with seller's credentials
    const razorpay = new Razorpay({
      key_id: seller.razorpay_key_id,
      key_secret: seller.razorpay_key_secret,
    });

    // Create Razorpay order
    const totalAmount = product.price * quantity;
    const orderOptions = {
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: `ord_${Date.now().toString().slice(-8)}`, // Keep receipt under 40 chars
      notes: {
        product_id: productId,
        product_name: product.name,
        quantity: quantity.toString(),
        seller_id: product.seller._id.toString(),
        admin_id: req.user._id.toString(),
        selling_price: sellingPrice.toString(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Create order record in database
    const order = await Order.create({
      type: 'ADMIN_PURCHASE',
      admin: req.user._id,
      seller: product.seller._id,
      items: [{
        product: product._id,
        quantity: quantity,
        price_at_purchase: product.price,
      }],
      total_amount: totalAmount,
      status: 'PLACED',
      payment_status: 'CREATED',
      razorpay_order_id: razorpayOrder.id,
    });

    return sendSuccess(res, {
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: seller.razorpay_key_id,
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        quantity: quantity,
      },
      seller: {
        name: seller.username,
      },
      database_order_id: order._id,
      total_amount: totalAmount,
      selling_price: sellingPrice,
    });
  } catch (err) {
    next(err);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      database_order_id 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !database_order_id) {
      throw createError(400, 'Missing payment verification data');
    }

    // Get the order from database
    const order = await Order.findById(database_order_id).populate('items.product');
    if (!order) {
      throw createError(404, 'Order not found');
    }

    // Get seller's Razorpay details for verification
    const seller = await User.findById(order.seller);
    if (!seller || !seller.razorpay_key_secret) {
      throw createError(400, 'Seller payment details not found');
    }

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', seller.razorpay_key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw createError(400, 'Invalid payment signature');
    }

    // Update order with payment details
    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    order.payment_status = 'PAID';
    order.status = 'CONFIRMED';
    await order.save();

    // Get the original product and order details
    const product = order.items[0].product;
    const purchasedQuantity = order.items[0].quantity;
    
    // Get selling price from order notes (passed during order creation)
    const sellingPrice = order.notes?.selling_price ? parseFloat(order.notes.selling_price) : product.price * 1.2;
    
    // Reduce seller's product quantity
    const updatedProduct = await Product.findByIdAndUpdate(product._id, {
      $inc: { quantity: -purchasedQuantity }
    }, { new: true });
    
    // Update product status based on remaining quantity
    if (updatedProduct.quantity <= 0) {
      // Product fully sold - mark as SOLD so seller knows it's been fully purchased
      await Product.findByIdAndUpdate(product._id, { status: 'SOLD' });
    } else {
      // Product partially sold - keep as ACTIVE for remaining quantity
      // Seller can see the reduced quantity in their product list
      // The order will show in seller's order history
    }
    
    // Invalidate seller's product cache so they see updated quantity/status
    // This is handled by the frontend query invalidation
    
    // Prepare images array for AdminProduct
    let imagesArray = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      // Extract imageUrl from product images
      imagesArray = product.images.map(img => {
        if (typeof img === 'string') return img;
        return img.imageUrl || img.image || '';
      }).filter(url => url && url.trim() !== '');
    }
    // Add primary image to images array if not already included
    if (product.image && !imagesArray.includes(product.image)) {
      imagesArray.unshift(product.image); // Add primary image first
    }
    
    // Create admin product entry
    const adminProduct = await AdminProduct.create({
      originalProduct: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      quantity: purchasedQuantity,
      quantity_unit: product.quantity_unit || 'kg',
      image: product.image || (imagesArray.length > 0 ? imagesArray[0] : ''),
      images: imagesArray,
      purchasePrice: product.price,
      seller: order.seller,
      sellerName: seller.username,
      purchasedBy: req.user._id,
      order: order._id,
      sellingPrice: sellingPrice,
      status: 'ACTIVE',
    });

    return sendSuccess(res, {
      message: 'Payment verified successfully',
      order_id: order._id,
      payment_status: 'PAID',
      admin_product_id: adminProduct._id,
      remaining_seller_quantity: updatedProduct.quantity,
    });
  } catch (err) {
    next(err);
  }
}

async function getPaymentStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('items.product')
      .populate('seller', 'username email');
    
    if (!order) {
      throw createError(404, 'Order not found');
    }

    return sendSuccess(res, {
      order_id: order._id,
      razorpay_order_id: order.razorpay_order_id,
      payment_status: order.payment_status,
      status: order.status,
      total_amount: order.total_amount,
      product: order.items[0]?.product,
      seller: order.seller,
      created_at: order.created_at,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
};
