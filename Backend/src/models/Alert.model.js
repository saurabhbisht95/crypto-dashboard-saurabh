import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coinId: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    direction: {
      type: String,
      enum: ["above", "below"],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    triggered: {
      type: Boolean,
      default: false,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

alertSchema.index({ user: 1, active: 1 });

export const Alert = mongoose.model("Alert", alertSchema);
