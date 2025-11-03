import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { MQTTService } from '../services/mqttService';

// ====================================================
// 🧠 1. Context Setup
// ====================================================
const MqttContext = createContext(null);

// Timeout sensor (15 detik)
const SENSOR_TIMEOUT_MS = 15000;

// ====================================================
// 🔌 2. Provider Component
// ====================================================
export const MqttProvider = ({ children }) => {
  const [mqttService, setMqttService] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveData, setLiveData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const mqttServiceRef = useRef(null);
  const timeoutRefs = useRef({});

  const furnaceList = ['furnace1', 'furnace2', 'furnace3', 'furnace4'];

  // ====================================================
  // ⏱️ Reset Timer Timeout Sensor
  // ====================================================
  const resetSensorTimeout = (furnaceId, sensorType) => {
    const timeoutKey = `${furnaceId}_${sensorType}`;

    if (timeoutRefs.current[timeoutKey]) {
      clearTimeout(timeoutRefs.current[timeoutKey]);
    }

    timeoutRefs.current[timeoutKey] = setTimeout(() => {
      console.warn(
        `[MQTT Timeout] Tidak ada data ${sensorType} dari ${furnaceId} selama ${SENSOR_TIMEOUT_MS}ms. Reset ke 0.`
      );

      setLiveData(prev => {
        if (!prev[furnaceId]) return prev;

        const resetValue = sensorType === 'tekanan' ? '0.00' : '0.0';
        return {
          ...prev,
          [furnaceId]: {
            ...prev[furnaceId],
            [sensorType]: resetValue,
          },
        };
      });
    }, SENSOR_TIMEOUT_MS);
  };

  // ====================================================
  // 🚀 Inisialisasi MQTT Connection
  // ====================================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token tidak ditemukan. Silakan login.');
      setIsLoading(false);
      return;
    }

    const initializeMqtt = async () => {
      try {
        const decodedToken = jwtDecode(token);

        // Ambil kredensial MQTT dari backend
        const credsRes = await axios.get('http://localhost:5000/api/auth/mqtt-credentials', {
          headers: { 'x-auth-token': token },
        });

        const credentials = credsRes.data;
        const url = import.meta.env.VITE_MQTT_BROKER_URL;
        const options = {
          username: credentials.username,
          password: credentials.password,
          clientId: `webapp_client_${decodedToken.id}_${Math.random().toString(16).slice(2, 10)}`,
        };

        // ====================================================
        // 📡 MQTT Callback Events
        // ====================================================
        const callbacks = {
          onConnect: () => {
            setIsConnected(true);
            if (mqttServiceRef.current) {
              mqttServiceRef.current.subscribe('sensor/furnace/#');
              mqttServiceRef.current.subscribe('setpoint/pv/furnace/#');
              mqttServiceRef.current.subscribe('sensor/pressure/#');
            }
          },

          onClose: () => setIsConnected(false),

          onError: err => setError(`Koneksi MQTT gagal: ${err.message}`),

          onMessage: (topic, payload) => {
            const topicParts = topic.split('/');
            let furnaceId = null;
            let sensorType = null;

            // Deteksi struktur topik
            if (topicParts.length === 3 && topicParts[0] === 'sensor' && topicParts[1] === 'furnace') {
              furnaceId = topicParts[2];
              sensorType = 'suhu';
            } else if (
              topicParts.length === 4 &&
              topicParts[0] === 'setpoint' &&
              topicParts[1] === 'pv' &&
              topicParts[2] === 'furnace'
            ) {
              furnaceId = topicParts[3];
              sensorType = 'setpoint';
            } else if (
              topicParts.length === 3 &&
              topicParts[0] === 'sensor' &&
              topicParts[1] === 'pressure'
            ) {
              furnaceId = topicParts[2];
              sensorType = 'tekanan';
            }

            if (!furnaceId || !furnaceList.includes(furnaceId)) return;

            try {
              const data = JSON.parse(payload.toString());

              // ===============================
              // 🔄 Logika Anti-Kedipan Nilai
              // ===============================
              setLiveData(prev => {
                const currentData = prev[furnaceId] || {
                  suhu: '0.0',
                  tekanan: '0.00',
                  setpoint: '0.0',
                };

                const newData = { ...currentData };

                if (data.suhu !== undefined && data.suhu !== null) {
                  newData.suhu = Number(data.suhu).toFixed(1);
                }
                if (data.tekanan !== undefined && data.tekanan !== null) {
                  newData.tekanan = Number(data.tekanan).toFixed(2);
                }
                if (data.setpoint !== undefined && data.setpoint !== null) {
                  newData.setpoint = Number(data.setpoint).toFixed(1);
                }

                return {
                  ...prev,
                  [furnaceId]: newData,
                };
              });

              // Reset timeout hanya untuk sensor yang baru mengirim data
              if (sensorType) {
                resetSensorTimeout(furnaceId, sensorType);
              }
            } catch (e) {
              console.error(`Gagal parse data JSON dari topik ${topic}`, e);
            }
          },
        };

        // ====================================================
        // 🔗 Hubungkan ke Broker MQTT
        // ====================================================
        const service = new MQTTService(url, options, callbacks);
        service.connect();

        mqttServiceRef.current = service;
        setMqttService(service);
        setIsLoading(false);
      } catch (err) {
        console.error('Gagal inisialisasi koneksi MQTT:', err);
        setError(err.response?.data?.message || 'Gagal menyiapkan koneksi aman.');
        setIsLoading(false);
      }
    };

    initializeMqtt();

    // Cleanup ketika unmount
    return () => {
      if (mqttServiceRef.current) {
        mqttServiceRef.current.disconnect();
      }
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  // ====================================================
  // 🧩 Context Value
  // ====================================================
  const value = {
    mqttService,
    isConnected,
    liveData,
    isLoading,
    error,
    furnaceList,
  };

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

// ====================================================
// 🎣 3. Custom Hook
// ====================================================
export const useMqtt = () => {
  const context = useContext(MqttContext);
  if (context === null) {
    throw new Error('useMqtt must be used within an MqttProvider');
  }
  return context;
};
