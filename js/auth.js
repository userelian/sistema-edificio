/* ============================================================
   TORRE ESPERANZA — auth.js  (v2)
   Login con roles reales del edificio
   ============================================================
   ROLES:
   • admin       → acceso total
   • propietario → ve su depto (expensa + parqueos)
   • inquilino   → ve su depto (agua) o su parqueo
   ============================================================ */

// Usuarios demo — en producción esto vendría del servidor
const USUARIOS_DEMO = {
  // ── Administrador ──
  'admin': { password:'1234', rol:'admin', nombre:'Administrador', ir:'admin/dashboard.html' },

  // ── Propietarios (por departamento) ──
  '2A': { password:'1234', rol:'propietario', nombre:'Propietario 2A', unidad:'2A', ir:'propietario/dashboard.html' },
  '2B': { password:'1234', rol:'propietario', nombre:'Propietario 2B', unidad:'2B', ir:'propietario/dashboard.html' },
  '2C': { password:'1234', rol:'propietario', nombre:'Propietario 2C', unidad:'2C', ir:'propietario/dashboard.html' },
  '2D': { password:'1234', rol:'propietario', nombre:'Propietario 2D', unidad:'2D', ir:'propietario/dashboard.html' },
  '3A': { password:'1234', rol:'propietario', nombre:'Propietario 3A', unidad:'3A', ir:'propietario/dashboard.html' },
  '3B': { password:'1234', rol:'propietario', nombre:'Propietario 3B', unidad:'3B', ir:'propietario/dashboard.html' },
  '3C': { password:'1234', rol:'propietario', nombre:'Propietario 3C', unidad:'3C', ir:'propietario/dashboard.html' },
  '3D': { password:'1234', rol:'propietario', nombre:'Propietario 3D', unidad:'3D', ir:'propietario/dashboard.html' },
  '4A': { password:'1234', rol:'propietario', nombre:'Propietario 4A', unidad:'4A', ir:'propietario/dashboard.html' },
  '4B': { password:'1234', rol:'propietario', nombre:'Propietario 4B', unidad:'4B', ir:'propietario/dashboard.html' },
  '4C': { password:'1234', rol:'propietario', nombre:'Propietario 4C', unidad:'4C', ir:'propietario/dashboard.html' },
  '4D': { password:'1234', rol:'propietario', nombre:'Propietario 4D', unidad:'4D', ir:'propietario/dashboard.html' },
  '4E': { password:'1234', rol:'propietario', nombre:'Propietario 4E', unidad:'4E', ir:'propietario/dashboard.html' },
  '5A': { password:'1234', rol:'propietario', nombre:'Propietario 5A', unidad:'5A', ir:'propietario/dashboard.html' },
  '5B': { password:'1234', rol:'propietario', nombre:'Propietario 5B', unidad:'5B', ir:'propietario/dashboard.html' },
  '5C': { password:'1234', rol:'propietario', nombre:'Propietario 5C', unidad:'5C', ir:'propietario/dashboard.html' },
  '5D': { password:'1234', rol:'propietario', nombre:'Propietario 5D', unidad:'5D', ir:'propietario/dashboard.html' },
  '6A': { password:'1234', rol:'propietario', nombre:'Propietario 6A', unidad:'6A', ir:'propietario/dashboard.html' },
  '6B': { password:'1234', rol:'propietario', nombre:'Propietario 6B', unidad:'6B', ir:'propietario/dashboard.html' },
  '6C': { password:'1234', rol:'propietario', nombre:'Propietario 6C', unidad:'6C', ir:'propietario/dashboard.html' },
  '6D': { password:'1234', rol:'propietario', nombre:'Propietario 6D', unidad:'6D', ir:'propietario/dashboard.html' },
  '7A': { password:'1234', rol:'propietario', nombre:'Propietario 7A', unidad:'7A', ir:'propietario/dashboard.html' },
  '7B': { password:'1234', rol:'propietario', nombre:'Propietario 7B', unidad:'7B', ir:'propietario/dashboard.html' },
  '7C': { password:'1234', rol:'propietario', nombre:'Propietario 7C', unidad:'7C', ir:'propietario/dashboard.html' },
  '7D': { password:'1234', rol:'propietario', nombre:'Propietario 7D', unidad:'7D', ir:'propietario/dashboard.html' },

  // ── Inquilinos de parqueo suelto ──
  'PARQ2':  { password:'1234', rol:'inquilino_parqueo', nombre:'Inquilino PARQ2',  unidad:'PARQ2',  ir:'propietario/dashboard.html' },
  'PARQ4':  { password:'1234', rol:'inquilino_parqueo', nombre:'Inquilino PARQ4',  unidad:'PARQ4',  ir:'propietario/dashboard.html' },
  'PARQ5':  { password:'1234', rol:'inquilino_parqueo', nombre:'Inquilino PARQ5',  unidad:'PARQ5',  ir:'propietario/dashboard.html' },
  'PARQ17': { password:'1234', rol:'inquilino_parqueo', nombre:'Inquilino PARQ17', unidad:'PARQ17', ir:'propietario/dashboard.html' },
};

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────
let rolSeleccionado = 'admin';

