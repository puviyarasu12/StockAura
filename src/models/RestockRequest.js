const mongoose = require("mongoose");

const restockRequestSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    requestedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["draft", "requested", "received", "cancelled"],
      default: "draft",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    emailedTo: {
      type: String,
      trim: true,
      lowercase: true,
    },
    emailedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestockRequest", restockRequestSchema);

