import { Schema, models, model } from "mongoose";

const DocumentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    filename: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      required: true,
    },

    extractedText: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["processing", "ready"],
      default: "processing",
      status: "processing",
    },
  },
  {
    timestamps: true,
  }
);

export default models.Document || model("Document", DocumentSchema);