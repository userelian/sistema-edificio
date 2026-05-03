/* ============================================================
   TORRE ESPERANZA — admin.js
   Lógica del panel de administrador
   ============================================================ */

// ─── Guard: requiere sesión de admin ───
const sesion = requireSesion('admin');
if (sesion) {
  document.getElementById('nombreAdmin').textContent = sesion.nombre || 'Administrador';
}

// ─────────────────────────────────────────────
// NAVEGACIÓN POR SECCIONES
// ─────────────────────────────────────────────
function mostrarSeccion(id, btn) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.add('hidden'));
  document.getElementById(`sec-${id}`).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Cargar datos al entrar a cada sección
  if (id === 'resumen')       renderResumen();
  if (id === 'expensas')      renderExpensas();
  if (id === 'agua')          renderAgua();
  if (id === 'parqueos')      renderParqueos();
  if (id === 'departamentos') renderDepartamentos();
  if (id === 'pagos')         renderPagos();
}

// ─────────────────────────────────────────────
// RESUMEN GENERAL
// ─────────────────────────────────────────────
function renderResumen() {
  const mes = 'Marzo', anio = 2026;
  const exp = getExpensaMes(mes, anio);
  const aguaMes = getAguaMes(mes, anio);
  const tbody = document.getElementById('bodyResumen');
  tbody.innerHTML = '';

  let pagados = 0;

  UNIDADES.forEach(u => {
    const pagado = deptoYaPago(u.depto, mes, anio);
    const aguaDepto = aguaMes[u.depto] || {};
    const consumo = (aguaDepto.actual || 0) - (aguaDepto.anterior || 0);
    const costoAgua = consumo > 0 ? consumo * (aguaDepto.precio || 5.5) : 0;
    const total = exp.depto + exp.parqueo + costoAgua;
    if (pagado) pagados++;

    tbody.innerHTML += `
      <tr>
        <td><strong>${u.depto}</strong></td>
        <td>${u.parqueo}</td>
        <td class="monto">Bs ${exp.depto.toFixed(2)}</td>
        <td class="monto">Bs ${costoAgua.toFixed(2)}</td>
        <td class="monto">Bs ${total.toFixed(2)}</td>
        <td>${pagado
          ? '<span class="badge badge-green">✅ Pagado</span>'
          : '<span class="badge badge-red">⏳ Pendiente</span>'}</td>
        <td>
          ${!pagado ? `<button class="btn btn-primary btn-sm" onclick="pagoRapido('${u.depto}',${total})">Marcar pagado</button>` : '—'}
        </td>
      </tr>`;
  });

  document.getElementById('pagaron').textContent   = pagados;
  document.getElementById('pendientes').textContent = UNIDADES.length - pagados;
  document.getElementById('totalPagaron').textContent = UNIDADES.length;
  document.getElementById('totalDeptos').textContent  = UNIDADES.length;
}

function pagoRapido(depto, total) {
  addPago({ depto, mes: 'Marzo', anio: 2026, monto: total.toFixed(2), concepto: 'Expensa + Agua + Parqueo', fecha: new Date().toLocaleDateString('es-BO') });
  renderResumen();
}

// ─────────────────────────────────────────────
// EXPENSAS
// ─────────────────────────────────────────────
function guardarExpensa() {
  const mes   = document.getElementById('expMes').value;
  const anio  = parseInt(document.getElementById('expAnio').value);
  const depto = parseFloat(document.getElementById('expDepto').value);
  const parq  = parseFloat(document.getElementById('expParq').value);
  if (!mes || !anio || isNaN(depto) || isNaN(parq)) {
    alert('Completa todos los campos'); return;
  }
  addExpensa({ mes, anio, depto, parqueo: parq });
  document.getElementById('msgExpensa').textContent = `✅ Guardado: ${mes} ${anio}`;
  renderExpensas();
  setTimeout(() => document.getElementById('msgExpensa').textContent = '', 3000);
}

function renderExpensas() {
  const arr = getExpensas().sort((a,b) => b.anio - a.anio || 0);
  const tbody = document.getElementById('bodyExpensas');
  tbody.innerHTML = arr.map(e =>
    `<tr>
      <td>${e.mes} ${e.anio}</td>
      <td class="monto">Bs ${e.depto.toFixed(2)}</td>
      <td class="monto">Bs ${e.parqueo.toFixed(2)}</td>
    </tr>`
  ).join('');
}

// ─────────────────────────────────────────────
// AGUA
// ─────────────────────────────────────────────
function renderAgua() {
  const mes   = document.getElementById('aguaMes').value;
  const anio  = document.getElementById('aguaAnio').value;
  const prev  = getAguaMes(mes, anio);
  const precio = parseFloat(document.getElementById('preciom3').value) || 5.5;
  const tbody = document.getElementById('bodyAgua');
  tbody.innerHTML = '';

  UNIDADES.forEach(u => {
    const d = prev[u.depto] || {};
    const ant = d.anterior || 0;
    const act = d.actual   || 0;
    const con = act > ant ? act - ant : 0;
    const tot = (con * precio).toFixed(2);
    tbody.innerHTML += `
      <tr>
        <td><strong>${u.depto}</strong></td>
        <td><input type="number" class="ag-ant" data-depto="${u.depto}" value="${ant}" style="width:90px;padding:5px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;"/></td>
        <td><input type="number" class="ag-act" data-depto="${u.depto}" value="${act}" style="width:90px;padding:5px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;" oninput="recalcFila(this)"/></td>
        <td id="con-${u.depto}">${con} m³</td>
        <td>Bs ${precio}/m³</td>
        <td id="tot-${u.depto}" class="monto">Bs ${tot}</td>
        <td></td>
      </tr>`;
  });
}

