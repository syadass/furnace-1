import React from 'react';
import ThermometerVisual from './thermometerVisual';
import FurnaceAssembly from './furnaceAssembly';

const FurnaceCard = ({
    furnace,
    index,
    status,
    user,
    currentData,
    setpoints,
    onStartSession,
    onEndSession,
    onSetpointChange,
    onSetpointSubmit
}) => {
    const isLockedByMe = status?.is_active && status?.active_userID === user?.id;
    const isLockedByOther = status?.is_active && status?.active_userID !== user?.id;
    const isViewer = user?.role === 'viewer';

    // PERBAIKAN: Baca state 'setpoints' dengan aman.
    // Ini mencegah error jika setpoints[furnace] belum ada.
    const currentSetpoint = setpoints[furnace] || { suhu: "" };

    return (
        <div className={`relative p-4 ${isLockedByOther ? 'grayscale-locked' : ''}`} style={{ minWidth: '450px', minHeight: '400px' }} >
            {isLockedByOther && (
                <div className="absolute top-2 right-2 flex items-center justify-center z-30">
                    <p className="text-sm font-bold p-2 bg-gray-700 text-white rounded-lg shadow-xl border border-gray-500">
                        LOCKED: {status.active_user_fullname || `User ID ${status.active_userID}`}
                    </p>
                </div>
            )}
            <div className="flex justify-center items-start gap-8">
                <div className="relative z-10 pt-16">
                    <ThermometerVisual value={currentData.suhu} max={100} />
                </div>
                <div className="flex flex-col items-center gap-4 pt-16 z-10">
                    <button onClick={() => onStartSession(furnace)} disabled={status?.is_active || isLockedByOther || isViewer} className={`w-12 h-12 rounded-full text-white text-lg font-bold ${status?.is_active || isLockedByOther || isViewer ? 'bg-gray-400 border-gray-600' : 'bg-green-400'} shadow-[inset_0_4px_6px_rgba(255,255,255,0.6),0_4px_6px_rgba(0,0,0,0.4)] border-4 ${status?.is_active || isLockedByOther || isViewer ? 'border-gray-600' : 'border-white'} transition-all transform active:translate-y-1 active:shadow-[inset_0_2px_3px_rgba(255,255,255,0.5),0_2px_3px_rgba(0,0,0,0.3)] hover:brightness-110`} style={{ background: status?.is_active || isLockedByOther || isViewer ? '' : 'radial-gradient(circle at 30% 30%, #a6f600, #22c700 70%)' }}>
                        <span className="material-icons text-xl">ON</span>
                    </button>
                    <button onClick={() => onEndSession(furnace)} disabled={!isLockedByMe || isLockedByOther || isViewer} className={`w-12 h-12 rounded-full text-white text-lg font-bold ${!isLockedByMe || isLockedByOther || isViewer ? 'bg-gray-400 border-gray-600' : 'bg-red-500'} shadow-[inset_0_4px_6px_rgba(255,255,255,0.6),0_4px_6px_rgba(0,0,0,0.4)] border-4 ${!isLockedByMe || isLockedByOther || isViewer ? 'border-gray-600' : 'border-white'} transition-all transform active:translate-y-1 active:shadow-[inset_0_2px_3px_rgba(255,255,255,0.5),0_2px_3px_rgba(0,0,0,0.3)] hover:brightness-110`} style={{ background: !isLockedByMe || isLockedByOther || isViewer ? '' : 'radial-gradient(circle at 30% 30%, #ff6b6b, #c70000 70%)' }}>
                        <span className="material-icons text-xl">OFF</span>
                    </button>
                </div>
                <div className="flex flex-col items-center">
                    <FurnaceAssembly furnaceName={`Furnace ${index + 1}`} pressureValue={currentData.tekanan} pressureMax={10} isActive={status?.is_active} />
                    <div className="bg-gray-100 p-4 rounded-lg shadow-inner w-56 mt-4 border border-gray-300">
                        <p className={`font-bold text-center text-lg mb-2 ${isLockedByMe ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>Setpoint</p>
                        <div className="flex flex-col gap-2">
                            {/* PERBAIKAN: Gunakan 'currentSetpoint' yang sudah aman */}
                            <input 
                                type="number" 
                                placeholder="Suhu (°C)" 
                                value={currentSetpoint.suhu} 
                                onChange={(e) => onSetpointChange(furnace, "suhu", e.target.value)} 
                                className="border border-gray-400 rounded-md p-2 text-center disabled:bg-gray-200 disabled:cursor-not-allowed text-sm" 
                                disabled={!isLockedByMe || isLockedByOther || isViewer} 
                            />
                        </div>
                        <button onClick={() => onSetpointSubmit(furnace)} className="mt-3 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm" disabled={!isLockedByMe || isLockedByOther || isViewer}>Kirim</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FurnaceCard;