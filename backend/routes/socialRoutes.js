const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
    createPost,
    getFeed,
    getStories,
    toggleLike,
    toggleFollowShop
} = require('../controllers/socialController');

router.post('/post', isAuthenticated, createPost);
router.get('/feed', getFeed);
router.get('/stories', getStories);
router.put('/like/:postId', isAuthenticated, toggleLike);
router.put('/follow/:shopId', isAuthenticated, toggleFollowShop);

module.exports = router;
