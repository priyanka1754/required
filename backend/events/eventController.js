const Event = require('./event');
// in eventController.js
const { S3, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3ClientEvents = new S3({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

exports.getEventPresignedUrl = async (req, res) => {
  try {
    const { fileType } = req.query;

    if (!fileType) {
      return res.status(400).json({ error: 'Missing fileType' });
    }

    let extension = 'jpg';
    if (fileType.includes('png')) extension = 'png';
    else if (fileType.includes('webp')) extension = 'webp';

    const key = `events/${Date.now()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3ClientEvents, command, {
      expiresIn: 300,
    });

    res.json({
      uploadUrl,
      key,
      publicUrl: `${process.env.AWS_CLOUDFRONT_URL}/${key}`,
    });
  } catch (err) {
    console.error('Error generating event presigned URL:', err);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
};

// Create Event 
exports.createEvent = async (req, res) => {
  try {
    const { hostId } = req.body;  // ⬅ get from body
    if (!hostId) {
      return res.status(400).json({ error: 'hostId is required' });
    }

    const allowedFields = [
      'title',
      'description',
      'date',
      'time',
      'duration',
      'category',
      'eventType',
      'city',
      'venue',
      'meetingLink',
      'posterUrl',
      'maxAttendees',
      'isFree',
      'price',
    ];

    const eventData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        eventData[field] = req.body[field];
      }
    });

    eventData.host = hostId; // ⬅ set host from client

    const event = new Event(eventData);
    await event.save();

    const populatedEvent = await Event.findById(event._id).populate(
      'host',
      'name avatar bio'
    );

    const eventObj = populatedEvent.toObject();
    eventObj.id = eventObj._id;

    res.status(201).json(eventObj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Events 
exports.getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type, city } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (type) filter.eventType = type;
    if (city) filter.city = city;

    // optionally: only upcoming/ongoing
    // if you want to keep simple, skip $expr for now, or keep your duration logic
    // filter.status = { $in: ['Upcoming', 'Ongoing'] };

    const events = await Event.find(filter)
      .populate('host', 'Name avatar bio')
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get Event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      // Populate host with _id as id, name, avatar, bio
      .populate({
        path: 'host',
        select: 'Name avatar bio',
        transform: (doc) => doc ? { id: doc._id, name: doc.Name, avatar: doc.avatar, bio: doc.bio } : null
      });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Update Event
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (String(event.host) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ error: 'Not authorized', debug: { eventHost: event.host, userId: req.user._id } });
    }

    const allowedFields = [
      'title',
      'description',
      'date',
      'time',
      'duration',
      'category',
      'eventType',
      'city',
      'venue',
      'meetingLink',
      'posterUrl',
      'maxAttendees',
      'isFree',
      'price',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    event.updatedAt = new Date();
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Cancel Event (host only)
exports.cancelEvent = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (String(event.host) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    event.isCancelled = true;
    await event.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add a comment to an event
// controller: addComment
exports.addComment = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { comment, userId, authorName, authorAvatar } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const newComment = {
      userId,
      comment,
      authorName: authorName || 'User',
      authorAvatar: authorAvatar || '',
      createdAt: new Date(),
      likes: [],
      replies: [],
    };

    event.comments = event.comments || [];
    event.comments.push(newComment);
    await event.save();

    res.status(201).json(newComment);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to add comment.', error: err.message });
  }
};

// Add a reply to a comment
exports.replyToComment = async (req, res) => {
  try {
    const eventId = req.params.id;
    const commentId = req.params.commentId;
    const { reply, userId, authorName, authorAvatar } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply cannot be empty.' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const comment = event.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    const newReply = {
      userId,
      comment: reply,
      authorName: authorName || 'User',
      authorAvatar: authorAvatar || '',
      createdAt: new Date(),
      likes: [],
    };

    comment.replies = comment.replies || [];
    comment.replies.push(newReply);
    await event.save();

    res.status(201).json(newReply);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to add reply.', error: err.message });
  }
};

// Get all comments for an event
exports.getComments = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json(event.comments || []);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments.', error: err.message });
  }
};


// Like/unlike a comment
exports.likeComment = async (req, res) => {
  try {
    const eventId = req.params.id;
    const commentId = req.params.commentId;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const comment = event.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    comment.likes = comment.likes || [];
    const index = comment.likes.findIndex(id => String(id) === String(userId));

    let liked;
    if (index === -1) {
      comment.likes.push(userId);
      liked = true;
    } else {
      comment.likes.splice(index, 1);
      liked = false;
    }

    await event.save();
    res.json({ liked, likesCount: comment.likes.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to like/unlike comment.', error: err.message });
  }
};


// Get events created by a user
exports.getUserEvents = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Events created by user
    const createdEvents = await Event.find({ host: userId }).populate('host', 'name avatar bio');
    // Map to add 'id' property
    const eventsWithId = createdEvents.map(event => {
      const obj = event.toObject();
      obj.id = obj._id;
      return obj;
    });
    res.json(eventsWithId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};