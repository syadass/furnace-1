// pages/admin/RiwayatAkses.jsx

import { useEffect, useState } from "react";
import Sidebar from "../../components/admin/sidebar"; // Pastikan path ini benar
import Header from "../../components/admin/header"; // Pastikan path ini benar
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";

const RiwayatAkses = () => {
  // State HANYA untuk Riwayat Akses Furnace
  const [accessLogs, setAccessLogs] = useState([]);
  const [searchLogs, setSearchLogs] = useState("");
  const [entriesLogs, setEntriesLogs] = useState(5);
  const [currentPageLogs, setCurrentPageLogs] = useState(1);

  useEffect(() => {
    fetchAccessLogs();
  }, []);

  // Fungsi untuk fetch riwayat akses
  const fetchAccessLogs = async () => {
    try {
      // --- ✨ PERUBAHAN 1: URL DIPERBAIKI ---
      const res = await axios.get("http://localhost:5000/api/furnaces/access-logs");
      setAccessLogs(res.data);
    } catch (err) {
      console.error("Gagal fetch access logs:", err);
    }
  };

  // Logika untuk filtering dan pagination Riwayat Akses
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
          {/* --- Judul Halaman --- */}
          <h1 className="text-3xl font-bold mb-8 text-[#3674B5]">
            Riwayat Akses Furnace Operator
          </h1>

          {/* --- Kontainer Tabel Riwayat Akses --- */}
          <div className="bg-white shadow-xl rounded-2xl p-6">
            {/* Kontrol atas (Logs) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
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
              </div>
            </div>

            {/* Tabel (Logs) */}
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
                      // --- ✨ PERUBAHAN 2: KEY DIPERBAIKI ---
                      key={row.session_id || i} // Gunakan session_id dari backend
                      className={`transition-all duration-300 hover:bg-blue-50 cursor-pointer ${
                        i % 2 === 0 ? "bg-gray-100" : "bg-white"
                      }`}
                    >
                      <td className="p-3 text-center">{startIndexLogs + i + 1}</td>
                      {/* Properti ini (row.nama_operator, dll) sudah sesuai dengan query backend */}
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

            {/* Info bawah + Pagination (Logs) */}
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