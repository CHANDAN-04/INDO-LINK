const { Schema, model, Types } = require('mongoose');

const cartItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product' }, // For seller products (legacy)
    adminProduct: { type: Types.ObjectId, ref: 'AdminProduct' }, // For admin products
    quantity: { type: Number, required: true, min: 1 },
    product_type: { type: String, enum: ['seller', 'admin'], default: 'admin' }, // Track product type
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = model('Cart', cartSchema);


