const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Resume", "Aadhar Card", "PAN Card", "Certificate", "Other"],
      default: "Other",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      default: "",
    },
    size: {
      type: Number, // in bytes
      default: 0,
    },
  },
  { timestamps: true },
);

const documentModel = mongoose.model("Document", documentSchema);
module.exports = documentModel;
