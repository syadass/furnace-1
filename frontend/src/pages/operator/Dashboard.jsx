lama
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Pastikan sudah diinstal
import Header from "../../components/operator/header";
import { MQTTService } from "../../services/mqttService";

// ====================================================================
// == 🎨 KOMPONEN-KOMPONEN VISUAL BARU DENGAN GAYA SCADA              ==
// ====================================================================

const ScadaStyles = () => (
  <style>{`
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-slow 4s linear infinite;
    }
    @keyframes heat-glow {
      0%, 100% { box-shadow: 0 0 15px 5px rgba(239, 68, 68, 0.7); }
      50% { box-shadow: 0 0 25px 10px rgba(239, 68, 68, 0.5); }
    }
    .animate-heat-glow {
      animation: heat-glow 3s ease-in-out infinite;
    }
  `}</style>
);

const ThermometerVisual = ({ value = 0, max = 100 }) => {
  const fillPercentage = Math.max(0, Math.min((value / max) * 100, 100));
  return (
    <div className="relative w-12 h-48 bg-gray-300 border-2 border-gray-600 rounded-sm overflow-hidden shadow-inner flex flex-col justify-end">
      <div className="absolute top-0 left-0 w-full h-full flex flex-col-reverse justify-between text-[8px] text-gray-800 font-semibold pr-1">
          {[...Array(11)].map((_, i) => (
              <span key={i} className="text-right">{i * (max / 10)}—</span>
          ))}
      </div>
      <div 
        className="absolute bottom-0 left-0 w-full bg-red-500 transition-all duration-500 ease-out" 
        style={{ height: `${fillPercentage}%` }}
      ></div>
      <div className="absolute bottom-0 left-0 w-full h-6 bg-red-600 rounded-b-sm"></div>
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-sm font-mono shadow-md">
        {Number(value).toFixed(1)}°C
      </div>
    </div>
  );
};

const PressureGaugeVisual = ({ value = 0, max = 10 }) => {
  const angle = Math.max(-135, Math.min((value / max) * 270 - 135, 135));
  return (
    <div className="w-20 h-20 bg-gray-200 border-2 border-gray-600 rounded-full flex items-center justify-center shadow-md relative">
      <div className="absolute inset-2 border-2 border-gray-500 rounded-full"></div>
      <div 
        className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-1 h-8 bg-black origin-bottom transition-transform duration-500 z-10" 
        style={{ transform: `rotate(${angle}deg)` }}
      ></div>
      <div className="w-2 h-2 bg-gray-800 rounded-full z-20"></div>
      <span className="absolute -bottom-6 text-xs font-bold text-gray-800 bg-gray-100 px-1 py-0.5 rounded-sm shadow-sm">{Number(value).toFixed(2)} bar</span>
    </div>
  );
};

const FurnaceAssembly = ({ furnaceName, pressureValue, pressureMax, isActive = false }) => {
  return (
    <div className="flex flex-col items-center relative pt-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
        <div className="relative flex flex-col items-center">
            <div className="w-10 h-6 bg-blue-600 border-2 border-gray-800 rounded-sm"></div>
            <div className="w-6 h-8 bg-gray-700 border-x-2 border-gray-800 -mt-1"></div>
            <div className="absolute top-[3.25rem]">
              <PressureGaugeVisual value={pressureValue} max={pressureMax} />
            </div>
        </div>
      </div>
      <div className="w-36 h-48 bg-gray-500 border-2 border-gray-800 rounded-md shadow-lg relative overflow-hidden mt-8">
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-red-500 rounded-full animate-heat-glow"></div>
          </div>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full h-full flex flex-col items-center justify-end">
          <div className="w-1.5 h-3/4 bg-gray-800 border-x border-gray-900"></div>
          <div className={`w-28 h-4 origin-center ${isActive ? 'bg-red-600 animate-spin-slow' : 'bg-gray-700'}`}>
            <div className="w-full h-full bg-gray-800 transform -skew-x-[45deg]"></div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-700 border-t-2 border-gray-800"></div>
      </div>
      <h2 className="mt-4 text-xl font-bold text-gray-800 bg-gray-200 px-4 py-1 rounded-md shadow-inner">{furnaceName}</h2>
    </div>
  );
};