function selectRole(rol, btn) {
  rolSeleccionado = rol;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const hints = {
    admin:            'Ej: admin',
    propietario:      'Ej: 2C  /  6A  /  7D',
    inquilino_parqueo:'Ej: PARQ2  /  PARQ17',
  };
  document.getElementById('usuario').placeholder = hints[rol] || 'Usuario';
  limpiarMsg();
}

function togglePass() {
  const i = document.getElementById('password');
  i.type = i.type === 'password' ? 'text' : 'password';
}

function mostrarError(msg) {
  const el = document.getElementById('msg-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  document.getElementById('msg-ok').classList.add('hidden');
}
function mostrarOk(msg) {
  const el = document.getElementById('msg-ok');
  el.textContent = msg;
  el.classList.remove('hidden');
  document.getElementById('msg-error').classList.add('hidden');
}
function limpiarMsg() {
  document.getElementById('msg-error').classList.add('hidden');
  document.getElementById('msg-ok').classList.add('hidden');
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function iniciarSesion() {
  const rawUser  = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value;

  if (!rawUser || !password) {
    mostrarError('⚠️ Completa usuario y contraseña.');
    return;
  }

  // Normalizar clave: PARQ en mayúscula, departamentos en mayúscula
  const clave = rawUser.toUpperCase() === 'ADMIN' ? 'admin' : rawUser.toUpperCase();
  const user = USUARIOS_DEMO[clave];

  if (!user) {
    mostrarError('❌ Usuario no encontrado. Verifica tu depto o número de parqueo.');
    return;
  }
  if (user.password !== password) {
    mostrarError('❌ Contraseña incorrecta.');
    return;
  }

  // Verificar coherencia rol seleccionado vs rol real
  const rolRealEsAdmin = user.rol === 'admin';
  const selAdmin       = rolSeleccionado === 'admin';
  if (selAdmin && !rolRealEsAdmin) {
    mostrarError('❌ Este usuario no es administrador.');
    return;
  }
  if (!selAdmin && rolRealEsAdmin) {
    mostrarError('❌ El administrador debe seleccionar la pestaña "Administrador".');
    return;
  }

  mostrarOk('✅ Acceso correcto, redirigiendo...');

  localStorage.setItem('te_sesion', JSON.stringify({
    usuario   : clave,
    nombre    : user.nombre,
    rol       : user.rol,
    unidad    : user.unidad || null,
    timestamp : Date.now(),
  }));

  setTimeout(() => { window.location.href = user.ir; }, 700);
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') iniciarSesion(); });

// Redirigir si ya hay sesión vigente
(function() {
  const s = JSON.parse(localStorage.getItem('te_sesion') || 'null');
  if (!s) return;
  if (Date.now() - s.timestamp < 8 * 3600000) {
    window.location.href = s.rol === 'admin' ? 'admin/dashboard.html' : 'propietario/dashboard.html';
  } else {
    localStorage.removeItem('te_sesion');
  }
})();
