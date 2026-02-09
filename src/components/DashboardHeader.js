import React from 'react';
import { formatNumber } from '../utils';

const ConfigInput = ({ label, value, onChange, type = "number", addon = "", colorClass = "" }) => (
    <div className={`bg-white px-4 py-2 rounded-lg shadow-sm border ${colorClass}`}>
        <span className={`text-[10px] font-bold block uppercase opacity-60`}>{label}</span>
        <div className="flex items-center">
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full font-bold focus:outline-none text-xs bg-transparent"
            />
            {addon && <span className="text-xs font-bold opacity-60 ml-0.5">{addon}</span>}
        </div>
    </div>
);

const DashboardHeader = ({
    gastosOperativos, setGastosOperativos,
    pctIndirectos, setPctIndirectos,
    pctCostoLaboral, setPctCostoLaboral,
    margenObjetivo, setMargenObjetivo
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase py-1">
                    Horizon Finance <span className="text-slate-900/10">2026</span>
                </h1>
                <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">
                    Financial Intelligence Engine • Projection Matrix
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <ConfigInput
                    label="Gastos Operativos"
                    value={gastosOperativos === 0 ? '' : formatNumber(gastosOperativos)}
                    onChange={val => {
                        const raw = val.replace(/\./g, '').replace(/\s/g, '');
                        setGastosOperativos(raw === '' ? 0 : parseFloat(raw) || 0);
                    }}
                    type="text"
                    colorClass="border-indigo-100 text-indigo-600"
                />
                <ConfigInput
                    label="Indirectos"
                    value={pctIndirectos}
                    onChange={val => setPctIndirectos(Number(val) || 0)}
                    addon="%"
                    colorClass="border-purple-100 text-purple-600"
                />
                <ConfigInput
                    label="Costo Laboral"
                    value={pctCostoLaboral}
                    onChange={val => setPctCostoLaboral(Number(val) || 0)}
                    addon="%"
                    colorClass="border-pink-100 text-pink-600"
                />
                <ConfigInput
                    label="Margen Obj."
                    value={margenObjetivo}
                    onChange={val => setMargenObjetivo(Number(val) || 0)}
                    addon="%"
                    colorClass="border-slate-100 text-slate-600"
                />
            </div>
        </div>
    );
};

export default DashboardHeader;
