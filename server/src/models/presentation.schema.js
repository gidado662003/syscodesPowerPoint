const mongoose = require("mongoose");

const presentationSchema = new mongoose.Schema(
  {
    // store an ordered list of Slide ObjectIds
    slides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Slide",
        required: true,
      },
    ],
    title: { type: String, required: false },
    userId: { type: Number, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Presentation", presentationSchema);
