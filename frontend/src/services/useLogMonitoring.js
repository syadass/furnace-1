import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { format } from 'date-fns';

export const useLogMonitoring = () => {
    const [availableLogs, setAvailableLogs] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [fullName, setFullName] = useState("Memuat...");
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedFurnace, setSelectedFurnace] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [isChartLoading, setIsChartLoading] = useState(false);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isSessionLoading, setIsSessionLoading] = useState(false);

    // Efek untuk mengambil data log awal
    useEffect(() => {
        const token = localStorage.getItem("token");
        let decodedToken = null;
        if (token) {
            try {
                decodedToken = jwtDecode(token);
                setCurrentUser(decodedToken);
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
                const res = await axios.get(`http://localhost:5000/api/logs/user/${decodedToken.id}`, {
                    headers: { 'x-auth-token': token }
                });
                const userLogs = res.data;
                if (!Array.isArray(userLogs)) {
                    console.error("Data log bukan array", userLogs);
                    setAvailableLogs({});
                    return;
                }
                if (userLogs.length > 0 && userLogs[0].nama_lengkap) {
                    setFullName(userLogs[0].nama_lengkap);
                } else {
                    setFullName(decodedToken.nama_lengkap || decodedToken.name || "Operator");
                }
                const groups = userLogs.reduce((acc, log) => {
                    if (!log.timestamp || !log.furnace_id) return acc;
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

    // Efek untuk mengambil data sesi berdasarkan tanggal dan tungku
    useEffect(() => {
        const fetchSessions = async () => {
            if (!selectedDate || !selectedFurnace) {
                setAvailableSessions([]);
                setSelectedSession(null);
                return;
            }
            const token = localStorage.getItem("token");
            if (!token) return;

            setIsSessionLoading(true);
            setAvailableSessions([]);
            setSelectedSession(null);
            try {
                const dateKey = format(selectedDate, 'yyyy-MM-dd');
                const res = await axios.get(`http://localhost:5000/api/logs/sessions/${selectedFurnace}/${dateKey}`, {
                    headers: { 'x-auth-token': token }
                });
                if (Array.isArray(res.data)) {
                    setAvailableSessions(res.data);
                }
            } catch (error) {
                console.error("Gagal mengambil daftar sesi:", error);
                alert("Gagal memuat daftar sesi.");
            } finally {
                setIsSessionLoading(false);
            }
        };
        fetchSessions();
    }, [selectedDate, selectedFurnace]);

    // Efek untuk mereset chart jika pilihan berubah
    useEffect(() => {
        if (showChart) {
            setShowChart(false);
            setChartData([]);
        }
    }, [selectedDate, selectedFurnace, selectedSession]);
    
    // Memoized values
    const availableDates = useMemo(() => Object.keys(availableLogs).map(dateStr => new Date(dateStr)), [availableLogs]);
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

    // Efek untuk mereset tungku jika tidak valid
    useEffect(() => {
        if (selectedDate && availableFurnaces.length > 0 && !availableFurnaces.includes(selectedFurnace)) {
            setSelectedFurnace(null);
        } else if (selectedDate && availableFurnaces.length === 0) {
            setSelectedFurnace(null);
        }
    }, [selectedDate, availableLogs, selectedFurnace, availableFurnaces]);
    
    // Handlers
    const handleDownload = async () => {
        if (!selectedSession) {
            alert('Harap pilih tanggal, tungku, dan sesi terlebih dahulu.');
            return;
        }
        const token = localStorage.getItem('token');
        const downloadUrl = `http://localhost:5000/api/logs/download/${selectedSession.session_id}`;
        
        setIsLoading(true);
        try {
            const response = await axios.get(downloadUrl, {
                headers: { 'x-auth-token': token },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const dateKey = format(selectedDate, 'yyyy-MM-dd');
            const fileName = `log_sesi_${selectedSession.session_id}_${selectedFurnace}_${dateKey}.csv`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            alert('File log sesi berhasil diunduh!');
        } catch (error) {
            console.error('Gagal download file CSV:', error);
            alert('Gagal mengunduh data log. Data mungkin tidak tersedia.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewChart = async () => {
        if (showChart) {
            setShowChart(false);
            return;
        }
        if (!selectedSession) {
            alert('Harap pilih tanggal, tungku, dan sesi terlebih dahulu.');
            return;
        }
        const token = localStorage.getItem('token');
        const dataUrl = `http://localhost:5000/api/logs/data/${selectedSession.session_id}`;
        setIsChartLoading(true);
        setShowChart(true);
        setChartData([]);
        try {
            const response = await axios.get(dataUrl, { headers: { 'x-auth-token': token } });
            setChartData(response.data);
        } catch (error) {
            console.error('Gagal mengambil data untuk grafik:', error);
            alert('Gagal memuat data grafik.');
            setShowChart(false);
        } finally {
            setIsChartLoading(false);
        }
    };
    
    return {
        // State and derived values
        currentUser, fullName, availableLogs, totalUniqueFurnaces,
        selectedDate, selectedFurnace, selectedSession,
        availableDates, availableFurnaces, availableSessions,
        showChart, chartData,
        // Loading states
        isLoading, isChartLoading, isSessionLoading,
        // Setters and handlers
        setSelectedDate, setSelectedFurnace, setSelectedSession,
        handleDownload, handleViewChart
    };
};