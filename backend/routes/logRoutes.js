const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

router.get(
    '/sessions/:furnace_id/:date',
    authMiddleware,
    logController.getSessionsByDateAndFurnace
);
router.get(
    '/download/:session_id',
    authMiddleware,
    logController.downloadCSVBySession
);
router.get(
    '/data/:session_id',
    authMiddleware,
    logController.getChartDataBySession
);
router.delete('/cleanup', authMiddleware, logController.manuallyCleanLogs);
router.get('/', logController.getAllLogs);
router.get('/user/:userID', logController.getLogsByUser);
router.post('/', logController.createLog);
router.put('/:logID', logController.updateLog);
router.delete('/:logID', logController.deleteLog);

module.exports = router;