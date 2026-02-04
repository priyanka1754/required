const express = require("express");
const router = express.Router();
const Blog = require("../models/blogs");

// ✅ Create a blog
router.post("/", async (req, res) => {
  try {
    console.log("req.body", req.body);
    const { title, intro, content, authorName, customerId } = req.body;

    if (!title || !intro || !content || !authorName || !customerId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newBlog = new Blog({
      title,
      intro,
      content,
      image: "",
      author: authorName,
      customerId,
      blogId: `${Date.now()}${Math.floor(Math.random() * 1000)}`, // Generate a unique blog ID
    });
    console.log("new blog ", newBlog);
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    console.log("blogs", blogs);
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Get a single blog by ID
router.get("/:id", async (req, res) => {
  try {
    console.log("req.params.id", req.params.id);
    const blogData = await Blog.find({ blogId: req.params.id });
    const blog = blogData[0] || null;
    console.log("blog", blog);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const otherBlogs = await Blog.find({
      customerId: blog.customerId,
      _id: { $ne: blog._id },
    });

    res.json({ blog, otherBlogs });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Edit a blog (check using customerId)
router.put("/:id", async (req, res) => {
  try {
    const { title, intro, content, image, customerId } = req.body;

    const updatedBlog = await Blog.findOneAndUpdate(
      { blogId: req.params.id, customerId },
      {
        $set: {
          title: title,
          intro: intro,
          content: content,
          image: image,
        },
      },
      { new: true }
    );
    if (!updatedBlog)
      return res
        .status(404)
        .json({ message: "Blog not found or unauthorized" });
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Delete a blog (check using customerId)
router.delete("/:id", async (req, res) => {
  try {
    const { customerId } = req.query;
    console.log("req.params.id", req.params.id);
    const blogData = await Blog.find({ blogId: req.params.id });
    const blog = blogData[0] || null;
    console.log("blog", blog);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // if (blog.customerId !== customerId) {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    await blog.deleteOne();
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/:id/like", async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const blog = await Blog.findOne({ blogId: req.params.id });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const hasLiked = blog.likedBy?.includes(customerId);

    if (hasLiked) {
      // Remove like
      await Blog.updateOne(
        { blogId: req.params.id },
        {
          $inc: { likes: -1 },
          $pull: { likedBy: customerId }
        }
      );
      const updatedBlog = await Blog.findOne({ blogId: req.params.id });
      return res.json({
        message: "Like removed",
        likes: updatedBlog.likes,
        liked: false
      });
    } else {
      // Add like
      await Blog.updateOne(
        { blogId: req.params.id },
        {
          $inc: { likes: 1 },
          $addToSet: { likedBy: customerId }
        }
      );
      const updatedBlog = await Blog.findOne({ blogId: req.params.id });
      return res.json({
        message: "Liked successfully",
        likes: updatedBlog.likes,
        liked: true
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Check if user has liked a blog (optional - for getting like status)
router.get("/:id/like-status/:customerId", async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogId: req.params.id });
    
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const hasLiked = blog.likedBy ? blog.likedBy.includes(req.params.customerId) : false;
    
    return res.json({ 
      hasLiked: hasLiked,
      likes: blog.likes 
    });
  } catch (error) {
    console.error("Error checking like status:", error);
    return res.status(500).json({ message: "Server error", error: error.message || error });
  }
});

// ✅ Dislike a blog
router.post("/:id/dislike", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.dislikes += 1;
    await blog.save();
    res.json({ message: "Disliked successfully", dislikes: blog.dislikes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/:id/comment", async (req, res) => {
  try {
    const { content, authorName, customerId } = req.body;

    if (!content || !authorName || !customerId) {
      return res.status(400).json({ message: "Content, author name, and customer ID are required" });
    }

    const newComment = {
      content,
      authorName,
      customerId
    };

    const updatedBlog = await Blog.findOneAndUpdate(
      { blogId: req.params.id },
      { $push: { comments: newComment } },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment: updatedBlog.comments[updatedBlog.comments.length - 1]
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


// ✅ Get all comments for a blog
router.get("/:id/comments", async (req, res) => {
  try {
    const blogData = await Blog.find({ blogId: req.params.id });
    const blog = blogData[0] || null;
    
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Sort comments by creation date (newest first)
    const sortedComments = blog.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ comments: sortedComments });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update reading progress for a user
router.post('/:blogId/reading-progress', async (req, res) => {
  try {
    const { blogId } = req.params;
    const { customerId, scrollPercentage } = req.body;

    if (!customerId || scrollPercentage === undefined) {
      return res.status(400).json({ 
        message: 'Customer ID and scroll percentage are required' 
      });
    }

    // Validate scroll percentage
    if (scrollPercentage < 0 || scrollPercentage > 100) {
      return res.status(400).json({ 
        message: 'Scroll percentage must be between 0 and 100' 
      });
    }

    const result = await Blog.findOneAndUpdate(
      { 
        blogId,
        'readingProgress.customerId': customerId 
      },
      {
        $set: {
          'readingProgress.$.scrollPercentage': scrollPercentage,
          'readingProgress.$.lastReadAt': new Date()
        }
      },
      { new: true }
    );

    if (result) {
      // User already had progress, it was updated
      return res.status(200).json({
        message: 'Reading progress updated successfully',
        scrollPercentage,
        customerId
      });
    }

    // If no existing progress found, add new entry
    const updatedBlog = await Blog.findOneAndUpdate(
      { blogId },
      {
        $push: {
          readingProgress: {
            customerId,
            scrollPercentage,
            lastReadAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json({
      message: 'Reading progress updated successfully',
      scrollPercentage,
      customerId
    });

  } catch (error) {
    console.error('Error updating reading progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reading progress for a specific user
router.get('/:blogId/reading-progress/:customerId', async (req, res) => {
  try {
    const { blogId, customerId } = req.params;

    const blog = await Blog.findOne({ blogId });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Find reading progress for this user
    const userProgress = blog.readingProgress.find(
      progress => progress.customerId === customerId
    );

    if (!userProgress) {
      return res.status(200).json({ 
        scrollPercentage: 0,
        message: 'No reading progress found for this user'
      });
    }

    res.status(200).json({
      scrollPercentage: userProgress.scrollPercentage,
      lastReadAt: userProgress.lastReadAt,
      customerId
    });

  } catch (error) {
    console.error('Error fetching reading progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;