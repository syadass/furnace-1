// backend/services/mqttService.js

const mqtt = require('mqtt');
const LogData = require('../models/logModel');
const db = require('../config/db');

// ✅ Buat variabel client di scope atas agar bisa diakses fungsi lain
let client;

const connectAndSubscribe = () => {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `backend_logger_${Math.random().toString(16).slice(2, 10)}`,
  };

  // ✅ Inisialisasi client yang sudah kita deklarasikan di atas
  client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    console.log('✅ Backend terhubung ke MQTT Broker');
    const topic = 'sensor/furnace/#';
    client.subscribe(topic, (err) => {
      if (!err) console.log(`🔌 Berhasil subscribe ke topik (logging): ${topic}`);
      else console.error('❌ Gagal subscribe (logging):', err);
    });
  });

  // Fungsi ini tetap sama, untuk menyimpan data log dari sensor
  client.on('message', (topic, payload) => {
    try {
      const message = JSON.parse(payload.toString());
      const topicParts = topic.split('/');
      
      if (topicParts.length === 3 && topicParts[0] === 'sensor' && topicParts[1] === 'furnace') {
        const furnaceId = topicParts[2];
        const statusQuery = 'SELECT active_userID FROM furnace_status WHERE furnace_id = ? AND is_active = TRUE';
        
        db.query(statusQuery, [furnaceId], (err, results) => {
          if (err) {
            console.error('❌ Gagal memeriksa status furnace:', err);
            return;
          }
          const currentUserID = results.length > 0 ? results[0].active_userID : null;
          const logEntry = {
            userID: currentUserID,
            pressure_value: message.tekanan,
            temperature_value: message.suhu,
            furnace_id: furnaceId
          };
          
          LogData.create(logEntry, (err, result) => {
            if (err) {
              console.error('❌ Gagal menyimpan data log ke database:', err);
            } else {
              console.log(`💾 Data log berhasil disimpan! ID: ${result.insertId}, UserID: ${currentUserID || 'N/A'}`);
            }
          });
        });
      }
    } catch (e) {
      console.error('❌ Gagal mem-parsing payload JSON:', e);
    }
  });

  client.on('error', (err) => console.error('❌ Error koneksi MQTT:', err));
  client.on('close', () => console.log(' MQTT terputus.'));
};

// ✅ Fungsi baru untuk memberikan instance client ke file lain
const getClient = () => {
  if (!client) {
    throw new Error("MQTT client belum terhubung. Pastikan connectAndSubscribe() sudah dipanggil.");
  }
  return client;
};

// ✅ Ekspor kedua fungsi
module.exports = { connectAndSubscribe, getClient };