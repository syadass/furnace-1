const express = require('express');
const router = express.Router();
const furnaceController = require('../controllers/furnaceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Menghubungkan metode GET untuk path '/status' ke fungsi getFurnaceStatus di controller.
router.get('/status', furnaceController.getFurnaceStatus);

// Menghubungkan metode POST untuk path '/start-session' ke fungsi startSession di controller.
router.post('/start-session', furnaceController.startSession);

// Menghubungkan metode POST untuk path '/end-session' ke fungsi endSession di controller.
router.post('/end-session', furnaceController.endSession);

// Mengekspor router agar bisa digunakan di file server.js
module.exports = router;