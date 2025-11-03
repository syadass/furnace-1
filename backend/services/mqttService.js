// ===========================
// 📦 Import Dependencies
// ===========================
const mqtt = require('mqtt');
const LogData = require('../models/logModel');
const db = require('../config/db');

// ===========================
// ⚙️ Variabel Global
// ===========================
let client;
const lastLogTime = {};
const LOG_INTERVAL_MS = 5 * 1000; // interval penyimpanan log per 5 detik
const latestSensorData = {}; // menyimpan data terakhir dari tiap furnace

// ===========================
// 🚀 Fungsi: Koneksi & Subscribe MQTT
// ===========================
const connectAndSubscribe = () => {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `backend_logger_${Math.random().toString(16).slice(2, 10)}`,
  };

  client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    console.log('✅ Backend terhubung ke MQTT Broker');

    // Subscribe ke semua topik yang dibutuhkan
    const topicsToSubscribe = [
      'sensor/furnace/+',
      'setpoint/pv/furnace/+',
      'sensor/pressure/',
    ];

    topicsToSubscribe.forEach(topic => {
      client.subscribe(topic, err => {
        if (!err) {
          console.log(`🔌 Berhasil subscribe ke topik (logging): ${topic}`);
        } else {
          console.error('❌ Gagal subscribe (logging):', err);
        }
      });
    });
  });

  // ===========================
  // 📩 Event: Pesan Masuk
  // ===========================
  client.on('message', (topic, payload) => {
    try {
      const parsedPayload = JSON.parse(payload.toString());
      const now = Date.now();
      const topicParts = topic.split('/');
      let furnaceId;

      // Deteksi ID furnace berdasarkan pola topik
      if (topicParts.length === 3 && topicParts[0] === 'sensor' && topicParts[1] === 'furnace') {
        furnaceId = topicParts[2];
      } else if (
        topicParts.length === 4 &&
        topicParts[0] === 'setpoint' &&
        topicParts[1] === 'pv' &&
        topicParts[2] === 'furnace'
      ) {
        furnaceId = topicParts[3];
      } else if (
        topicParts.length === 3 &&
        topicParts[0] === 'sensor' &&
        topicParts[1] === 'pressure'
      ) {
        furnaceId = topicParts[2];
      }

      if (!furnaceId) return; // abaikan topik yang tidak sesuai

      // Inisialisasi data jika belum ada
      if (!latestSensorData[furnaceId]) {
        latestSensorData[furnaceId] = { suhu: null, tekanan: null, setpoint: null };
      }

      // ===========================
      // 🔄 Update Data Sensor (Anti-null)
      // ===========================
      if (topic.startsWith('sensor/furnace/')) {
        if (parsedPayload.suhu !== undefined && parsedPayload.suhu !== null) {
          latestSensorData[furnaceId].suhu = parsedPayload.suhu;
        }
      } else if (topic.startsWith('setpoint/pv/furnace/')) {
        if (parsedPayload.setpoint !== undefined && parsedPayload.setpoint !== null) {
          latestSensorData[furnaceId].setpoint = parsedPayload.setpoint;
        }
      } else if (topic.startsWith('sensor/pressure/')) {
        if (parsedPayload.tekanan !== undefined && parsedPayload.tekanan !== null) {
          latestSensorData[furnaceId].tekanan = parsedPayload.tekanan;
        }
      }

      // ===========================
      // 💾 Simpan ke Database (Throttled)
      // ===========================
      const lastTime = lastLogTime[furnaceId] || 0;

      if (now - lastTime > LOG_INTERVAL_MS) {
        const dataExists =
          latestSensorData[furnaceId].suhu !== null ||
          latestSensorData[furnaceId].tekanan !== null;

        if (!dataExists) return; // skip jika belum ada data valid

        lastLogTime[furnaceId] = now;
        const currentData = latestSensorData[furnaceId];

        const statusQuery = `
          SELECT 
            fs.active_userID,
            u.nama_lengkap
          FROM 
            furnace_status fs
          JOIN 
            users u ON fs.active_userID = u.userID 
          WHERE 
            fs.furnace_id = ? AND fs.is_active = TRUE
        `;

        db.query(statusQuery, [furnaceId], (err, results) => {
          if (err) {
            console.error('❌ Gagal memeriksa status furnace:', err);
            return;
          }

          if (results.length > 0) {
            const activeSession = results[0];
            const logEntry = {
              userID: activeSession.active_userID,
              nama_lengkap: activeSession.nama_lengkap,
              pressure_value: currentData.tekanan,
              temperature_value: currentData.suhu,
              furnace_id: furnaceId,
            };

            LogData.create(logEntry, (err) => {
              if (err) {
                console.error('❌ Gagal menyimpan data log ke database:', err);
              } else {
                console.log(
                  `💾 Data log disimpan! (Furnace: ${furnaceId}, Operator: ${activeSession.nama_lengkap}) at ${new Date().toLocaleTimeString()}`
                );
              }
            });
          }
        });
      }
    } catch (e) {
      console.error('❌ Gagal mem-parsing payload JSON atau error lain:', e);
    }
  });

  // ===========================
  // ⚠️ Event: Error & Disconnect
  // ===========================
  client.on('error', err => console.error('❌ Error koneksi MQTT:', err));
  client.on('close', () => console.log('⚠️ MQTT terputus.'));
};

// ===========================
// 🔁 Getter Client
// ===========================
const getClient = () => {
  if (!client) {
    throw new Error('MQTT client belum terhubung. Pastikan connectAndSubscribe() sudah dipanggil.');
  }
  return client;
};

// ===========================
// 📤 Ekspor Modul
// ===========================
module.exports = { connectAndSubscribe, getClient };
