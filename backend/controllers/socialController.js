const Post = require('../models/Post');
const User = require('../models/User');
const Shop = require('../models/Shop');

// Create a new post or story
exports.createPost = async (req, res) => {
    try {
        const { type, mediaUrl, caption, shopId, tags, isRegional } = req.body;
        const post = new Post({
            user: req.user.id,
            type,
            mediaUrl,
            caption,
            shop: shopId,
            tags,
            isRegional
        });
        await post.save();
        res.status(201).json({ success: true, post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all posts (Feed)
exports.getFeed = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'fullname avatar')
            .populate('shop', 'name logo')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get stories (Reels style)
exports.getStories = async (req, res) => {
    try {
        const stories = await Post.find({ type: 'Story' })
            .populate('user', 'fullname avatar')
            .populate('shop', 'name logo')
            .sort({ createdAt: -1 })
            .limit(20);
        res.status(200).json({ success: true, stories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Like/Unlike a post
exports.toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        const index = post.likes.indexOf(req.user.id);
        if (index === -1) {
            post.likes.push(req.user.id);
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();
        res.status(200).json({ success: true, likes: post.likes.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Follow/Unfollow a shop
exports.toggleFollowShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        const user = await User.findById(req.user.id);

        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        const shopIndex = shop.followers.indexOf(req.user.id);
        const userIndex = user.followingShops.indexOf(req.params.shopId);

        if (shopIndex === -1) {
            shop.followers.push(req.user.id);
            user.followingShops.push(req.params.shopId);
        } else {
            shop.followers.splice(shopIndex, 1);
            user.followingShops.splice(userIndex, 1);
        }

        await shop.save();
        await user.save();

        res.status(200).json({ success: true, isFollowing: shopIndex === -1 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Follow/Unfollow a user
exports.toggleFollowUser = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        if (targetUserId === req.user.id) return res.status(400).json({ success: false, message: 'You cannot follow yourself' });

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(req.user.id);

        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

        const index = targetUser.followers.indexOf(req.user.id);
        if (index === -1) {
            targetUser.followers.push(req.user.id);
            currentUser.followingUsers.push(targetUserId);
        } else {
            targetUser.followers.splice(index, 1);
            const followIndex = currentUser.followingUsers.indexOf(targetUserId);
            if (followIndex !== -1) currentUser.followingUsers.splice(followIndex, 1);
        }

        targetUser.socialStats.followersCount = targetUser.followers.length;
        currentUser.socialStats.followingCount = currentUser.followingUsers.length;

        await targetUser.save();
        await currentUser.save();

        res.status(200).json({ success: true, isFollowing: index === -1 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get activity of followed friends
exports.getFriendsActivity = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const friends = currentUser.followingUsers;

        const Order = require('../models/Order');
        const activity = await Order.find({ user: { $in: friends }, status: 'Delivered' })
            .populate('user', 'fullname avatar')
            .populate('shop', 'name logo')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({ success: true, activity });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
