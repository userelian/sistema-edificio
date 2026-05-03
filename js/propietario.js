/* ============================================================
   TORRE ESPERANZA — propietario.js  (v2)
   Vista de propietario / inquilino de parqueo
   ============================================================ */

const sesion = requireSesion(null); // cualquier rol que no sea admin
if (sesion && sesion.rol === 'admin') cerrarSesion();

const miUnidad = sesion?.unidad || null;
const miRol    = sesion?.rol    || '';

// ─── UI de identificación ───
if (sesion) {
  document.getElementById('nombreU').textContent    = sesion.nombre;
  document.getElementById('avatarU').textContent    = (miUnidad || '?')[0];
  document.getElementById('rolU').textContent       = miRol === 'inquilino_parqueo' ? 'Inquilino de parqueo' : 'Propietario';
  document.getElementById('sideSubtitle').textContent = miUnidad ? `Unidad: ${miUnidad}` : 'Mi Cuenta';
}

// Ocultar pestaña Agua si es inquilino de parqueo (no tiene medidor)
if (miRol === 'inquilino_parqueo') {
  document.getElementById('navAgua').style.display = 'none';
}

const MES_ACTUAL  = 'Marzo';
const ANIO_ACTUAL = 2026;

// ─────────────────────────────────────────────
// NAVEGACIÓN
// ─────────────────────────────────────────────
function ir(id, btn) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.add('hidden'));
  document.getElementById(`sec-${id}`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (id === 'inicio')   renderInicio();
  if (id === 'historial') renderHistorial();
  if (id === 'agua')     renderAgua();
}

// ─────────────────────────────────────────────
// INICIO
// ─────────────────────────────────────────────
function renderInicio() {
  if (!miUnidad) return;

  const cfg    = getConfig();
  const esParq = PARQUEOS_SUELTOS.includes(miUnidad);
  const u      = getUnidad(miUnidad);
  const mora   = calcularMora(miUnidad, MES_ACTUAL, ANIO_ACTUAL);
  const deuda  = calcularDeuda(miUnidad, MES_ACTUAL, ANIO_ACTUAL);
  const pagado = totalPagadoMes(miUnidad, MES_ACTUAL, ANIO_ACTUAL);
  const saldo  = Math.max(0, deuda + mora - pagado);
  const ok     = saldo <= 0;

  document.getElementById('tituloInicio').textContent = esParq
    ? `Parqueo ${miUnidad}` : `Departamento ${miUnidad}`;
  document.getElementById('tituloDesglose').textContent =
    `Desglose — ${MES_ACTUAL} ${ANIO_ACTUAL}`;

  // Stats cards
  let statsHTML = '';

  if (!esParq) {
    const consumo = getConsumo(miUnidad, MES_ACTUAL, ANIO_ACTUAL);
    statsHTML += `
      <div class="stat-card navy">
        <div class="stat-icon">🏠</div>
        <div class="stat-label">Departamento</div>
        <div class="stat-value">${miUnidad}</div>
        <div class="stat-sub">Piso ${miUnidad[0]}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💧</div>
        <div class="stat-label">Consumo agua</div>
        <div class="stat-value">${consumo} m³</div>
        <div class="stat-sub">${MES_ACTUAL} ${ANIO_ACTUAL}</div>
      </div>`;
  } else {
    statsHTML += `
      <div class="stat-card navy">
        <div class="stat-icon">🅿️</div>
        <div class="stat-label">Tu Parqueo</div>
        <div class="stat-value">${miUnidad}</div>
        <div class="stat-sub">Cuota: ${bs(cfg.parqueo_mes)}/mes</div>
      </div>`;
  }

  statsHTML += `
    <div class="stat-card ${ok ? 'green' : 'red'}">
      <div class="stat-icon">${ok ? '✅' : '⏳'}</div>
      <div class="stat-label">Estado ${MES_ACTUAL}</div>
      <div class="stat-value">${ok ? 'Al día' : 'Pendiente'}</div>
      <div class="stat-sub">${ok ? 'Pago registrado' : `Saldo: ${bs(saldo)}`}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">💰</div>
      <div class="stat-label">Total mes</div>
      <div class="stat-value" style="font-size:20px;">${bs(deuda + mora)}</div>
      <div class="stat-sub">${mora > 0 ? `incl. mora ${bs(mora)}` : 'Sin mora'}</div>
    </div>`;

  document.getElementById('statsInicio').innerHTML = statsHTML;

  // Desglose tabla
  const items = desglosarDeuda(miUnidad, MES_ACTUAL, ANIO_ACTUAL);
  let tbody = '';
  items.forEach(i => {
    tbody += `<tr>
      <td>${i.concepto}</td>
      <td><span class="badge ${i.quien === 'propietario' ? 'badge-navy' : 'badge-gold'}">${i.quien}</span></td>
      <td class="monto">${bs(i.monto)}</td>
    </tr>`;
  });
  if (mora > 0) {
    tbody += `<tr>
      <td>⚠️ Mora acumulada (${cfg.mora_pct}% mensual)</td>
      <td><span class="badge badge-red">mora</span></td>
      <td class="monto pendiente">${bs(mora)}</td>
    </tr>`;
  }
  tbody += `<tr style="border-top:2px solid var(--navy);">
    <td colspan="2"><strong>TOTAL A PAGAR</strong></td>
    <td class="monto" style="font-size:18px;color:var(--navy);"><strong>${bs(deuda + mora)}</strong></td>
  </tr>`;
  if (pagado > 0) {
    tbody += `<tr>
      <td colspan="2">Ya pagado</td>
      <td class="monto pagado">${bs(pagado)}</td>
    </tr>
    <tr>
      <td colspan="2"><strong>SALDO</strong></td>
      <td class="monto ${saldo > 0 ? 'pendiente' : 'pagado'}"><strong>${saldo > 0 ? bs(saldo) : '✓ Pagado'}</strong></td>
    </tr>`;
  }

  document.getElementById('bodyDesglose').innerHTML = tbody;

  // Alerta de pago
  document.getElementById('alertaPago').innerHTML = ok
    ? `<div style="background:#edf7f1;border:1px solid #b7e4c7;border-radius:8px;padding:12px 16px;color:var(--green);font-size:13px;">✅ Tu pago de <strong>${MES_ACTUAL} ${ANIO_ACTUAL}</strong> está registrado. ¡Gracias!</div>`
    : `<div style="background:#fdf0ef;border:1px solid #f5c6c2;border-radius:8px;padding:12px 16px;color:var(--red);font-size:13px;">⏳ Tienes un saldo pendiente de <strong>${bs(saldo)}</strong> para <strong>${MES_ACTUAL} ${ANIO_ACTUAL}</strong>.<br>Por favor acércate a la administración para regularizar tu pago.</div>`;
}

