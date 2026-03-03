const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth');
const { createQuest, getAllQuests, deleteQuest, getMyQuests, claimQuestReward } = require('../controllers/questController');

// Admin routes
router.post('/', isAuthenticated, authorizeRoles('Admin'), createQuest);
router.get('/all', isAuthenticated, authorizeRoles('Admin'), getAllQuests);
router.delete('/:id', isAuthenticated, authorizeRoles('Admin'), deleteQuest);

// Customer routes
router.get('/my', isAuthenticated, getMyQuests);
router.post('/claim/:questId', isAuthenticated, claimQuestReward);

module.exports = router;
