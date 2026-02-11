const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
    createVirtualBrand,
    getVirtualBrands,
    createPackagedGood,
    createFestivalPopup
} = require('../controllers/cloudKitchenController');

router.post('/virtual-brand', isAuthenticated, createVirtualBrand);
router.get('/virtual-brands/:kitchenId', getVirtualBrands);
router.post('/packaged-good', isAuthenticated, createPackagedGood);
router.post('/festival-popup', isAuthenticated, createFestivalPopup);

module.exports = router;
