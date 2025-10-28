import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/operator/header";
import { useMqtt } from "../../services/mqttContext";
import ScadaStyles from "../../components/operator/dashboard/scadaStyle";
import FurnaceCard from "../../components/operator/dashboard/furnaceCard";

const Dashboard = () => {
    // isMqttLoading sekarang HANYA akan dipakai untuk menampilkan error,
    // tapi tidak lagi untuk menampilkan layar loading.
    const { mqttService, isConnected, liveData, isLoading: isMqttLoading, error: mqttError, furnaceList } = useMqtt();
    const [user, setUser] = useState(null);
    const [setpoints, setSetpoints] = useState({});
    const [furnaceStatuses, setFurnaceStatuses] = useState({});
    
    // State ini sudah benar (false)
    const [isStatusLoading, setIsStatusLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser(decodedToken);
            } catch (error) {
                console.error("Gagal decode token:", error);
            }
        }
    }, []);

    // useEffect untuk setpoints (Sudah benar)
    useEffect(() => {
        if (furnaceList && furnaceList.length > 0) {
            const initialSetpoints = furnaceList.reduce((acc, furnaceId) => {
                if (!acc[furnaceId]) {
                    acc[furnaceId] = { suhu: "" };
                }
                return acc;
            }, { ...setpoints }); 
            setSetpoints(initialSetpoints);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [furnaceList]); 

    // fetchFurnaceStatuses (Sudah benar, 'silent refresh')
    const fetchFurnaceStatuses = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("Token tidak ditemukan.");
                return;
            }
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
        } 
    };

    // useEffect ini akan memanggil silent refresh saat komponen me-mount
    useEffect(() => {
        fetchFurnaceStatuses();
    }, []);

    // handleStartSession (Sudah benar, 'silent refresh')
    const handleStartSession = async (furnace) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post("http://localhost:5000/api/furnaces/start-session",
                { furnace_id: furnace }, { headers: { 'x-auth-token': token } });
            alert(`Sesi untuk ${furnace} berhasil dimulai!`);
            fetchFurnaceStatuses(); 
        } catch (err) {
            alert(err.response?.data?.message || "Terjadi kesalahan.");
        }
    };

    // handleEndSession (Sudah benar, 'silent refresh')
    const handleEndSession = async (furnace) => {
        if (window.confirm(`Apakah Anda yakin ingin mengakhiri sesi pada ${furnace}?`)) {
            try {
                const token = localStorage.getItem('token');
                await axios.post("http://localhost:5000/api/furnaces/end-session",
                    { furnace_id: furnace }, { headers: { 'x-auth-token': token } });
                alert(`Sesi untuk ${furnace} telah diakhiri.`);
                fetchFurnaceStatuses();
            } catch (err) {
                alert(err.response?.data?.message || "Terjadi kesalahan.");
            }
        }
    };

    // ... (handleChange & handleSubmit tidak diubah) ...
    const handleChange = (furnace, field, value) => {
        setSetpoints((prev) => ({
            ...prev, 
            [furnace]: { ...(prev[furnace] || {}), [field]: value }
        }));
    };

    const handleSubmit = async (furnace) => {
        if (!user) {
            alert("Sesi pengguna tidak valid. Silakan login kembali.");
            return;
        }
        try {
            const furnaceSetpoint = setpoints[furnace] || { suhu: "" };
            const { suhu } = furnaceSetpoint;
            
            if (suhu === "" || isNaN(suhu)) {
                alert("Setpoint suhu harus berupa angka dan tidak boleh kosong!");
                return;
            }
            const token = localStorage.getItem('token');
            const topic = `setpoint/furnace/${furnace}`;
            const payload = JSON.stringify({ suhu: Number(suhu) });
            mqttService?.publish(topic, payload);
            await axios.post("http://localhost:5000/api/setpoints", {
                userID: user.id,
                temperature_value: Number(suhu),
                furnace_id: furnace,
            }, {
                headers: { 'x-auth-token': token }
            });
            alert(`✅ Setpoint untuk ${furnace} berhasil dikirim dan disimpan!`);
        } catch (err) {
            console.error("Gagal mengirim atau menyimpan setpoint:", err);
            alert("Gagal mengirim atau menyimpan setpoint!");
        }
    };

    // =================================================================
    // == PERUBAHAN DI SINI: Blok 'if (isMqttLoading)' DIHAPUS
    // =================================================================
    /*
    // BLOK INI DIHAPUS:
    if (isMqttLoading) {
        return <div className="min-h-screen ...">Menyiapkan koneksi dan data...</div>;
    }
    */

    // Kita hanya menyisakan pengecekan 'error'
    if (mqttError) {
        return <div className="min-h-screen flex items-center justify-center bg-red-100"><p className="text-xl font-semibold text-red-700">{mqttError}</p></div>;
    }

    // Halaman akan langsung me-render JSX di bawah ini
    return (
        <div className="min-h-screen bg-sky-100 font-sans">
            <ScadaStyles />
            <Header />
            <div className="p-6">
                <div className="flex justify-center items-center gap-4 mb-10">
                    <h1 className="text-3xl font-bold text-gray-800">Monitoring & Kontrol Furnace</h1>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-full shadow-md">
                        {/* Indikator ini akan 'false' (merah) saat awal, lalu 'true' (hijau) saat connect */}
                        <span className={`h-4 w-4 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className="font-semibold">{isConnected ? 'MQTT Connected' : 'MQTT Disconnected'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 justify-items-center max-w-max mx-auto">
                    {furnaceList.map((furnace, index) => {
                        // 'currentData' akan default ke 0.0 saat awal
                        const currentData = liveData[furnace] || { suhu: "0.0", tekanan: "0.00" };
                        return (
                            <FurnaceCard
                                key={furnace}
                                furnace={furnace}
                                index={index}
                                status={furnaceStatuses[furnace]}
                                user={user}
                                currentData={currentData}
                                setpoints={setpoints}
                                onStartSession={handleStartSession}
                                onEndSession={handleEndSession}
                                onSetpointChange={handleChange}
                                onSetpointSubmit={handleSubmit}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;