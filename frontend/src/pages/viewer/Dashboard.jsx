import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/viewer/header"; 
import { MQTTService } from "../../services/mqttService";

//custom scada
const ScadaStyles = () => (
    <style>{`
        /* Putaran kipas lambat */
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 4s linear infinite;
        }

        /* Efek nyala panas dalam furnace */
        @keyframes fire-glow {
            0% { background: radial-gradient(circle at 50% 80%, rgba(255,90,0,0.5) 0%, rgba(255,40,0,0.25) 40%, transparent 70%); filter: blur(10px); }
            50% { background: radial-gradient(circle at 50% 85%, rgba(255,160,0,0.6) 0%, rgba(255,60,0,0.35) 45%, transparent 75%); filter: blur(15px); }
            100% { background: radial-gradient(circle at 50% 80%, rgba(255,90,0,0.5) 0%, rgba(255,40,0,0.25) 40%, transparent 70%); filter: blur(10px); }
        }
        .animate-fire-glow {
            animation: fire-glow 2.8s ease-in-out infinite;
        }

        /* Efek asap keluar dari atas furnace */
        @keyframes smoke {
            0% { transform: translateY(0) scale(0.8); opacity: 0.4; }
            50% { transform: translateY(-20px) scale(1); opacity: 0.25; }
            100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
        }
        .animate-smoke {
            animation: smoke 3s ease-in-out infinite;
        }
        
        /* Gaya 3D Gauge/Thermometer Casing */
        .gauge-casing-3d {
            box-shadow: 
                inset 0 1px 3px rgba(0,0,0,0.5), /* Inner shadow untuk cekung */
                0 5px 15px rgba(0,0,0,0.3); /* Outer shadow untuk lift */
            background: linear-gradient(145deg, #d1d5db 0%, #e5e7eb 50%, #f3f4f6 100%); /* Gradien metalik */
            transform: translateZ(0); /* Menjamin render 3D */
        }
    `}</style>
);

//thermometer
const ThermometerVisual = ({ value = 0, max = 100 }) => {
    const fillPercentage = Math.max(0, Math.min((value / max) * 100, 100));
    return (
        <div className="relative p-2 rounded-lg gauge-casing-3d" style={{ transform: "perspective(400px) rotateX(5deg)" }}>
            <div className="relative w-12 h-48 bg-gray-50 border-2 border-gray-400 rounded-sm overflow-hidden shadow-inner flex flex-col justify-end">
                <div className="absolute top-0 left-0 w-full h-full flex flex-col-reverse justify-between text-[8px] text-gray-800 font-semibold pr-1 z-10">
                    {[...Array(11)].map((_, i) => (
                        <span key={i} className="text-right tracking-tighter" style={{ lineHeight: '14px' }}>{i * (max / 10)}—</span>
                    ))}
                </div>
                <div className="absolute bottom-0 left-0 w-full bg-red-600 transition-all duration-700 ease-out shadow-lg shadow-red-500/50" style={{ height: `${fillPercentage}%`, background: 'linear-gradient(to top, #ef4444, #b91c1c)' }}></div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-10 h-10 bg-red-700 rounded-full border-2 border-red-900 shadow-xl z-20"></div>
            </div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-yellow-300 text-sm px-3 py-1 rounded-full font-mono shadow-xl border border-yellow-500/50">
                {Number(value).toFixed(1)}°C
            </div>
        </div>
    );
};

//pressure gauge
const PressureGaugeVisual = ({ value = 0, max = 10 }) => {
    const angle = Math.max(-135, Math.min((value / max) * 270 - 135, 135));
    return (
        <div className="relative p-2 rounded-full gauge-casing-3d">
            <div className="w-24 h-24 bg-gray-800 border-4 border-gray-600 rounded-full flex items-center justify-center shadow-inner relative" style={{ background: 'radial-gradient(circle at 50% 50%, #4b5563 0%, #1f2937 100%)', transform: 'translateZ(0)' }}>
                <div className="absolute inset-1.5 bg-gray-100 rounded-full border border-gray-300 shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-135deg)' }}>
                            {[...Array(28)].map((_, i) => (<line key={i} x1="50" y1="5" x2="50" y2={i % 5 === 0 ? "10" : "8"} stroke={i % 5 === 0 ? "#1f2937" : "#4b5563"} strokeWidth={i % 5 === 0 ? "1.5" : "1"} transform={`rotate(${(i / 27) * 270}, 50, 50)`} />))}
                        </svg>
                    </div>
                    <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-1 h-10 bg-red-600 origin-bottom transition-transform duration-500 z-10 rounded-t-full shadow-lg" style={{ transform: `translateX(-50%) rotate(${angle}deg)`, transformOrigin: 'bottom center' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full z-20 border border-white"></div>
                </div>
            </div>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-800 bg-gray-200 px-2 py-1 rounded-md shadow-xl border border-gray-400">
                {Number(value).toFixed(2)} bar
            </span>
        </div>
    );
};