// ─────────────────────────────────────────────
// HISTORIAL DE PAGOS
// ─────────────────────────────────────────────
function renderHistorial() {
  const pagos = getPagosUnidad(miUnidad).slice().reverse();
  const tbody = document.getElementById('bodyHistorial');

  if (pagos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Sin pagos registrados aún</td></tr>';
    return;
  }

  tbody.innerHTML = pagos.map(p => `
    <tr>
      <td>${p.mes} ${p.anio}</td>
      <td><span class="badge badge-navy">${p.tipo_pago}</span></td>
      <td class="monto">${bs(p.monto)}</td>
      <td>${p.pagado_por}</td>
      <td style="font-size:12px;">${p.fecha}</td>
      <td style="font-size:12px;color:var(--text-muted);">${p.nota || '—'}</td>
    </tr>`).join('');
}

// ─────────────────────────────────────────────
// CONSUMO DE AGUA (solo deptos)
// ─────────────────────────────────────────────
function renderAgua() {
  const allLecturas = getLecturas();
  const tbody = document.getElementById('bodyAgua');
  const keys  = Object.keys(allLecturas).sort().reverse();

  if (keys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">El administrador aún no ha cargado lecturas</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  keys.forEach(k => {
    const d = allLecturas[k][miUnidad];
    if (!d) return;
    const cons  = Math.max(0, (d.actual || 0) - (d.anterior || 0));
    const costo = calcularAgua(cons);
    tbody.innerHTML += `
      <tr>
        <td>${k.replace('-', ' ')}</td>
        <td>${d.anterior} m³</td>
        <td>${d.actual} m³</td>
        <td><strong>${cons} m³</strong></td>
        <td style="font-size:12px;color:var(--text-muted);">${desglosarAgua(cons)}</td>
        <td class="monto"><strong>${bs(costo)}</strong></td>
      </tr>`;
  });
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
renderInicio();
