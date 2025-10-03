import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Pastikan library ini sudah diinstal
import Header from "../../components/operator/header";
import { MQTTService } from "../../services/mqttService";

const Dashboard = () => {
  // State untuk menyimpan data pengguna yang sedang login
  const [user, setUser] = useState(null);

  const [setpoints, setSetpoints] = useState({
    furnace1: { suhu: "", tekanan: "" },
    furnace2: { suhu: "", tekanan: "" },
    furnace3: { suhu: "", tekanan: "" },
  });

  const [liveData, setLiveData] = useState({
    furnace1: { suhu: "...", tekanan: "..." },
    furnace2: { suhu: "...", tekanan: "..." },
    furnace3: { suhu: "...", tekanan: "..." },
  });

  const [isConnected, setIsConnected] = useState(false);
  const [warnings, setWarnings] = useState({
    furnace1: false,
    furnace2: false,
    furnace3: false,
  });

  const [furnaceStatuses, setFurnaceStatuses] = useState({});
  const mqttServiceRef = useRef(null);
  const furnaceList = ["furnace1", "furnace2", "furnace3"];

  // Mengambil data pengguna dari token JWT saat komponen pertama kali dimuat
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUser(decodedToken); // Langsung set objek token ke state user
      } catch (error) {
        console.error("Token tidak valid atau session berakhir:", error);
        // Idealnya, di sini Anda akan mengarahkan pengguna ke halaman login
      }
    }
  }, []);

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
                  const suhuValue = data.suhu !== undefined ? Number(data.suhu).toFixed(1) : "N/A";
                  const tekananValue = data.tekanan !== undefined ? Number(data.tekanan).toFixed(2) : "N/A";
                  setLiveData(prev => ({
                    ...prev,
                    [furnaceId]: { suhu: suhuValue, tekanan: tekananValue },
                  }));
                } catch (e) {
                  console.error("Gagal parse data JSON dari MQTT", e);
                }
              }
        }

        if (topicParts[0] === 'furnaces' && topicParts[1] === 'events') {
            console.log("🔄 Event sesi diterima, memperbarui status furnace...");
            fetchFurnaceStatuses();
        }
      },
      onClose: () => setIsConnected(false),
    };

    mqttServiceRef.current = new MQTTService(url, options, callbacks);
    mqttServiceRef.current.connect();

    return () => {
      mqttServiceRef.current?.disconnect();
    };
  }, []);

  const handleStartSession = async (furnace) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post("http://localhost:5000/api/furnaces/start-session", 
        { furnace_id: furnace },
        { headers: { 'x-auth-token': token } }
      );
      alert(`Sesi untuk ${furnace} berhasil dimulai!`);
      fetchFurnaceStatuses(); 
    } catch (err) {
      console.error("Gagal memulai sesi:", err);
      alert(err.response?.data?.message || "Terjadi kesalahan.");
    }
  };
  
  const handleEndSession = async (furnace) => {
    if (confirm(`Apakah Anda yakin ingin mengakhiri sesi pada ${furnace}?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.post("http://localhost:5000/api/furnaces/end-session", 
          { furnace_id: furnace },
          { headers: { 'x-auth-token': token } }
        );
        alert(`Sesi untuk ${furnace} telah diakhiri.`);
        fetchFurnaceStatuses();
      } catch (err) {
        console.error("Gagal mengakhiri sesi:", err);
        alert(err.response?.data?.message || "Terjadi kesalahan.");
      }
    }
  };

  const handleChange = (furnace, field, value) => {
    setSetpoints((prev) => ({
      ...prev,
      [furnace]: { ...prev[furnace], [field]: value },
    }));
  };

  const handleSubmit = async (furnace) => {
    if (!user) {
      alert("Sesi pengguna tidak ditemukan, silakan login kembali.");
      return;
    }
    try {
      const { suhu, tekanan } = setpoints[furnace];
      if (suhu === "" || tekanan === "") {
        alert("Setpoint suhu dan tekanan tidak boleh kosong!");
        return;
      }
      const topic = `setpoint/furnace/${furnace}`;
      const payload = JSON.stringify({
        suhu: Number(suhu),
        tekanan: Number(tekanan),
      });
      mqttServiceRef.current?.publish(topic, payload);
      await axios.post("http://localhost:5000/api/setpoints", {
        userID: user.id, // Menggunakan ID dari user yang login
        pressure_value: tekanan,
        temperature_value: suhu,
        furnace_id: furnace,
      });
      alert(`✅ Setpoint untuk ${furnace} berhasil dikirim!`);
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Gagal mengirim setpoint!");
    }
  };

  // Menampilkan loading screen jika data pengguna belum siap
  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-100">
            <p className="text-xl font-semibold">Memuat data pengguna...</p>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-100">
      <Header />
      <div className="p-6">
        <div className="flex justify-center items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Operator Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>{isConnected ? 'MQTT Connected' : 'MQTT Disconnected'}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
          {furnaceList.map((furnace, index) => {
            const status = furnaceStatuses[furnace];
            // Menggunakan user.id dari state untuk perbandingan yang dinamis
            const isLockedByMe = status?.is_active && status?.active_userID === user.id;
            const isLockedByOther = status?.is_active && status?.active_userID !== user.id;
            
            return (
              <div 
                key={furnace} 
                className={`bg-white p-4 rounded-lg shadow-md w-80 text-center transition-all duration-300
                  ${warnings[furnace] ? 'border-4 border-red-500 ring-4 ring-red-200' : 'border-4 border-transparent'}
                  ${isLockedByOther ? 'opacity-60 bg-gray-100' : ''}`}
              >
                <img src="/furnace.png" alt={`Furnace ${index + 1}`} className="mx-auto" />
                <h2 className="text-lg font-semibold mt-2">Furnace {index + 1}</h2>
                {isLockedByOther && (
                  <p className="text-sm font-bold text-red-600 my-2">
                    Digunakan oleh User ID: {status.active_userID}
                  </p>
                )}

                <div className="mt-4 border-b pb-4">
                  <p className="font-bold text-gray-700">Real-time Data</p>
                  <div className="flex justify-around mt-2">
                    <div>
                      <p className="text-sm text-gray-500">Suhu</p>
                      <p className="text-2xl font-bold text-orange-500">{liveData[furnace].suhu} °C</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tekanan</p>
                      <p className="text-2xl font-bold text-teal-500">{liveData[furnace].tekanan} bar</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className={`font-bold ${isLockedByMe ? 'text-red-600' : 'text-gray-700'}`}>
                    Setpoint
                  </p>
                  <div className="flex flex-col gap-2 mt-2">
                    <input 
                      type="number" 
                      placeholder="Suhu (°C)" 
                      value={setpoints[furnace].suhu} 
                      onChange={(e) => handleChange(furnace, "suhu", e.target.value)} 
                      className="border rounded-md p-2 text-center disabled:bg-gray-200 disabled:cursor-not-allowed"
                      disabled={!isLockedByMe}
                    />
                    <input 
                      type="number" 
                      placeholder="Tekanan (bar)" 
                      value={setpoints[furnace].tekanan} 
                      onChange={(e) => handleChange(furnace, "tekanan", e.target.value)} 
                      className="border rounded-md p-2 text-center disabled:bg-gray-200 disabled:cursor-not-allowed"
                      disabled={!isLockedByMe}
                    />
                  </div>
                  <button 
                    onClick={() => handleSubmit(furnace)} 
                    className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!isLockedByMe}
                  >
                    Simpan & Kirim
                  </button>
                </div>

                <div className="mt-4 h-12">
                  {!status?.is_active && (
                    <button onClick={() => handleStartSession(furnace)} className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold">
                      Mulai Sesi
                    </button>
                  )}
                  {isLockedByMe && (
                    <button onClick={() => handleEndSession(furnace)} className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold">
                      Akhiri Sesi
                    </button>
                  )}
                   {isLockedByOther && (
                     <div className="p-2 bg-gray-200 rounded-lg text-sm">
                       <p className="text-gray-700 font-semibold">Terkunci</p>
                     </div>
                  )}
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