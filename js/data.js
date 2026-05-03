/* ============================================================
   TORRE ESPERANZA — data.js  (v2)
   Capa de datos con lógica real del edificio
   ============================================================
   REGLAS DE NEGOCIO:
   • Propietario depto  → paga EXPENSA (Bs 335) + PARQUEO propio (Bs 100 c/u)
   • Inquilino depto    → paga solo AGUA (tarifa EPSAS escalonada)
   • Inquilino parqueo  → paga Bs 100/mes (parqueos sueltos numerados)
   • Local comercial    → paga EXPENSA configurable
   • Mora               → 2% mensual sobre saldo pendiente

   TARIFA AGUA EPSAS (DOM SOL):
   • 0–10 m³  → Bs 1.90/m³  + cargo fijo Bs 1.00
   • +10 m³   → Bs 3.90/m³  (excedente)
   ============================================================ */

// ─────────────────────────────────────────────
// CATÁLOGO REAL DEL EDIFICIO
// (extraído de la planilla física)
// ─────────────────────────────────────────────
const DEPARTAMENTOS = [
  {id:'2A',piso:2},{id:'2B',piso:2},{id:'2C',piso:2},{id:'2D',piso:2},
  {id:'3A',piso:3},{id:'3B',piso:3},{id:'3C',piso:3},{id:'3D',piso:3},
  {id:'4A',piso:4},{id:'4B',piso:4},{id:'4C',piso:4},{id:'4D',piso:4},{id:'4E',piso:4},
  {id:'5A',piso:5},{id:'5B',piso:5},{id:'5C',piso:5},{id:'5D',piso:5},
  {id:'6A',piso:6},{id:'6B',piso:6},{id:'6C',piso:6},{id:'6D',piso:6},
  {id:'7A',piso:7},{id:'7B',piso:7},{id:'7C',piso:7},{id:'7D',piso:7},
];

const LOCALES = [
  {id:'LOCAL1',nombre:'Local 1'},
  {id:'LOCAL2',nombre:'Local 2'},
  {id:'LOCAL3',nombre:'Local 3'},
  {id:'LOCAL4',nombre:'Local 4'},
  {id:'LOCAL5',nombre:'Local 5'},
];

// Parqueos numerados alquilados a terceros (propietarios los subalquilan)
const PARQUEOS_SUELTOS = [
  'PARQ2','PARQ4','PARQ5','PARQ6',
  'PARQ14','PARQ17','PARQ18','PARQ19',
  'PARQ20','PARQ22','PARQ23','PARQ26',
  'PARQ34','PARQ44',
];

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ─────────────────────────────────────────────
// TARIFA EPSAS
// ─────────────────────────────────────────────
function calcularAgua(m3) {
  if (m3 <= 0) return 0;
  const B1_LIMITE = 10, B1_PRECIO = 1.90, B2_PRECIO = 3.90, FIJO = 1.00;
  let costo = FIJO;
  if (m3 <= B1_LIMITE) {
    costo += m3 * B1_PRECIO;
  } else {
    costo += B1_LIMITE * B1_PRECIO;
    costo += (m3 - B1_LIMITE) * B2_PRECIO;
  }
  return Math.round(costo * 100) / 100;
}

// Devuelve texto explicando el cálculo escalonado
function desglosarAgua(m3) {
  if (m3 <= 0) return 'Sin consumo';
  if (m3 <= 10) return `${m3}m³ × Bs1.90 + cargo fijo Bs1.00`;
  return `10m³×Bs1.90 + ${m3-10}m³×Bs3.90 + cargo fijo Bs1.00`;
}

// ─────────────────────────────────────────────
// CONFIGURACIÓN GENERAL
// ─────────────────────────────────────────────
const CFG_DEFAULT = {
  expensa_depto: 335,
  expensa_local: 100,
  parqueo_mes:   100,
  mora_pct:        2,
};

function getConfig()     { return getStore('config', CFG_DEFAULT); }
function setConfig(data) { setStore('config', { ...getConfig(), ...data }); }

