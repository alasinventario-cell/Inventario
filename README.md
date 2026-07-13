# ALAS — Inventario · Control de Usos Internos

Módulo del ecosistema **ALAS Launcher 2.0**. HTML/CSS/JS vanilla standalone (sin build),
mismo patrón que `productividad_picking` y `Calculadora de flete`.

Registra **usos internos** de mercadería (guantes, botines, insumos…), los hace pasar por un
flujo con **auditoría de estados** y genera un **reporte para enviar por correo**.

## Flujo

```
Documento:  EMITIDO ─► AUTORIZADO ─────────────────► TERMINADO
Línea (SAP): PENDIENTE ─► CARGADO (caso CECO) ─► BAJA
```
- **Cargar a SAP**: se elige el *caso / forma de carga* (del Excel CECO) y se autocompletan
  `CUENTA MAYOR` + `CECO` + `ORDEN` + detalle; sólo la `N.RESERVA` se tipea a mano.
- **Baja**: marca la línea como consumida en SAP. El documento queda *terminado* cuando todas
  sus líneas están en baja.
- **Auditoría**: cada acción (crear, autorizar, cargar SAP, baja) registra usuario + fecha.

## Estructura

```
index.html          Shell: sidebar ALAS + topbar (INVENTARIO + búsqueda) + vistas
style.css           Estilos: menú de cards, tabla por fecha, badges, modales, reporte
app.js              Routing, wizard, carga SAP, baja, auditoría, reporte (Outlook/print/PDF)
inventario-api.js   Capa de datos — Supabase o fallback localStorage (modo DEMO)
casos-ceco.js       Casos CECO (22) + diccionario + catálogo demo (de CECO INVENTARIO.xlsx)
schema.sql          Tablas + RLS + seeds (correr en el Supabase dedicado)
supabase-config.js  Credenciales — mientras sean placeholder, corre en modo DEMO
CECO INVENTARIO.xlsx Fuente de los casos (referencia)
+ canónicos ALAS: alas-transition.js, alas-auth-client.js, ui-protection.js, icon-192.png…
```

## Modo DEMO vs Supabase

Sin credenciales en `supabase-config.js`, el módulo corre en **modo demo** (datos en
`localStorage`, catálogo demo) para poder ver y probar toda la UI. Al pegar la URL + anon key
del proyecto Supabase dedicado y correr `schema.sql`, pasa a modo real automáticamente.

## Probar en local

```bash
npx serve .    # servir por http (no file://, el SSO necesita http)
```
Redirige al Launcher si no hay sesión SSO. Para el flujo real, abrir **desde el Launcher**.

## Pendientes

- [ ] Cargar el catálogo real de mercaderías en Supabase (estructura la define el usuario)
- [ ] Crear proyecto Supabase dedicado + completar `supabase-config.js` + correr `schema.sql`
- [ ] Repo GitHub propio + deploy Vercel + registrar módulo en la tabla `modules` del Launcher
- [ ] Verificar checklist de `logistic-launcher/docs/standards.md` §12
