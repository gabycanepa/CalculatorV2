import React from 'react';
import { formatCurrency } from '../utils';

const HistoryPanel = ({ historial, setHistorial, cargarEscenario, close }) => {
    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                    <h2 className="font-black text-slate-800 text-sm uppercase tracking-tight">Timeline de Escenarios Cloud</h2>
                </div>
                <button onClick={close} className="text-slate-400 hover:text-slate-600 transition p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {historial.length === 0 ? (
                    <div className="col-span-full py-12 text-center">
                        <div className="text-slate-300 text-5xl mb-4 text-center">📭</div>
                        <p className="text-slate-400 text-sm font-medium italic">No se encontraron registros en la nube de Horizon.</p>
                    </div>
                ) : (
                    historial.map(item => (
                        <div key={item.id} className="group relative bg-slate-50/50 border border-slate-100 rounded-xl p-5 hover:border-indigo-400 hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-black text-slate-800 text-sm uppercase truncate max-w-[80%]">{item.nombre}</h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('¿Eliminar este escenario?')) setHistorial(prev => prev.filter(h => h.id !== item.id));
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                <p className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase">{item.fecha}</p>
                            </div>

                            <div className="space-y-2 mb-5">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Venta Sim.</span>
                                    <span className="font-black text-emerald-600 text-xs">{formatCurrency(item.eerr?.propuesta?.ventasTotales || 0)}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Neto Proy.</span>
                                    <span className="font-black text-indigo-600 text-xs">{formatCurrency(item.eerr?.gananciaNetaTotal || 0)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => cargarEscenario(item)}
                                className="w-full bg-white border border-slate-200 text-slate-600 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300"
                            >
                                Implementar Escenario
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;
