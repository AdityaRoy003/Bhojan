const Event = require('../models/Event');

// --- ADMIN: Create an Event ---
exports.createEvent = async (req, res) => {
    try {
        const event = await Event.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ADMIN: Update an Event ---
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ADMIN: Delete an Event ---
exports.deleteEvent = async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ADMIN: Get All Events ---
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('featuredShops', 'name image city').sort({ startDate: -1 });
        res.json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- PUBLIC: Get Currently Active Events ---
exports.getActiveEvents = async (req, res) => {
    try {
        const now = new Date();
        const events = await Event.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).populate('featuredShops', 'name image city rating');
        res.json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
