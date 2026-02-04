const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  authorName: String,
  authorAvatar: String,
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const CommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  authorName: String,
  authorAvatar: String,
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  replies: [ReplySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: ['Workshop', 'Kids Activity', 'Meetup', 'Webinar', 'Health', 'Education'],
    required: true
  },

  eventType: {
    type: String,
    enum: ['Online', 'Offline'],
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  time: {
    type: String,
    required: true
  },

  duration: {
    type: Number // hours
  },

  posterUrl: {
    type: String
  },

  // For Offline events
  venue: {
    type: String
  },

  // For Online events
  meetingLink: {
    type: String
  },

  city: {
    type: String
  },

  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  maxAttendees: {
    type: Number
  },

  isFree: {
    type: Boolean,
    default: true
  },

  price: {
  type: Number,
  default: 0
},

  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },

  comments: [CommentSchema],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

EventSchema.index({ date: 1, city: 1, category: 1 });

module.exports = mongoose.model('Event', EventSchema);