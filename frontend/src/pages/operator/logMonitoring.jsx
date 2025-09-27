import { useEffect, useState } from "react";
import Header from "../../components/operator/header";
import { Download, Search } from "lucide-react";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const LogMonitoring = () => {
  const [groupedLogs, setGroupedLogs] = useState({});
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    let decodedToken = null;
    if (token) {
      try {
        decodedToken = jwtDecode(token);
        setCurrentUser(decodedToken);
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }

    const fetchLogs = async () => {
      if (!token) return;
      try {
        const res = await axios.get("http://localhost:5000/api/logs", {
          headers: { 'x-auth-token': token }
        });

        if (decodedToken) {
          const userLogs = res.data.filter(log => log.userID === decodedToken.id);

          const groups = userLogs.reduce((acc, log) => {
            if (!log.timestamp || !log.furnace_id) return acc;
            
            const date = log.timestamp.split('T')[0];
            
            if (!acc[date]) {
              acc[date] = [];
            }

            if (!acc[date].includes(log.furnace_id)) {
              acc[date].push(log.furnace_id);
            }

            return acc;
          }, {});

          setGroupedLogs(groups);
        }
        
      } catch (err) {
        console.error("Gagal fetch logs:", err);
      }
    };
    fetchLogs();
  }, []);

  const handleDownload = async (furnaceId, date) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Otentikasi gagal. Silakan login kembali.');
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:5000/api/logs/download/${furnaceId}/${date}`,
        {
          headers: { 'x-auth-token': token },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `log_user_${currentUser.id}_${furnaceId}_${date}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Gagal download file CSV:', error);
      alert('Gagal mengunduh data log.');
    }
  };
  
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="min-h-screen bg-blue-100">
      <Header />
      <div className="p-6">
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center bg-white rounded-md shadow-sm border border-gray-300 px-3 py-2 w-64">
            <Search size={16} className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Cari Furnace ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-gray-700"
            />
          </div>
        </div>

        <div className="space-y-4">
          {sortedDates.length === 0 ? (
            <div className="bg-white px-4 py-6 rounded-md shadow-sm text-center">
              <p className="text-gray-500 italic">Tidak ada riwayat log ditemukan</p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date}>
                <h2 className="text-lg font-bold text-gray-700 mb-2 border-b-2 pb-1">
                  Tanggal {date}
                </h2>
                <div className="space-y-3">
                  {groupedLogs[date]
                    .filter(furnaceId => furnaceId && furnaceId.toLowerCase().includes(search.toLowerCase()))
                    .map((furnaceId) => (
                    <div
                      key={`${date}-${furnaceId}`}
                      className="flex items-center justify-between bg-white px-4 py-3 rounded-md shadow-sm"
                    >
                      <div>
                        <p className="font-semibold">
                          Furnace ID: {furnaceId}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(furnaceId, date)}
                        className="flex items-center space-x-2 bg-green-50 text-green-600 px-4 py-2 rounded-md shadow-sm hover:bg-green-100 transition"
                      >
                        <Download size={16} />
                        <span>Download Log Harian</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogMonitoring;