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

// Route lain
router.get('/', logController.getAllLogs);
router.get('/user/:userID', logController.getLogsByUser);
router.post('/', logController.createLog);
router.put('/:logID', logController.updateLog);
router.delete('/:logID', logController.deleteLog);

module.exports = router;