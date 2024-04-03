import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema(
  {
    code: {
        type: String,
        requied: [true, "Please Enter the Coupoun Code."],
        unique: true,
    },
    amount: {
        type: Number,
        requied: [true, "Please Enter the Discount Amount."]
    },
  },
);

export const Coupon = mongoose.model('Coupon', CouponSchema);
