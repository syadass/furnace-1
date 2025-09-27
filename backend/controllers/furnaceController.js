// backend/controllers/furnaceController.js

const db = require('../config/db');
// ✅ Ubah import untuk mengambil fungsi getClient
const { getClient } = require('../services/mqttService');

// GET /api/furnaces/status (Tidak ada perubahan)
exports.getFurnaceStatus = (req, res) => {
  db.query('SELECT * FROM furnace_status', (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
};

// POST /api/furnaces/start-session (Diperbarui dengan perintah MQTT)
exports.startSession = (req, res) => {
  const { furnace_id } = req.body;
  const userID = req.user.id;
  const mqttClient = getClient(); // Dapatkan instance client MQTT

  const checkQuery = 'SELECT * FROM furnace_status WHERE furnace_id = ? AND is_active = TRUE';
  db.query(checkQuery, [furnace_id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Furnace sedang digunakan oleh user lain.' });
    }

    const updateQuery = 'UPDATE furnace_status SET is_active = TRUE, active_userID = ?, session_startTime = NOW() WHERE furnace_id = ?';
    db.query(updateQuery, [userID, furnace_id], (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      
      // 🔥 --- KIRIM PERINTAH MQTT UNTUK MEMULAI SESI --- 🔥
      console.log(`🚀 Mengirim perintah MULAI SESI ke ${furnace_id}`);
      
      const setpointTopic = `setpoint/furnace/${furnace_id}`;
      const controlTopic = `control/furnace/${furnace_id}`;

      // 1. Atur setpoint suhu awal ke 70°C
      mqttClient.publish(setpointTopic, JSON.stringify({ suhu: 70 }), { qos: 1 });
      
      // 2. Atur mode controller ke otomatis (MODE=0)
      mqttClient.publish(controlTopic, JSON.stringify({ mode: "auto" }), { qos: 1 });
      
      res.json({ message: `Sesi untuk ${furnace_id} berhasil dimulai.` });
    });
  });
};

// POST /api/furnaces/end-session (Diperbarui dengan perintah MQTT)
exports.endSession = (req, res) => {
  const { furnace_id } = req.body;
  const userID = req.user.id;
  const mqttClient = getClient(); // Dapatkan instance client MQTT

  const checkQuery = 'SELECT * FROM furnace_status WHERE furnace_id = ? AND active_userID = ?';
  db.query(checkQuery, [furnace_id, userID], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length === 0) {
      return res.status(403).json({ message: 'Anda tidak berhak mengakhiri sesi ini.' });
    }

    const updateQuery = 'UPDATE furnace_status SET is_active = FALSE, active_userID = NULL, session_startTime = NULL WHERE furnace_id = ?';
    db.query(updateQuery, [furnace_id], (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      
      // 🔥 --- KIRIM PERINTAH MQTT UNTUK MENGAKHIRI SESI --- 🔥
      console.log(`🚀 Mengirim perintah AKHIRI SESI ke ${furnace_id}`);
      const controlTopic = `control/furnace/${furnace_id}`;
      
      // 1. Atur mode ke manual (MODE=1)
      mqttClient.publish(controlTopic, JSON.stringify({ mode: "manual" }), { qos: 1 });
      
      // 2. Matikan pemanas (HEAT=0) dengan mengirim perintah power off
      mqttClient.publish(controlTopic, JSON.stringify({ power: "off" }), { qos: 1 });
      
      res.json({ message: `Sesi untuk ${furnace_id} telah berakhir.` });
    });
  });
};