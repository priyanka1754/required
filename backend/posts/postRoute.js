const express = require('express');
const router = express.Router();
const postController = require('./postController');
const authMiddleware = require('../middleware/auth');

// ✅ Public routes
router.get('/', postController.getAllPosts); // Feed
router.get('/category/:category', postController.getPostsByCategory);
router.get('/user/:userId', postController.getUserPosts);
router.get('/presigned-url', postController.getPresignedUrl); // Presigned URL for uploads
router.get('/:postId', postController.getPostById);
router.get('/:postId/like-status/:userId', postController.getLikeStatus); // Like status
router.get('/:postId/comments', postController.getComments); // Get all comments for a post

// ✅ Protected routes
router.post('/', postController.createPost);
router.post('/upload', postController.uploadMedia, postController.handleMediaUpload);
router.put('/:postId', postController.updatePost);
router.delete('/:postId', postController.deletePost);
router.post('/:postId/like', postController.toggleLike);
router.post('/:postId/comment', postController.addComment);


module.exports = router;