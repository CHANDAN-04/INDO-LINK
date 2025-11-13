const { Schema, model } = require('mongoose');

const sliderSchema = new Schema(
  {
    title: { type: String },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    product: { type: Schema.Types.ObjectId, ref: 'AdminProduct' }, // Link to product
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = model('SliderItem', sliderSchema);