// ====================================================================
// ==  KOMPONEN UTAMA DASHBOARD                                       ==
// ====================================================================
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [setpoints, setSetpoints] = useState({
    furnace1: { suhu: "", tekanan: "" },
    furnace2: { suhu: "", tekanan: "" },
    furnace3: { suhu: "", tekanan: "" },
  });

  const [liveData, setLiveData] = useState({
    furnace1: { suhu: "0.0", tekanan: "0.00" },
    furnace2: { suhu: "0.0", tekanan: "0.00" },
    furnace3: { suhu: "0.0", tekanan: "0.00" },
  });

  const [isConnected, setIsConnected] = useState(false);
  const [furnaceStatuses, setFurnaceStatuses] = useState({});

  const mqttServiceRef = useRef(null);
  const furnaceList = ["furnace1", "furnace2", "furnace3"];
  
  // Mengambil data pengguna dari token JWT saat komponen pertama kali dimuat
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decodedToken = jwtDecode(token);

      // INI BAGIAN PALING PENTING
      console.log("ISI SEBENARNYA DARI TOKEN:", decodedToken); 

      // Baris ini mungkin salah dan perlu disesuaikan
      setUser(decodedToken); 

    } catch (error) {
      console.error("GAGAL DECODE TOKEN:", error);
    }
  } else {
    console.log("Token tidak ditemukan di Local Storage.");
  }
}, []);

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

  useEffect(() => {
    fetchFurnaceStatuses();
    const url = import.meta.env.VITE_MQTT_BROKER_URL;
    const options = {
      username: import.meta.env.VITE_MQTT_USERNAME,
      password: import.meta.env.VITE_MQTT_PASSWORD,
    };
    const callbacks = {
      onConnect: () => {
        setIsConnected(true);
        mqttServiceRef.current?.subscribe('sensor/furnace/#');
        mqttServiceRef.current?.subscribe('furnaces/events');
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
        if (topicParts[0] === 'furnaces' && topicParts[1] === 'events') {
          fetchFurnaceStatuses();
        }
      },
      onClose: () => setIsConnected(false),
    };
    mqttServiceRef.current = new MQTTService(url, options, callbacks);
    mqttServiceRef.current.connect();
    return () => { mqttServiceRef.current?.disconnect(); };
  }, []);

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
      const { suhu, tekanan } = setpoints[furnace];
      if (suhu === "" || tekanan === "") { alert("Setpoint suhu dan tekanan tidak boleh kosong!"); return; }
      const topic = `setpoint/furnace/${furnace}`;
      const payload = JSON.stringify({ suhu: Number(suhu), tekanan: Number(tekanan) });
      mqttServiceRef.current?.publish(topic, payload);
      await axios.post("http://localhost:5000/api/setpoints", {
        userID: user.id, // Menggunakan ID dari user yang login
        pressure_value: tekanan,
        temperature_value: suhu,
        furnace_id: furnace,
      });
      alert(`✅ Setpoint untuk ${furnace} berhasil dikirim!`);
    } catch (err) { alert("Gagal mengirim setpoint!"); }
  };

  // Tampilkan loading screen jika data pengguna belum siap
  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-sky-100">
            <p className="text-xl font-semibold">Memuat data pengguna...</p>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-sky-100 font-sans">
      <ScadaStyles />
      <Header />
      <div className="p-6">
        <div className="flex justify-center items-center gap-4 mb-10">
          <h1 className="text-3xl font-bold text-gray-800">Operator Dashboard</h1>
          <div className="flex items-center gap-2 p-2 bg-white rounded-full shadow-md">
            <span className={`h-4 w-4 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="font-semibold">{isConnected ? 'MQTT Connected' : 'MQTT Disconnected'}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-start gap-16">
          {furnaceList.map((furnace, index) => {
            const status = furnaceStatuses[furnace];
            // Menggunakan user.id dari state untuk perbandingan
            const isLockedByMe = status?.is_active && status?.active_userID === user.id;
            const isLockedByOther = status?.is_active && status?.active_userID !== user.id;
            
            return (
              <div 
                key={furnace} 
                className={`relative p-4 ${isLockedByOther ? 'opacity-50' : ''}`}
                style={{ minWidth: '450px', minHeight: '400px' }} 
              >
                {isLockedByOther && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 rounded-xl">
                    <p className="text-white text-xl font-bold p-4 bg-red-600 rounded-lg">
                      Digunakan oleh User ID: {status.active_userID}
                    </p>
                  </div>
                )}
                <div className="flex justify-center items-start gap-8">
                  <div className="relative z-10 pt-16">
                    <ThermometerVisual value={liveData[furnace].suhu} max={100} />
                  </div>
                  <div className="flex flex-col items-center gap-4 pt-16 z-10">
                    <button onClick={() => handleStartSession(furnace)} disabled={status?.is_active || isLockedByOther} className="w-10 h-10 bg-green-500 rounded-full border-2 border-green-700 shadow-md disabled:bg-gray-400 disabled:border-gray-600 hover:bg-green-400 transition"></button>
                    <button onClick={() => handleEndSession(furnace)} disabled={!isLockedByMe || isLockedByOther} className="w-10 h-10 bg-red-500 rounded-full border-2 border-red-700 shadow-md disabled:bg-gray-400 disabled:border-gray-600 hover:bg-red-400 transition"></button>
                    <div className="mt-4 p-1 bg-gray-600 rounded-md border-2 border-gray-800 flex flex-col items-center shadow-md">
                      <button className="w-8 h-8 text-white flex items-center justify-center text-xl font-bold active:bg-gray-700 select-none">▲</button>
                      <button className="w-8 h-8 text-white flex items-center justify-center text-xl font-bold active:bg-gray-700 select-none">▼</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <FurnaceAssembly 
                      furnaceName={`Furnace ${index + 1}`}
                      pressureValue={liveData[furnace].tekanan}
                      pressureMax={10}
                      isActive={status?.is_active}
                    />
                    <div className="bg-gray-100 p-4 rounded-lg shadow-inner w-56 mt-4 border border-gray-300"> 
                      <p className={`font-bold text-center text-lg mb-2 ${isLockedByMe ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>Setpoint</p>
                      <div className="flex flex-col gap-2">
                        <input type="number" placeholder="Suhu (°C)" value={setpoints[furnace].suhu} onChange={(e) => handleChange(furnace, "suhu", e.target.value)} className="border border-gray-400 rounded-md p-2 text-center disabled:bg-gray-200 disabled:cursor-not-allowed text-sm" disabled={!isLockedByMe || isLockedByOther} />
                        <input type="number" placeholder="Tekanan (bar)" value={setpoints[furnace].tekanan} onChange={(e) => handleChange(furnace, "tekanan", e.target.value)} className="border border-gray-400 rounded-md p-2 text-center disabled:bg-gray-200 disabled:cursor-not-allowed text-sm" disabled={!isLockedByMe || isLockedByOther} />
                      </div>
                      <button onClick={() => handleSubmit(furnace)} className="mt-3 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm" disabled={!isLockedByMe || isLockedByOther}>Kirim</button>
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