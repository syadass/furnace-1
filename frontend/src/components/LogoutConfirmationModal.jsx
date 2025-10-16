// src/components/LogoutConfirmationModal.jsx

import { AlertTriangle } from "lucide-react";

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  // Jika prop `isOpen` false, komponen tidak akan dirender sama sekali
  if (!isOpen) {
    return null;
  }

  return (
    // 1. Backdrop/Overlay
    // 'fixed inset-0' membuatnya menutupi seluruh layar.
    // 'bg-black/60' memberikan warna hitam dengan 60% opacity.
    // 'backdrop-blur-sm' memberikan efek blur pada konten di belakangnya.
    // 'flex justify-center items-center' membuat modal berada di tengah.
<div
  className="fixed inset-0 bg-black/10 flex justify-center items-center z-50 transition-opacity duration-300"
  onClick={onClose}
>
      {/* 2. Konten Modal */}
      {/* 'onClick' di sini untuk mencegah modal tertutup saat diklik di dalamnya */}
      <div
        className="relative bg-gradient-to-br from-[#2A3B52] to-[#1C283A] text-white rounded-xl shadow-2xl p-4 max-w-md w-full m-4 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          {/* Ikon Peringatan */}
          <div className="p-3 bg-yellow-500/10 rounded-full mb-4">
            <AlertTriangle className="text-yellow-400 h-12 w-12" strokeWidth={1.5} />
          </div>

          {/* Judul */}
          <h2 className="text-2xl font-bold mb-2">Konfirmasi Logout</h2>

          {/* Pesan */}
          <p className="text-slate-300 mb-8">
            Apakah Anda yakin ingin keluar?
          </p>

          {/* Tombol Aksi */}
          <div className="flex justify-center gap-4 w-full">
            {/* Tombol Batal */}
            <button
              onClick={onClose}
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 w-full"
            >
              Batal
            </button>

            {/* Tombol Konfirmasi */}
            <button
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 w-full"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationModal;