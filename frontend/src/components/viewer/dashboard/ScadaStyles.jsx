// src/components/scada/ScadaStyles.jsx

import React from 'react';

// Komponen ini menyuntikkan CSS kustom dengan animasi
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

export default ScadaStyles;