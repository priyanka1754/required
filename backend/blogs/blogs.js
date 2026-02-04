const mongoose = require("mongoose");

// Comment schema
const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    authorName: { type: String, required: true }, // Required - only logged in users can comment
    customerId: { type: String, required: true }, // Required - only logged in users can comment
  },
  { timestamps: true } // Auto add createdAt & updatedAt
);

// Reading progress schema
const readingProgressSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true },
    scrollPercentage: { type: Number, required: true, min: 0, max: 100 },
    lastReadAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    intro: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String }, // Store image URL or path
    author: { type: String, required: true }, // Store author name as string
    customerId: { type: String, required: true }, // Store customer ID
    likes: { type: Number, default: 0 },
    likedBy: [{
      type: String, // Array of customer IDs who have liked this blog
      default: []
    }],
    dislikes: { type: Number, default: 0 },
    blogId: { type: String, required: true }, // Store blog ID
    comments: [commentSchema], // Array of comments
    readingProgress: [readingProgressSchema], // Array of reading progress for different users
  },
  { timestamps: true } // Auto add createdAt & updatedAt
);

module.exports = mongoose.model("Blog", blogSchema);