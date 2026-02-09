import React from 'react';
import { formatCurrency, formatPercent, tolerantGet } from '../utils';

const Row = ({ label, base, basePct, prop, propPct, total, totalPct, isMain, isRed, pl = 0 }) => {
    const baseVal = base !== undefined ? base : 0;
    const propVal = prop !== undefined ? prop : 0;
    const totalVal = total !== undefined ? total : 0;

    return (
        <tr className={`group border-b border-slate-50 transition-colors ${isMain ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
            <td className={`p-4 font-bold text-slate-700 ${pl ? `pl-${pl}` : ''} ${isMain ? 'text-sm' : 'text-xs'}`}>{label}</td>
            <td className="p-4 text-right font-mono text-slate-600 border-r border-slate-50">{formatCurrency(baseVal)}</td>
            <td className="p-4 text-right font-bold text-slate-400 border-r border-slate-50">{basePct}</td>
            <td className={`p-4 text-right font-mono border-r border-slate-50 ${isRed ? 'text-rose-500' : 'text-emerald-600'} font-bold`}>
                {isRed && propVal > 0 ? '-' : ''}{formatCurrency(propVal)}
            </td>
            <td className="p-4 text-right font-bold text-slate-400 border-r border-slate-50">{propPct}</td>
            <td className={`p-4 text-right font-mono border-r border-slate-50 ${isRed ? 'text-rose-600' : 'text-indigo-600'} font-black ${isMain ? 'text-sm' : 'text-xs'}`}>
                {isRed && totalVal > 0 ? '-' : ''}{formatCurrency(totalVal)}
            </td>
            <td className="p-4 text-right font-black text-slate-800">{totalPct}</td>
        </tr>
    );
};

const PLTable = ({ eerr, dataSheets, propuesta, gastosOperativos, expanded, toggle }) => {
    const { eerrBase } = dataSheets;

    if (!expanded) return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-8">
            <button
                onClick={toggle}
                className="w-full p-6 flex justify-between items-center hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <h2 className="font-black text-slate-800 text-sm uppercase tracking-tight">Estado de Resultados Comparativo</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Matriz de Rendimiento Consolidada</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden sm:block text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neto Estimado</p>
                        <p className="font-black text-lg text-indigo-600 leading-none">{formatCurrency(eerr.gananciaNetaTotal)}</p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Ver Detalle</span>
                </div>
            </button>
        </div>
    );

    const getPct = (val, total) => total ? formatPercent((val / total) * 100) : '0%';

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-indigo-600 text-white">
                <div className="flex items-center gap-4">
                    <h2 className="font-black text-sm uppercase tracking-widest">Estructura de Pérdidas y Ganancias</h2>
                    <span className="bg-white/10 px-3 py-1 rounded text-[9px] font-black tracking-widest uppercase">Comparativo Real vs Simulado</span>
                </div>
                <button onClick={toggle} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="p-4 border-r border-slate-100 min-w-[200px]">Métrica Financiera</th>
                            <th className="p-4 text-right border-r border-slate-100">Base Dic-25</th>
                            <th className="p-4 text-right border-r border-slate-100">%</th>
                            <th className="p-4 text-right border-r border-slate-100">Simulación</th>
                            <th className="p-4 text-right border-r border-slate-100">%</th>
                            <th className="p-4 text-right border-r border-slate-100">Consolidado</th>
                            <th className="p-4 text-right">Target %</th>
                        </tr>
                    </thead>
                    <tbody className="font-semibold">
                        <Row
                            label="Ingresos por Servicios"
                            base={eerr.ingresoBase}
                            basePct="100%"
                            prop={propuesta.ventasTotales}
                            propPct="100%"
                            total={eerr.ingresoTotal}
                            totalPct="100%"
                            isMain
                        />
                        <Row
                            label="Costo Directo de Operación"
                            base={eerr.costoIngresoBase}
                            basePct={getPct(eerr.costoIngresoBase, eerr.ingresoBase)}
                            prop={propuesta.costosTotales}
                            propPct={getPct(propuesta.costosTotales, propuesta.ventasTotales)}
                            total={eerr.costoIngresosTotal}
                            totalPct={getPct(eerr.costoIngresosTotal, eerr.ingresoTotal)}
                            isRed
                        />
                        <Row
                            label="Ganancia Bruta"
                            base={eerr.gananciaBrutaBase}
                            basePct={getPct(eerr.gananciaBrutaBase, eerr.ingresoBase)}
                            prop={propuesta.ventasTotales - propuesta.costosTotales}
                            propPct={getPct(propuesta.ventasTotales - propuesta.costosTotales, propuesta.ventasTotales)}
                            total={eerr.gananciaBrutaTotal}
                            totalPct={getPct(eerr.gananciaBrutaTotal, eerr.ingresoTotal)}
                            isMain
                        />
                        <Row
                            label="Gastos de Estructura (OpEx)"
                            base={eerr.gastoOperacionBase}
                            basePct={getPct(eerr.gastoOperacionBase, eerr.ingresoBase)}
                            prop={0}
                            propPct="0%"
                            total={eerr.gastoOperacionTotal}
                            totalPct={getPct(eerr.gastoOperacionTotal, eerr.ingresoTotal)}
                            isRed
                            pl={6}
                        />
                        <Row
                            label="EBITDA (Ingreso Operación)"
                            base={tolerantGet(eerrBase, 'Ingreso de operación')}
                            basePct={getPct(tolerantGet(eerrBase, 'Ingreso de operación'), eerr.ingresoBase)}
                            prop={eerr.ingresoOperacionTotal - tolerantGet(eerrBase, 'Ingreso de operación')}
                            propPct={getPct(eerr.ingresoOperacionTotal - tolerantGet(eerrBase, 'Ingreso de operación'), propuesta.ventasTotales)}
                            total={eerr.ingresoOperacionTotal}
                            totalPct={formatPercent(eerr.margenOperacionPct)}
                            isMain
                        />
                        <Row
                            label="Otros Ingresos No Op."
                            base={eerr.otrosIngresosBase}
                            basePct={getPct(eerr.otrosIngresosBase, eerr.ingresoBase)}
                            prop={0}
                            propPct="0%"
                            total={eerr.otrosIngresosTotal}
                            totalPct={formatPercent((eerr.otrosIngresosTotal / eerr.ingresoTotal) * 100)}
                        />
                        <Row
                            label="Otros Gastos No Op."
                            base={eerr.otrosGastosBase}
                            basePct={getPct(eerr.otrosGastosBase, eerr.ingresoBase)}
                            prop={0}
                            propPct="0%"
                            total={eerr.otrosGastosTotal}
                            totalPct={formatPercent((eerr.otrosGastosTotal / eerr.ingresoTotal) * 100)}
                            isRed
                        />
                        <tr className="bg-slate-900 text-white">
                            <td className="p-5 font-black uppercase tracking-widest">Resultado Neto Proyectado</td>
                            <td className="p-5 text-right font-mono font-black">{formatCurrency(eerr.gananciaNetaBase)}</td>
                            <td className="p-5 text-right font-black">{formatPercent((eerr.gananciaNetaBase / (eerr.ingresoBase || 1)) * 100)}</td>
                            <td className="p-5 text-right font-mono font-black text-emerald-400">{formatCurrency(propuesta.margenBruto)}</td>
                            <td className="p-5 text-right font-black text-emerald-400">{formatPercent(propuesta.margenBrutoPct)}</td>
                            <td className="p-5 text-right font-mono font-black text-indigo-300 text-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border-l border-white/10">
                                {formatCurrency(eerr.gananciaNetaTotal)}
                            </td>
                            <td className="p-5 text-right font-black text-indigo-300 text-sm">
                                {formatPercent(eerr.margenNetoPct)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100">
                <div className="flex flex-wrap gap-8">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Delta Ingresos</span>
                        <span className="text-sm font-black text-emerald-600">+{formatCurrency(propuesta.ventasTotales)}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Delta Costos</span>
                        <span className="text-sm font-black text-rose-500">+{formatCurrency(propuesta.costosTotales)}</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Delta Neto Final</span>
                        <span className="text-sm font-black text-indigo-600">+{formatCurrency(eerr.gananciaNetaTotal - eerr.gananciaNetaBase)}</span>
                    </div>
                </div>

                <div className="text-center md:text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Eficiencia Operativa</div>
                    <div className="text-2xl font-black text-indigo-600 tracking-tighter">
                        {eerr.margenNetoPct.toFixed(1)}% <span className="text-slate-300 text-sm font-bold tracking-normal italic ml-2">Net Margin</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PLTable;
