// backend/services/mqttService.js

const mqtt = require('mqtt');
const LogData = require('../models/logModel');
const db = require('../config/db');

let client;
// Objek untuk melacak waktu log terakhir per furnace (untuk throttling)
const lastLogTime = {};

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
    const topic = 'sensor/furnace/#';
    client.subscribe(topic, (err) => {
      if (!err) console.log(`🔌 Berhasil subscribe ke topik (logging): ${topic}`);
      else console.error('❌ Gagal subscribe (logging):', err);
    });
  });

  client.on('message', (topic, payload) => {
    try {
      const message = JSON.parse(payload.toString());
      const topicParts = topic.split('/');
      
      if (topicParts.length === 3 && topicParts[0] === 'sensor' && topicParts[1] === 'furnace') {
        const furnaceId = topicParts[2];
        
        const now = Date.now();
        const lastTime = lastLogTime[furnaceId] || 0;

        if (now - lastTime > 1000) {
          lastLogTime[furnaceId] = now;

          // Query sudah diperbaiki dari u.id menjadi u.userID
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
                pressure_value: message.tekanan,
                temperature_value: message.suhu,
                furnace_id: furnaceId
              };
              
              LogData.create(logEntry, (err, result) => {
                if (err) {
                  console.error('❌ Gagal menyimpan data log ke database:', err);
                } else {
                  console.log(`💾 Data log disimpan! (Furnace: ${furnaceId}, Operator: ${activeSession.nama_lengkap})`);
                }
              });
            } else {
              console.log(`- Data dari furnace ${furnaceId} diabaikan (tidak ada sesi aktif).`);
            }
          });
        }
      }
    } catch (e) {
      console.error('❌ Gagal mem-parsing payload JSON:', e);
    }
  });

  client.on('error', (err) => console.error('❌ Error koneksi MQTT:', err));
  client.on('close', () => console.log(' MQTT terputus.'));
};

const getClient = () => {
  if (!client) {
    throw new Error("MQTT client belum terhubung. Pastikan connectAndSubscribe() sudah dipanggil.");
  }
  return client;
};

module.exports = { connectAndSubscribe, getClient };