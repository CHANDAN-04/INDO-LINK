const { Schema, model } = require('mongoose');

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

module.exports = model('Category', categorySchema);


