# 🏢 Torre Esperanza — Sistema de Gestión Web

Sistema web para la gestión de **expensas**, **consumo de agua** y **parqueos** del edificio Torre Esperanza.

## 🚀 Demo en vivo

> Sube a GitHub Pages y reemplaza este link con el tuyo.

## 📁 Estructura del proyecto

```
torre-esperanza/
├── index.html               ← Pantalla de Login
├── admin/
│   └── dashboard.html       ← Panel Administrador
├── propietario/
│   └── dashboard.html       ← Panel Propietario / Inquilino
├── css/
│   └── style.css            ← Estilos globales
└── js/
    ├── auth.js              ← Lógica de autenticación
    ├── data.js              ← Capa de datos (localStorage)
    ├── admin.js             ← Lógica del panel admin
    └── propietario.js       ← Lógica del panel propietario
```

## 👤 Usuarios de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `1234`    | Administrador |
| `2C`    | `1234`    | Propietario Depto 2C |
| `3A`    | `1234`    | Propietario Depto 3A |
| `5D`    | `1234`    | Propietario Depto 5D |

> Todos los departamentos del 2A al 5D tienen contraseña `1234` para la demo.

## ✨ Funcionalidades

### Administrador
- 📊 Resumen general con estado de pagos por unidad
- 💰 Configurar expensas mensuales (monto depto + parqueo)
- 💧 Registrar lecturas de medidor de agua por departamento
- 🅿️ Mapa visual de parqueos con estado de pago
- 🏠 Gestión de propietarios/inquilinos por departamento
- ✅ Registrar pagos y ver historial completo

### Propietario / Inquilino
- 🏠 Ver estado de su cuenta del mes actual
- 💰 Desglose detallado: expensa + agua + parqueo
- 📋 Historial de pagos y expensas
- 💧 Historial de consumo de agua personal
- 🅿️ Información de su parqueo asignado

## 🛠️ Tecnologías

- **HTML5** — Estructura semántica
- **CSS3** — Variables CSS, Grid, Flexbox, animaciones
- **JavaScript vanilla** — Sin frameworks
- **localStorage** — Persistencia en el navegador (sin backend por ahora)
- Fuentes: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) + [DM Sans](https://fonts.google.com/specimen/DM+Sans)

## 🌐 Subir a GitHub Pages

1. Crea un repo en GitHub: `torre-esperanza`
2. Sube todos los archivos
3. Ve a **Settings → Pages → Source: main branch / root**
4. Tu sitio estará en: `https://tu-usuario.github.io/torre-esperanza/`

## 🔮 Próximos pasos sugeridos

- [ ] Backend con Node.js + Express o PHP
- [ ] Base de datos MySQL / PostgreSQL
- [ ] Envío de notificaciones por email/WhatsApp
- [ ] Exportar reportes a PDF
- [ ] Gráficas de consumo por mes

---
Desarrollado como proyecto de aprendizaje web.
