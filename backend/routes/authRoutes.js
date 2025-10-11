// file: backend/routes/authRoutes.js

const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // Pastikan Anda punya middleware ini
const router = express.Router();

// Endpoint login yang sudah ada
router.post('/login', authController.login);

// --- TAMBAHKAN ENDPOINT BARU DI BAWAH INI ---

// @route   GET /api/auth/mqtt-credentials
// @desc    Memberikan kredensial MQTT berdasarkan role di JWT
// @access  Private
router.get('/mqtt-credentials', authMiddleware, (req, res) => {
  // authMiddleware akan memvalidasi token dan menaruh payload (id, role) ke req.user
  const userRole = req.user.role;

  let credentials;

  if (userRole === 'operator') {
    credentials = {
      username: process.env.MQTT_OPERATOR_USERNAME,
      password: process.env.MQTT_OPERATOR_PASSWORD,
    };
  } else if (userRole === 'viewer') {
    credentials = {
      username: process.env.MQTT_VIEWER_USERNAME,
      password: process.env.MQTT_VIEWER_PASSWORD,
    };
  } else {
    // Jika ada role lain (misal admin) yang tidak seharusnya mendapat akses MQTT
    return res.status(403).json({ message: 'Role Anda tidak diizinkan untuk akses MQTT.' });
  }

  // Kirim kredensial yang sesuai ke frontend
  res.json(credentials);
});

module.exports = router;