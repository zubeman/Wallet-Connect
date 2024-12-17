const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Changed from walletController to authController
const { isAuthenticated, verifyToken } = require('../middleware/authMiddleware');

// Assuming the transfer functionality has been merged into authController
router.get('/connect', isAuthenticated, authController.connect); 
router.post('/transfer', isAuthenticated, verifyToken, authController.transfer);

module.exports = router;