//furnace 
const FurnaceAssembly = ({ furnaceName, pressureValue, pressureMax, isActive = false }) => {
    return (
        <div className="flex flex-col items-center relative pt-12">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                <div className="relative flex flex-col items-center">
                    <div className="w-10 h-8 bg-blue-700 border-2 border-gray-900 rounded-t-md shadow-inner"></div>
                    <div className="w-6 h-10 bg-gray-600 border-x-2 border-gray-900 -mt-2 shadow-inner"></div>
                    <div className="absolute top-[3.75rem]"><PressureGaugeVisual value={pressureValue} max={pressureMax} /></div>
                </div>
            </div>
            <div className="relative w-48 h-64 mt-10 rounded-xl overflow-hidden shadow-2xl" style={{ background: "linear-gradient(145deg, #a0a0a0 10%, #707070 40%, #404040 90%)", border: "4px solid #1f2937", boxShadow: "inset 0 4px 10px rgba(255,255,255,0.2), inset 0 -5px 15px rgba(0,0,0,0.8), 0 15px 30px rgba(0,0,0,0.5)", transform: "perspective(800px) rotateX(8deg) rotateY(0deg) scale(1)" }}>
                <div className="absolute inset-12 rounded-lg overflow-hidden flex items-center justify-center bg-[#101010] shadow-2xl border-4 border-[#333]">
                    {isActive && (
                        <>
                            <div className="absolute inset-0 animate-fire-glow"></div>
                            <div className="absolute inset-2 rounded-md" style={{ background: "radial-gradient(circle at 50% 80%, rgba(255,100,0,0.45) 0%, rgba(255,50,0,0.25) 45%, transparent 75%)", filter: "blur(12px)" }}></div>
                        </>
                    )}
                </div>
                {isActive && (<div className="absolute -top-14 left-1/2 -translate-x-1/2 animate-smoke"><div className="w-16 h-16 bg-gradient-to-t from-transparent via-gray-300/40 to-white/50 blur-lg opacity-50 rounded-full"></div></div>)}
            </div>
            <h2 className="mt-6 text-xl font-extrabold text-gray-900 bg-yellow-400 px-5 py-1.5 rounded-full shadow-lg border-2 border-yellow-600">{furnaceName}</h2>
        </div>
    );
};

//dashboard utama
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
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                setUser(jwtDecode(token)); 
            } catch (error) {
                setError("Sesi Anda tidak valid. Silakan login kembali.");
                setIsLoading(false);
            }
        } else {
            setError("Anda harus login untuk mengakses halaman ini.");
            setIsLoading(false);
        }
    }, []);

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
                    clientId: `viewer_client_${user.id}_${Math.random().toString(16).slice(2, 10)}`,
                };
                const callbacks = {
                    onConnect: () => {
                        setIsConnected(true);
                        mqttServiceRef.current?.subscribe('sensor/furnace/#');
                    },
                    onMessage: (topic, payload) => {
                        const topicParts = topic.split('/');
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

                mqttServiceRef.current = new MQTTService(url, options, callbacks);
                mqttServiceRef.current.connect();
            } catch (err) {
                setError("Gagal terhubung ke sistem monitoring.");
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

        const handleWindowFocus = () => fetchFurnaceStatuses();
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            cleanupMqtt();
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [user]);

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
                        return (
                            <div key={furnace} className="relative p-4" style={{ minWidth: '450px', minHeight: '400px' }}>
                                {/* Fitur "LOCKED" sudah dihapus dari sini */}
                                
                                <div className="flex justify-center items-start gap-8">
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