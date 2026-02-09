export const cleanNum = (val) => {
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

export const normalizeKey = (k) => {
    if (!k && k !== 0) return '';
    const s = String(k).toLowerCase().trim();
    const accentMap = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n' };
    let out = s.replace(/[áéíóúñ]/g, m => accentMap[m]);
    out = out.replace(/[^a-z0-9]/g, '');
    return out;
};

export const tolerantGet = (mapObj, key) => {
    if (!mapObj) return 0;
    const nk = normalizeKey(key);
    for (const k of Object.keys(mapObj)) {
        if (normalizeKey(k) === nk) return mapObj[k];
    }
    return mapObj[key] !== undefined ? mapObj[key] : 0;
};

export const fetchSheet = async (sheetId, sheetName) => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
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

export const formatCurrency = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

export const formatNumber = (n) =>
    new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);

export const formatPercent = (n) => `${n.toFixed(0)}%`;
