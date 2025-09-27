import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/admin/sidebar";
import Header from "../../components/admin/header";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function DaftarOperator() {
  const [operators, setOperators] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingDelete, setLoadingDelete] = useState(null);
  const navigate = useNavigate();

  const fetchOperators = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setOperators(res.data);
    } catch (err) {
      console.error("Gagal fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const handleDelete = async (userID, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${nama}?`)) return;

    try {
      setLoadingDelete(userID);
      await axios.delete(`http://localhost:5000/api/users/${userID}`);
      alert("Operator berhasil dihapus!");
      setOperators(operators.filter((op) => op.userID !== userID));
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus operator!");
    } finally {
      setLoadingDelete(null);
    }
  };

  const filteredOperators = operators.filter(
    (op) =>
      (op.nama_lengkap?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (op.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (op.NIM?.toLowerCase() || "").includes(search.toLowerCase())
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
      <div className="flex-1 flex flex-col">
        <Header />

        <div className="p-6 flex-1">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#3674B5" }}>
            Tambah Data Operator
          </h2>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            {/* Tombol Tambah dan Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <button
                onClick={() => navigate("/admin/form-tambah")}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition"
                style={{ backgroundColor: "#3674B5" }}
              >
                <FaPlus />
                Tambah Data
              </button>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Cari:</label>
                <input
                  type="text"
                  placeholder="Ketik untuk mencari..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-[#3674B5]"
                />
              </div>
            </div>

            {/* Pilihan jumlah entri */}
            <div className="mb-4">
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

            {/* Tabel */}
            {loading ? (
              <p>Loading data...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-200 to-gray-300 text-left">
                      <th className="p-3">No.</th>
                      <th className="p-3">Nama</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">NIM</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOperators.map((op, i) => (
                      <tr
                        key={op.userID}
                        className={`transition hover:bg-blue-50 ${
                          i % 2 === 0 ? "bg-gray-100" : "bg-white"
                        }`}
                      >
                        <td className="p-3 text-center">{startIndex + i + 1}</td>
                        <td className="p-3">{op.nama_lengkap}</td>
                        <td className="p-3">{op.username}</td>
                        <td className="p-3">{op.NIM}</td>
                        <td className="p-3 flex gap-2 justify-center">
                          <button
                            onClick={() =>
                              navigate(`/admin/form-edit/${op.userID}`)
                            }
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-md transition hover:opacity-90"
                            style={{ backgroundColor: "#3674B5" }}
                          >
                            <FaEdit />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(op.userID, op.nama_lengkap)
                            }
                            disabled={loadingDelete === op.userID}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-md transition ${
                              loadingDelete === op.userID
                                ? "bg-red-300 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {loadingDelete === op.userID ? (
                              "Menghapus..."
                            ) : (
                              <>
                                <FaTrash />
                                Hapus
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredOperators.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center p-6 text-gray-500 italic"
                        >
                          Belum ada data operator.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Info bawah + Pagination */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-600">
              <p>
                Lihat {startIndex + 1} sampai{" "}
                {Math.min(startIndex + entries, filteredOperators.length)} dari{" "}
                {filteredOperators.length} entri
              </p>

              {/* Pagination */}
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                {/* Tombol Previous */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className={`p-2 ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <FaChevronLeft size={16} />
                </button>

                {/* Nomor Halaman */}
                <div
                  className="px-3 py-1 text-white font-medium rounded"
                  style={{ backgroundColor: "#3674B5" }}
                >
                  {currentPage}
                </div>

                {/* Tombol Next */}
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className={`p-2 ${
                    currentPage === totalPages || totalPages === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800"
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
