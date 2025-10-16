import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { MQTTService } from '../services/mqttService';

// 1. Buat Context
const MqttContext = createContext(null);

// 2. Buat Provider Component
export const MqttProvider = ({ children }) => {
    const [mqttService, setMqttService] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [liveData, setLiveData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const furnaceList = ["furnace1", "furnace2", "furnace3"];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Token tidak ditemukan. Silakan login.");
            setIsLoading(false);
            return;
        }

        const initializeMqtt = async () => {
            try {
                const decodedToken = jwtDecode(token);
                
                const credsRes = await axios.get("http://localhost:5000/api/auth/mqtt-credentials", {
                    headers: { 'x-auth-token': token }
                });
                const credentials = credsRes.data;
                const url = import.meta.env.VITE_MQTT_BROKER_URL;
                const options = {
                    username: credentials.username,
                    password: credentials.password,
                    clientId: `webapp_client_${decodedToken.id}_${Math.random().toString(16).slice(2, 10)}`,
                };
                
                const callbacks = {
                    onConnect: () => {
                        setIsConnected(true);
                        // Subscribe ke topic utama setelah terhubung
                        service.subscribe('sensor/furnace/#');
                    },
                    onClose: () => setIsConnected(false),
                    onError: (err) => setError(`Koneksi MQTT Gagal: ${err.message}`),
                    onMessage: (topic, payload) => {
                        const topicParts = topic.split('/');
                        if (topicParts.length === 3 && topicParts[0] === 'sensor' && topicParts[1] === 'furnace') {
                            const furnaceId = topicParts[2];
                            if (furnaceList.includes(furnaceId)) {
                                try {
                                    const data = JSON.parse(payload.toString());
                                    const suhuValue = data.suhu !== undefined ? Number(data.suhu).toFixed(1) : "0.0";
                                    const tekananValue = data.tekanan !== undefined ? Number(data.tekanan).toFixed(2) : "0.00";
                                    setLiveData(prev => ({
                                        ...prev,
                                        [furnaceId]: { suhu: suhuValue, tekanan: tekananValue }
                                    }));
                                } catch (e) {
                                    console.error("Gagal parse data JSON dari MQTT", e);
                                }
                            }
                        }
                    },
                };

                const service = new MQTTService(url, options, callbacks);
                service.connect();
                setMqttService(service);
                setIsLoading(false);

            } catch (err) {
                console.error("Gagal inisialisasi koneksi MQTT:", err);
                setError(err.response?.data?.message || "Gagal menyiapkan koneksi aman.");
                setIsLoading(false);
            }
        };

        initializeMqtt();

        // Cleanup function untuk memutuskan koneksi saat aplikasi ditutup
        return () => {
            if (mqttService) {
                mqttService.disconnect();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Array kosong memastikan ini hanya berjalan sekali

    const value = {
        mqttService,
        isConnected,
        liveData,
        isLoading,
        error,
        furnaceList
    };

    return (
        <MqttContext.Provider value={value}>
            {children}
        </MqttContext.Provider>
    );
};

// 3. Buat custom hook untuk kemudahan akses
export const useMqtt = () => {
    const context = useContext(MqttContext);
    if (context === null) {
        throw new Error('useMqtt must be used within an MqttProvider');
    }
    return context;
};