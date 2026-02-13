const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    postId: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString()
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    customerId: {
      type: String,
      required: true,
      index: true
    },

    content: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    category: {
      type: String,
      required: true,
      enum: [
        'General Thoughts',
        'Parenting Tips',
        'Child Development',
        'Health & Wellness',
        'Education',
        'Entertainment',
        'Ask for Advice',
        'Success Stories'
      ]
    },

    mediaType: {
      type: String,
      enum: ['photo', 'video', ''],
      default: ''
    },

    mediaUrl: {
      type: String,
      default: ''
    },

    likes: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],

    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: 500
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
