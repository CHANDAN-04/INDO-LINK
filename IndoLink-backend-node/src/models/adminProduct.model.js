const mongoose = require('mongoose');

const adminProductSchema = new mongoose.Schema({
  // Original product reference
  originalProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  
  // Product details (copied from original for independence)
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  quantity_unit: {
    type: String,
    enum: ['kg', 'g', 'ton', 'liter', 'ml', 'piece', 'dozen', 'pack', 'box', 'bag'],
    default: 'kg',
  },
  image: {
    type: String,
    required: true,
  },
  images: [{
    type: String,
  }],
  
  // Purchase details
  purchasePrice: {
    type: Number,
    required: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  
  // Seller information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sellerName: {
    type: String,
    required: true,
  },
  
  // Admin information
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Order reference
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  
  // Status
  status: {
    type: String,
    enum: ['ACTIVE', 'SOLD_OUT', 'INACTIVE'],
    default: 'ACTIVE',
  },
  
  // Sales tracking for admin
  soldQuantity: {
    type: Number,
    default: 0,
  },
  
  // Pricing for resale
  sellingPrice: {
    type: Number,
    required: true,
  },
  
}, {
  timestamps: true,
});

// Index for efficient queries
adminProductSchema.index({ purchasedBy: 1, status: 1 });
adminProductSchema.index({ seller: 1 });
adminProductSchema.index({ originalProduct: 1 });

// Virtual for available quantity
adminProductSchema.virtual('availableQuantity').get(function() {
  return this.quantity - this.soldQuantity;
});

// Ensure virtual fields are serialized
adminProductSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('AdminProduct', adminProductSchema);
