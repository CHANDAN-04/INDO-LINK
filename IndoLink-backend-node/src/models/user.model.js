const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const USER_ROLES = ['ADMIN', 'SELLER', 'BUYER', 'BROKER'];

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    first_name: { type: String, trim: true },
    last_name: { type: String, trim: true },
    role: { type: String, enum: USER_ROLES, default: 'BUYER', index: true },
    phone_number: { type: String },
    address: { type: String },
    password_hash: { type: String, required: true },
    razorpay_key_id: { type: String },
    razorpay_key_secret: { type: String },
    broker_id: { type: String }, // Optional field for buyers and sellers to reference their broker
    broker_code: { type: String, unique: true, sparse: true }, // Unique code for brokers
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

userSchema.methods.comparePassword = async function comparePassword(plain) {
  return bcrypt.compare(plain, this.password_hash);
};

module.exports = model('User', userSchema);


