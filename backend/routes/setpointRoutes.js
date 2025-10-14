const express = require("express");
const router = express.Router();
const setpointController = require("../controllers/setpointController");


// POST /api/setpoints
router.post("/", setpointController.createSetpoint);

// GET /api/setpoints
router.get("/", setpointController.getSetpoints);

// hapus data setpoint 1 bulan
router.delete(
    "/cleanup", 
    setpointController.manuallyCleanSetpoints
);

module.exports = router;
