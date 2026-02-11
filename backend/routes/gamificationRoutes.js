const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { spinWheel, getChallenges } = require('../controllers/gamificationController');

router.post('/spin-reward', isAuthenticated, spinWheel);
router.get('/challenges', isAuthenticated, getChallenges);

module.exports = router;
