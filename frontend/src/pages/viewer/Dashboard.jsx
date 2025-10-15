import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/viewer/Header"; 
import { MQTTService } from "../../services/mqttService";
import ScadaStyles from "../../components/viewer/ScadaStyles"; 
import ThermometerVisual from "../../components/viewer/ThermometerVisual"; 
import FurnaceAssembly from "../../components/viewer/FurnaceAssembly"; 

const ViewerDashboard = () => {
    const [user, setUser] = useState(null);
    const [liveData, setLiveData] = useState({
        furnace1: { suhu: "0.0", tekanan: "0.00" },
        furnace2: { suhu: "0.0", tekanan: "0.00" },
        furnace3: { suhu: "0.0", tekanan: "0.00" },
    });

    const [isConnected, setIsConnected] = useState(false);
    const [furnaceStatuses, setFurnaceStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const mqttServiceRef = useRef(null);
    const furnaceList = ["furnace1", "furnace2", "furnace3"];
    
    // --- Authentication & User Effect ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Dekode token untuk mendapatkan data pengguna
                const decodedToken = jwtDecode(token);
                // Viewer Dashboard harus memastikan bahwa role adalah 'viewer'
                if (decodedToken.role !== 'viewer') {
                    setError("Akses Ditolak: Anda tidak memiliki izin viewer.");
                    setIsLoading(false);
                } else {
                    setUser(decodedToken); 
                }
            } catch (error) {
                setError("Sesi Anda tidak valid. Silakan login kembali.");
                setIsLoading(false);
            }
        } else {
            setError("Anda harus login untuk mengakses halaman ini.");
            setIsLoading(false);
        }
    }, []);

    // --- Fetch Furnace Statuses ---
    const fetchFurnaceStatuses = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get("http://localhost:5000/api/furnaces/status", {
                headers: { 'x-auth-token': token }
            });
            const statuses = res.data.reduce((acc, current) => {
                acc[current.furnace_id] = current;
                return acc;
            }, {});
            setFurnaceStatuses(statuses);
        } catch (err) { console.error("Gagal mengambil status furnace:", err); }
    };

    // --- MQTT & Initialization Effect ---
    useEffect(() => {
        // HANYA inisialisasi jika user sudah didapatkan DAN bukan sedang proses inisialisasi
        if (!user || user.role !== 'viewer' || mqttServiceRef.current) return;

        const initializeDashboard = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Token otentikasi tidak ditemukan.");

                const [credsRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/auth/mqtt-credentials", { 
                        headers: { 'x-auth-token': token } 
                    }),
                    fetchFurnaceStatuses() // Ambil status awal
                ]);
                
                const credentials = credsRes.data;
                const url = import.meta.env.VITE_MQTT_BROKER_URL;
                const options = {
                    username: credentials.username,
                    password: credentials.password,
                    // Pastikan ClientID unik
                    clientId: `viewer_client_${user.id}_${Math.random().toString(16).slice(2, 10)}`,
                };
                
                const callbacks = {
                    onConnect: () => {
                        setIsConnected(true);
                        // Subscribe ke semua data sensor furnace
                        mqttServiceRef.current?.subscribe('sensor/furnace/#');
                    },
                    onMessage: (topic, payload) => {
                        const topicParts = topic.split('/');
                        // Hanya proses topik sensor yang valid
                        if (topicParts.length === 3 && topicParts[0] === 'sensor' && topicParts[1] === 'furnace') {
                            const furnaceId = topicParts[2];
                            if (furnaceList.includes(furnaceId)) {
                                try {
                                    const data = JSON.parse(payload.toString());
                                    const suhuValue = data.suhu !== undefined ? Number(data.suhu).toFixed(1) : "0.0";
                                    const tekananValue = data.tekanan !== undefined ? Number(data.tekanan).toFixed(2) : "0.00";
                                    setLiveData(prev => ({ ...prev, [furnaceId]: { suhu: suhuValue, tekanan: tekananValue } }));
                                } catch (e) { console.error("Gagal parse data JSON dari MQTT", e); }
                            }
                        }
                    },
                    onClose: () => setIsConnected(false),
                };

                // Koneksi MQTT
                mqttServiceRef.current = new MQTTService(url, options, callbacks);
                mqttServiceRef.current.connect();

            } catch (err) {
                console.error("Gagal inisialisasi koneksi:", err);
                setError("Gagal terhubung ke sistem monitoring. Coba lagi nanti.");
            } finally {
                setIsLoading(false);
            }
        };

        initializeDashboard();

        const cleanupMqtt = () => {
            if (mqttServiceRef.current) {
                mqttServiceRef.current.disconnect();
                mqttServiceRef.current = null;
            }
        };

        // Refresh status furnace saat window kembali fokus
        const handleWindowFocus = () => fetchFurnaceStatuses();
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            cleanupMqtt();
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [user]);

    // --- Render Logic ---

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-sky-100"><p className="text-xl font-semibold">Menyiapkan koneksi aman...</p></div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center bg-red-100"><p className="text-xl font-semibold text-red-700">{error}</p></div>;
    }
    
    return (
        <div className="min-h-screen bg-sky-100 font-sans">
            <ScadaStyles />
            <Header />
            <div className="p-6">
                <div className="flex justify-center items-center gap-4 mb-10">
                    <h1 className="text-3xl font-bold text-gray-800">Monitoring Furnace</h1>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-full shadow-md">
                        <span className={`h-4 w-4 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className="font-semibold">{isConnected ? 'MQTT Connected' : 'MQTT Disconnected'}</span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center items-start gap-16">
                    {furnaceList.map((furnace, index) => {
                        const status = furnaceStatuses[furnace];
                        const activeUser = status?.is_active ? status?.active_username || `User ${status.active_userID}` : null;

                        return (
                            <div key={furnace} className="relative p-4" style={{ minWidth: '350px', minHeight: '400px' }}>
                                
                                {activeUser && (
                                    <div className="absolute top-2 right-2 flex items-center justify-center z-30">
                                        <p className="text-sm font-bold p-2 bg-yellow-600 text-white rounded-lg shadow-xl border border-yellow-400">
                                            ACTIVE: {activeUser}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-center items-center gap-8">
                                    <div className="relative z-10 pt-16">
                                        <ThermometerVisual value={liveData[furnace].suhu} max={100} />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <FurnaceAssembly 
                                            furnaceName={`Furnace ${index + 1}`}
                                            pressureValue={liveData[furnace].tekanan}
                                            pressureMax={10}
                                            isActive={status?.is_active}
                                        />
                                        {/* Hilangkan input setpoint dan tombol Start/Stop */}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ViewerDashboard;