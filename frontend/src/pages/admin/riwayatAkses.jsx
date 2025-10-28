// pages/admin/riwayatAkses.jsx

import { useEffect, useState } from "react";
import Sidebar from "../../components/admin/sidebar";
import Header from "../../components/admin/header";
import { FaChevronLeft, FaChevronRight, FaDownload } from "react-icons/fa";
import axios from "axios";
// Library PapaParse TIDAK DIPERLUKAN LAGI untuk fungsi download ini
import { saveAs } from 'file-saver';

const RiwayatAkses = () => {
  const [accessLogs, setAccessLogs] = useState([]);
  const [searchLogs, setSearchLogs] = useState("");
  const [entriesLogs, setEntriesLogs] = useState(5);
  const [currentPageLogs, setCurrentPageLogs] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchAccessLogs();
  }, []);

  // Fungsi untuk fetch data tabel (tidak berubah)
  const fetchAccessLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Mencoba fetch data tabel dengan token:", token);
      if (!token) {
        console.error("Token tidak ditemukan. Silakan login ulang.");
        return;
      }
      const res = await axios.get("http://localhost:5000/api/furnaces/access-logs", {
        headers: { 'x-auth-token': token }
      });
      setAccessLogs(res.data);
    } catch (err) {
      console.error("Gagal fetch access logs:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.error("Token ditolak oleh server. Kemungkinan kedaluwarsa atau tidak valid.");
      }
    }
  };

  // --- ✨ FUNGSI DOWNLOAD YANG SUDAH DISESUAIKAN --- ✨
  const handleDownloadCSV = async () => {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token tidak ditemukan untuk download.");
        alert("Sesi Anda habis, silakan login ulang.");
        setIsDownloading(false);
        return;
      }

      // Panggil API backend, minta response sebagai 'blob' (file)
      const response = await axios.get("http://localhost:5000/api/furnaces/access-logs/download", {
        headers: {
          'x-auth-token': token
        },
        responseType: 'blob', // Penting: minta data sebagai file
      });

      // Ambil nama file dari header 'Content-Disposition'
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `riwayat_akses_furnace_${Date.now()}.csv`; // Nama default
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }

      // Langsung simpan blob yang diterima dari backend
      saveAs(response.data, fileName);

    } catch (err) {
      console.error("Gagal mengunduh CSV:", err);
      // Cek jika error karena tidak ada data (404 dari backend)
      if (err.response && err.response.status === 404) {
        // Coba baca pesan error dari response jika backend mengirim JSON
        try {
          // Response error 404 mungkin berupa JSON, coba parse
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result);
              alert(errorData.message || "Tidak ada data riwayat akses untuk diunduh.");
            } catch (jsonParseError) {
              alert("Tidak ada data riwayat akses untuk diunduh (error backend).");
            }
          }
          reader.onerror = () => {
            alert("Tidak ada data riwayat akses untuk diunduh (error baca response).");
          }
          reader.readAsText(err.response.data); // Baca blob sebagai teks
        } catch (readError) {
           alert("Tidak ada data riwayat akses untuk diunduh (error frontend).");
         }
      } else {
         alert("Terjadi kesalahan saat mencoba mengunduh data CSV.");
      }
    } finally {
      setIsDownloading(false);
    }
  };
  // --- ✨ AKHIR FUNGSI DOWNLOAD --- ✨

  // Logika untuk filtering dan pagination (tidak berubah)
  const filteredLogs = accessLogs.filter(
    (log) =>
      (log.nama_operator?.toLowerCase() || "").includes(searchLogs.toLowerCase()) ||
      (log.furnace_id?.toString().toLowerCase() || "").includes(searchLogs.toLowerCase())
  );
  const totalPagesLogs = Math.ceil(filteredLogs.length / entriesLogs);
  const startIndexLogs = (currentPageLogs - 1) * entriesLogs;
  const currentLogs = filteredLogs.slice(startIndexLogs, startIndexLogs + entriesLogs);

  return (
    <div className="flex min-h-screen bg-blue-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 pt-[60px]">
        <Header />
        <main className="p-6 flex-1">
          <h1 className="text-3xl font-bold mb-8 text-[#3674B5]">
            Riwayat Akses Furnace Operator
          </h1>
          <div className="bg-white shadow-xl rounded-2xl p-6">
            {/* Kontrol Atas: Select, Cari, Tombol Download */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
              {/* Select Entries */}
              <div>
                <label className="text-sm text-gray-600">
                  Lihat{" "}
                  <select
                    value={entriesLogs}
                    onChange={(e) => {
                      setEntriesLogs(Number(e.target.value));
                      setCurrentPageLogs(1);
                    }}
                    className="border rounded px-2 py-1 mx-2 shadow-sm focus:ring focus:ring-[#3674B5] transition"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  entri
                </label>
              </div>
              {/* Search & Download */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Cari:</label>
                <input
                  type="text"
                  value={searchLogs}
                  onChange={(e) => {
                    setSearchLogs(e.target.value);
                    setCurrentPageLogs(1);
                  }}
                  className="border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-[#3674B5] shadow-sm transition"
                  placeholder="Cari operator/furnace..."
                />
                <button
                  onClick={handleDownloadCSV}
                  disabled={isDownloading}
                  className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg shadow-md transition transform hover:scale-105 ${
                    isDownloading
                      ? "bg-green-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                  }`}
                >
                  <FaDownload />
                  {isDownloading ? "Mengunduh..." : "Download CSV"}
                </button>
              </div>
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#c0d6f9] to-[#9bbce4] text-left">
                    <th className="p-3">No.</th>
                    <th className="p-3">Nama Operator</th>
                    <th className="p-3">Furnace</th>
                    <th className="p-3">Waktu Mulai</th>
                    <th className="p-3">Waktu Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((row, i) => (
                    <tr
                      key={row.session_id || i}
                      className={`transition-all duration-300 hover:bg-blue-50 cursor-pointer ${
                        i % 2 === 0 ? "bg-gray-100" : "bg-white"
                      }`}
                    >
                      <td className="p-3 text-center">{startIndexLogs + i + 1}</td>
                      <td className="p-3">{row.nama_operator || '(User Dihapus)'}</td>
                      <td className="p-3">{row.furnace_id}</td>
                      <td className="p-3">{new Date(row.waktu_mulai).toLocaleString("id-ID")}</td>
                      <td className="p-3">
                        {row.waktu_selesai
                          ? new Date(row.waktu_selesai).toLocaleString("id-ID")
                          : "Masih Berjalan"}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center p-6 text-gray-500 italic">
                        Belum ada data riwayat akses.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-600">
              <p>
                Lihat {startIndexLogs + 1} dari {filteredLogs.length} entri
              </p>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <button
                  disabled={currentPageLogs === 1}
                  onClick={() => setCurrentPageLogs((p) => p - 1)}
                  className={`p-2 rounded-full transition ${
                    currentPageLogs === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-gray-800 hover:scale-110"
                  }`}
                >
                  <FaChevronLeft size={16} />
                </button>
                <div className="px-3 py-1 text-white font-medium rounded-lg shadow" style={{ backgroundColor: "#3674B5" }}>
                  {currentPageLogs}
                </div>
                <button
                  disabled={currentPageLogs === totalPagesLogs || totalPagesLogs === 0}
                  onClick={() => setCurrentPageLogs((p) => p + 1)}
                  className={`p-2 rounded-full transition ${
                    currentPageLogs === totalPagesLogs || totalPagesLogs === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-gray-800 hover:scale-110"
                  }`}
                >
                  <FaChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RiwayatAkses;