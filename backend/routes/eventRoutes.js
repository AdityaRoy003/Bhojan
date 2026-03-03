const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth');
const { createEvent, updateEvent, deleteEvent, getAllEvents, getActiveEvents } = require('../controllers/eventController');

// Public
router.get('/active', getActiveEvents);

// Admin
router.post('/', isAuthenticated, authorizeRoles('Admin'), createEvent);
router.get('/all', isAuthenticated, authorizeRoles('Admin'), getAllEvents);
router.put('/:id', isAuthenticated, authorizeRoles('Admin'), updateEvent);
router.delete('/:id', isAuthenticated, authorizeRoles('Admin'), deleteEvent);

module.exports = router;
