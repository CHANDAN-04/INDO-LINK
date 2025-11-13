const { Schema, model } = require('mongoose');

const brokerEarningSchema = new Schema(
  {
    broker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'AdminProduct', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    purchase_price: { type: Number, required: true },
    selling_price: { type: Number, required: true },
    profit: { type: Number, required: true },
    commission_rate: { type: Number, default: 0.05 }, // 5%
    commission_amount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const brokerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    broker_code: { type: String, unique: true, sparse: true },
    total_earnings: { type: Number, default: 0 },
    total_users: { type: Number, default: 0 },
    total_commission_paid: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Generate unique broker code
brokerSchema.pre('save', async function(next) {
  if (!this.broker_code) {
    let brokerCode;
    let isUnique = false;
    
    while (!isUnique) {
      brokerCode = `BRK${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      const existingBroker = await this.constructor.findOne({ broker_code: brokerCode });
      if (!existingBroker) {
        isUnique = true;
      }
    }
    
    this.broker_code = brokerCode;
  }
  next();
});

module.exports = {
  Broker: model('Broker', brokerSchema),
  BrokerEarning: model('BrokerEarning', brokerEarningSchema)
};
