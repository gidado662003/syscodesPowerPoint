const mongoose = require("mongoose");

const slideSchema = new mongoose.Schema(
  {
    title: { type: String },
    subtitle: { type: String },
    content: { type: String },
    image: { type: String },
    layout: { type: String },
    // make backgroundColor optional to avoid validation errors when not provided
    backgroundColor: { type: String, default: "#ffffff" },
    // Store Laravel's SQL user_id (optional)
    userId: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Slide", slideSchema);
