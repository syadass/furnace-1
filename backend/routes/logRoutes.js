// logroutes.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

// Route download harian
router.get(
  '/download/:furnace_id/:date', 
  authMiddleware,
  logController.downloadCSVByDate
);

// PENAMBAHAN ROUTE BARU: CLEANUP LOGS (OPSIONAL)
router.delete(
    '/cleanup', 
    authMiddleware, // Batasi akses hanya untuk pengguna terotentikasi
    logController.manuallyCleanLogs
);

// Route lain
router.get('/', logController.getAllLogs);
router.get('/user/:userID', logController.getLogsByUser);
router.post('/', logController.createLog);
router.put('/:logID', logController.updateLog);
router.delete('/:logID', logController.deleteLog);

module.exports = router;