// ─────────────────────────────────────────────
// HELPERS localStorage
// ─────────────────────────────────────────────
function getStore(key, fallback = {}) {
  try {
    const v = localStorage.getItem(`te_${key}`);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function setStore(key, val) {
  localStorage.setItem(`te_${key}`, JSON.stringify(val));
}

// ─────────────────────────────────────────────
// UNIDADES (propietarios / inquilinos por depto)
// ─────────────────────────────────────────────
function getUnidades() { return getStore('unidades', {}); }
function getUnidad(id) { return getUnidades()[id] || {}; }
function setUnidad(id, data) {
  const u = getUnidades();
  u[id] = { ...(u[id] || {}), ...data };
  setStore('unidades', u);
}

// ─────────────────────────────────────────────
// INQUILINOS DE PARQUEO SUELTO
// ─────────────────────────────────────────────
function getInqParqueos() { return getStore('inq_parqueo', {}); }
function getInqParqueo(id) { return getInqParqueos()[id] || {}; }
function setInqParqueo(id, data) {
  const p = getInqParqueos();
  p[id] = { ...(p[id] || {}), ...data };
  setStore('inq_parqueo', p);
}

// ─────────────────────────────────────────────
// LECTURAS DE AGUA (por mes)
// ─────────────────────────────────────────────
function getLecturas() { return getStore('lecturas', {}); }
function getLecturasMes(mes, anio) { return getLecturas()[`${mes}-${anio}`] || {}; }
function setLecturasMes(mes, anio, obj) {
  const d = getLecturas();
  d[`${mes}-${anio}`] = obj;
  setStore('lecturas', d);
}
function getConsumo(depto, mes, anio) {
  const l = getLecturasMes(mes, anio)[depto] || { anterior: 0, actual: 0 };
  return Math.max(0, (l.actual || 0) - (l.anterior || 0));
}

// ─────────────────────────────────────────────
// PAGOS
// Cada pago tiene:
//   unidad, tipo: 'expensa'|'agua'|'parqueo'|'mora'|'mixto'
//   mes, anio, monto, pagado_por, fecha, nota
// ─────────────────────────────────────────────
function getPagos()    { return getStore('pagos', []); }
function addPago(pago) {
  const arr = getPagos();
  arr.push({ ...pago, id: Date.now() });
  setStore('pagos', arr);
}
function getPagosMes(mes, anio) {
  return getPagos().filter(p => p.mes === mes && String(p.anio) === String(anio));
}
function getPagosUnidad(unidad) {
  return getPagos().filter(p => p.unidad === unidad);
}
function totalPagadoMes(unidad, mes, anio) {
  return getPagosMes(mes, anio)
    .filter(p => p.unidad === unidad)
    .reduce((s, p) => s + Number(p.monto), 0);
}
function estaPagado(unidad, mes, anio) {
  const deuda = calcularDeuda(unidad, mes, anio);
  if (deuda <= 0) return true;
  return totalPagadoMes(unidad, mes, anio) >= deuda;
}

// ─────────────────────────────────────────────
// DEUDA DE UNA UNIDAD EN UN MES
// ─────────────────────────────────────────────
function calcularDeuda(unidad, mes, anio) {
  const cfg = getConfig();

  // Parqueo suelto → solo cuota mensual
  if (PARQUEOS_SUELTOS.includes(unidad)) {
    return cfg.parqueo_mes;
  }

  // Local → expensa de local
  if (LOCALES.find(l => l.id === unidad)) {
    return cfg.expensa_local;
  }

  // Departamento → expensa + parqueos + agua
  const u = getUnidad(unidad);
  const nParq = (u.parqueos_propietario || []).length;
  const consumo = getConsumo(unidad, mes, anio);
  const agua = calcularAgua(consumo);
  return cfg.expensa_depto + (nParq * cfg.parqueo_mes) + agua;
}

// Desglose detallado para mostrar en tabla
function desglosarDeuda(unidad, mes, anio) {
  const cfg = getConfig();

  if (PARQUEOS_SUELTOS.includes(unidad)) {
    return [{ concepto: 'Cuota parqueo', monto: cfg.parqueo_mes, quien: 'inquilino' }];
  }
  if (LOCALES.find(l => l.id === unidad)) {
    return [{ concepto: 'Expensa local', monto: cfg.expensa_local, quien: 'propietario' }];
  }

  const u = getUnidad(unidad);
  const nParq = (u.parqueos_propietario || []).length;
  const consumo = getConsumo(unidad, mes, anio);
  const agua = calcularAgua(consumo);
  const items = [];

  items.push({ concepto: 'Expensa departamento', monto: cfg.expensa_depto, quien: 'propietario' });
  if (nParq > 0) {
    items.push({ concepto: `Parqueo(s) (${nParq} × Bs${cfg.parqueo_mes})`, monto: nParq * cfg.parqueo_mes, quien: 'propietario' });
  }
  items.push({ concepto: `Agua: ${desglosarAgua(consumo)}`, monto: agua, quien: 'inquilino' });
  return items;
}

// ─────────────────────────────────────────────
// MORA
// ─────────────────────────────────────────────
function calcularMora(unidad, mesActual, anioActual) {
  const pct = getConfig().mora_pct / 100;
  let mora = 0;

  // Meses anteriores (hasta 24)
  let m = MESES.indexOf(mesActual), a = Number(anioActual);
  for (let i = 0; i < 24; i++) {
    m--; if (m < 0) { m = 11; a--; }
    const deuda  = calcularDeuda(unidad, MESES[m], a);
    const pagado = totalPagadoMes(unidad, MESES[m], a);
    const saldo  = deuda - pagado;
    if (saldo > 0) mora += saldo * pct;
  }
  return Math.round(mora * 100) / 100;
}

// ─────────────────────────────────────────────
// SESIÓN
// ─────────────────────────────────────────────
function getSesion() {
  return JSON.parse(localStorage.getItem('te_sesion') || 'null');
}
function cerrarSesion() {
  localStorage.removeItem('te_sesion');
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  window.location.href = (depth > 1 ? '../'.repeat(depth - 1) : '') + 'index.html';
}
function requireSesion(rol) {
  const s = getSesion();
  if (!s) { cerrarSesion(); return null; }
  if (Date.now() - s.timestamp > 8 * 3600000) { cerrarSesion(); return null; }
  if (rol && s.rol !== rol) { cerrarSesion(); return null; }
  return s;
}

// ─────────────────────────────────────────────
// FORMATO
// ─────────────────────────────────────────────
function bs(n) { return `Bs ${Number(n).toFixed(2)}`; }
function hoy() { return new Date().toLocaleDateString('es-BO'); }
