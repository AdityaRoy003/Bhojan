const Item = require('../models/Item');
const Shop = require('../models/Shop');

// Add Item
exports.addItem = async (req, res) => {
    try {
        const { name, image, category, price, foodType, shopId, description, dietaryTags, spiceLevel } = req.body;

        // Verify ownership
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }
        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to add items to this shop' });
        }

        const item = await Item.create({
            name,
            description,
            image,
            shop: shopId,
            category,
            price,
            foodType,
            dietaryTags: dietaryTags || [],
            spiceLevel: spiceLevel || 'Medium'
        });

        // Add item to shop's item list
        shop.items.push(item._id);
        await shop.save();

        res.status(201).json({ success: true, item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Edit Item
exports.editItem = async (req, res) => {
    try {
        let item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Verify ownership via shop
        const shop = await Shop.findById(item.shop);
        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this item' });
        }

        item = await Item.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Item
exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        const shop = await Shop.findById(item.shop);
        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
        }

        await item.deleteOne();

        // Remove from shop items array
        shop.items = shop.items.filter(i => i.toString() !== req.params.id);
        await shop.save();

        res.status(200).json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Items by Shop
exports.getShopItems = async (req, res) => {
    try {
        const items = await Item.find({ shop: req.params.shopId });
        res.status(200).json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
