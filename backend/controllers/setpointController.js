const Setpoint = require("../models/setpointModel");

exports.createSetpoint = (req, res) => {
  const { userID, pressure_value, temperature_value } = req.body;

  if (!userID || !pressure_value || !temperature_value) {
    return res.status(400).json({ message: "Semua field wajib diisi" });
  }

  Setpoint.create(userID, pressure_value, temperature_value, (err, result) => {
    if (err) {
      console.error("❌ Error insert setpoint:", err);
      return res.status(500).json({ message: "Gagal menyimpan data" });
    }
    res.status(201).json({
      message: "Setpoint berhasil disimpan",
      id: result.insertId,
    });
  });
};

exports.getSetpoints = (req, res) => {
  Setpoint.getAll((err, results) => {
    if (err) {
      console.error("❌ Error get setpoints:", err);
      return res.status(500).json({ message: "Gagal mengambil data" });
    }
    res.json(results);
  });
};
