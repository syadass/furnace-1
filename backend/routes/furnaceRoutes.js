const express = require('express');
const router = express.Router();
const furnaceController = require('../controllers/furnaceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Rute yang sudah ada
router.get('/status', furnaceController.getFurnaceStatus);
router.post('/start-session', furnaceController.startSession);
router.post('/end-session', furnaceController.endSession);

// --- ✨ RUTE INI SUDAH BENAR ---
// Ini akan membuat endpoint: GET /api/furnace/access-logs
router.get('/access-logs', furnaceController.getAllAccessLogs);

// Mengekspor router agar bisa digunakan di file server.js
module.exports = router;