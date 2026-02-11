const express = require('express');
const { createShop, getAllShops, getShopDetails, getMyShop, searchShops, updateShop, deleteShop, updateShopSettings } = require('../controllers/shopController');
const { addItem, editItem, deleteItem, getShopItems } = require('../controllers/itemController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Public Routes
router.get('/all', getAllShops);
router.get('/search/:query', searchShops); // Moved searchShops import to the top
router.get('/:id', getShopDetails);
router.get('/:shopId/items', getShopItems);

// Protected Routes (Owner)
router.post('/create', isAuthenticated, createShop);
router.get('/my/shop', isAuthenticated, getMyShop);

// Shop CRUD (Owner)
router.put('/:id', isAuthenticated, authorizeRoles('Owner'), updateShop);
router.put('/settings/:id', isAuthenticated, authorizeRoles('Owner'), updateShopSettings);
router.delete('/:id', isAuthenticated, authorizeRoles('Owner'), deleteShop);

// Item CRUD (Owner)
router.post('/item/add', isAuthenticated, authorizeRoles('Owner'), addItem);
router.put('/item/:id', isAuthenticated, authorizeRoles('Owner'), editItem);
router.delete('/item/:id', isAuthenticated, authorizeRoles('Owner'), deleteItem);

module.exports = router;
