const Setpoint = require('../models/setpointModel');
const { getClient } = require('../services/mqttService');

/**
 * Membuat dan menyimpan setpoint baru, lalu mempublikasikannya ke MQTT.
 */
exports.createSetpoint = (req, res) => {
  // 1. Ambil semua data yang diperlukan dari body request
  const { userID, pressure_value, temperature_value, furnace_id } = req.body;

  // 2. Lakukan validasi untuk memastikan tidak ada data yang kosong atau undefined
  if (!userID || pressure_value === undefined || temperature_value === undefined || !furnace_id) {
    return res.status(400).json({ 
      success: false, 
      message: "Data tidak lengkap. Pastikan userID, pressure_value, temperature_value, dan furnace_id terisi." 
    });
  }

  // 3. (Untuk Debugging) Tampilkan data di console sebelum mencoba menyimpannya
  console.log('DEBUG: Data yang akan disimpan ke setpointModel:', { 
      userID, 
      furnace_id, 
      pressure_value, 
      temperature_value 
  });

  // 4. Panggil fungsi create dari model untuk menyimpan data ke database
  Setpoint.create(userID, furnace_id, pressure_value, temperature_value, (err, result) => {
    if (err) {
      console.error("❌ Gagal menyimpan setpoint ke database:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Terjadi kesalahan pada server saat menyimpan ke database." 
      });
    }

    console.log(`💾 Setpoint berhasil disimpan ke DB. ID: ${result.insertId} untuk Furnace: ${furnace_id}`);
    
    // 5. Setelah berhasil disimpan, coba publikasikan ke MQTT
    try {
      const mqttClient = getClient();
      const topic = `setpoint/furnace/${furnace_id}`;
      const payload = JSON.stringify({
        suhu: temperature_value,
        tekanan: pressure_value
      });

      // Publikasikan data dan tangani respons di dalam callback
      mqttClient.publish(topic, payload, { qos: 1 }, (publishErr) => {
        const responseData = { 
          id: result.insertId, 
          userID, 
          furnace_id, 
          pressure_value, 
          temperature_value 
        };

        if (publishErr) {
          console.error("❌ Gagal mempublikasikan setpoint ke MQTT:", publishErr);
          // Kirim respons bahwa data disimpan, TAPI gagal dikirim ke perangkat
          return res.status(201).json({
            success: true,
            message: 'Setpoint berhasil disimpan ke database, TETAPI GAGAL dikirim ke perangkat.',
            warning: 'MQTT publish error',
            data: responseData
          });
        }
        
        console.log(`🚀 Setpoint berhasil dipublish ke MQTT. Topic: ${topic}`);
        // Kirim respons sukses penuh jika semuanya berhasil
        res.status(201).json({
          success: true,
          message: 'Setpoint berhasil dibuat, disimpan, dan dikirim ke perangkat.',
          data: responseData
        });
      });
    } catch (error) {
        console.error("❌ Terjadi error saat mencoba publish MQTT:", error.message);
        // Tangani jika `getClient()` atau proses MQTT lain gagal sebelum publish
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