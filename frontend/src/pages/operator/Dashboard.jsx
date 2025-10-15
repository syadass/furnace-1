import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/operator/Header"; 
import { MQTTService } from "../../services/mqttService";
import ScadaStyles from "../../components/operator/ScadaStyles";
import ThermometerVisual from "../../components/operator/ThermometerVisual";
import FurnaceAssembly from "../../components/operator/FurnaceAssembly";


const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [setpoints, setSetpoints] = useState({
        furnace1: { suhu: "" },
        furnace2: { suhu: "" },
        furnace3: { suhu: "" },
    });

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
                const decodedToken = jwtDecode(token);
                setUser(decodedToken); 
            } catch (error) {
                console.error("GAGAL DECODE TOKEN:", error);
                setError("Sesi Anda tidak valid. Silakan login kembali.");
                setIsLoading(false);
            }
        } else {
            console.log("Token tidak ditemukan di Local Storage.");
            setError("Anda harus login untuk mengakses halaman ini.");
            setIsLoading(false);
        }
    }, []);

    // --- Fetch Furnace Statuses ---
    const fetchFurnaceStatuses = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) { console.error("Token tidak ditemukan."); return; }
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
        if (!user || mqttServiceRef.current) return;

        const initializeDashboard = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Token otentikasi tidak ditemukan.");
                const [credsRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/auth/mqtt-credentials", { 
                        headers: { 'x-auth-token': token } 
                    }),
                    fetchFurnaceStatuses() 
                ]);
                
                const credentials = credsRes.data;

                const url = import.meta.env.VITE_MQTT_BROKER_URL;
                const options = {
                    username: credentials.username,
                    password: credentials.password,
                    clientId: `dashboard_client_${user.id}_${Math.random().toString(16).slice(2, 10)}`,
                };

                const callbacks = {
                    onConnect: () => {
                        setIsConnected(true);
                        // Subscribe ke semua data sensor furnace
                        mqttServiceRef.current?.subscribe('sensor/furnace/#'); 
                    },
                    onMessage: (topic, payload) => {
                        const topicParts = topic.split('/');
                        if (topicParts[0] === 'sensor' && topicParts[1] === 'furnace') {
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

                // koneksi MQTT
                mqttServiceRef.current = new MQTTService(url, options, callbacks);
                mqttServiceRef.current.connect();

            } catch (err) {
                console.error("Gagal inisialisasi koneksi:", err);
                setError(err.response?.data?.message || "Gagal terhubung ke sistem monitoring.");
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

        const handleWindowFocus = () => {
            console.log("Window kembali fokus, merefresh status furnace...");
            fetchFurnaceStatuses();
        };
        
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            cleanupMqtt();
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [user]);

    // --- Control Handlers ---

    const handleStartSession = async (furnace) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post("http://localhost:5000/api/furnaces/start-session", 
                { furnace_id: furnace }, { headers: { 'x-auth-token': token } });
            alert(`Sesi untuk ${furnace} berhasil dimulai!`);
            fetchFurnaceStatuses();
        } catch (err) { alert(err.response?.data?.message || "Terjadi kesalahan."); }
    };
    
    const handleEndSession = async (furnace) => {
        if (confirm(`Apakah Anda yakin ingin mengakhiri sesi pada ${furnace}?`)) {
            try {
                const token = localStorage.getItem('token');
                await axios.post("http://localhost:5000/api/furnaces/end-session", 
                    { furnace_id: furnace }, { headers: { 'x-auth-token': token } });
                alert(`Sesi untuk ${furnace} telah diakhiri.`);
                fetchFurnaceStatuses();
            } catch (err) { alert(err.response?.data?.message || "Terjadi kesalahan."); }
        }
    };

    const handleChange = (furnace, field, value) => {
        setSetpoints((prev) => ({
            ...prev, [furnace]: { ...prev[furnace], [field]: value }
        }));
    };

    const handleSubmit = async (furnace) => {
        if (!user) {
            alert("Sesi pengguna tidak valid. Silakan login kembali.");
            return;
        }
        try {
            const { suhu } = setpoints[furnace];
            if (suhu === "") { alert("Setpoint suhu tidak boleh kosong!"); return; } 
            
            const topic = `setpoint/furnace/${furnace}`;
            const payload = JSON.stringify({ suhu: Number(suhu) }); 
            mqttServiceRef.current?.publish(topic, payload);
            
            // Mengirim data ke backend
            await axios.post("http://localhost:5000/api/setpoints", {
                userID: user.id, 
                temperature_value: suhu,
                furnace_id: furnace,
            });
            
            alert(`✅ Setpoint untuk ${furnace} berhasil dikirim!`);
            window.location.reload(); 

        } catch (err) { 
            alert("Gagal mengirim setpoint!"); 
        }
    };

    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-sky-100">
                <p className="text-xl font-semibold">Menyiapkan koneksi aman...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-100">
                <p className="text-xl font-semibold text-red-700">{error}</p>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-sky-100 font-sans">
            <ScadaStyles />
            <Header />
            <div className="p-6">
                <div className="flex justify-center items-center gap-4 mb-10">
                    <h1 className="text-3xl font-bold text-gray-800">Monitoring & Kontrol Furnace</h1>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-full shadow-md">
                        <span className={`h-4 w-4 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className="font-semibold">{isConnected ? 'MQTT Connected' : 'MQTT Disconnected'}</span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center items-start gap-16">
                    {furnaceList.map((furnace, index) => {
                        const status = furnaceStatuses[furnace];
                        const isLockedByMe = status?.is_active && status?.active_userID === user.id;
                        const isLockedByOther = status?.is_active && status?.active_userID !== user.id;
                        const isViewer = user.role === 'viewer';
                        
                        return (
                            <div 
                                key={furnace} 
                                className={`relative p-4 ${isLockedByOther ? 'grayscale-locked' : ''}`}
                                style={{ minWidth: '450px', minHeight: '400px' }} 
                            >
                                {isLockedByOther && (
                                    <div className="absolute top-2 right-2 flex items-center justify-center z-30">
                                        <p className="text-sm font-bold p-2 bg-gray-700 text-white rounded-lg shadow-xl border border-gray-500">
                                            LOCKED: User {status.active_userID}
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-center items-start gap-8">
                                    <div className="relative z-10 pt-16">
                                        {/* Menggunakan ThermometerVisual */}
                                        <ThermometerVisual value={liveData[furnace].suhu} max={100} />
                                    </div>
                                    <div className="flex flex-col items-center gap-4 pt-16 z-10">
                                        {/* Tombol START (ON) */}
                                        <button
                                            onClick={() => handleStartSession(furnace)}
                                            disabled={status?.is_active || isLockedByOther || isViewer} 
                                            className={`
                                                w-12 h-12 rounded-full text-white text-lg font-bold 
                                                ${status?.is_active || isLockedByOther || isViewer ? 'bg-gray-400 border-gray-600' : 'bg-green-400'} 
                                                shadow-[inset_0_4px_6px_rgba(255,255,255,0.6),0_4px_6px_rgba(0,0,0,0.4)]
                                                border-4 ${status?.is_active || isLockedByOther || isViewer ? 'border-gray-600' : 'border-white'}
                                                transition-all transform active:translate-y-1 active:shadow-[inset_0_2px_3px_rgba(255,255,255,0.5),0_2px_3px_rgba(0,0,0,0.3)]
                                                hover:brightness-110
                                            `}
                                            style={{
                                                background: status?.is_active || isLockedByOther || isViewer
                                                    ? '' 
                                                    : 'radial-gradient(circle at 30% 30%, #a6f600, #22c700 70%)'
                                            }}
                                        >
                                            <span className="material-icons text-xl">ON</span>
                                        </button>

                                        {/* Tombol STOP (OFF) */}
                                        <button
                                            onClick={() => handleEndSession(furnace)}
                                            disabled={!isLockedByMe || isLockedByOther || isViewer} 
                                            className={`
                                                w-12 h-12 rounded-full text-white text-lg font-bold 
                                                ${!isLockedByMe || isLockedByOther || isViewer ? 'bg-gray-400 border-gray-600' : 'bg-red-500'} 
                                                shadow-[inset_0_4px_6px_rgba(255,255,255,0.6),0_4px_6px_rgba(0,0,0,0.4)]
                                                border-4 ${!isLockedByMe || isLockedByOther || isViewer ? 'border-gray-600' : 'border-white'}
                                                transition-all transform active:translate-y-1 active:shadow-[inset_0_2px_3px_rgba(255,255,255,0.5),0_2px_3px_rgba(0,0,0,0.3)]
                                                hover:brightness-110
                                            `}
                                            style={{
                                                background: !isLockedByMe || isLockedByOther || isViewer
                                                    ? ''
                                                    : 'radial-gradient(circle at 30% 30%, #ff6b6b, #c70000 70%)'
                                            }}
                                        >
                                            <span className="material-icons text-xl">OFF</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        {/* Menggunakan FurnaceAssembly */}
                                        <FurnaceAssembly 
                                            furnaceName={`Furnace ${index + 1}`}
                                            pressureValue={liveData[furnace].tekanan}
                                            pressureMax={10}
                                            isActive={status?.is_active}
                                        />
                                        <div className="bg-gray-100 p-4 rounded-lg shadow-inner w-56 mt-4 border border-gray-300"> 
                                            <p className={`font-bold text-center text-lg mb-2 ${isLockedByMe ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>Setpoint</p>
                                            <div className="flex flex-col gap-2">
                                                <input 
                                                    type="number" 
                                                    placeholder="Suhu (°C)" 
                                                    value={setpoints[furnace].suhu} 
                                                    onChange={(e) => handleChange(furnace, "suhu", e.target.value)} 
                                                    className="border border-gray-400 rounded-md p-2 text-center disabled:bg-gray-200 disabled:cursor-not-allowed text-sm" 
                                                    disabled={!isLockedByMe || isLockedByOther || isViewer} 
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleSubmit(furnace)} 
                                                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm" 
                                                disabled={!isLockedByMe || isLockedByOther || isViewer}
                                            >
                                                Kirim
                                            </button>
                                        </div>
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

export default Dashboard;