import mongoose, { Schema } from "mongoose";
const ConversationSchema = new Schema(
    {
        userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
     title: {
      type: String,
      default: "New Chat",
    },
  },
   {
    timestamps: true,
  }            
    
)

export default mongoose.models.Conversation ||
mongoose.model("Conversation", ConversationSchema);