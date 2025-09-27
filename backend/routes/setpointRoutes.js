const express = require("express");
const router = express.Router();
const setpointController = require("../controllers/setpointController");

// POST /api/setpoints
router.post("/", setpointController.createSetpoint);

// GET /api/setpoints
router.get("/", setpointController.getSetpoints);

module.exports = router;
