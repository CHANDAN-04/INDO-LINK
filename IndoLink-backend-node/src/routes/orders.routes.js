const { Router } = require('express');
const { protect, requireRoles } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const AdminProduct = require('../models/adminProduct.model');
const { Broker, BrokerEarning } = require('../models/broker.model');
const User = require('../models/user.model');
const orderController = require('../controllers/order.controller');

const router = Router();

const Product = require('../models/product.model');
const crypto = require('crypto');

router.get('/cart', protect, requireRoles('BUYER'), async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .populate('items.adminProduct');
    
    const normalized = {
      items: (cart?.items || []).map((it) => {
        if (it.product_type === 'admin' && it.adminProduct) {
          // Admin product
          return {
            id: it._id.toString(),
            product: {
              id: it.adminProduct._id.toString(),
              name: it.adminProduct.name,
              category_name: it.adminProduct.category?.name,
              price: it.adminProduct.sellingPrice,
              image: it.adminProduct.image,
              available_quantity: it.adminProduct.quantity - it.adminProduct.soldQuantity,
              is_admin_product: true,
            },
            quantity: it.quantity,
            product_type: 'admin',
          };
        } else if (it.product) {
          // Legacy seller product
          return {
            id: it._id.toString(),
            product: {
              id: it.product._id.toString(),
              name: it.product.name,
              category_name: undefined,
              price: it.product.relist_price || it.product.price || 0,
              image: it.product.image,
              is_admin_product: false,
            },
            quantity: it.quantity,
            product_type: 'seller',
          };
        }
        return null;
      }).filter(Boolean),
    };
    return sendSuccess(res, normalized);
  } catch (err) { next(err); }
});

router.post('/cart', protect, requireRoles('BUYER'), async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;
    
    // Check if it's an admin product (new system)
    const adminProduct = await AdminProduct.findById(product_id);
    if (adminProduct) {
      if (adminProduct.status !== 'ACTIVE') {
        return res.status(400).json({ success: false, message: 'Product not available for purchase' });
      }
      
      const availableQty = adminProduct.quantity - adminProduct.soldQuantity;
      if (availableQty <= 0) {
        return res.status(400).json({ success: false, message: 'Product is out of stock' });
      }
      
      const qty = Math.max(1, Number(quantity) || 1);
      if (qty > availableQty) {
        return res.status(400).json({ success: false, message: `Only ${availableQty} items available` });
      }
      
      // Check if item already exists in cart
      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
      }
      
      const existingItemIndex = cart.items.findIndex(item => 
        item.adminProduct && item.adminProduct.toString() === product_id
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item
        cart.items[existingItemIndex].quantity += qty;
      } else {
        // Add new item
        cart.items.push({
          adminProduct: adminProduct._id,
          quantity: qty,
          product_type: 'admin'
        });
      }
      
      await cart.save();
      
      return sendSuccess(res, { 
        message: 'Product added to cart',
        items: cart.items.map((it) => ({ 
          id: it._id, 
          adminProduct: it.adminProduct,
          product: it.product,
          quantity: it.quantity,
          product_type: it.product_type
        })) 
      });
    }
    
    // Legacy seller product support (if needed)
    const product = await Product.findById(product_id);
    if (!product || !product.admin || product.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Product not available for purchase' });
    }
    
    const qty = Math.max(1, Number(quantity) || 1);
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id, 'items.product': { $ne: product._id } },
      { $push: { items: { product: product._id, quantity: qty, product_type: 'seller' } } },
      { upsert: true, new: true }
    );
    const updated = await Cart.findOneAndUpdate(
      { user: req.user._id, 'items.product': product._id },
      { $inc: { 'items.$.quantity': qty } },
      { new: true }
    );
    const result = updated || cart;
    return sendSuccess(res, { items: result.items.map((it) => ({ id: it._id, product: it.product, quantity: it.quantity })) });
  } catch (err) { next(err); }
});

router.put('/cart/items/:itemId', protect, requireRoles('BUYER'), async (req, res, next) => {
  try {
    const qty = Math.max(0, Number(req.body.quantity) || 0);
    let cart;
    if (qty === 0) {
      cart = await Cart.findOneAndUpdate(
        { user: req.user._id },
        { $pull: { items: { _id: req.params.itemId } } },
        { new: true }
      );
    } else {
      cart = await Cart.findOneAndUpdate(
        { user: req.user._id, 'items._id': req.params.itemId },
        { $set: { 'items.$.quantity': qty } },
        { new: true }
      );
    }
    return sendSuccess(res, cart || { items: [] });
  } catch (err) { next(err); }
});

router.delete('/cart/items/:itemId', protect, requireRoles('BUYER'), async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { items: { _id: req.params.itemId } } },
      { new: true }
    );
    return sendSuccess(res, cart || { items: [] });
  } catch (err) { next(err); }
});

