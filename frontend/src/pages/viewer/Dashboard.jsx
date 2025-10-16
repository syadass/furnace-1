import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/viewer/header";
import ScadaStyles from "../../components/viewer/dashboard/ScadaStyles";
import ThermometerVisual from "../../components/viewer/dashboard/ThermometerVisual";
import FurnaceAssembly from "../../components/viewer/dashboard/FurnaceAssembly";
import { useMqtt } from "../../services/mqttContext"; // <-- 1. Import hook useMqtt

const ViewerDashboard = () => {
    // --- State Lokal untuk Halaman Ini ---
    const [user, setUser] = useState(null);
    const [furnaceStatuses, setFurnaceStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true); // Loading untuk otentikasi & status
    const [error, setError] = useState('');

    // --- 2. Ambil State MQTT dari Context ---
    // Semua logika koneksi, liveData, dan isConnected sekarang datang dari sini.
    const { 
        liveData: mqttLiveData, 
        isConnected: isMqttConnected, 
        furnaceList 
    } = useMqtt();

    // --- Efek untuk Otentikasi Viewer ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
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

    // --- Efek untuk Mengambil Status Furnace (Logika Spesifik Halaman) ---
    useEffect(() => {
        if (!user) return; // Hanya jalankan jika user sudah terotentikasi

        const fetchFurnaceStatuses = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get("http://localhost:5000/api/furnaces/status", {
                    headers: { 'x-auth-token': token }
                });
                const statuses = res.data.reduce((acc, current) => {
                    acc[current.furnace_id] = current;
                    return acc;
                }, {});
                setFurnaceStatuses(statuses);
            } catch (err) {
                console.error("Gagal mengambil status furnace:", err);
                setError("Gagal memuat status tungku.");
            } finally {
                setIsLoading(false); // Selesai loading setelah status didapat
            }
        };

        fetchFurnaceStatuses(); // Panggil sekali saat user berubah

        const handleWindowFocus = () => fetchFurnaceStatuses();
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [user]); // Dijalankan setiap kali object 'user' berubah

    // --- Render Logic ---
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-sky-100"><p className="text-xl font-semibold">Memuat dasbor viewer...</p></div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center bg-red-100"><p className="text-xl font-semibold text-red-700">{error}</p></div>;
    }

    // Fallback untuk memastikan liveData punya struktur data default
    const liveData = furnaceList.reduce((acc, furnaceId) => {
        acc[furnaceId] = mqttLiveData[furnaceId] || { suhu: "0.0", tekanan: "0.00" };
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-sky-100 font-sans">
            <ScadaStyles />
            <Header />
            <div className="p-6">
                <div className="flex justify-center items-center gap-4 mb-10">
                    <h1 className="text-3xl font-bold text-gray-800">Monitoring Furnace</h1>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-full shadow-md">
                        <span className={`h-4 w-4 rounded-full ${isMqttConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className="font-semibold">{isMqttConnected ? 'MQTT Connected' : 'MQTT Disconnected'}</span>
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