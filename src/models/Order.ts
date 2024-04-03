import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      address: {
        type: String,
        required: [true, 'Please Enter Address.'],
      },
      city: {
        type: String,
        required: [true, 'Please Enter City.'],
      },
      state: {
        type: String,
        required: [true, 'Please Enter State.'],
      },
      pinCode: {
        type: String,
        required: [true, 'Please Enter PinCode.'],
      },
    },

    user: {
      type: String,
      ref: 'User',
      required: true,
    },

    subTotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    shippingCharges: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Processing', 'Shipped', 'Delivered'],
      default: 'Processing',
    },

    orderItems: [
      {
        name: String,
        photo: String,
        price: Number,
        quantity: Number,
        productId: {
          type: mongoose.Types.ObjectId,
          ref: 'Product',
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const Order = mongoose.model('Order', OrderSchema);
