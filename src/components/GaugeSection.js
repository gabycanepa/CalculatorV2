import React from 'react';
import { formatCurrency, formatNumber } from '../utils';

const Velocimetro = ({ titulo, objetivo, lineas, agregarLineaVenta, actualizarLineaVenta, eliminarLineaVenta, color, clientes }) => {
    const totalReal = lineas.reduce((sum, l) => sum + (Number(l.monto) || 0), 0);
    const pctCumplimiento = objetivo > 0 ? Math.min((totalReal / objetivo) * 100, 100) : 0;
    const angle = -90 + (pctCumplimiento * 1.8);

    const totalArcLength = 251.2;
    const filledLength = (pctCumplimiento / 100) * totalArcLength;
    const gapLength = totalArcLength - filledLength;

    const getColor = () => {
        if (pctCumplimiento >= 100) return '#10b981'; // emerald-500
        if (pctCumplimiento >= 75) return '#f59e0b'; // amber-500
        if (pctCumplimiento >= 50) return '#f97316'; // orange-500
        return '#ef4444'; // red-500
    };

    const currentColor = getColor();

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col items-center group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="w-12 h-1.5 rounded-full mb-6" style={{ backgroundColor: color }}></div>
            <h3 className="text-[10px] font-black text-center mb-8 uppercase tracking-[0.2em] text-slate-400">{titulo}</h3>

            <div className="relative w-full flex justify-center mb-10">
                <svg viewBox="0 0 200 120" className="w-full max-w-[200px] drop-shadow-2xl">
                    {/* Track Background */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />

                    {/* Progress shadow path (the grey part of the remaining arc) */}
                    {pctCumplimiento < 100 && (
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={`${gapLength} ${totalArcLength}`}
                            strokeDashoffset={`-${filledLength}`}
                            style={{ transition: 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        />
                    )}

                    {/* Active Progress Path */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={currentColor}
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray={`${filledLength} ${totalArcLength}`}
                        style={{ transition: 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    />

                    {/* Needle */}
                    <g transform={`rotate(${angle} 100 100)`} style={{ transition: 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        <line x1="100" y1="100" x2="100" y2="35" stroke={currentColor} strokeWidth="4" strokeLinecap="round" />
                        <path d="M 95 60 L 100 30 L 105 60 Z" fill={currentColor} />
                    </g>

                    <circle cx="100" cy="100" r="10" fill="white" stroke={currentColor} strokeWidth="4" />
                    <circle cx="100" cy="100" r="4" fill={currentColor} />
                </svg>

                <div className="absolute top-20 flex flex-col items-center">
                    <p className="text-4xl font-black tracking-tighter" style={{ color: currentColor }}>{pctCumplimiento.toFixed(1)}%</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Status</p>
                </div>
            </div>

            <div className="w-full space-y-4 bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Goal 2026</span>
                        <span className="text-sm font-black text-slate-800">{formatNumber(objetivo)}</span>
                    </div>
                    <button
                        onClick={agregarLineaVenta}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-90"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {lineas.map((linea) => (
                        <div key={linea.id} className="flex gap-2 items-center group/line">
                            <select
                                value={linea.cliente}
                                onChange={(e) => actualizarLineaVenta(linea.id, 'cliente', e.target.value)}
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none appearance-none cursor-pointer"
                            >
                                {clientes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input
                                type="text"
                                value={linea.monto === '' ? '' : formatNumber(linea.monto)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\./g, '').replace(/\s/g, '');
                                    actualizarLineaVenta(linea.id, 'monto', raw === '' ? '' : parseFloat(raw) || 0);
                                }}
                                className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-right"
                                placeholder="0"
                            />
                            <button
                                onClick={() => eliminarLineaVenta(linea.id)}
                                className="opacity-0 group-hover/line:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pt-5 border-t border-slate-200 mt-2 flex justify-between items-center">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Consolidado</span>
                        <span className="text-xs font-black text-indigo-600">{formatCurrency(totalReal)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Gap</span>
                        <span className={`text-xs font-black ${objetivo - totalReal > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {formatCurrency(objetivo - totalReal)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GaugeSection = ({
    goals,
    lineasVentaTotal, setLineasVentaTotal,
    lineasRenovacion, setLineasRenovacion,
    lineasIncremental, setLineasIncremental,
    clientes
}) => {
    const handleUpdate = (setter, id, campo, valor) => {
        setter(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l));
    };

    const handleAdd = (setter) => {
        setter(prev => [...prev, { id: Date.now(), cliente: clientes[0] || '', monto: '' }]);
    };

    const handleRemove = (setter, id) => {
        setter(prev => prev.filter(l => l.id !== id));
    };

    return (
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Performance Tracking Matrix</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Velocimetro
                    titulo="Total Strategic Volume"
                    objetivo={goals.VENTAS_TOTAL}
                    lineas={lineasVentaTotal}
                    agregarLineaVenta={() => handleAdd(setLineasVentaTotal)}
                    actualizarLineaVenta={(id, k, v) => handleUpdate(setLineasVentaTotal, id, k, v)}
                    eliminarLineaVenta={(id) => handleRemove(setLineasVentaTotal, id)}
                    color="#6366f1"
                    clientes={clientes}
                />
                <Velocimetro
                    titulo="Portfolio Renewal"
                    objetivo={goals.RENOVACION}
                    lineas={lineasRenovacion}
                    agregarLineaVenta={() => handleAdd(setLineasRenovacion)}
                    actualizarLineaVenta={(id, k, v) => handleUpdate(setLineasRenovacion, id, k, v)}
                    eliminarLineaVenta={(id) => handleRemove(setLineasRenovacion, id)}
                    color="#ec4899"
                    clientes={clientes}
                />
                <Velocimetro
                    titulo="Incremental Growth"
                    objetivo={goals.INCREMENTAL}
                    lineas={lineasIncremental}
                    agregarLineaVenta={() => handleAdd(setLineasIncremental)}
                    actualizarLineaVenta={(id, k, v) => handleUpdate(setLineasIncremental, id, k, v)}
                    eliminarLineaVenta={(id) => handleRemove(setLineasIncremental, id)}
                    color="#3b82f6"
                    clientes={clientes}
                />
            </div>
        </div>
    );
};

export default GaugeSection;
