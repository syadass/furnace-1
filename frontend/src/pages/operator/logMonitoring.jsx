// logmonitoring.jsx

import { useEffect, useState, useMemo } from "react";
import Header from "../../components/operator/header";
import { Download, Calendar, HardHat, ChevronDown, User, Search, Loader2, Gauge, CheckCircle } from "lucide-react"; 
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import id from 'date-fns/locale/id';

const LogMonitoring = () => {
    // State untuk menyimpan daftar semua tanggal unik dan ID tungku yang tersedia
    const [availableLogs, setAvailableLogs] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [fullName, setFullName] = useState("Memuat..."); // <-- Akan diisi dari data log

    // State untuk kontrol download
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedFurnace, setSelectedFurnace] = useState(null);
    const [isFurnaceDropdownOpen, setIsFurnaceDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // --- LOGIKA UTAMA: FETCH DAN GROUPING LOGS ---
    useEffect(() => {
        const token = localStorage.getItem("token");
        let decodedToken = null;

        if (token) {
            try {
                decodedToken = jwtDecode(token);
                setCurrentUser(decodedToken);
                // Mengatur nama default sementara, akan diperbarui setelah fetch log
                setFullName("Operator"); 
                
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }

        const fetchAndGroupLogs = async () => {
            if (!token || !decodedToken) {
                setFullName("Pengguna Tidak Terotentikasi");
                return;
            }
            setIsLoading(true);
            try {
                // Memanggil endpoint yang sudah difilter oleh backend (dan sudah JOIN nama_lengkap)
                const res = await axios.get(`http://localhost:5000/api/logs/user/${decodedToken.id}`, {
                    headers: { 'x-auth-token': token }
                });

                const userLogs = res.data;

                // *** PERUBAHAN UTAMA DI SINI: MENGAMBIL NAMA LENGKAP DARI DATA LOG ***
                if (userLogs.length > 0 && userLogs[0].nama_lengkap) {
                    setFullName(userLogs[0].nama_lengkap);
                } else {
                    // Jika data log tidak ada atau nama_lengkap tidak ditemukan, kembali ke nama default/token
                    setFullName(decodedToken.nama_lengkap || decodedToken.name || "Operator");
                }
                // *******************************************************************


                const groups = userLogs.reduce((acc, log) => {
                    if (!log.timestamp || !log.furnace_id) return acc;
                    // Ambil bagian tanggal saja (YYYY-MM-DD)
                    const dateKey = log.timestamp.split('T')[0];
                    if (!acc[dateKey]) {
                        acc[dateKey] = new Set();
                    }
                    acc[dateKey].add(log.furnace_id);
                    return acc;
                }, {});

                const finalGroups = {};
                for (const date in groups) {
                    finalGroups[date] = Array.from(groups[date]).sort();
                }
                setAvailableLogs(finalGroups);

                // Atur default pilihan ke tanggal dan tungku terbaru
                const dates = Object.keys(finalGroups).sort((a, b) => new Date(b) - new Date(a));
                if (dates.length > 0) {
                    const latestDate = new Date(dates[0]);
                    setSelectedDate(latestDate);
                    const furnacesForLatestDate = finalGroups[dates[0]];
                    if (furnacesForLatestDate && furnacesForLatestDate.length > 0) {
                        setSelectedFurnace(furnacesForLatestDate[0]);
                    }
                }

            } catch (err) {
                console.error("Gagal fetch logs:", err);
                if (err.response && err.response.status === 401) {
                    alert("Sesi berakhir atau otentikasi gagal. Silakan login kembali.");
                    localStorage.removeItem("token");
                    window.location.href = '/login';
                } else {
                    alert("Gagal memuat daftar log yang tersedia.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndGroupLogs();

    }, []);

    // LOGIKA MEMOISASI DAN HANDLER
    const availableDates = useMemo(() => {
        return Object.keys(availableLogs).map(dateStr => new Date(dateStr));
    }, [availableLogs]);

    const availableFurnaces = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        return availableLogs[dateKey] || [];
    }, [selectedDate, availableLogs]);

    const totalUniqueFurnaces = useMemo(() => {
        const uniqueFurnaces = new Set();
        Object.values(availableLogs).forEach(furnaces => {
            furnaces.forEach(id => uniqueFurnaces.add(id));
        });
        return uniqueFurnaces.size;
    }, [availableLogs]);

    useEffect(() => {
        if (selectedDate && availableFurnaces.length > 0 && !availableFurnaces.includes(selectedFurnace)) {
            setSelectedFurnace(null);
        } else if (selectedDate && availableFurnaces.length === 0) {
            setSelectedFurnace(null);
        }
    }, [selectedDate, availableLogs]);

    const handleDownload = async () => {
        const token = localStorage.getItem('token');
        if (!token || !selectedDate || !selectedFurnace) {
            alert('Harap otentikasi/pilihan belum lengkap.');
            return;
        }

        const dateKey = format(selectedDate, 'yyyy-MM-dd');

        setIsLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/logs/download/${selectedFurnace}/${dateKey}`,
                {
                    headers: { 'x-auth-token': token },
                    responseType: 'blob',
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const userId = currentUser?.id || 'unknown';
            const fileName = `log_user_${userId}_${selectedFurnace}_${dateKey}.csv`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            alert(`File log untuk ${selectedFurnace} pada tanggal ${dateKey} berhasil diunduh!`);

        } catch (error) {
            console.error('Gagal download file CSV:', error);
            alert('Gagal mengunduh data log. Data mungkin tidak tersedia untuk pilihan tersebut atau terjadi kesalahan server.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    const CardStyle = "bg-white p-6 md:p-10 rounded-2xl shadow-xl lg:shadow-2xl border-t-8 border-blue-600 transition-all duration-300 hover:shadow-2xl hover:border-blue-700 transform hover:-translate-y-0.5";

    return (
        <div className="min-h-screen bg-sky-100 font-sans">
            <Header />
            <div className="p-4 md:p-8 max-w-5xl mx-auto">

                {/* Header dan Info User */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-4 border-blue-200 pb-4">
                    <h1 className="text-3xl font-bold text-gray-800">Monitor Log Harian</h1>
                    <div className="flex items-center text-md text-gray-700 font-semibold mt-3 md:mt-0 p-2 bg-white rounded-lg shadow-md border border-gray-200">
                        <User size={20} className="mr-2 text-blue-600" />
                        Operator: <span className="ml-1 text-blue-700 font-bold">{fullName} {currentUser?.id && fullName !== "Pengguna Tidak Terotentikasi" && `(ID: ${currentUser.id})`}</span>
                    </div>
                </div>

                {/* --- BAGIAN RINGKASAN LOG --- */}
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                    <Gauge size={20} className="mr-2 text-gray-500" /> Ringkasan Ketersediaan Log
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Card Total Hari */}
                    <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-green-500 transition-transform duration-300 hover:scale-[1.01] hover:shadow-xl">
                        <p className="text-sm font-semibold text-gray-500 uppercase">Total Hari Log Tersedia</p>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-4xl font-extrabold text-green-600">{Object.keys(availableLogs).length}</span>
                            <Calendar size={36} className="text-green-300 opacity-70" />
                        </div>
                    </div>
                    {/* Card Total Tungku Unik */}
                    <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-purple-500 transition-transform duration-300 hover:scale-[1.01] hover:shadow-xl">
                        <p className="text-sm font-semibold text-gray-500 uppercase">Total ID Tungku Unik</p>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-4xl font-extrabold text-purple-600">{totalUniqueFurnaces}</span>
                            <HardHat size={36} className="text-purple-300 opacity-70" />
                        </div>
                    </div>
                </div>

                {/* Kontainer Pilihan Download */}
                <div className={CardStyle}>
                    <h2 className="text-2xl font-extrabold text-gray-800 mb-8 flex items-center border-b pb-3 text-blue-600">
                        <Download size={28} className="mr-3 text-blue-600 animate-bounce-slow" />
                        Pilih Data Log untuk Diunduh
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                        {/* 1. Pemilih Tanggal */}
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-lg transition-shadow">
                            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <Calendar size={18} className="inline mr-2 text-blue-500" /> Tanggal Log:
                            </label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={handleDateChange}
                                locale={id}
                                dateFormat="dd MMMM yyyy"
                                includeDates={availableDates}
                                placeholderText="Pilih Tanggal Tersedia"
                                className="w-full border border-blue-300 rounded-xl p-4 shadow-inner text-lg font-medium focus:ring-blue-500 focus:border-blue-500 transition duration-150 cursor-pointer text-gray-700 hover:border-blue-500"
                                wrapperClassName="w-full"
                                dropdownMode="select"
                            />
                            <p className="text-sm text-gray-500 mt-3 flex items-center">
                                <CheckCircle size={14} className="mr-1 text-green-500" /> Pilih tanggal log yang tersedia.
                            </p>
                        </div>

                        {/* 2. Pemilih Furnace ID */}
                        <div className="relative p-4 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-lg transition-shadow">
                            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <HardHat size={18} className="inline mr-2 text-blue-500" /> ID Tungku (Furnace):
                            </label>
                            <button
                                type="button"
                                onClick={() => selectedDate && availableFurnaces.length > 0 && setIsFurnaceDropdownOpen(!isFurnaceDropdownOpen)}
                                className={`w-full flex justify-between items-center border rounded-xl p-4 shadow-sm transition duration-150 text-left text-lg font-medium
                                    ${selectedDate && availableFurnaces.length > 0 ? 'bg-white border-blue-300 hover:border-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'}
                                `}
                                disabled={!selectedDate || availableFurnaces.length === 0}
                            >
                                <span className={selectedFurnace ? 'text-gray-900 font-bold' : 'text-gray-500'}>
                                    {selectedFurnace || (selectedDate && availableFurnaces.length > 0 ? "Pilih ID Tungku" : "Pilih tanggal dahulu / Tungku tidak tersedia")}
                                </span>
                                <ChevronDown size={20} className={`ml-2 transform ${isFurnaceDropdownOpen ? 'rotate-180' : 'rotate-0'} transition-transform`} />
                            </button>

                            {isFurnaceDropdownOpen && selectedDate && availableFurnaces.length > 0 && (
                                <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto border border-blue-200 animate-fade-in">
                                    {availableFurnaces.map((furnaceId) => (
                                        <div
                                            key={furnaceId}
                                            className="p-4 text-md hover:bg-blue-50 cursor-pointer flex justify-between items-center font-medium transition-colors"
                                            onClick={() => {
                                                setSelectedFurnace(furnaceId);
                                                setIsFurnaceDropdownOpen(false);
                                            }}
                                        >
                                            <span>{furnaceId}</span>
                                            {selectedFurnace === furnaceId && <span className="text-green-600 font-bold">✓ Dipilih</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-sm text-gray-500 mt-3 flex items-center">
                                <CheckCircle size={14} className="mr-1 text-green-500" /> Daftar tungku yang aktif pada tanggal yang dipilih.
                            </p>
                        </div>
                    </div>

                    {/* 3. Tombol Download */}
                    <div className="pt-8 border-t-2 border-blue-100 flex justify-center">
                        <button
                            onClick={handleDownload}
                            disabled={!selectedDate || !selectedFurnace || isLoading}
                            className={`flex items-center space-x-4 text-white px-10 py-4 rounded-full shadow-xl transition-all duration-300 transform
                                ${!selectedDate || !selectedFurnace || isLoading
                                    ? 'bg-gray-400 cursor-not-allowed opacity-75'
                                    : 'bg-green-600 hover:bg-green-700 hover:scale-[1.05] active:scale-[0.98] focus:ring-4 focus:ring-green-300'
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <Download size={24} />
                            )}
                            <span className="font-extrabold text-xl">
                                {isLoading ? "Mengunduh Log Data..." : "Unduh"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Info Status */}
                <div className="mt-8 p-6 bg-blue-100 rounded-xl border border-blue-300 shadow-md">
                    <p className="text-md text-blue-800 font-semibold flex items-center">
                        <Search size={18} className="mr-2 text-blue-600" />
                        Status Log: Total **{Object.keys(availableLogs).length}** hari log dan **{totalUniqueFurnaces}** ID tungku unik tersedia untuk Operator **{fullName}**.
                    </p>
                </div>
            </div>
            
            <style jsx global>{`
                /* Tambahkan animasi sederhana untuk Download Icon di judul */
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite;
                }
                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }
                /* Animasi fade-in untuk dropdown (opsional) */
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default LogMonitoring;