import React, { useState, useEffect, useMemo } from 'react';

// Core Constants & Utils
import { SHEET_ID, SCRIPT_URL, GOALS, DEFAULTS } from './constants';
import {
    cleanNum, normalizeKey, tolerantGet, fetchSheet,
    formatCurrency, formatNumber
} from './utils';

// UI Components
import DashboardHeader from './components/DashboardHeader';
import ScenarioTable from './components/ScenarioTable';
import HistoryPanel from './components/HistoryPanel';
import PLTable from './components/PLTable';
import GaugeSection from './components/GaugeSection';

function App() {
    // --- STATE MANAGEMENT ---
    const [dataSheets, setDataSheets] = useState({
        preciosNuevos: [],
        clientes: [],
        config: {},
        eerrBase: {},
        eerrBaseNorm: {},
        loading: true,
        error: null
    });

    const [escenarios, setEscenarios] = useState([]);
    const [historial, setHistorial] = useState([]);

    const [pctIndirectos, setPctIndirectos] = useState(DEFAULTS.PCT_INDIRECTOS);
    const [pctCostoLaboral, setPctCostoLaboral] = useState(DEFAULTS.PCT_COSTO_LABORAL);
    const [gastosOperativos, setGastosOperativos] = useState(DEFAULTS.GASTOS_OPERATIVOS);
    const [margenObjetivo, setMargenObjetivo] = useState(DEFAULTS.MARGEN_OBJETIVO);

    const [isReady, setIsReady] = useState(false);
    const [isLoadingFromCloud, setIsLoadingFromCloud] = useState(false);

    // Tracking Lines State
    const [lineasVentaTotal, setLineasVentaTotal] = useState(() => {
        try { return JSON.parse(localStorage.getItem('hzn_lineasVenta')) || [{ id: 1, cliente: '', monto: '' }]; }
        catch (e) { return [{ id: 1, cliente: '', monto: '' }]; }
    });
    const [lineasRenovacion, setLineasRenovacion] = useState(() => {
        try { return JSON.parse(localStorage.getItem('hzn_lineasReno')) || [{ id: 1, cliente: '', monto: '' }]; }
        catch (e) { return [{ id: 1, cliente: '', monto: '' }]; }
    });
    const [lineasIncremental, setLineasIncremental] = useState(() => {
        try { return JSON.parse(localStorage.getItem('hzn_lineasIncr')) || [{ id: 1, cliente: '', monto: '' }]; }
        catch (e) { return [{ id: 1, cliente: '', monto: '' }]; }
    });

    // UI States
    const [mostrarHistorial, setMostrarHistorial] = useState(false);
    const [mostrarEERR, setMostrarEERR] = useState(true);

    // --- INITIAL DATA LOAD ---
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [precios, clientes, cfg, eerr] = await Promise.all([
                    fetchSheet(SHEET_ID, 'PreciosNuevos'),
                    fetchSheet(SHEET_ID, 'Clientes'),
                    fetchSheet(SHEET_ID, 'Configuracion'),
                    fetchSheet(SHEET_ID, 'EERRBase')
                ]);

                // Process Config
                const configObj = {};
                cfg.forEach(row => {
                    const key = row['Parámetro'] ?? row['Parametro'] ?? row['Key'] ?? Object.values(row)[0];
                    const valCell = row['Valor'] ?? row['Value'] ?? Object.values(row)[1];
                    if (key) configObj[String(key).trim()] = cleanNum(valCell);
                });

                // Process EERR Base
                const eerrObj = {};
                eerr.forEach(row => {
                    const concepto = row['Concepto'] ?? Object.values(row)[0];
                    const montoCell = row['Monto (ARS)'] ?? row['Monto'] ?? Object.values(row)[1];
                    if (concepto !== undefined) {
                        eerrObj[String(concepto).trim()] = cleanNum(montoCell);
                    }
                });

                const eerrNorm = {};
                Object.keys(eerrObj).forEach(k => { eerrNorm[normalizeKey(k)] = eerrObj[k]; });

                // Process Prices
                const preciosProcesados = precios.map(p => ({
                    categoria: p['Categoria'] ?? p['Categoría'] ?? Object.values(p)[0] ?? 'Otros',
                    tipo: p['Tipo'] ?? Object.values(p)[1] ?? 'Default',
                    valor: cleanNum(p['Valor (ARS)'] ?? p['Valor'] ?? Object.values(p)[2]),
                    sueldoSugerido: cleanNum(p['Sueldo Sugerido (ARS)'] ?? p['Sueldo Sugerido'] ?? Object.values(p)[3]),
                    costoFijo: cleanNum(p['Costo Fijo (ARS)'] ?? p['Costo Fijo'] ?? Object.values(p)[4])
                }));

                const clientesProcesados = clientes.map(c => {
                    return c['Cliente'] ?? c['cliente'] ?? c['Name'] ?? Object.values(c)[0] ?? '';
                }).filter(Boolean);

                setDataSheets({
                    preciosNuevos: preciosProcesados,
                    clientes: clientesProcesados,
                    config: configObj,
                    eerrBase: eerrObj,
                    eerrBaseNorm: eerrNorm,
                    loading: false,
                    error: null
                });

                // Sync local settings with Sheets config if not already set
                setPctIndirectos(configObj['% Indirectos'] ?? configObj['Indirectos'] ?? 37);
                setPctCostoLaboral(configObj['% Costo Laboral'] ?? configObj['Costo Laboral'] ?? 45);
                setGastosOperativos(configObj['Gastos Operativos'] ?? DEFAULTS.GASTOS_OPERATIVOS);
                setMargenObjetivo(configObj['Margen Objetivo (%)'] ?? 25);

                // Fetch Cloud History
                loadCloudHistory();

                // Initial default scenario
                if (preciosProcesados.length > 0 && escenarios.length === 0) {
                    setEscenarios([{
                        id: Date.now(),
                        cliente: clientesProcesados[0] || 'Nuevo Cliente',
                        tipoIdx: 0,
                        cantidad: 1,
                        sueldoBruto: preciosProcesados[0].sueldoSugerido || 0,
                        ventaUnit: preciosProcesados[0].valor || 0
                    }]);
                }

                setIsReady(true);
            } catch (error) {
                console.error('Error loading sheets:', error);
                setDataSheets(prev => ({ ...prev, loading: false, error: 'Error de sincronización con Google Sheets.' }));
                setIsReady(true);
            }
        };
        cargarDatos();
    }, []);

    const loadCloudHistory = async () => {
        try {
            const resNube = await fetch(`${SCRIPT_URL}?sheet=HistorialCompartido`);
            const dataNube = await resNube.json();

            if (dataNube && Array.isArray(dataNube)) {
                const findKey = (obj, k) => Object.keys(obj).find(key => key.toLowerCase() === k.toLowerCase());

                const historialSincronizado = dataNube.map(item => {
                    const dEsc = item[findKey(item, 'DatosEscenario')];
                    const conf = item[findKey(item, 'Configuracion')];
                    const eerrData = item[findKey(item, 'EERR')];

                    const parseValue = (val, defaultVal) => {
                        if (!val) return defaultVal;
                        if (typeof val === 'object') return val;
                        try { return JSON.parse(val); } catch (e) { return defaultVal; }
                    };

                    return {
                        id: item[findKey(item, 'ID')] ? String(item[findKey(item, 'ID')]).replace(/'/g, "") : Date.now(),
                        nombre: item[findKey(item, 'Nombre')] || "Sin nombre",
                        fecha: item[findKey(item, 'Fecha')] || "",
                        escenarios: parseValue(dEsc, []),
                        config: parseValue(conf, {}),
                        eerr: parseValue(eerrData, {})
                    };
                });

                setHistorial(historialSincronizado);

                // Load latest by default
                const ultimo = historialSincronizado[historialSincronizado.length - 1];
                if (ultimo && Array.isArray(ultimo.escenarios) && ultimo.escenarios.length > 0) {
                    applyOldEscenario(ultimo, false);
                }
            }
        } catch (e) { console.error("Cloud History Error:", e); }
    };

    // --- PERSISTENCE ---
    useEffect(() => {
        if (!isReady || isLoadingFromCloud) return;
        localStorage.setItem('hzn_escenarios', JSON.stringify(escenarios));
        localStorage.setItem('hzn_pctInd', pctIndirectos);
        localStorage.setItem('hzn_pctLab', pctCostoLaboral);
        localStorage.setItem('hzn_gastosOp', gastosOperativos);
        localStorage.setItem('hzn_margenObj', margenObjetivo);
        localStorage.setItem('hzn_lineasVenta', JSON.stringify(lineasVentaTotal));
        localStorage.setItem('hzn_lineasReno', JSON.stringify(lineasRenovacion));
        localStorage.setItem('hzn_lineasIncr', JSON.stringify(lineasIncremental));
    }, [escenarios, pctIndirectos, pctCostoLaboral, gastosOperativos, margenObjetivo, lineasVentaTotal, lineasRenovacion, lineasIncremental, isReady, isLoadingFromCloud]);

    // --- CALCULATIONS ---
    const calculateResult = (e) => {
        const p = dataSheets.preciosNuevos[e.tipoIdx];
        if (!p) return { venta: 0, costoTotal: 0, res: 0 };

        const isStaff = (p.categoria || '').toLowerCase().includes('staff');
        const venta = (Number(e.cantidad) || 0) * (Number(e.ventaUnit) || 0);
        let costoTotal = 0;

        if (isStaff) {
            const sueldo = (Number(e.cantidad) || 0) * (Number(e.sueldoBruto) || 0);
            costoTotal = sueldo + (sueldo * pctCostoLaboral / 100) + (sueldo * pctIndirectos / 100);
        } else {
            const base = (Number(e.cantidad) || 0) * (Number(p.costoFijo) || 0);
            costoTotal = base + (base * pctIndirectos / 100);
        }

        return { venta, costoTotal, res: venta - costoTotal };
    };

    const currentEERR = useMemo(() => {
        let ventasTotales = 0;
        let costosTotales = 0;
        const porCliente = {};

        escenarios.forEach(e => {
            const { venta, costoTotal } = calculateResult(e);
            ventasTotales += venta;
            costosTotales += costoTotal;

            if (!porCliente[e.cliente]) porCliente[e.cliente] = { ventas: 0, costos: 0 };
            porCliente[e.cliente].ventas += venta;
            porCliente[e.cliente].costos += costoTotal;
        });

        const eerr = dataSheets.eerrBase ?? {};
        const eerrNorm = dataSheets.eerrBaseNorm ?? {};

        const getBase = (key) => tolerantGet(eerr, key) || tolerantGet(eerrNorm, normalizeKey(key)) || 0;

        const ingresoBase = getBase('Ingreso');
        const costoIngresoBase = getBase('Costo de ingresos');
        const gananciaBrutaBase = getBase('Ganancia bruta');
        const gastoOperacionBase = getBase('Menos gasto de operación');
        const gananciaNetaBase = getBase('Ganancia neta');

        const ingresoTotal = ingresoBase + ventasTotales;
        const costoIngresosTotal = costoIngresoBase + costosTotales;
        const gananciaBrutaTotal = ingresoTotal - costoIngresosTotal;
        const gastoOperacionTotal = gastosOperativos || gastoOperacionBase;
        const ingresoOperacionTotal = gananciaBrutaTotal - gastoOperacionTotal;
        const otrosIngresosTotal = getBase('Más otros ingresos');
        const otrosGastosTotal = getBase('Menos gastos de otro tipo');
        const gananciaNetaTotal = ingresoOperacionTotal + otrosIngresosTotal - otrosGastosTotal;

        return {
            ingresoBase, costoIngresoBase, gananciaBrutaBase, gastoOperacionBase, gananciaNetaBase,
            ingresoTotal, costoIngresosTotal, gananciaBrutaTotal, gastoOperacionTotal, ingresoOperacionTotal,
            otrosIngresosTotal, otrosGastosTotal, gananciaNetaTotal,
            margenBrutoPct: ingresoTotal > 0 ? (gananciaBrutaTotal / ingresoTotal) * 100 : 0,
            margenOperacionPct: ingresoTotal > 0 ? (ingresoOperacionTotal / ingresoTotal) * 100 : 0,
            margenNetoPct: ingresoTotal > 0 ? (gananciaNetaTotal / ingresoTotal) * 100 : 0,
            propuesta: { ventasTotales, costosTotales, porCliente, margenBruto: (ventasTotales - costosTotales), margenBrutoPct: ventasTotales > 0 ? ((ventasTotales - costosTotales) / ventasTotales) * 100 : 0 }
        };
    }, [escenarios, pctIndirectos, pctCostoLaboral, gastosOperativos, dataSheets.eerrBase]);

    // --- ACTIONS ---
    const applyOldEscenario = (item, confirm = true) => {
        if (confirm && !window.confirm(`¿Cargar "${item.nombre}"?`)) return;
        setIsLoadingFromCloud(true);

        setEscenarios(item.escenarios || []);
        const { config = {} } = item;
        setPctIndirectos(config.pctIndirectos ?? 37);
        setPctCostoLaboral(config.pctCostoLaboral ?? 45);
        setGastosOperativos(config.gastosOperativos ?? DEFAULTS.GASTOS_OPERATIVOS);
        setMargenObjetivo(config.margenObjetivo ?? 25);

        if (config.lineasVentaTotal) setLineasVentaTotal(config.lineasVentaTotal);
        if (config.lineasRenovacion) setLineasRenovacion(config.lineasRenovacion);
        if (config.lineasIncremental) setLineasIncremental(config.lineasIncremental);

        setMostrarHistorial(false);
        setTimeout(() => setIsLoadingFromCloud(false), 200);
    };

    const guardarEscenario = async () => {
        const nombre = window.prompt("Nombre del escenario:", `Horizon_Model_${historial.length + 1}`);
        if (!nombre) return;

        const payload = {
            id: Date.now(),
            nombre,
            fecha: new Date().toLocaleString('es-AR'),
            escenarios: escenarios,
            config: { pctIndirectos, pctCostoLaboral, gastosOperativos, margenObjetivo, lineasVentaTotal, lineasRenovacion, lineasIncremental },
            eerr: currentEERR
        };

        try {
            const p = new URLSearchParams();
            p.append('payload', JSON.stringify(payload));
            p.append('sheet', 'HistorialCompartido');

            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: p.toString()
            });

            setHistorial(prev => [payload, ...prev]);
            alert(`✅ Escenario "${nombre}" sincronizado exitosamente.`);
        } catch (e) { alert("Error al sincronizar."); }
    };

    const descargarPDF = () => {
        const timestamp = new Date().toLocaleString('es-AR');
        let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Horizon Projection ${timestamp}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-size: 24px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: 800; background: #f1f5f9; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
            th { border-bottom: 2px solid #e2e8f0; padding: 12px; text-align: left; color: #64748b; font-weight: 800; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
            .total { font-weight: 800; color: #4f46e5; }
            .neg { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1>HORIZON ENGINE <span style="opacity: 0.3;">/</span> REPORT</h1>
          <p style="font-size: 10px; font-weight: 800; color: #64748b;">TIMESTAMP: ${timestamp}</p>
          
          <div class="grid">
            <div class="card">
               <span class="badge">Net Target</span>
               <h2 style="margin: 10px 0;">${formatCurrency(currentEERR.gananciaNetaTotal)}</h2>
               <p style="font-size: 12px; color: #64748b;">Consolidated Net Proj 2026</p>
            </div>
            <div class="card">
               <span class="badge">Efficiency</span>
               <h2 style="margin: 10px 0;">${currentEERR.margenNetoPct.toFixed(1)}%</h2>
               <p style="font-size: 12px; color: #64748b;">Operational Margin Ratio</p>
            </div>
          </div>

          <h3>Matrix Simulation Detail</h3>
          <table>
            <thead>
              <tr>
                <th>CLIENT</th><th>SERVICE</th><th>QTY</th><th>UNIT</th><th>TOTAL COST</th><th>NET RESULT</th>
              </tr>
            </thead>
            <tbody>
              ${escenarios.map(e => {
            const res = calculateResult(e);
            const p = dataSheets.preciosNuevos[e.tipoIdx] || {};
            return \`
                  <tr>
                    <td>\${e.cliente}</td>
                    <td>\${p.categoria} / \${p.tipo}</td>
                    <td>\${e.cantidad}</td>
                    <td>\${formatCurrency(e.ventaUnit)}</td>
                    <td class="neg">-\${formatCurrency(res.costoTotal)}</td>
                    <td class="total">\${formatCurrency(res.res)}</td>
                  </tr>
                \`;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Horizon_Matrix_Report_${Date.now()}.html`;
            a.click();
            URL.revokeObjectURL(url);
        };

        // --- RENDERING ---
        if (dataSheets.loading) return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="font-black tracking-[0.3em] uppercase text-[10px] animate-pulse">Sincronizando Horizon Matrix...</p>
            </div>
        );

        if (dataSheets.error) return (
            <div className="flex items-center justify-center min-h-screen bg-rose-50 p-20">
                <div className="bg-white p-8 rounded-2xl shadow-2xl border border-rose-100 text-center max-w-md">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-black text-rose-600 uppercase mb-2">System Error</h2>
                    <p className="text-slate-500 text-sm font-medium mb-6">{dataSheets.error}</p>
                    <button onClick={() => window.location.reload()} className="bg-rose-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition">Reintentar</button>
                </div>
            </div>
        );

        const actualizarFila = (id, campo, valor) => {
            setEscenarios(prev => prev.map(e => {
                if (e.id !== id) return e;
                const updated = { ...e };
                if (campo === 'ventaUnit' || campo === 'sueldoBruto') {
                    updated[campo] = Number(valor) || 0;
                } else if (campo === 'tipoIdx') {
                    updated.tipoIdx = Number(valor) || 0;
                    const p = dataSheets.preciosNuevos[Number(valor)];
                    if (p) {
                        updated.sueldoBruto = p.sueldoSugerido ?? 0;
                        updated.ventaUnit = p.valor ?? 0;
                    }
                } else if (campo === 'cantidad' || campo === 'cliente') {
                    updated[campo] = valor;
                }
                return updated;
            }));
        };

        const agregarFila = () => {
            const p = dataSheets.preciosNuevos[0] || { sueldoSugerido: 0, valor: 0 };
            setEscenarios(prev => [
                ...prev,
                { id: Date.now(), cliente: dataSheets.clientes[0] || '', tipoIdx: 0, cantidad: 1, sueldoBruto: p.sueldoSugerido, ventaUnit: p.valor }
            ]);
        };

        return (
            <div className="p-4 md:p-10 bg-slate-50 min-h-screen font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
                <div className="max-w-7xl mx-auto">

                    <DashboardHeader
                        gastosOperativos={gastosOperativos} setGastosOperativos={setGastosOperativos}
                        pctIndirectos={pctIndirectos} setPctIndirectos={setPctIndirectos}
                        pctCostoLaboral={pctCostoLaboral} setPctCostoLaboral={setPctCostoLaboral}
                        margenObjetivo={margenObjetivo} setMargenObjetivo={setMargenObjetivo}
                    />

                    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mostrarHistorial ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-400'
                                    }`}
                            >
                                Timeline Registry ({historial.length})
                            </button>
                            <button
                                onClick={guardarEscenario}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all duration-300 active:scale-95"
                            >
                                Sync to Cloud
                            </button>
                        </div>

                        <button
                            onClick={descargarPDF}
                            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all duration-300 active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Report
                        </button>
                    </div>

                    {mostrarHistorial && (
                        <HistoryPanel
                            historial={historial}
                            setHistorial={setHistorial}
                            cargarEscenario={applyOldEscenario}
                            close={() => setMostrarHistorial(false)}
                        />
                    )}

                    <ScenarioTable
                        escenarios={escenarios} setEscenarios={setEscenarios}
                        precios={dataSheets.preciosNuevos}
                        clientes={dataSheets.clientes}
                        pctCostoLaboral={pctCostoLaboral}
                        pctIndirectos={pctIndirectos}
                        margenObjetivo={margenObjetivo}
                        agregarFila={agregarFila}
                        actualizarFila={actualizarFila}
                        limpiarTodo={() => { if (window.confirm('¿Borrar matriz actual?')) setEscenarios([]); }}
                    />

                    <PLTable
                        eerr={currentEERR}
                        dataSheets={dataSheets}
                        propuesta={currentEERR.propuesta}
                        gastosOperativos={gastosOperativos}
                        expanded={mostrarEERR}
                        toggle={() => setMostrarEERR(!mostrarEERR)}
                    />

                    <GaugeSection
                        goals={GOALS}
                        lineasVentaTotal={lineasVentaTotal} setLineasVentaTotal={setLineasVentaTotal}
                        lineasRenovacion={lineasRenovacion} setLineasRenovacion={setLineasRenovacion}
                        lineasIncremental={lineasIncremental} setLineasIncremental={setLineasIncremental}
                        clientes={dataSheets.clientes}
                    />

                    <div className="py-12 border-t border-slate-100 mt-20 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">
                            Horizon Finance Engine • v2.0 Modular Alpha
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    export default App;
