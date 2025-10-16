import React from 'react';

const PressureGaugeVisual = ({ value = 0, max = 10 }) => {
    const angle = Math.max(-135, Math.min((value / max) * 270 - 135, 135));
    return (
        <div className="relative p-2 rounded-full gauge-casing-3d">
            <div 
                className="w-24 h-24 bg-gray-800 border-4 border-gray-600 rounded-full flex items-center justify-center shadow-inner relative"
                style={{ background: 'radial-gradient(circle at 50% 50%, #4b5563 0%, #1f2937 100%)', transform: 'translateZ(0)' }}
            >
                {/* Faceplate */}
                <div className="absolute inset-1.5 bg-gray-100 rounded-full border border-gray-300 shadow-lg">
                    {/* Skala */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-135deg)' }}>
                            {/* Garis Skala */}
                            {[...Array(28)].map((_, i) => (
                                <line 
                                    key={i}
                                    x1="50" y1="5" x2="50" y2={i % 5 === 0 ? "10" : "8"} 
                                    stroke={i % 5 === 0 ? "#1f2937" : "#4b5563"} 
                                    strokeWidth={i % 5 === 0 ? "1.5" : "1"}
                                    transform={`rotate(${(i / 27) * 270}, 50, 50)`}
                                />
                            ))}
                            {/* Nilai Skala */}
                            {[...Array(11)].map((_, i) => {
                                const val = i * (max / 10);
                                const valAngle = (i / 10) * 270 - 135;
                                const x = 50 + 35 * Math.cos((valAngle + 90) * (Math.PI / 180));
                                const y = 50 + 35 * Math.sin((valAngle + 90) * (Math.PI / 180));
                                return (
                                    <text 
                                        key={i} 
                                        x={x} y={y} 
                                        fontSize="7" 
                                        textAnchor="middle" 
                                        dominantBaseline="middle" 
                                        fill="#1f2937"
                                        transform={`rotate(${valAngle + 180}, ${x}, ${y})`}
                                    >
                                        {val}
                                    </text>
                                );
                            })}
                        </svg>
                    </div>
                    {/* Needle/Jarum */}
                    <div 
                        className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-1 h-10 bg-red-600 origin-bottom transition-transform duration-500 z-10 rounded-t-full shadow-lg" 
                        style={{ 
                            transform: `translateX(-50%) rotate(${angle}deg)`, 
                            transformOrigin: 'bottom center'
                        }}
                    ></div>
                    {/* Center Pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full z-20 border border-white"></div>
                </div>
            </div>
            {/* Label Nilai */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-800 bg-gray-200 px-2 py-1 rounded-md shadow-xl border border-gray-400">
                {Number(value).toFixed(2)} bar
            </span>
        </div>
    );
};

export default PressureGaugeVisual;