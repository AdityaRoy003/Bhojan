const Shop = require('../models/Shop');
const Item = require('../models/Item');
const Order = require('../models/Order');

// Create virtual brand under parent kitchen
exports.createVirtualBrand = async (req, res) => {
    try {
        const { name, description, logo, cuisineType, parentKitchenId } = req.body;

        // Verify parent kitchen ownership
        const parentKitchen = await Shop.findById(parentKitchenId);
        if (!parentKitchen || parentKitchen.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const virtualBrand = new Shop({
            name,
            description,
            logo,
            cuisineType,
            owner: req.user.id,
            isVirtualBrand: true,
            parentKitchen: parentKitchenId,
            // Inherit location from parent
            city: parentKitchen.city,
            state: parentKitchen.state,
            address: parentKitchen.address,
            location: parentKitchen.location
        });

        await virtualBrand.save();
        res.status(201).json({ success: true, virtualBrand });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all virtual brands for a kitchen
exports.getVirtualBrands = async (req, res) => {
    try {
        const { kitchenId } = req.params;
        const virtualBrands = await Shop.find({
            parentKitchen: kitchenId,
            isVirtualBrand: true
        });
        res.status(200).json({ success: true, virtualBrands });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create packaged goods item
exports.createPackagedGood = async (req, res) => {
    try {
        const { name, description, price, category, image, shopId, shelfLife, packaging } = req.body;

        const item = new Item({
            name,
            description,
            price,
            category: category || 'Packaged Goods',
            image,
            shop: shopId,
            foodType: 'Packaged',
            metadata: {
                shelfLife, // e.g., "6 months"
                packaging, // e.g., "Vacuum sealed"
                isPackagedGood: true
            }
        });

        await item.save();
        res.status(201).json({ success: true, item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create festival pop-up
exports.createFestivalPopup = async (req, res) => {
    try {
        const { name, description, festivalName, startDate, endDate, location } = req.body;

        const popup = new Shop({
            name,
            description,
            owner: req.user.id,
            ...location,
            isFestivalPopup: true,
            festivalMeta: {
                festivalName, // e.g., "Chhath Puja Special"
                startDate,
                endDate,
                isActive: new Date() >= new Date(startDate) && new Date() <= new Date(endDate)
            }
        });

        await popup.save();
        res.status(201).json({ success: true, popup });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
