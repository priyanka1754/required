const express = require('express');
const router = express.Router();
const eventCtrl = require('./eventController');

router.get('/presigned-url', eventCtrl.getEventPresignedUrl);
router.post('/', eventCtrl.createEvent);
router.get('/', eventCtrl.getEvents);
router.get('/:id', eventCtrl.getEventById);
router.put('/:id', eventCtrl.updateEvent);
router.delete('/:id',eventCtrl.cancelEvent);
router.post('/:id/comment', eventCtrl.addComment); 
router.get('/:id/comments', eventCtrl.getComments); 
router.post('/:id/comment/:commentId/reply', eventCtrl.replyToComment); 
router.post('/:id/comment/:commentId/like', eventCtrl.likeComment); 
router.get('/user/:userId', eventCtrl.getUserEvents); 

module.exports = router;