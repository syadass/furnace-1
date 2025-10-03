const Setpoint = require('../models/setpointModel');
const { getClient } = require('../services/mqttService'); // Import getClient

// Fungsi untuk membuat dan menyimpan setpoint baru
exports.createSetpoint = (req, res) => {
  // 1. Ambil data dari body request yang dikirim frontend
  const { userID, pressure_value, temperature_value, furnace_id } = req.body;

  // 2. Validasi sederhana: pastikan data yang dibutuhkan ada
  if (!userID || pressure_value === undefined || temperature_value === undefined || !furnace_id) {
    return res.status(400).json({ 
      success: false, 
      message: "Data tidak lengkap. Pastikan userID, pressure_value, temperature_value, dan furnace_id terisi." 
    });
  }

  // 3. Panggil fungsi 'create' dari model untuk menyimpan ke DB
  Setpoint.create(userID, pressure_value, temperature_value, (err, result) => {
    if (err) {
      console.error("❌ Gagal menyimpan setpoint ke database:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Terjadi kesalahan pada server saat menyimpan ke database." 
      });
    }

    console.log(`💾 Setpoint berhasil disimpan ke DB. ID: ${result.insertId}`);

    try {
      // 4. Setelah berhasil disimpan, publish setpoint ke MQTT Broker
      const mqttClient = getClient(); // Dapatkan instance client MQTT
      const topic = `setpoint/furnace/${furnace_id}`; // Topic spesifik untuk furnace tertentu
      const payload = JSON.stringify({
        suhu: temperature_value,
        tekanan: pressure_value
      });

      mqttClient.publish(topic, payload, (err) => {
        if (err) {
          console.error("❌ Gagal mempublikasikan setpoint ke MQTT:", err);
          // Meskipun gagal publish, data sudah masuk DB. Kita tetap kirim response sukses ke user.
        } else {
          console.log(`🚀 Setpoint berhasil dipublish ke MQTT. Topic: ${topic}, Payload: ${payload}`);
        }
      });
    } catch (error) {
        console.error("❌ Terjadi error saat mencoba publish MQTT:", error.message);
    }
    
    // 5. Kirim response sukses ke frontend
    res.status(201).json({
      success: true,
      message: 'Setpoint berhasil dibuat, disimpan, dan dikirim ke perangkat.',
      data: {
        id: result.insertId,
        userID,
        pressure_value,
        temperature_value
      }
    });
  });
};

// Fungsi untuk mengambil semua data setpoint (ini sudah ada di rute GET Anda)
exports.getSetpoints = (req, res) => {
  Setpoint.getAll((err, results) => {
    if (err) {
      console.error("❌ Gagal mengambil data setpoint:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Terjadi kesalahan pada server."
      });
    }
    res.status(200).json({ 
      success: true, 
      data: results 
    });
  });
};