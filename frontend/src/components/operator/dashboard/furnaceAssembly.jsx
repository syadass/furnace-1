import React from 'react';
import PressureGaugeVisual from './pressureGaugeVisual';

const FurnaceAssembly = ({ furnaceName, pressureValue, pressureMax, isActive = false }) => {
    return (
        <div className="flex flex-col items-center relative pt-12">
            {/* Pressure Gauge Assembly */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                <div className="relative flex flex-col items-center">
                    {/* Pipa Koneksi */}
                    <div className="w-10 h-8 bg-blue-700 border-2 border-gray-900 rounded-t-md shadow-inner"></div>
                    <div className="w-6 h-10 bg-gray-600 border-x-2 border-gray-900 -mt-2 shadow-inner"></div>
                    <div className="absolute top-[3.75rem]">
                        <PressureGaugeVisual value={pressureValue} max={pressureMax} />
                    </div>
                </div>
            </div>
            {/* Furnace Body */}
            <div
                className="relative w-48 h-64 mt-10 rounded-xl overflow-hidden shadow-2xl"
                style={{
                    background: "linear-gradient(145deg, #a0a0a0 10%, #707070 40%, #404040 90%)",
                    border: "4px solid #1f2937",
                    boxShadow: "inset 0 4px 10px rgba(255,255,255,0.2), inset 0 -5px 15px rgba(0,0,0,0.8), 0 15px 30px rgba(0,0,0,0.5)",
                    transform: "perspective(800px) rotateX(8deg) rotateY(0deg) scale(1)",
                }}
            >
                {/* Pintu Inspeksi/Ruang Pembakaran */}
                <div className="absolute inset-12 rounded-lg overflow-hidden flex items-center justify-center bg-[#101010] shadow-2xl border-4 border-[#333]" style={{ boxShadow: 'inset 0 0 15px rgba(0,0,0,0.9), 0 0 10px rgba(255,255,255,0.1)' }}>
                    {isActive ? (
                        <>
                            <div className="absolute inset-0 animate-fire-glow"></div>
                            <div className="absolute inset-2 rounded-md" style={{ background: "radial-gradient(circle at 50% 80%, rgba(255,100,0,0.45) 0%, rgba(255,50,0,0.25) 45%, transparent 75%)", filter: "blur(12px)" }}></div>
                        </>
                    ):null}
                </div>
                {/* Panel bawah Kaki/Base */}
                <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: "linear-gradient(to top, #111 0%, #333 40%, #555 100%)", borderTop: "4px solid #222", boxShadow: '0 5px 10px rgba(0,0,0,0.5)' }}></div>
                {/* Asap */}
                {isActive && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 animate-smoke">
                        <div className="w-16 h-16 bg-gradient-to-t from-transparent via-gray-300/40 to-white/50 blur-lg opacity-50 rounded-full"></div>
                    </div>
                )}
            </div>
            {/* Nama Furnace */}
            <h2 className="mt-6 text-xl font-extrabold text-gray-900 bg-yellow-400 px-5 py-1.5 rounded-full shadow-lg border-2 border-yellow-600">
                {furnaceName}
            </h2>
        </div>
    );
};

export default FurnaceAssembly;