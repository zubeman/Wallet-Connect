const walletController = require('../controllers/walletController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/connect', isAuthenticated, walletController.connect);
router.post('/transfer', isAuthenticated, walletController.transfer);

module.exports = router;
