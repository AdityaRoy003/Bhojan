const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
    createPost,
    getFeed,
    getStories,
    toggleLike,
    toggleFollowShop,
    toggleFollowUser,
    getFriendsActivity
} = require('../controllers/socialController');

router.post('/post', isAuthenticated, createPost);
router.post('/stories', isAuthenticated, createPost);
router.get('/feed', getFeed);
router.get('/stories', getStories);
router.put('/like/:postId', isAuthenticated, toggleLike);
router.put('/follow/:shopId', isAuthenticated, toggleFollowShop);
router.put('/follow-user/:userId', isAuthenticated, toggleFollowUser);
router.get('/friends-activity', isAuthenticated, getFriendsActivity);

module.exports = router;
