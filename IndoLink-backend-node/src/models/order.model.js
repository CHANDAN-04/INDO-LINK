const { Schema, model, Types } = require('mongoose');

const orderItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product' }, // For seller products
    adminProduct: { type: Types.ObjectId, ref: 'AdminProduct' }, // For admin products
    quantity: { type: Number, required: true, min: 1 },
    price_at_purchase: { type: Number, required: true, min: 0 },
    product_name: { type: String }, // Store product name for reference
    product_image: { type: String }, // Store product image for reference
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    type: { type: String, enum: ['ADMIN_PURCHASE', 'BUYER_PURCHASE'], required: true },
    buyer: { type: Types.ObjectId, ref: 'User' },
    seller: { type: Types.ObjectId, ref: 'User' },
    admin: { type: Types.ObjectId, ref: 'User' },
    items: { type: [orderItemSchema], default: [] },
    total_amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PLACED' },
    payment_status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CREATED'], default: 'PENDING' },
    order_number: { type: String, index: true },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

orderSchema.pre('save', function ensureOrderNumber(next) {
  if (!this.order_number) {
    this.order_number = `OD${Math.floor(Math.random() * 1e9)}`;
  }
  next();
});

module.exports = model('Order', orderSchema);


