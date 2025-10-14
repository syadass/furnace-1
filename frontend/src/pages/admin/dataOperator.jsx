import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/admin/sidebar";
import Header from "../../components/admin/header";
import { useNavigate } from "react-router-dom";
import { FaEye, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function DataOperator() {
  const [operators, setOperators] = useState([]);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(5);
  const [loadingDelete, setLoadingDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Ambil data dari backend
  const fetchOperators = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setOperators(res.data);
    } catch (err) {
      console.error("Gagal ambil data:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  // Hapus operator
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus operator ini?")) return;

    try {
      setLoadingDelete(id);
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      alert("Operator berhasil dihapus!");
      setOperators(operators.filter((op) => (op.userID || op.id) !== id));
    } catch (err) {
      console.error("Gagal hapus data:", err.response?.data || err.message);
      alert("Gagal hapus data. Cek console untuk detail.");
    } finally {
      setLoadingDelete(null);
    }
  };

  // Filtering & pagination
  const filteredOperators = operators.filter(
    (op) =>
      (op.nama_lengkap?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (op.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (op.NIM?.toString().toLowerCase() || "").includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOperators.length / entries);
  const startIndex = (currentPage - 1) * entries;
  const currentOperators = filteredOperators.slice(
    startIndex,
    startIndex + entries
  );

  return (
    <div className="flex min-h-screen bg-blue-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 pt-[60px]">
        <Header />

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#3674B5]">Daftar Operator</h2>

          <div className="bg-white shadow-xl rounded-2xl p-6">
            {/* Kontrol atas */}
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
                    className="border rounded px-2 py-1 mx-2"
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
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-[#3674B5]"
                />
              </div>
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto">
              {loading ? (
                <p>Loading data...</p>
              ) : (
                <table className="w-full rounded-lg overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-200 to-gray-300 text-left">
                      <th className="p-3">No.</th>
                      <th className="p-3">Nama</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Password</th>
                      <th className="p-3">NIM</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOperators.map((op, i) => (
                      <tr
                        key={op.userID || op.id}
                        className={`transition-all duration-300 hover:bg-blue-50 cursor-pointer ${
                          i % 2 === 0 ? "bg-gray-100" : "bg-white"
                        }`}
                      >
                        <td className="p-3 text-center">{startIndex + i + 1}</td>
                        <td className="p-3">{op.nama_lengkap}</td>
                        <td className="p-3">{op.username}</td>
                        <td className="p-3">
                          {"•".repeat(op.password?.length || 8)}
                        </td>
                        <td className="p-3">{op.NIM}</td>
                        <td className="p-3 flex gap-2 justify-center">
                          {/* Tombol Lihat */}
                          <button
                            onClick={() =>
                              navigate("/admin/lihat-data-operator", {
                                state: { operator: op },
                              })
                            }
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-md transition transform hover:scale-105 hover:opacity-90 bg-gradient-to-r from-[#3674B5] to-[#133E87]"
                          >
                            <FaEye /> Lihat
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            onClick={() => handleDelete(op.userID || op.id)}
                            disabled={loadingDelete === (op.userID || op.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-md transition transform hover:scale-105 ${
                              loadingDelete === (op.userID || op.id)
                                ? "bg-red-300 cursor-not-allowed"
                                : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                            }`}
                          >
                            {loadingDelete === (op.userID || op.id) ? (
                              "Menghapus..."
                            ) : (
                              <>
                                <FaTrash /> Hapus
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredOperators.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center p-6 text-gray-500 italic"
                        >
                          Tidak ada data ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Info bawah + Pagination */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-600">
              <p>
                Lihat {filteredOperators.length === 0 ? 0 : startIndex + 1} dari{" "}
                {filteredOperators.length} entri
              </p>

              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className={`p-2 rounded-full transition ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800 hover:scale-110"
                  }`}
                >
                  <FaChevronLeft size={16} />
                </button>

                <div
                  className="px-3 py-1 text-white font-medium rounded-lg shadow"
                  style={{ backgroundColor: "#3674B5" }}
                >
                  {currentPage}
                </div>

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className={`p-2 rounded-full transition ${
                    currentPage === totalPages || totalPages === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800 hover:scale-110"
                  }`}
                >
                  <FaChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