router.post('/checkout', protect, requireRoles('BUYER'), async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .populate('items.adminProduct');
    
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    const items = [];
    let total = 0;
    
    // Process cart items and validate availability
    for (const cartItem of cart.items) {
      let orderItem;
      
      if (cartItem.product_type === 'admin' && cartItem.adminProduct) {
        // Admin product
        const adminProduct = cartItem.adminProduct;
        const availableQty = adminProduct.quantity - adminProduct.soldQuantity;
        
        if (cartItem.quantity > availableQty) {
          return res.status(400).json({ 
            success: false, 
            message: `Not enough quantity available for ${adminProduct.name}. Available: ${availableQty}` 
          });
        }
        
        orderItem = {
          adminProduct: adminProduct._id,
          quantity: cartItem.quantity,
          price_at_purchase: adminProduct.sellingPrice,
          product_name: adminProduct.name,
          product_image: adminProduct.image,
        };
        
        total += adminProduct.sellingPrice * cartItem.quantity;
        
        // Update sold quantity
        await AdminProduct.findByIdAndUpdate(adminProduct._id, {
          $inc: { soldQuantity: cartItem.quantity }
        });
        
      } else if (cartItem.product_type === 'seller' && cartItem.product) {
        // Legacy seller product (if any still exist)
        const product = cartItem.product;
        
        if (cartItem.quantity > product.quantity) {
          return res.status(400).json({ 
            success: false, 
            message: `Not enough quantity available for ${product.name}. Available: ${product.quantity}` 
          });
        }
        
        orderItem = {
          product: product._id,
          quantity: cartItem.quantity,
          price_at_purchase: product.relist_price || product.price,
          product_name: product.name,
          product_image: product.image,
        };
        
        total += (product.relist_price || product.price) * cartItem.quantity;
      }
      
      if (orderItem) {
        items.push(orderItem);
      }
    }
    
    const order = await Order.create({
      type: 'BUYER_PURCHASE',
      buyer: req.user._id,
      items,
      total_amount: total,
      status: 'PLACED',
      payment_status: 'PAID',
    });
    
    // Process broker commissions for admin products
    for (const item of items) {
      if (item.adminProduct) {
        const adminProduct = await AdminProduct.findById(item.adminProduct)
          .populate('seller')
          .populate('purchasedBy');
        
        if (adminProduct) {
          const profit = adminProduct.sellingPrice - adminProduct.purchasePrice;
          const commissionAmount = profit * 0.05; // 5% commission
          
          // Find broker for seller
          if (adminProduct.seller.broker_id) {
            const sellerBroker = await Broker.findOne({ broker_code: adminProduct.seller.broker_id });
            if (sellerBroker) {
              await BrokerEarning.create({
                broker: sellerBroker._id,
                order: order._id,
                product: adminProduct._id,
                seller: adminProduct.seller._id,
                buyer: req.user._id,
                purchase_price: adminProduct.purchasePrice,
                selling_price: adminProduct.sellingPrice,
                profit: profit,
                commission_rate: 0.05,
                commission_amount: commissionAmount,
                status: 'PAID'
              });
              
              // Update broker's total earnings
              await Broker.findByIdAndUpdate(sellerBroker._id, {
                $inc: { total_earnings: commissionAmount }
              });
            }
          }
          
          // Find broker for buyer
          const buyer = await User.findById(req.user._id);
          if (buyer && buyer.broker_id) {
            const buyerBroker = await Broker.findOne({ broker_code: buyer.broker_id });
            if (buyerBroker) {
              await BrokerEarning.create({
                broker: buyerBroker._id,
                order: order._id,
                product: adminProduct._id,
                seller: adminProduct.seller._id,
                buyer: req.user._id,
                purchase_price: adminProduct.purchasePrice,
                selling_price: adminProduct.sellingPrice,
                profit: profit,
                commission_rate: 0.05,
                commission_amount: commissionAmount,
                status: 'PAID'
              });
              
              // Update broker's total earnings
              await Broker.findByIdAndUpdate(buyerBroker._id, {
                $inc: { total_earnings: commissionAmount }
              });
            }
          }
        }
      }
    }
    
    // Clear cart after successful order
    await Cart.deleteOne({ user: req.user._id });
    
    return sendSuccess(res, order);
  } catch (err) { next(err); }
});

router.get('/', protect, requireRoles('BUYER'), async (req, res, next) => {
  try {
    const orders = await Order.find({ 
      buyer: req.user._id,
      type: 'BUYER_PURCHASE' 
    })
      .populate('items.product', 'name image')
      .populate('items.adminProduct', 'name image sellingPrice')
      .sort({ created_at: -1 });
    
    const formattedOrders = orders.map(order => ({
      id: order._id,
      order_number: order.order_number,
      type: order.type,
      items: order.items.map(item => {
        if (item.adminProduct) {
          return {
            product: {
              id: item.adminProduct._id,
              name: item.product_name || item.adminProduct.name,
              image: item.product_image || item.adminProduct.image,
              is_admin_product: true,
            },
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
          };
        } else if (item.product) {
          return {
            product: {
              id: item.product._id,
              name: item.product_name || item.product.name,
              image: item.product_image || item.product.image,
              is_admin_product: false,
            },
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
          };
        }
        return null;
      }).filter(Boolean),
      total_amount: order.total_amount,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
    }));
    
    return sendSuccess(res, formattedOrders);
  } catch (err) { next(err); }
});

// Seller orders view (orders referencing products that belong to seller)
router.get('/seller', protect, requireRoles('SELLER'), orderController.getSellerOrders);

// Admin orders list
router.get('/admin', protect, requireRoles('ADMIN'), orderController.getAllOrders);

// Get specific order by ID
router.get('/:id', protect, orderController.getOrderById);

module.exports = router;


