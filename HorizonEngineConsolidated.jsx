import React, { useState, useEffect, useMemo } from 'react';

// --- CONSTANTS ---
const SHEET_ID = '1fJVmm7i5g1IfOLHDTByRM-W01pWIF46k7aDOYsH4UKA';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCxPqker3JsD9YKVDeTY5zOqmguQM10hpRAvUbjlEe3PUOHI8uScpLvAMQ4QvrSu7x/exec';

const GOALS = {
    VENTAS_TOTAL: 2195176117,
    RENOVACION: 1225673502,
    INCREMENTAL: 969002614
};

const DEFAULTS = {
    PCT_INDIRECTOS: 37,
    PCT_COSTO_LABORAL: 45,
    GASTOS_OPERATIVOS: 46539684.59,
    MARGEN_OBJETIVO: 25
};

// --- UTILS ---
const cleanNum = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    let s = String(val);
    s = s.replace(/[$€£\s]/g, '');
    s = s.replace(/[^\d,.\-]/g, '');
    if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else {
        s = s.replace(/\./g, '').replace(',', '.');
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
};

const normalizeKey = (k) => {
    if (!k && k !== 0) return '';
    const s = String(k).toLowerCase().trim();
    const accentMap = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n' };
    let out = s.replace(/[áéíóúñ]/g, m => accentMap[m]);
    out = out.replace(/[^a-z0-9]/g, '');
    return out;
};

const tolerantGet = (mapObj, key) => {
    if (!mapObj) return 0;
    const nk = normalizeKey(key);
    for (const k of Object.keys(mapObj)) {
        if (normalizeKey(k) === nk) return mapObj[k];
    }
    return mapObj[key] !== undefined ? mapObj[key] : 0;
};

const fetchSheet = async (sheetName) => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) return [];

    const parseCSVLine = (line) => {
        const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)|;(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
        return line.split(re).map(cell => cell.replace(/^"|"$/g, '').trim());
    };

    const headers = parseCSVLine(lines[0]);

    return lines.slice(1).map(line => {
        const cells = parseCSVLine(line);
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = cells[i] !== undefined ? cells[i] : '';
        });
        return obj;
    });
};

const formatCurrency = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

const formatNumber = (n) =>
    new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);

const formatPercent = (n) => `${n.toFixed(0)}%`;

// --- COMPONENTS ---

const DashboardHeader = ({
    gastosOperativos, setGastosOperativos,
    pctIndirectos, setPctIndirectos,
    pctCostoLaboral, setPctCostoLaboral,
    margenObjetivo, setMargenObjetivo
}) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase py-1">
                Horizon Finance <span className="text-slate-900/10">2026</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">
                Financial Intelligence Engine • Projection Matrix
            </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">
            {[
                { label: "OpEx", val: formatNumber(gastosOperativos), set: (v) => setGastosOperativos(v.replace(/\./g, '')), clr: "border-indigo-100 text-indigo-600" },
                { label: "Ind.", val: pctIndirectos, set: setPctIndirectos, unit: "%", clr: "border-purple-100 text-purple-600" },
                { label: "Lab.", val: pctCostoLaboral, set: setPctCostoLaboral, unit: "%", clr: "border-pink-100 text-pink-600" },
                { label: "Mgn.", val: margenObjetivo, set: setMargenObjetivo, unit: "%", clr: "border-slate-100 text-slate-600" }
            ].map(cfg => (
                <div key={cfg.label} className={`bg-white px-3 py-1.5 rounded-lg border ${cfg.clr}`}>
                    <span className="opacity-40 uppercase text-[9px] block">{cfg.label}</span>
                    <input
                        className="w-12 bg-transparent focus:outline-none"
                        value={cfg.val}
                        onChange={e => cfg.set(e.target.value)}
                    />{cfg.unit}
                </div>
            ))}
        </div>
    </div>
);

