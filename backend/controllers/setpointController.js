const Setpoint = require('../models/setpointModel');
const { getClient } = require('../services/mqttService');

/**
 * Membuat dan menyimpan setpoint baru dengan nilai suhu default, lalu mempublikasikannya ke MQTT.
 */
exports.createSetpoint = (req, res) => {
  // 1. Ambil data dari body request.
  const { userID, furnace_id, temperature_value } = req.body; // Terima juga temperature_value dari frontend
  
  // 2. Lakukan validasi data.
  if (!userID || !furnace_id || temperature_value === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: "Data tidak lengkap. Pastikan userID, furnace_id, dan temperature_value terisi." 
    });
  }

  // 3. Siapkan data sebagai satu objek untuk disimpan. 'pressure_value' telah dihapus.
  const setpointData = {
    userID,
    furnace_id,
    temperature_value, // Gunakan nilai suhu dari frontend
  };

  // 4. Panggil fungsi create dari model dengan SATU objek data.
  Setpoint.create(setpointData, (err, result) => {
    if (err) {
      console.error("❌ Gagal menyimpan setpoint ke database:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Terjadi kesalahan pada server saat menyimpan ke database." 
      });
    }

    console.log(`💾 Setpoint berhasil disimpan ke DB. ID: ${result.insertId}`);
    
    // 5. Setelah berhasil disimpan, publikasikan ke MQTT.
    try {
      const mqttClient = getClient();
      const topic = `setpoint/furnace/${furnace_id}`;
      
      const payload = JSON.stringify({
        suhu: temperature_value // Kirim suhu yang diterima dari frontend
      });

      mqttClient.publish(topic, payload, { qos: 1 }, (publishErr) => {
        const responseData = { 
          id: result.insertId, 
          ...setpointData
        };

        if (publishErr) {
          console.error("❌ Gagal mempublikasikan setpoint ke MQTT:", publishErr);
          return res.status(201).json({
            success: true,
            message: 'Setpoint berhasil disimpan, TETAPI GAGAL dikirim ke perangkat.',
            warning: 'MQTT publish error',
            data: responseData
          });
        }
        
        console.log(`🚀 Setpoint berhasil dipublish ke MQTT. Topic: ${topic}`);
        res.status(201).json({
          success: true,
          message: 'Setpoint berhasil dibuat, disimpan, dan dikirim ke perangkat.',
          data: responseData
        });
      });
    } catch (error) {
        console.error("❌ Terjadi error saat mencoba publish MQTT:", error.message);
        return res.status(500).json({
          success: false,
          message: "Setpoint disimpan, tetapi terjadi kesalahan internal pada layanan MQTT."
        });
    }
  });
};

/**
 * Mengambil semua data setpoint dari database.
 */
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