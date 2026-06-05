const Cart = require('../models/Cart');
const Item = require('../models/Item');
const crypto = require('crypto');

exports.createGroupCart = async (req, res) => {
    try {
        const { shopId } = req.body;
        const partyId = crypto.randomUUID().slice(0, 8); // Short random ID for the link
        const newCart = await Cart.create({
            partyId,
            hostId: req.user.id,
            shop: shopId,
            participants: [{ user: req.user.id, status: 'Browsing' }]
        });
        res.status(201).json({ success: true, cart: newCart, partyLink: `/group-cart/${partyId}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.joinGroupCart = async (req, res) => {
    try {
        const { partyId } = req.params;
        const cart = await Cart.findOne({ partyId });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
        if (cart.status !== 'Active') return res.status(400).json({ success: false, message: 'Cart is no longer active' });

        const alreadyJoined = cart.participants.find(p => p.user.toString() === req.user.id);
        if (!alreadyJoined) {
            cart.participants.push({ user: req.user.id, status: 'Browsing' });
            await cart.save();
        }
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addItemToCart = async (req, res) => {
    try {
        const { partyId } = req.params;
        const { itemId, quantity, note } = req.body;
        
        const cart = await Cart.findOne({ partyId });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
        
        const itemDetails = await Item.findById(itemId);
        if (!itemDetails) return res.status(404).json({ success: false, message: 'Item not found' });

        cart.items.push({
            item: itemId,
            addedBy: req.user.id,
            name: itemDetails.name,
            price: itemDetails.price,
            quantity: quantity || 1,
            note
        });

        await cart.save();
        // Here we would typically emit a WebSocket event to update all participants
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.lockCart = async (req, res) => {
    try {
        const { partyId } = req.params;
        const cart = await Cart.findOne({ partyId });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
        
        if (cart.hostId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only host can lock the cart' });
        }

        cart.status = 'Locked';
        await cart.save();
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
