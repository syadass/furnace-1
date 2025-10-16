import React from 'react';

const ThermometerVisual = ({ value = 0, max = 100 }) => {
    const fillPercentage = Math.max(0, Math.min((value / max) * 100, 100));
    return (
        <div className="relative p-2 rounded-lg gauge-casing-3d" style={{ transform: "perspective(400px) rotateX(5deg)" }}>
            <div className="relative w-12 h-48 bg-gray-50 border-2 border-gray-400 rounded-sm overflow-hidden shadow-inner flex flex-col justify-end">
                {/* Skala */}
                <div className="absolute top-0 left-0 w-full h-full flex flex-col-reverse justify-between text-[8px] text-gray-800 font-semibold pr-1 z-10">
                    {[...Array(11)].map((_, i) => (
                        <span key={i} className="text-right tracking-tighter" style={{ lineHeight: '14px' }}>
                            {i * (max / 10)}—
                        </span>
                    ))}
                </div>
                {/* Fluid/Mercury Fill */}
                <div 
                    className="absolute bottom-0 left-0 w-full bg-red-600 transition-all duration-700 ease-out shadow-lg shadow-red-500/50" 
                    style={{ height: `${fillPercentage}%`, background: 'linear-gradient(to top, #ef4444, #b91c1c)' }}
                ></div>
                {/* Bulb Bawah */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-10 h-10 bg-red-700 rounded-full border-2 border-red-900 shadow-xl z-20"></div>
            </div>
            {/* Label Nilai */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-yellow-300 text-sm px-3 py-1 rounded-full font-mono shadow-xl border border-yellow-500/50">
                {Number(value).toFixed(1)}°C
            </div>
        </div>
    );
};

export default ThermometerVisual;