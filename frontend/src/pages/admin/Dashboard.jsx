import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/sidebar";
import Header from "../../components/admin/header";
import { FaUsers, FaEye, FaPlus, FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";

const Dashboard = () => {
  // State HANYA UNTUK DATA USER
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(5);
  const [loadingDelete, setLoadingDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    // fetchAccessLogs() DIHAPUS DARI SINI
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // SEMUA FUNGSI DAN LOGIKA accessLogs DIHAPUS DARI SINI

  // Logika Data User (Tetap Ada)
  const operatorCount = users.filter((u) => {
    const roleVal = (u.role || u.role_name || u.level || u.tipe || "").toString().toLowerCase().trim();
    return roleVal === "operator";
  }).length;

  const filteredUsers = users.filter(
    (u) =>
      (u.nama_lengkap?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.NIM?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / entries);
  const startIndex = (currentPage - 1) * entries;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + entries);

  const handleDelete = async (userID, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${nama}?`)) return;
    try {
      setLoadingDelete(userID);
      await axios.delete(`http://localhost:5000/api/users/${userID}`);
      alert("User berhasil dihapus!");
      setUsers(users.filter((u) => u.userID !== userID));
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus user!");
    } finally {
      setLoadingDelete(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-blue-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 pt-[60px]">
        <Header />
        <main className="p-6 flex-1">
          <h1 className="text-3xl font-bold mb-8 text-[#3674B5]">Dashboard</h1>
          {/* Cards (Tetap Ada) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: FaUsers, label: "Operator Terdaftar", value: operatorCount, bg: "from-[#3674B5] to-[#133E87]" },
              { icon: FaEye, label: "Viewer", value: 1, bg: "from-[#608BC1] to-[#133E87]" },
              { icon: FaPlus, label: "Tambah Operator", value: "", bg: "from-[#3674B5] to-[#133E87]", action: () => navigate("/admin/form-tambah") },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  onClick={card.action}
                  className={`flex rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1`}
                >
                  <div
                    className={`flex items-center justify-center w-1/3 p-6 bg-gradient-to-br ${card.bg}`}
                  >
                    <Icon className="text-5xl text-white transition-transform duration-500 hover:rotate-12" />
                  </div>
                  <div className="bg-white flex flex-col justify-center w-2/3 p-4">
                    <p className="text-gray-500 text-lg mb-1">{card.label}</p>
                    {card.value !== "" && <p className="text-3xl font-extrabold text-gray-800">{card.value}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Riwayat Pendaftaran (Tetap Ada) */}
          <h2 className="text-2xl font-bold mb-4 text-[#3674B5]">Riwayat Pendaftaran Terakhir</h2>
          <div className="bg-white shadow-xl rounded-2xl p-6">
            {/* Kontrol atas (User) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
              <div>
                <label className="text-sm text-gray-600">
                  Lihat{" "}
                  <select
                    value={entries}
                    onChange={(e) => {
                      setEntries(Number(e.target.value));
                      setCurrentPage(1);
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
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-[#3674B5] shadow-sm transition"
                  placeholder="Cari..."
                />
              </div>
            </div>

            {/* Tabel (User) */}
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#c0d6f9] to-[#9bbce4] text-left">
                    <th className="p-3">No.</th>
                    <th className="p-3">Nama</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">NIM</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((row, i) => (
                    <tr
                      key={row.userID}
                      className={`transition-all duration-300 hover:bg-blue-50 cursor-pointer ${
                        i % 2 === 0 ? "bg-gray-100" : "bg-white"
                      }`}
                    >
                      <td className="p-3 text-center">{startIndex + i + 1}</td>
                      <td className="p-3">{row.nama_lengkap}</td>
                      <td className="p-3">{row.username}</td>
                      <td className="p-3">{row.NIM}</td>
                      <td className="p-3 flex gap-2 justify-center">
                        <button
                          onClick={() => navigate(`/admin/form-edit/${row.userID}`)}
                          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-md transition transform hover:scale-105 hover:opacity-90 bg-gradient-to-r from-[#3674B5] to-[#133E87]"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(row.userID, row.nama_lengkap)}
                          disabled={loadingDelete === row.userID}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-md transition transform hover:scale-105 ${
                            loadingDelete === row.userID
                              ? "bg-red-300 cursor-not-allowed"
                              : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                          }`}
                        >
                          {loadingDelete === row.userID ? "Menghapus..." : <>
                            <FaTrash /> Hapus
                          </>}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center p-6 text-gray-500 italic">
                        Belum ada data pendaftaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Info bawah + Pagination (User) */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-600">
              <p>
                Lihat {startIndex + 1} dari {filteredUsers.length} entri
              </p>

              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className={`p-2 rounded-full transition ${
                    currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-gray-800 hover:scale-110"
                  }`}
                >
                  <FaChevronLeft size={16} />
                </button>

                <div className="px-3 py-1 text-white font-medium rounded-lg shadow" style={{ backgroundColor: "#3674B5" }}>
                  {currentPage}
                </div>

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className={`p-2 rounded-full transition ${
                    currentPage === totalPages || totalPages === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-gray-800 hover:scale-110"
                  }`}
                >
                  <FaChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* SEMUA BAGIAN JSX RIWAYAT AKSES DIHAPUS DARI SINI */}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;