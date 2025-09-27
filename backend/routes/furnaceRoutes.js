const express = require('express');
const router = express.Router();
// Mengimpor controller yang berisi logika untuk setiap rute
const furnaceController = require('../controllers/furnaceController');
// Mengimpor middleware untuk memeriksa autentikasi (token)
const authMiddleware = require('../middleware/authMiddleware');

// ✅ Menerapkan middleware ke SEMUA rute di bawahnya.
// Ini adalah cara yang efisien untuk melindungi semua endpoint furnace.
// Setiap permintaan ke /status, /start-session, dll., akan dicek tokennya terlebih dahulu.
router.use(authMiddleware);

// ✅ Menghubungkan metode GET untuk path '/status' ke fungsi getFurnaceStatus di controller.
router.get('/status', furnaceController.getFurnaceStatus);

// ✅ Menghubungkan metode POST untuk path '/start-session' ke fungsi startSession di controller.
router.post('/start-session', furnaceController.startSession);

// ✅ Menghubungkan metode POST untuk path '/end-session' ke fungsi endSession di controller.
router.post('/end-session', furnaceController.endSession);

// ✅ Mengekspor router agar bisa digunakan di file server.js
module.exports = router;