function recalcFila(input) {
  const depto  = input.dataset.depto;
  const row    = input.closest('tr');
  const ant    = parseFloat(row.querySelector('.ag-ant').value) || 0;
  const act    = parseFloat(row.querySelector('.ag-act').value) || 0;
  const precio = parseFloat(document.getElementById('preciom3').value) || 5.5;
  const con    = act > ant ? act - ant : 0;
  document.getElementById(`con-${depto}`).textContent = `${con} m³`;
  document.getElementById(`tot-${depto}`).textContent = `Bs ${(con * precio).toFixed(2)}`;
}

function guardarAgua() {
  const mes    = document.getElementById('aguaMes').value;
  const anio   = document.getElementById('aguaAnio').value;
  const precio = parseFloat(document.getElementById('preciom3').value) || 5.5;
  const lecturas = {};
  document.querySelectorAll('.ag-ant').forEach(inp => {
    const depto = inp.dataset.depto;
    const ant   = parseFloat(inp.value) || 0;
    const row   = inp.closest('tr');
    const act   = parseFloat(row.querySelector('.ag-act').value) || 0;
    lecturas[depto] = { anterior: ant, actual: act, precio };
  });
  setAguaMes(mes, anio, lecturas);
  alert(`✅ Lecturas de agua guardadas para ${mes} ${anio}`);
}

// ─────────────────────────────────────────────
// PARQUEOS
// ─────────────────────────────────────────────
function renderParqueos() {
  const mes = 'Marzo', anio = 2026;
  const grid = document.getElementById('gridParqueos');
  grid.innerHTML = '';
  UNIDADES.forEach(u => {
    const pagado = deptoYaPago(u.depto, mes, anio);
    grid.innerHTML += `
      <div style="background:var(--white);border-radius:10px;padding:16px;text-align:center;box-shadow:var(--shadow);border-top:3px solid ${pagado ? 'var(--green)' : 'var(--red)'};">
        <div style="font-size:22px;margin-bottom:6px;">🅿️</div>
        <div style="font-weight:600;color:var(--navy);font-size:14px;">${u.parqueo}</div>
        <div style="font-size:12px;color:var(--text-muted);">Depto ${u.depto}</div>
        <div style="margin-top:8px;">
          <span class="badge ${pagado ? 'badge-green' : 'badge-red'}">${pagado ? '✅ Al día' : '⏳ Pendiente'}</span>
        </div>
      </div>`;
  });
}

// ─────────────────────────────────────────────
// DEPARTAMENTOS
// ─────────────────────────────────────────────
function renderDepartamentos() {
  const props = getPropietarios();
  const tbody = document.getElementById('bodyDeptos');
  tbody.innerHTML = '';
  UNIDADES.forEach(u => {
    const p = props[u.depto] || {};
    tbody.innerHTML += `
      <tr>
        <td><strong>${u.depto}</strong></td>
        <td>${u.parqueo}</td>
        <td>${p.propietario || '<span style="color:var(--text-muted)">—</span>'}</td>
        <td>${p.inquilino  || '<span style="color:var(--text-muted)">—</span>'}</td>
        <td>${p.telefono   || '—'}</td>
        <td>${p.email      || '—'}</td>
        <td><button class="btn btn-outline btn-sm" onclick="editarDepto('${u.depto}')">✏️ Editar</button></td>
      </tr>`;
  });
}

function editarDepto(depto) {
  const p = getPropietarios()[depto] || {};
  const prop = prompt(`Propietario de ${depto}:`, p.propietario || '');
  if (prop === null) return;
  const inq  = prompt('Inquilino (dejar vacío si es el mismo propietario):', p.inquilino || '');
  const tel  = prompt('Teléfono:', p.telefono || '');
  const mail = prompt('Email:', p.email || '');
  setPropietario(depto, { propietario: prop, inquilino: inq, telefono: tel, email: mail });
  renderDepartamentos();
}

// ─────────────────────────────────────────────
// PAGOS
// ─────────────────────────────────────────────
function renderPagos() {
  // Llenar select de departamentos
  const sel = document.getElementById('pagoDepto');
  sel.innerHTML = UNIDADES.map(u => `<option value="${u.depto}">${u.depto}</option>`).join('');
  renderHistorialPagos();
}

function registrarPago() {
  const depto    = document.getElementById('pagoDepto').value;
  const mes      = document.getElementById('pagoMes').value;
  const anio     = parseInt(document.getElementById('pagoAnio').value);
  const monto    = document.getElementById('pagoMonto').value;
  const concepto = document.getElementById('pagoConcepto').value || 'Expensa mensual';

  if (!depto || !mes || !anio || !monto) {
    alert('Completa todos los campos obligatorios'); return;
  }
  if (deptoYaPago(depto, mes, anio)) {
    alert(`⚠️ El departamento ${depto} ya registra pago para ${mes} ${anio}`); return;
  }
  addPago({ depto, mes, anio, monto, concepto, fecha: new Date().toLocaleDateString('es-BO') });
  document.getElementById('msgPago').textContent = `✅ Pago de ${depto} registrado correctamente`;
  setTimeout(() => document.getElementById('msgPago').textContent = '', 3000);
  renderHistorialPagos();
}

function renderHistorialPagos() {
  const pagos = getPagos().slice().reverse();
  const tbody = document.getElementById('bodyHistorialPagos');
  tbody.innerHTML = pagos.length === 0
    ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">Sin pagos registrados</td></tr>'
    : pagos.map(p =>
        `<tr>
          <td><strong>${p.depto}</strong></td>
          <td>${p.mes} ${p.anio}</td>
          <td class="monto">Bs ${parseFloat(p.monto).toFixed(2)}</td>
          <td>${p.concepto}</td>
          <td>${p.fecha}</td>
        </tr>`
      ).join('');
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
renderResumen();
