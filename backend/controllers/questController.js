const Quest = require('../models/Quest');
const UserQuest = require('../models/UserQuest');
const User = require('../models/User');

// --- ADMIN: Create a Quest ---
exports.createQuest = async (req, res) => {
    try {
        const quest = await Quest.create(req.body);
        res.status(201).json({ success: true, quest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ADMIN: Get All Quests ---
exports.getAllQuests = async (req, res) => {
    try {
        const quests = await Quest.find().sort({ createdAt: -1 });
        res.json({ success: true, quests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ADMIN: Delete a Quest ---
exports.deleteQuest = async (req, res) => {
    try {
        await Quest.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Quest deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- CUSTOMER: Get My Quests (with progress) ---
exports.getMyQuests = async (req, res) => {
    try {
        let activeQuests = await Quest.find({ isActive: true });
        if (activeQuests.length === 0) {
            const defaultQuests = [
                {
                    title: 'Bhojan Beginner',
                    description: 'Place your first order on Bhojan!',
                    icon: '🍔',
                    conditionType: 'order_count',
                    targetValue: 1,
                    rewardPoints: 50,
                    isActive: true
                },
                {
                    title: 'Cuisine Connoisseur',
                    description: 'Explore the menu! Order from 3 different cuisines',
                    icon: '🍕',
                    conditionType: 'cuisine_variety',
                    targetValue: 3,
                    rewardPoints: 150,
                    isActive: true
                },
                {
                    title: 'Big Spender',
                    description: 'Order your favorites and spend a total of ₹1000',
                    icon: '💰',
                    conditionType: 'spend_amount',
                    targetValue: 1000,
                    rewardPoints: 200,
                    isActive: true
                },
                {
                    title: 'Bhojan Fanatic',
                    description: 'Order 5 times to prove your loyalty',
                    icon: '👑',
                    conditionType: 'order_count',
                    targetValue: 5,
                    rewardPoints: 300,
                    isActive: true
                }
            ];
            await Quest.insertMany(defaultQuests);
            activeQuests = await Quest.find({ isActive: true });
        }

        const userQuestDocs = await UserQuest.find({ user: req.user._id });
        const userQuestMap = {};
        userQuestDocs.forEach(uq => { userQuestMap[uq.quest.toString()] = uq; });

        const quests = activeQuests.map(q => {
            const uq = userQuestMap[q._id.toString()];
            return {
                ...q.toObject(),
                progress: uq ? uq.progress : 0,
                completed: uq ? uq.completed : false,
                rewarded: uq ? uq.rewarded : false,
            };
        });
        res.json({ success: true, quests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- CUSTOMER: Claim reward for completed quest ---
exports.claimQuestReward = async (req, res) => {
    try {
        const uq = await UserQuest.findOne({ user: req.user._id, quest: req.params.questId });
        if (!uq || !uq.completed) return res.status(400).json({ success: false, message: 'Quest not completed.' });
        if (uq.rewarded) return res.status(400).json({ success: false, message: 'Reward already claimed.' });

        const quest = await Quest.findById(req.params.questId);
        uq.rewarded = true;
        await uq.save();

        // Add loyalty points to user
        await User.findByIdAndUpdate(req.user._id, { $inc: { loyaltyPoints: quest.rewardPoints } });

        res.json({ success: true, message: `🎉 +${quest.rewardPoints} points claimed!`, badge: quest.rewardBadge });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Internal: Called after each order to update quest progress ---
exports.updateQuestProgress = async (userId, orderData) => {
    try {
        const quests = await Quest.find({ isActive: true });
        for (const quest of quests) {
            let uq = await UserQuest.findOne({ user: userId, quest: quest._id });
            if (!uq) {
                uq = new UserQuest({ user: userId, quest: quest._id, progress: 0, progressData: {} });
            }
            if (uq.completed) continue;

            if (quest.conditionType === 'order_count') {
                uq.progress = (uq.progress || 0) + 1;
            } else if (quest.conditionType === 'spend_amount') {
                uq.progress = (uq.progress || 0) + (orderData.totalAmount || 0);
            } else if (quest.conditionType === 'cuisine_variety') {
                const cuisines = uq.progressData?.cuisines || [];
                const shopCuisine = orderData.shopCuisine || 'Other';
                if (!cuisines.includes(shopCuisine)) cuisines.push(shopCuisine);
                uq.progressData = { cuisines };
                uq.progress = cuisines.length;
            }

            if (uq.progress >= quest.targetValue && !uq.completed) {
                uq.completed = true;
                uq.completedAt = new Date();
            }
            await uq.save();
        }
    } catch (err) {
        console.error('[Quest Progress Error]', err.message);
    }
};