const Velocimetro = ({ titulo, objetivo, lineas, onAdd, onUpdate, onRemove, color, clientes }) => {
    const totalReal = lineas.reduce((sum, l) => sum + (Number(l.monto) || 0), 0);
    const pct = objetivo > 0 ? Math.min((totalReal / objetivo) * 100, 100) : 0;
    const angle = -90 + (pct * 1.8);
    const colorHex = pct >= 100 ? '#10b981' : pct >= 75 ? '#f59e0b' : pct >= 50 ? '#f97316' : '#ef4444';

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 flex flex-col items-center hover:shadow-xl transition-all">
            <h3 className="text-[10px] font-black mb-6 uppercase tracking-widest text-slate-400">{titulo}</h3>
            <div className="relative w-full flex justify-center mb-6">
                <svg viewBox="0 0 200 120" className="w-40 drop-shadow-xl">
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={colorHex} strokeWidth="20" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 251} 251`} style={{ transition: 'all 1s ease' }} />
                    <g transform={`rotate(${angle} 100 100)`} style={{ transition: 'all 1s ease' }}>
                        <line x1="100" y1="100" x2="100" y2="35" stroke={colorHex} strokeWidth="4" strokeLinecap="round" />
                    </g>
                    <circle cx="100" cy="100" r="8" fill="white" stroke={colorHex} strokeWidth="3" />
                </svg>
                <p className="absolute top-16 text-2xl font-black" style={{ color: colorHex }}>{pct.toFixed(0)}%</p>
            </div>
            <div className="w-full space-y-2 max-h-40 overflow-y-auto pr-1">
                {lineas.map(l => (
                    <div key={l.id} className="flex gap-2 items-center text-[10px]">
                        <select value={l.cliente} onChange={e => onUpdate(l.id, 'cliente', e.target.value)} className="flex-1 bg-slate-50 border-none rounded p-1 font-bold">{clientes.map(c => <option key={c}>{c}</option>)}</select>
                        <input value={l.monto === '' ? '' : formatNumber(l.monto)} onChange={e => onUpdate(l.id, 'monto', e.target.value.replace(/\D/g, ''))} className="w-16 bg-slate-50 border-none rounded p-1 text-right font-black" />
                        <button onClick={() => onRemove(l.id)} className="text-slate-300 hover:text-rose-500">✕</button>
                    </div>
                ))}
            </div>
            <button onClick={onAdd} className="mt-4 w-full bg-slate-900 text-white text-[9px] font-black uppercase py-2 rounded-lg">+</button>
        </div>
    );
};

// --- MAIN APP ---

export default function App() {
    const [dataSheets, setDataSheets] = useState({ preciosNuevos: [], clientes: [], eerrBase: {}, loading: true });
    const [escenarios, setEscenarios] = useState([]);
    const [historial, setHistorial] = useState([]);

    // Config States
    const [pctInd, setPctInd] = useState(DEFAULTS.PCT_INDIRECTOS);
    const [pctLab, setPctLab] = useState(DEFAULTS.PCT_COSTO_LABORAL);
    const [gastosOp, setGastosOp] = useState(DEFAULTS.GASTOS_OPERATIVOS);
    const [mgnObj, setMgnObj] = useState(DEFAULTS.MARGEN_OBJETIVO);

    // Tracking Lines
    const [lv, setLv] = useState([{ id: 1, cliente: '', monto: '' }]);
    const [lr, setLr] = useState([{ id: 1, cliente: '', monto: '' }]);
    const [li, setLi] = useState([{ id: 1, cliente: '', monto: '' }]);

    const [ready, setReady] = useState(false);
    const [showHist, setShowHist] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const [precios, clientes, cfg, eerr] = await Promise.all([
                    fetchSheet('PreciosNuevos'), fetchSheet('Clientes'), fetchSheet('Configuracion'), fetchSheet('EERRBase')
                ]);

                const config = {}; cfg.forEach(r => config[r['Parámetro'] || Object.values(r)[0]] = cleanNum(Object.values(r)[1]));
                const eerrObj = {}; eerr.forEach(r => eerrObj[Object.values(r)[0]] = cleanNum(Object.values(r)[1]));

                setDataSheets({
                    preciosNuevos: precios.map(p => ({
                        categoria: p['Categoria'] || p['Categoría'] || Object.values(p)[0],
                        tipo: p['Tipo'] || Object.values(p)[1],
                        valor: cleanNum(p['Valor (ARS)'] || Object.values(p)[2]),
                        sueldo: cleanNum(p['Sueldo Sugerido (ARS)'] || Object.values(p)[3]),
                        fijo: cleanNum(p['Costo Fijo (ARS)'] || Object.values(p)[4])
                    })),
                    clientes: clientes.map(c => Object.values(c)[0]).filter(Boolean),
                    eerrBase: eerrObj,
                    loading: false
                });

                setReady(true);
            } catch (e) { console.error(e); setDataSheets(p => ({ ...p, loading: false })); }
        };
        init();
    }, []);

    const calculateEERR = useMemo(() => {
        let simV = 0, simC = 0;
        escenarios.forEach(e => {
            const p = dataSheets.preciosNuevos[e.tipoIdx]; if (!p) return;
            const v = e.cantidad * e.ventaUnit;
            let c = 0;
            if (p.categoria.toLowerCase().includes('staff')) {
                const s = e.cantidad * e.sueldoBruto;
                c = s + (s * pctLab / 100) + (s * pctInd / 100);
            } else {
                const f = e.cantidad * p.fijo;
                c = f + (f * pctInd / 100);
            }
            simV += v; simC += c;
        });

        const baseV = tolerantGet(dataSheets.eerrBase, 'Ingreso');
        const baseC = tolerantGet(dataSheets.eerrBase, 'Costo de ingresos');
        const baseN = tolerantGet(dataSheets.eerrBase, 'Ganancia neta');

        return {
            simV, simC, simN: simV - simC,
            totalV: baseV + simV, totalC: baseC + simC,
            totalN: (baseV + simV) - (baseC + simC) - gastosOp + tolerantGet(dataSheets.eerrBase, 'Más otros ingresos') - tolerantGet(dataSheets.eerrBase, 'Menos gastos de otro tipo'),
            baseN
        };
    }, [escenarios, pctInd, pctLab, gastosOp, dataSheets]);

    if (dataSheets.loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black animate-pulse">HORIZON ENGINE V2.0</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans selection:bg-indigo-100">
            <div className="max-w-7xl mx-auto">
                <DashboardHeader
                    gastosOperativos={gastosOp} setGastosOperativos={setGastosOp}
                    pctIndirectos={pctInd} setPctIndirectos={setPctInd}
                    pctCostoLaboral={pctLab} setPctCostoLaboral={setPctLab}
                    margenObjetivo={mgnObj} setMargenObjetivo={setMgnObj}
                />

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-100">
                    <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Escenarios de Matrix</h2>
                        <button onClick={() => setEscenarios(p => [...p, { id: Date.now(), cliente: dataSheets.clientes[0], tipoIdx: 0, cantidad: 1, sueldoBruto: dataSheets.preciosNuevos[0].sueldo, ventaUnit: dataSheets.preciosNuevos[0].valor }])} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">+ Agregar</button>
                    </div>
                    <table className="w-full text-left text-xs">
                        <thead className="text-[10px] uppercase font-black text-slate-400 bg-slate-50/30">
                            <tr><th className="p-4">Cliente</th><th className="p-4">Servicio</th><th className="p-4 text-center">Qty</th><th className="p-4 text-right">Venta</th><th className="p-4 text-right">Sueldo</th><th className="p-4 text-center">Neto</th><th className="p-4"></th></tr>
                        </thead>
                        <tbody>
                            {escenarios.map(e => (
                                <tr key={e.id} className="border-t border-slate-50 font-bold text-slate-700">
                                    <td className="p-4"><select className="bg-transparent" value={e.cliente} onChange={ev => setEscenarios(prev => prev.map(x => x.id === e.id ? { ...x, cliente: ev.target.value } : x))}>{dataSheets.clientes.map(c => <option key={c}>{c}</option>)}</select></td>
                                    <td className="p-4"><select className="text-indigo-600 font-black" value={e.tipoIdx} onChange={ev => { const i = Number(ev.target.value); setEscenarios(prev => prev.map(x => x.id === e.id ? { ...x, tipoIdx: i, sueldoBruto: dataSheets.preciosNuevos[i].sueldo, ventaUnit: dataSheets.preciosNuevos[i].valor } : x)) }}>{dataSheets.preciosNuevos.map((p, i) => <option key={i} value={i}>{p.categoria}</option>)}</select></td>
                                    <td className="p-4 text-center"><input type="number" className="w-8 text-center" value={e.cantidad} onChange={ev => setEscenarios(prev => prev.map(x => x.id === e.id ? { ...x, cantidad: Number(ev.target.value) } : x))} /></td>
                                    <td className="p-4 text-right text-emerald-600 font-black">${formatNumber(e.ventaUnit)}</td>
                                    <td className="p-4 text-right text-indigo-400">${formatNumber(e.sueldoBruto)}</td>
                                    <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded text-[9px]">${formatNumber(e.cantidad * e.ventaUnit)}</span></td>
                                    <td className="p-4 text-right"><button onClick={() => setEscenarios(prev => prev.filter(x => x.id !== e.id))} className="text-slate-200 hover:text-rose-500">✕</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-900 text-white rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Total Projected Net</span>
                            <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(calculateEERR.totalN)}</h2>
                            <div className="flex gap-4 mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Base: {formatCurrency(calculateEERR.baseN)}</span>
                                <span className="text-emerald-400">Delta: +{formatCurrency(calculateEERR.totalN - calculateEERR.baseN)}</span>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Health Matrix</span>
                            <div className="text-3xl font-black text-white">{((calculateEERR.totalN / calculateEERR.totalV) * 100).toFixed(1)}% <span className="text-xs text-indigo-400 tracking-normal opacity-50 ml-1">Margin</span></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Velocimetro titulo="Total Growth" objetivo={GOALS.VENTAS_TOTAL} lineas={lv} onAdd={() => setLv(p => [...p, { id: Date.now(), monto: '' }])} onUpdate={(id, k, v) => setLv(prev => prev.map(x => x.id === id ? { ...x, [k]: v } : x))} onRemove={id => setLv(p => p.filter(x => x.id !== id))} color="#6366f1" clientes={dataSheets.clientes} />
                    <Velocimetro titulo="Retention" objetivo={GOALS.RENOVACION} lineas={lr} onAdd={() => setLr(p => [...p, { id: Date.now(), monto: '' }])} onUpdate={(id, k, v) => setLr(prev => prev.map(x => x.id === id ? { ...x, [k]: v } : x))} onRemove={id => setLr(p => p.filter(x => x.id !== id))} color="#ec4899" clientes={dataSheets.clientes} />
                    <Velocimetro titulo="Incremental" objetivo={GOALS.INCREMENTAL} lineas={li} onAdd={() => setLi(p => [...p, { id: Date.now(), monto: '' }])} onUpdate={(id, k, v) => setLi(prev => prev.map(x => x.id === id ? { ...x, [k]: v } : x))} onRemove={id => setLi(p => p.filter(x => x.id !== id))} color="#3b82f6" clientes={dataSheets.clientes} />
                </div>
            </div>
        </div>
    );
}
