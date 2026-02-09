import React from 'react';
import { formatCurrency, formatNumber } from '../utils';

const ScenarioTable = ({
    escenarios, setEscenarios,
    precios, clientes,
    pctCostoLaboral, pctIndirectos, margenObjetivo,
    agregarFila, actualizarFila, limpiarTodo
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-slate-50/80 to-indigo-50/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-black text-slate-800 text-sm uppercase tracking-tight">Simulación de Propuestas</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Modelador de Servicios & Staffing</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={limpiarTodo}
                        className="flex-1 sm:flex-none text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 transition"
                    >
                        Limpiar Base
                    </button>
                    <button
                        onClick={agregarFila}
                        className="flex-1 sm:flex-none bg-indigo-600 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all duration-300 active:scale-95"
                    >
                        + Nueva Línea
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                            <th className="p-5">Entidad/Cliente</th>
                            <th className="p-5">Matriz de Servicio</th>
                            <th className="p-5 text-center w-24">QTY</th>
                            <th className="p-5 text-right whitespace-nowrap">Venta Unit</th>
                            <th className="p-5 text-right whitespace-nowrap">Sueldo Bruto</th>
                            <th className="p-5 text-right">Resultado</th>
                            <th className="p-5 text-center">Margen</th>
                            <th className="p-5 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-semibold">
                        {escenarios.map(e => {
                            const p = precios[e.tipoIdx];
                            const isStaff = p && (p.categoria || '').toLowerCase().includes('staff');
                            let costoTotal = 0;
                            if (p) {
                                if (isStaff) {
                                    const sueldo = (Number(e.cantidad) || 0) * (Number(e.sueldoBruto) || 0);
                                    costoTotal = sueldo + (sueldo * pctCostoLaboral / 100) + (sueldo * pctIndirectos / 100);
                                } else {
                                    const base = (Number(e.cantidad) || 0) * (Number(p.costoFijo) || 0);
                                    costoTotal = base + (base * pctIndirectos / 100);
                                }
                            }
                            const venta = (Number(e.cantidad) || 0) * (Number(e.ventaUnit) || 0);
                            const res = venta - costoTotal;
                            const mgn = venta > 0 ? (res / venta) * 100 : 0;

                            return (
                                <tr key={e.id} className="group border-t border-slate-50 hover:bg-indigo-50/20 transition-colors duration-200">
                                    <td className="p-5">
                                        <select
                                            value={e.cliente}
                                            onChange={(ev) => actualizarFila(e.id, 'cliente', ev.target.value)}
                                            className="bg-transparent focus:outline-none font-bold text-slate-700 w-full appearance-none cursor-pointer"
                                        >
                                            {clientes.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-5">
                                        <select
                                            value={e.tipoIdx}
                                            onChange={(ev) => actualizarFila(e.id, 'tipoIdx', ev.target.value)}
                                            className="bg-indigo-50 group-hover:bg-white text-indigo-700 px-3 py-1.5 rounded-lg border border-transparent group-hover:border-indigo-100 focus:outline-none font-black text-[10px] uppercase w-full cursor-pointer transition-all"
                                        >
                                            {precios.map((p, i) => <option key={i} value={i}>{p.categoria} - {p.tipo}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-5 text-center">
                                        <input
                                            type="number"
                                            value={e.cantidad}
                                            onChange={(ev) => actualizarFila(e.id, 'cantidad', ev.target.value)}
                                            className="w-12 text-center bg-slate-50 rounded-lg py-1.5 font-black text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                                            min="0"
                                        />
                                    </td>
                                    <td className="p-5 text-right">
                                        <input
                                            type="text"
                                            value={formatNumber(e.ventaUnit)}
                                            onChange={(ev) => {
                                                const val = ev.target.value.replace(/\D/g, '');
                                                actualizarFila(e.id, 'ventaUnit', val === '' ? 0 : Number(val));
                                            }}
                                            className="w-32 text-right bg-emerald-50 text-emerald-700 font-black rounded-lg py-1.5 px-3 border border-transparent focus:border-emerald-200 focus:outline-none transition-all"
                                        />
                                    </td>
                                    <td className="p-5 text-right">
                                        {isStaff ? (
                                            <input
                                                type="text"
                                                value={formatNumber(e.sueldoBruto)}
                                                onChange={(ev) => {
                                                    const val = ev.target.value.replace(/\D/g, '');
                                                    actualizarFila(e.id, 'sueldoBruto', val === '' ? 0 : Number(val));
                                                }}
                                                className="w-28 text-right bg-indigo-50 text-indigo-700 font-black rounded-lg py-1.5 px-3 border border-transparent focus:border-indigo-200 focus:outline-none transition-all"
                                            />
                                        ) : (
                                            <span className="text-slate-200 font-black">-</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right font-black text-slate-800">
                                        <div className="flex flex-col items-end">
                                            <span>{formatCurrency(res)}</span>
                                            <span className="text-[9px] text-slate-400 font-bold">COSTO: {formatCurrency(costoTotal)}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <span className={`inline-block w-16 text-[10px] font-black px-2 py-1.5 rounded-lg shadow-sm ${mgn >= margenObjetivo ? 'bg-emerald-100 text-emerald-700' :
                                                mgn >= 15 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {mgn.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <button
                                            onClick={() => setEscenarios(prev => prev.filter(x => x.id !== e.id))}
                                            className="text-slate-200 hover:text-rose-500 transition-colors p-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {escenarios.length === 0 && (
                <div className="p-12 text-center bg-slate-50/20">
                    <p className="text-slate-400 font-medium italic">Inicie una simulación agregando una nueva línea de servicio.</p>
                </div>
            )}
        </div>
    );
};

export default ScenarioTable;
