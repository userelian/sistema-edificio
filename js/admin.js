/* ============================================================
   TORRE ESPERANZA — admin.js  (v2)
   Lógica completa del panel de administrador
   ============================================================ */

requireSesion('admin');

// ─────────────────────────────────────────────
// NAVEGACIÓN
// ─────────────────────────────────────────────
function ir(id, btn) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.add('hidden'));
  document.getElementById(`sec-${id}`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const renderMap = {
    resumen  : renderResumen,
    planilla : renderPlanilla,
    agua     : renderAgua,
    pagos    : renderPagos,
    parqueos : renderParqueos,
    unidades : renderUnidades,
    config   : renderConfig,
  };
  if (renderMap[id]) renderMap[id]();
}

// ─────────────────────────────────────────────
// ══ RESUMEN GENERAL ══
// ─────────────────────────────────────────────
function renderResumen() {
  const mes  = document.getElementById('filtroMesRes').value;
  const anio = document.getElementById('filtroAnioRes').value;
  document.getElementById('subtituloMes').textContent =
    `Torre Esperanza — ${mes} ${anio}`;

  // Stats cards
  const todasUnidades = [
    ...DEPARTAMENTOS.map(d => d.id),
    ...LOCALES.map(l => l.id),
    ...PARQUEOS_SUELTOS,
  ];

  let totalDeuda = 0, totalPagado = 0, unidadesPagadas = 0, unidadesPendientes = 0;

  todasUnidades.forEach(u => {
    const deuda  = calcularDeuda(u, mes, anio);
    const pagado = totalPagadoMes(u, mes, anio);
    totalDeuda  += deuda;
    totalPagado += Math.min(pagado, deuda);
    if (pagado >= deuda) unidadesPagadas++;
    else unidadesPendientes++;
  });

  document.getElementById('statsCards').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">🏠</div>
      <div class="stat-label">Total unidades</div>
      <div class="stat-value">${todasUnidades.length}</div>
      <div class="stat-sub">${DEPARTAMENTOS.length} deptos · ${LOCALES.length} locales · ${PARQUEOS_SUELTOS.length} parqueos</div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon">✅</div>
      <div class="stat-label">Pagaron</div>
      <div class="stat-value">${unidadesPagadas}</div>
      <div class="stat-sub">de ${todasUnidades.length} unidades</div>
    </div>
    <div class="stat-card red">
      <div class="stat-icon">⏳</div>
      <div class="stat-label">Pendientes</div>
      <div class="stat-value">${unidadesPendientes}</div>
      <div class="stat-sub">unidades con saldo</div>
    </div>
    <div class="stat-card navy">
      <div class="stat-icon">💰</div>
      <div class="stat-label">Cobrado / Total</div>
      <div class="stat-value" style="font-size:20px;">${bs(totalPagado)}</div>
      <div class="stat-sub">de ${bs(totalDeuda)} esperado</div>
    </div>`;

  // Tabla
  const tbody = document.getElementById('bodyResumen');
  tbody.innerHTML = '';

  // Departamentos
  DEPARTAMENTOS.forEach(d => filaResumen(d.id, 'Depto', mes, anio, tbody));
  // Locales
  LOCALES.forEach(l => filaResumen(l.id, 'Local', mes, anio, tbody));
  // Parqueos sueltos
  PARQUEOS_SUELTOS.forEach(p => filaResumen(p, 'Parqueo', mes, anio, tbody));
}

function filaResumen(unidad, tipo, mes, anio, tbody) {
  const cfg    = getConfig();
  const u      = getUnidad(unidad);
  const inqP   = getInqParqueo(unidad);

  const esParqueo = PARQUEOS_SUELTOS.includes(unidad);
  const esLocal   = LOCALES.find(l => l.id === unidad);

  const consumo   = esParqueo || esLocal ? 0 : getConsumo(unidad, mes, anio);
  const costoAgua = calcularAgua(consumo);
  const nParq     = (u.parqueos_propietario || []).length;
  const mora      = calcularMora(unidad, mes, anio);

  let expensa = 0, parqueoMonto = 0;
  if (esParqueo)      { parqueoMonto = cfg.parqueo_mes; }
  else if (esLocal)   { expensa = cfg.expensa_local; }
  else                { expensa = cfg.expensa_depto; parqueoMonto = nParq * cfg.parqueo_mes; }

  const total   = expensa + parqueoMonto + costoAgua + mora;
  const pagado  = totalPagadoMes(unidad, mes, anio);
  const saldo   = Math.max(0, total - pagado);
  const ok      = saldo <= 0;

  const nombreProp = esParqueo
    ? (inqP.inquilino || '<em style="color:var(--text-muted)">Sin asignar</em>')
    : (u.propietario || '—');
  const nombreInq  = esParqueo ? '—' : (u.inquilino || '—');

  tbody.innerHTML += `
    <tr>
      <td><strong>${unidad}</strong></td>
      <td><span class="badge ${tipo==='Depto'?'badge-navy':tipo==='Local'?'badge-gold':'badge-green'}">${tipo}</span></td>
      <td style="font-size:12px;">${nombreProp}${nombreInq !== '—' ? `<br><span style="color:var(--text-muted)">Inq: ${nombreInq}</span>` : ''}</td>
      <td class="monto">${expensa > 0 ? bs(expensa) : '—'}</td>
      <td>${consumo > 0 ? `${consumo}m³ → ${bs(costoAgua)}` : '—'}</td>
      <td class="monto">${parqueoMonto > 0 ? bs(parqueoMonto) : '—'}</td>
      <td class="monto ${mora > 0 ? 'pendiente' : ''}">${mora > 0 ? bs(mora) : '—'}</td>
      <td class="monto"><strong>${bs(total)}</strong></td>
      <td class="monto pagado">${pagado > 0 ? bs(pagado) : '—'}</td>
      <td class="monto ${saldo > 0 ? 'pendiente' : 'pagado'}">${saldo > 0 ? bs(saldo) : '✓'}</td>
      <td>
        <span class="badge ${ok ? 'badge-green' : 'badge-red'}">${ok ? '✅ Pagado' : '⏳ Pendiente'}</span>
        ${!ok ? `<button class="btn btn-primary btn-sm" style="margin-left:6px;" onclick="pagoRapido('${unidad}',${saldo},'${mes}',${anio})">Pagar</button>` : ''}
      </td>
    </tr>`;
}

function pagoRapido(unidad, saldo, mes, anio) {
  addPago({ unidad, tipo_pago:'mixto', mes, anio, monto: saldo, pagado_por:'propietario', fecha: hoy(), nota:'Pago rápido desde resumen' });
  renderResumen();
}

// ─────────────────────────────────────────────
// ══ PLANILLA ══
// ─────────────────────────────────────────────
function renderPlanilla() {
  const mes  = document.getElementById('planMes').value;
  const anio = document.getElementById('planAnio').value;
  const tbody = document.getElementById('bodyPlanilla');
  const tfoot = document.getElementById('footPlanilla');
  tbody.innerHTML = '';

  let totExp = 0, totParq = 0, totAgua = 0, totMora = 0, totTotal = 0, totPagado = 0, totSaldo = 0;

  const cfg = getConfig();

  const agregarFila = (unidad, label) => {
    const u    = getUnidad(unidad);
    const inqP = getInqParqueo(unidad);
    const esParqueo = PARQUEOS_SUELTOS.includes(unidad);
    const esLocal   = !!LOCALES.find(l => l.id === unidad);

    const consumo   = esParqueo || esLocal ? 0 : getConsumo(unidad, mes, anio);
    const costoAgua = calcularAgua(consumo);
    const nParq     = (u.parqueos_propietario || []).length;
    const mora      = calcularMora(unidad, mes, anio);

    let expensa = 0, parqueoMonto = 0;
    if (esParqueo)    { parqueoMonto = cfg.parqueo_mes; }
    else if (esLocal) { expensa = cfg.expensa_local; }
    else              { expensa = cfg.expensa_depto; parqueoMonto = nParq * cfg.parqueo_mes; }

    const total  = expensa + parqueoMonto + costoAgua + mora;
    const pagado = totalPagadoMes(unidad, mes, anio);
    const saldo  = Math.max(0, total - pagado);
    const ok     = saldo <= 0;

    totExp    += expensa;
    totParq   += parqueoMonto;
    totAgua   += costoAgua;
    totMora   += mora;
    totTotal  += total;
    totPagado += Math.min(pagado, total);
    totSaldo  += saldo;

    const prop = esParqueo ? (inqP.inquilino || '—') : (u.propietario || '—');
    const inq  = esParqueo ? '—' : (u.inquilino || '—');

    tbody.innerHTML += `
      <tr style="${ok ? '' : 'background:#fffbf7;'}">
        <td><strong>${label}</strong></td>
        <td style="font-size:12px;">${prop}</td>
        <td style="font-size:12px;">${inq}</td>
        <td class="monto">${expensa > 0 ? bs(expensa) : '—'}</td>
        <td class="monto">${parqueoMonto > 0 ? bs(parqueoMonto) : '—'}</td>
        <td>${consumo > 0 ? `${consumo}m³` : '—'}</td>
        <td class="monto">${costoAgua > 0 ? bs(costoAgua) : '—'}</td>
        <td class="monto ${mora > 0 ? 'pendiente' : ''}">${mora > 0 ? bs(mora) : '—'}</td>
        <td class="monto"><strong>${bs(total)}</strong></td>
        <td class="monto pagado">${pagado > 0 ? bs(pagado) : '—'}</td>
        <td class="monto ${saldo > 0 ? 'pendiente' : 'pagado'}" style="font-weight:600;">${saldo > 0 ? bs(saldo) : '✓'}</td>
        <td><span class="badge ${ok ? 'badge-green' : 'badge-red'}">${ok ? '✅' : '⏳'}</span></td>
      </tr>`;
  };

  DEPARTAMENTOS.forEach(d => agregarFila(d.id, d.id));

  // Separador locales
  tbody.innerHTML += `<tr style="background:var(--navy);"><td colspan="12" style="color:var(--gold);font-size:11px;letter-spacing:.06em;padding:6px 14px;text-transform:uppercase;">Locales Comerciales</td></tr>`;
  LOCALES.forEach(l => agregarFila(l.id, l.nombre));

  // Separador parqueos
  tbody.innerHTML += `<tr style="background:var(--navy);"><td colspan="12" style="color:var(--gold);font-size:11px;letter-spacing:.06em;padding:6px 14px;text-transform:uppercase;">Parqueos Sueltos</td></tr>`;
  PARQUEOS_SUELTOS.forEach(p => agregarFila(p, p));

  tfoot.innerHTML = `
    <tr style="background:var(--cream);font-weight:600;">
      <td colspan="3" style="padding:10px 14px;">TOTALES</td>
      <td class="monto">${bs(totExp)}</td>
      <td class="monto">${bs(totParq)}</td>
      <td>—</td>
      <td class="monto">${bs(totAgua)}</td>
      <td class="monto pendiente">${totMora > 0 ? bs(totMora) : '—'}</td>
      <td class="monto"><strong>${bs(totTotal)}</strong></td>
      <td class="monto pagado">${bs(totPagado)}</td>
      <td class="monto pendiente"><strong>${bs(totSaldo)}</strong></td>
      <td></td>
    </tr>`;
}

// ─────────────────────────────────────────────
// ══ LECTURAS DE AGUA ══
// ─────────────────────────────────────────────
function cargarAgua() {
  const mes  = document.getElementById('aguaMes').value;
  const anio = document.getElementById('aguaAnio').value;
  const prev = getLecturasMes(mes, anio);
  const tbody = document.getElementById('bodyAgua');
  tbody.innerHTML = '';

  DEPARTAMENTOS.forEach(d => {
    const lect = prev[d.id] || { anterior: 0, actual: 0 };
    const u    = getUnidad(d.id);
    const inq  = u.inquilino || '—';
    const cons = Math.max(0, (lect.actual || 0) - (lect.anterior || 0));
    const costo = calcularAgua(cons);
    tbody.innerHTML += `
      <tr>
        <td><strong>${d.id}</strong></td>
        <td style="font-size:12px;">${inq}</td>
        <td><input type="number" class="ag-ant" data-depto="${d.id}" value="${lect.anterior}"
          style="width:90px;padding:5px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;"/></td>
        <td><input type="number" class="ag-act" data-depto="${d.id}" value="${lect.actual}"
          style="width:90px;padding:5px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;"
          oninput="recalcAgua(this)"/></td>
        <td id="con-${d.id}" style="font-weight:600;">${cons} m³</td>
        <td id="det-${d.id}" style="font-size:12px;color:var(--text-muted);">${desglosarAgua(cons)}</td>
        <td id="cst-${d.id}" class="monto">${bs(costo)}</td>
      </tr>`;
  });
}

function recalcAgua(input) {
  const dep  = input.dataset.depto;
  const row  = input.closest('tr');
  const ant  = parseFloat(row.querySelector('.ag-ant').value) || 0;
  const act  = parseFloat(row.querySelector('.ag-act').value) || 0;
  const cons = Math.max(0, act - ant);
  document.getElementById(`con-${dep}`).textContent = `${cons} m³`;
  document.getElementById(`det-${dep}`).textContent = desglosarAgua(cons);
  document.getElementById(`cst-${dep}`).textContent = bs(calcularAgua(cons));
}

function guardarAgua() {
  const mes  = document.getElementById('aguaMes').value;
  const anio = document.getElementById('aguaAnio').value;
  const obj  = {};
  document.querySelectorAll('.ag-ant').forEach(inp => {
    const dep = inp.dataset.depto;
    const ant = parseFloat(inp.value) || 0;
    const act = parseFloat(inp.closest('tr').querySelector('.ag-act').value) || 0;
    obj[dep]  = { anterior: ant, actual: act };
  });
  setLecturasMes(mes, anio, obj);
  document.getElementById('msgAgua').textContent = `✅ Lecturas guardadas para ${mes} ${anio}`;
  setTimeout(() => document.getElementById('msgAgua').textContent = '', 3000);
}

function renderAgua() { cargarAgua(); }

// ─────────────────────────────────────────────
// ══ REGISTRAR PAGO ══
// ─────────────────────────────────────────────
function renderPagos() {
  // Llenar select de unidades
  const sel = document.getElementById('pagoUnidad');
  sel.innerHTML = '';
  DEPARTAMENTOS.forEach(d => sel.innerHTML += `<option value="${d.id}">Depto ${d.id}</option>`);
  LOCALES.forEach(l => sel.innerHTML += `<option value="${l.id}">${l.nombre}</option>`);
  PARQUEOS_SUELTOS.forEach(p => sel.innerHTML += `<option value="${p}">${p}</option>`);

  calcularPagoSugerido();
  renderUltimosPagos();
}

function calcularPagoSugerido() {
  const unidad = document.getElementById('pagoUnidad')?.value;
  const mes    = document.getElementById('pagoMes')?.value;
  const anio   = document.getElementById('pagoAnio')?.value;
  if (!unidad || !mes || !anio) return;

  const deuda  = calcularDeuda(unidad, mes, anio);
  const pagado = totalPagadoMes(unidad, mes, anio);
  const saldo  = Math.max(0, deuda - pagado);
  const mora   = calcularMora(unidad, mes, anio);
  const items  = desglosarDeuda(unidad, mes, anio);

  document.getElementById('pagoMonto').value = saldo.toFixed(2);

  const det = items.map(i =>
    `<div style="display:flex;justify-content:space-between;"><span>${i.concepto}</span><strong>${bs(i.monto)}</strong></div>`
  ).join('');

  document.getElementById('sugerenciaPago').innerHTML = `
    <strong>Desglose para ${unidad} — ${mes} ${anio}:</strong>
    <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">${det}</div>
    ${mora > 0 ? `<div style="margin-top:6px;color:var(--red);"><strong>Mora acumulada: ${bs(mora)}</strong></div>` : ''}
    <div style="margin-top:8px;border-top:1px solid var(--border);padding-top:8px;display:flex;justify-content:space-between;">
      <span>Ya pagado:</span><strong style="color:var(--green);">${bs(pagado)}</strong>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:15px;">
      <strong>Saldo a pagar:</strong><strong style="color:var(--red);">${bs(saldo)}</strong>
    </div>`;
}

function registrarPago() {
  const unidad   = document.getElementById('pagoUnidad').value;
  const tipo     = document.getElementById('pagoTipo').value;
  const mes      = document.getElementById('pagoMes').value;
  const anio     = document.getElementById('pagoAnio').value;
  const monto    = parseFloat(document.getElementById('pagoMonto').value);
  const porQuien = document.getElementById('pagadoPor').value;
  const nota     = document.getElementById('pagoNota').value;

  if (!unidad || !mes || !anio || isNaN(monto) || monto <= 0) {
    alert('Completa todos los campos obligatorios'); return;
  }

  addPago({ unidad, tipo_pago: tipo, mes, anio, monto, pagado_por: porQuien, fecha: hoy(), nota });

  document.getElementById('msgPago').textContent = `✅ Pago de ${bs(monto)} registrado para ${unidad} — ${mes} ${anio}`;
  setTimeout(() => document.getElementById('msgPago').textContent = '', 4000);

  calcularPagoSugerido();
  renderUltimosPagos();
}

function renderUltimosPagos() {
  const pagos = getPagos().slice().reverse().slice(0, 20);
  const tbody = document.getElementById('bodyUltimosPagos');
  if (pagos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Sin pagos aún</td></tr>';
    return;
  }
  tbody.innerHTML = pagos.map(p => `
    <tr>
      <td><strong>${p.unidad}</strong></td>
      <td>${p.mes} ${p.anio}</td>
      <td><span class="badge badge-navy">${p.tipo_pago}</span></td>
      <td class="monto">${bs(p.monto)}</td>
      <td>${p.pagado_por}</td>
      <td style="font-size:12px;">${p.fecha}</td>
    </tr>`).join('');
}

// ─────────────────────────────────────────────
// ══ PARQUEOS SUELTOS ══
// ─────────────────────────────────────────────
function renderParqueos() {
  const mes = 'Marzo', anio = 2026;
  const tbody = document.getElementById('bodyParqueos');
  tbody.innerHTML = '';

  PARQUEOS_SUELTOS.forEach(pid => {
    const inq  = getInqParqueo(pid);
    const pago = estaPagado(pid, mes, anio);
    tbody.innerHTML += `
      <tr>
        <td><strong>${pid}</strong></td>
        <td>${inq.inquilino || '<em style="color:var(--text-muted)">Sin asignar</em>'}</td>
        <td>${inq.telefono || '—'}</td>
        <td class="monto">${bs(getConfig().parqueo_mes)}</td>
        <td><span class="badge ${pago ? 'badge-green' : 'badge-red'}">${pago ? '✅ Pagado' : '⏳ Pendiente'}</span></td>
        <td><button class="btn btn-outline btn-sm" onclick="editarParqueo('${pid}')">✏️</button></td>
      </tr>`;
  });
}

function editarParqueo(pid) {
  const inq = getInqParqueo(pid);
  const nombre = prompt(`Inquilino de ${pid}:`, inq.inquilino || '');
  if (nombre === null) return;
  const tel = prompt('Teléfono:', inq.telefono || '');
  setInqParqueo(pid, { inquilino: nombre, telefono: tel, activo: !!nombre });
  renderParqueos();
}

// ─────────────────────────────────────────────
// ══ PROPIETARIOS / INQUILINOS ══
// ─────────────────────────────────────────────
function renderUnidades() {
  const tbody = document.getElementById('bodyUnidades');
  tbody.innerHTML = '';

  const todasUnidades = [
    ...DEPARTAMENTOS.map(d => ({ id: d.id, label: `Depto ${d.id}` })),
    ...LOCALES.map(l => ({ id: l.id, label: l.nombre })),
  ];

  todasUnidades.forEach(({ id, label }) => {
    const u = getUnidad(id);
    tbody.innerHTML += `
      <tr>
        <td><strong>${label}</strong></td>
        <td>${u.propietario || '<em style="color:var(--text-muted)">—</em>'}</td>
        <td>${u.tel_prop || '—'}</td>
        <td>${u.inquilino || '<em style="color:var(--text-muted)">—</em>'}</td>
        <td>${u.tel_inq || '—'}</td>
        <td>${(u.parqueos_propietario || []).join(', ') || '—'}</td>
        <td><button class="btn btn-outline btn-sm" onclick="editarUnidad('${id}')">✏️</button></td>
      </tr>`;
  });
}

function editarUnidad(id) {
  const u   = getUnidad(id);
  const prop = prompt(`Propietario de ${id}:`, u.propietario || '');
  if (prop === null) return;
  const telProp = prompt('Teléfono propietario:', u.tel_prop || '');
  const inq     = prompt('Inquilino (vacío si vive el propietario):', u.inquilino || '');
  const telInq  = inq ? prompt('Teléfono inquilino:', u.tel_inq || '') : '';
  const parqStr = prompt('Parqueos del propietario (separados por coma, ej: PARQ-2A,PARQ-3B):', (u.parqueos_propietario || []).join(','));
  const parqueos = parqStr ? parqStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  setUnidad(id, { propietario: prop, tel_prop: telProp, inquilino: inq, tel_inq: telInq, parqueos_propietario: parqueos });
  renderUnidades();
}

// ─────────────────────────────────────────────
// ══ CONFIGURACIÓN ══
// ─────────────────────────────────────────────
function renderConfig() {
  const cfg = getConfig();
  document.getElementById('cfgExpDepto').value = cfg.expensa_depto;
  document.getElementById('cfgExpLocal').value = cfg.expensa_local;
  document.getElementById('cfgParqueo').value  = cfg.parqueo_mes;
  document.getElementById('cfgMora').value     = cfg.mora_pct;
}
function guardarConfig() {
  setConfig({
    expensa_depto : parseFloat(document.getElementById('cfgExpDepto').value),
    expensa_local : parseFloat(document.getElementById('cfgExpLocal').value),
    parqueo_mes   : parseFloat(document.getElementById('cfgParqueo').value),
    mora_pct      : parseFloat(document.getElementById('cfgMora').value),
  });
  document.getElementById('msgConfig').textContent = '✅ Configuración guardada';
  setTimeout(() => document.getElementById('msgConfig').textContent = '', 3000);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
renderResumen();
