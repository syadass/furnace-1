  import { useState, useEffect, useRef } from "react";
  import axios from "axios";
  import { jwtDecode } from "jwt-decode"; // Pastikan sudah diinstal
  import Header from "../../components/operator/header";
  import { MQTTService } from "../../services/mqttService";


  // ====================================================================
  // == 🎨 SCADA GLOBAL STYLES (Animasi & Efek Visual 3D) ==
  // ====================================================================
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

      /* Efek glow panas tambahan */
      @keyframes heat-glow {
        0%, 100% { box-shadow: 0 0 15px 5px rgba(239, 68, 68, 0.7); }
        50% { box-shadow: 0 0 25px 10px rgba(239, 68, 68, 0.5); }
      }
      .animate-heat-glow {
        animation: heat-glow 3s ease-in-out infinite;
      }
      
      /* Gaya 3D Tombol */
      .button-3d-base {
          box-shadow: 
              0 0.5rem 0 rgba(0,0,0,0.4), /* Bayangan bawah (depth) */
              0 0.25rem 0.5rem rgba(0,0,0,0.3), /* Bayangan permukaan */
              inset 0 2px 4px rgba(255,255,255,0.2); /* Highlight atas */
          transition: transform 0.1s, box-shadow 0.1s;
      }
      .button-3d-base:active {
          transform: translateY(0.25rem); /* Bergerak ke bawah saat ditekan */
          box-shadow: 
              0 0.25rem 0 rgba(0,0,0,0.4), /* Mengurangi depth bayangan bawah */
              0 0.1rem 0.3rem rgba(0,0,0,0.2), 
              inset 0 2px 6px rgba(0,0,0,0.3); /* Membuat permukaan terlihat "masuk" */
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

  // ====================================================================
  // == 🌡️ THERMOMETER VISUAL (3D) ==
  // ====================================================================
  const ThermometerVisual = ({ value = 0, max = 100 }) => {
    const fillPercentage = Math.max(0, Math.min((value / max) * 100, 100));
    return (
      <div className="relative p-2 rounded-lg gauge-casing-3d" style={{ transform: "perspective(400px) rotateX(5deg)" }}>
        <div className="relative w-12 h-48 bg-gray-50 border-2 border-gray-400 rounded-sm overflow-hidden shadow-inner flex flex-col justify-end">
          {/* Skala */}
          <div className="absolute top-0 left-0 w-full h-full flex flex-col-reverse justify-between text-[8px] text-gray-800 font-semibold pr-1 z-10">
            {[...Array(11)].map((_, i) => (
              <span key={i} className="text-right tracking-tighter" style={{ lineHeight: '14px' }}>
                {i * (max / 10)}—
              </span>
            ))}
          </div>
          {/* Fluid/Mercury Fill */}
          <div 
            className="absolute bottom-0 left-0 w-full bg-red-600 transition-all duration-700 ease-out shadow-lg shadow-red-500/50" 
            style={{ height: `${fillPercentage}%`, background: 'linear-gradient(to top, #ef4444, #b91c1c)' }}
          ></div>
          {/* Bulb Bawah */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-10 h-10 bg-red-700 rounded-full border-2 border-red-900 shadow-xl z-20"></div>
          
        </div>
        {/* Label Nilai */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-yellow-300 text-sm px-3 py-1 rounded-full font-mono shadow-xl border border-yellow-500/50">
            {Number(value).toFixed(1)}°C
        </div>
      </div>
    );
  };

  // ====================================================================
  // == ⏲️ PRESSURE GAUGE VISUAL (3D) ==
  // ====================================================================
  const PressureGaugeVisual = ({ value = 0, max = 10 }) => {
    const angle = Math.max(-135, Math.min((value / max) * 270 - 135, 135));
    return (
      <div className="relative p-2 rounded-full gauge-casing-3d">
        <div 
          className="w-24 h-24 bg-gray-800 border-4 border-gray-600 rounded-full flex items-center justify-center shadow-inner relative"
          style={{ background: 'radial-gradient(circle at 50% 50%, #4b5563 0%, #1f2937 100%)', transform: 'translateZ(0)' }}
        >
          {/* Faceplate */}
          <div className="absolute inset-1.5 bg-gray-100 rounded-full border border-gray-300 shadow-lg">
            {/* Skala */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-135deg)' }}>
                {/* Garis Skala */}
                {[...Array(28)].map((_, i) => (
                  <line 
                    key={i}
                    x1="50" y1="5" x2="50" y2={i % 5 === 0 ? "10" : "8"} 
                    stroke={i % 5 === 0 ? "#1f2937" : "#4b5563"} 
                    strokeWidth={i % 5 === 0 ? "1.5" : "1"}
                    transform={`rotate(${(i / 27) * 270}, 50, 50)`}
                  />
                ))}
                {/* Nilai Skala */}
                {[...Array(11)].map((_, i) => {
                    const val = i * (max / 10);
                    const valAngle = (i / 10) * 270 - 135;
                    const x = 50 + 35 * Math.cos((valAngle + 90) * (Math.PI / 180));
                    const y = 50 + 35 * Math.sin((valAngle + 90) * (Math.PI / 180));
                    return (
                        <text 
                            key={i} 
                            x={x} y={y} 
                            fontSize="7" 
                            textAnchor="middle" 
                            dominantBaseline="middle" 
                            fill="#1f2937"
                            transform={`rotate(${valAngle + 180}, ${x}, ${y})`}
                        >
                            {val}
                        </text>
                    );
                })}
              </svg>
            </div>
            {/* Needle/Jarum */}
            <div 
              className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-1 h-10 bg-red-600 origin-bottom transition-transform duration-500 z-10 rounded-t-full shadow-lg" 
              style={{ 
                transform: `translateX(-50%) rotate(${angle}deg)`, 
                transformOrigin: 'bottom center'
              }}
            ></div>
            {/* Center Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full z-20 border border-white"></div>
          </div>
        </div>
        {/* Label Nilai */}
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-800 bg-gray-200 px-2 py-1 rounded-md shadow-xl border border-gray-400">
            {Number(value).toFixed(2)} bar
        </span>
      </div>
    );
  };


  // ====================================================================
  // == 🔥 FURNACE ASSEMBLY VISUAL (3D + Efek Panas) ==
  // ====================================================================
  const FurnaceAssembly = ({
    furnaceName, 
    pressureValue, 
    pressureMax, 
    isActive = false, 
  }) => {
    return (
      <div className="flex flex-col items-center relative pt-12">
        {/* Pressure Gauge Assembly */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
          <div className="relative flex flex-col items-center">
            {/* Pipa Koneksi */}
            <div className="w-10 h-8 bg-blue-700 border-2 border-gray-900 rounded-t-md shadow-inner"></div>
            <div className="w-6 h-10 bg-gray-600 border-x-2 border-gray-900 -mt-2 shadow-inner"></div>
            <div className="absolute top-[3.75rem]">
              <PressureGaugeVisual value={pressureValue} max={pressureMax} />
            </div>
          </div>
        </div>

        {/* Furnace Body */}
        <div
          className="relative w-48 h-64 mt-10 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(145deg, #a0a0a0 10%, #707070 40%, #404040 90%)",
            border: "4px solid #1f2937",
            boxShadow:
              "inset 0 4px 10px rgba(255,255,255,0.2), inset 0 -5px 15px rgba(0,0,0,0.8), 0 15px 30px rgba(0,0,0,0.5)",
            // Transformasi 3D
            transform: "perspective(800px) rotateX(8deg) rotateY(0deg) scale(1)",
          }}
        >
          {/* Pintu Inspeksi/Ruang Pembakaran */}
          <div 
            className="absolute inset-12 rounded-lg overflow-hidden flex items-center justify-center bg-[#101010] shadow-2xl border-4 border-[#333]"
            style={{
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.9), 0 0 10px rgba(255,255,255,0.1)'
            }}
          >
            {/* EFEK NYALA API (SELALU NYALA) */}
            <div className="absolute inset-0 animate-fire-glow"></div>
            
            {/* Visual Panas/Api (Gradien Statis) */}
            <div
              className="absolute inset-2 rounded-md"
              style={{
                background:
                  "radial-gradient(circle at 50% 80%, rgba(255,100,0,0.45) 0%, rgba(255,50,0,0.25) 45%, transparent 75%)",
                filter: "blur(12px)",
              }}
            ></div>
          </div>

          {/* Panel bawah Kaki/Base */}
          <div
            className="absolute bottom-0 left-0 right-0 h-12"
            style={{
              background: "linear-gradient(to top, #111 0%, #333 40%, #555 100%)",
              borderTop: "4px solid #222",
              boxShadow: '0 5px 10px rgba(0,0,0,0.5)'
            }}
          ></div>

          {/* Asap (TETAP DIKONTROL OLEH isActive) */}
          {isActive && (
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 animate-smoke">
              <div className="w-16 h-16 bg-gradient-to-t from-transparent via-gray-300/40 to-white/50 blur-lg opacity-50 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Nama Furnace */}
        <h2 className="mt-6 text-xl font-extrabold text-gray-900 bg-yellow-400 px-5 py-1.5 rounded-full shadow-lg border-2 border-yellow-600">
          {furnaceName}
        </h2>
      </div>
    );
  };


  // ====================================================================
  // == 🧭 DASHBOARD UTAMA ==

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
            <h1 className="text-3xl font-bold text-gray-800">Monitoring & Kontrol Furnace</h1>
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
                      {/* Tombol START (ON) */}
                      <button
                        onClick={() => handleStartSession(furnace)}
                        disabled={status?.is_active || isLockedByOther}
                        className={`
                          w-12 h-12 rounded-full text-white text-lg font-bold 
                          ${status?.is_active || isLockedByOther ? 'bg-gray-400 border-gray-600' : 'bg-green-400'} 
                          shadow-[inset_0_4px_6px_rgba(255,255,255,0.6),0_4px_6px_rgba(0,0,0,0.4)]
                          border-4 ${status?.is_active || isLockedByOther ? 'border-gray-600' : 'border-white'}
                          transition-all transform active:translate-y-1 active:shadow-[inset_0_2px_3px_rgba(255,255,255,0.5),0_2px_3px_rgba(0,0,0,0.3)]
                          hover:brightness-110
                        `}
                        style={{
                          background: status?.is_active || isLockedByOther 
                            ? '' 
                            : 'radial-gradient(circle at 30% 30%, #a6f600, #22c700 70%)'
                        }}
                      >
                        <span className="material-icons text-xl">ON</span>
                      </button>

                      {/* Tombol STOP (OFF) */}
                      <button
                        onClick={() => handleEndSession(furnace)}
                        disabled={!isLockedByMe || isLockedByOther}
                        className={`
                          w-12 h-12 rounded-full text-white text-lg font-bold 
                          ${!isLockedByMe || isLockedByOther ? 'bg-gray-400 border-gray-600' : 'bg-red-500'} 
                          shadow-[inset_0_4px_6px_rgba(255,255,255,0.6),0_4px_6px_rgba(0,0,0,0.4)]
                          border-4 ${!isLockedByMe || isLockedByOther ? 'border-gray-600' : 'border-white'}
                          transition-all transform active:translate-y-1 active:shadow-[inset_0_2px_3px_rgba(255,255,255,0.5),0_2px_3px_rgba(0,0,0,0.3)]
                          hover:brightness-110
                        `}
                        style={{
                          background: !isLockedByMe || isLockedByOther
                            ? ''
                            : 'radial-gradient(circle at 30% 30%, #ff6b6b, #c70000 70%)'
                        }}
                      >
                        <span className="material-icons text-xl">OFF</span>
                      </button>
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