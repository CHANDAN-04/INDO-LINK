const { Schema, model, Types } = require('mongoose');

const productImageSchema = new Schema(
  {
    imageUrl: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    quantity_unit: { type: String, enum: ['kg', 'g', 'ton', 'liter', 'ml', 'piece', 'dozen', 'pack', 'box', 'bag'], default: 'kg' },
    image: { type: String },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'SOLD', 'INACTIVE'], default: 'DRAFT' },
    seller: { type: Types.ObjectId, ref: 'User', required: true },
    admin: { type: Types.ObjectId, ref: 'User' },
    relist_price: { type: Number },
    gemini_analysis: { type: Schema.Types.Mixed },
    market_trend: { type: String },
    recommended_price: { type: Number },
    images: [productImageSchema],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = model('Product', productSchema);


