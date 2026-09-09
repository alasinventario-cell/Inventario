/* ============================================================================
 * calendario-inventarios.js — Apartado "Calendario de inventarios"
 * Vista Calendario (58%) + Lista (42%). Vanilla, azul/blanco, GSAP.
 * Arranca en modo demo (datos de ejemplo); listo para conectar a Supabase.
 * Se expone como window.CalendarioInv.render(rootEl).
 * ========================================================================== */
(function () {
  'use strict';
  var G = function () { return window.gsap; };

  /* ── Íconos (lucide) ─────────────────────────────────────────────────── */
  var ICO = {
    cal: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    warehouse: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-4 9 4v13"/><path d="M3 21h18M7 21v-6h10v6M7 12h10"/></svg>',
    factory: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21h20M4 21V11l5 3V11l5 3V8l5 3v10"/><path d="M8 21v-4h3v4"/></svg>',
    building: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h.01M13 7h.01M9 11h.01M13 11h.01M9 15h.01M13 15h.01M9 21v-4h4v4"/></svg>',
    plus: '<svg fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    left: '<svg fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    search: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
    user: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>',
    clock: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    box: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8"/></svg>',
    pin: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    x: '<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    chevronD: '<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    grip: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>',
    list: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    circle: '<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>',
    play: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/></svg>',
    check: '<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
    alert: '<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>',
    calEmpty: '<svg fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 15l6 4M15 15l-6 4"/></svg>',
    chk: '<svg fill="none" stroke="currentColor" stroke-width="2.6" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    tag: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.2"/></svg>',
    download: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  };

  /* ── Seleccionador PRO (custom select animado) ───────────────────────── */
  function mountSelect(container, opts, initial, cfg) {
    cfg = cfg || {};
    var value = initial || '', open = false;
    container.classList.add('ci-sel');
    container.innerHTML = '<button type="button" class="ci-sel__btn"><span class="ci-sel__val"></span><span class="ci-sel__cv">' + ICO.chevronD + '</span></button><div class="ci-sel__menu" hidden></div>';
    var btn = container.querySelector('.ci-sel__btn'), valEl = container.querySelector('.ci-sel__val'), menu = container.querySelector('.ci-sel__menu');
    function paintVal() { if (value) { valEl.textContent = value; valEl.classList.remove('ci-sel__val--ph'); } else { valEl.textContent = cfg.placeholder || 'Elegí…'; valEl.classList.add('ci-sel__val--ph'); } }
    function renderMenu() {
      menu.innerHTML = opts.map(function (o) { return '<button type="button" class="ci-sel__opt' + (o === value ? ' on' : '') + '" data-v="' + esc(o) + '">' + esc(o) + (o === value ? ICO.chk : '') + '</button>'; }).join('');
      menu.querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('mousedown', function (e) { e.preventDefault(); value = b.getAttribute('data-v'); paintVal(); if (cfg.onChange) cfg.onChange(value); close(); }); });
    }
    function onDoc(e) { if (!container.contains(e.target)) close(); }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    function openM() {
      renderMenu(); menu.hidden = false; open = true; container.classList.add('open');
      document.addEventListener('mousedown', onDoc, true); document.addEventListener('keydown', onEsc, true);
      if (G() && !reduce()) { G().fromTo(menu, { opacity: 0, y: -6, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .2, ease: 'back.out(2)', transformOrigin: 'top center' }); G().fromTo(menu.querySelectorAll('.ci-sel__opt'), { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: .18, stagger: .025, ease: 'power2.out', delay: .03 }); }
    }
    function close() { menu.hidden = true; open = false; container.classList.remove('open'); document.removeEventListener('mousedown', onDoc, true); document.removeEventListener('keydown', onEsc, true); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); open ? close() : openM(); });
    paintVal();
    return { getValue: function () { return value; } };
  }

  /* ── Config ──────────────────────────────────────────────────────────── */
  var DEPOSITOS = ['Depósito Central', 'Fábrica', 'Depósito Luque Sanber'];
  var DEP_ICO = [ICO.warehouse, ICO.factory, ICO.building];
  var SECTORES = ['Picking', 'Reserva', 'Recepción', 'Devoluciones', 'Expedición'];
  var TIPOS = ['Cíclico', 'General', 'Puntual', 'Rotativo'];
  var MOTIVOS = ['Averiado', 'Vencido', 'Extraviado', 'Error de carga SAP', 'Devolución pendiente', 'Robo/Merma', 'Otro'];
  var EST = {
    programado: { label: 'Programado', short: 'Prog.', ico: ICO.circle },
    en_proceso: { label: 'Contando', short: 'Cont.', ico: ICO.play },
    realizado: { label: 'Realizado', short: 'Hecho', ico: ICO.check },
    pendiente: { label: 'Pendiente', short: 'Pend.', ico: ICO.alert },
  };
  // Interior del badge de estado: "Contando" con puntos animados; resto ícono + label.
  function estBadgeInner(k) {
    if (k === 'en_proceso') return '<span class="ci-cnt-dots" aria-hidden="true"><i></i><i></i><i></i></span>Contando';
    return EST[k].ico + EST[k].label;
  }
  var EST_KEYS = ['programado', 'en_proceso', 'realizado', 'pendiente'];
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var DOW = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayISO() { return iso(new Date()); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function fmtDayLong(isoStr) { var d = new Date(isoStr + 'T00:00:00'); return d.toLocaleDateString('es-PY', { weekday: 'long', day: '2-digit', month: 'long' }); }
  function reduce() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ── Datos demo ──────────────────────────────────────────────────────── */
  var RESP = ['Carlos Gómez', 'David Espinola', 'Elias Cabrera', 'Jonathan Peralta', 'Lisandro López'];
  var seq = 1;
  function sampleItems() {
    var src = window.MERCADERIAS_DEMO || [];
    var n = 2 + Math.floor(Math.random() * 4), a = [], used = {};
    for (var i = 0; i < n && src.length; i++) {
      var m = src[Math.floor(Math.random() * src.length)];
      if (!m || used[m.codigo]) continue; used[m.codigo] = 1;
      a.push({ codigo: m.codigo, descripcion: m.descripcion, um: m.um || 'UN' });
    }
    return a;
  }
  function mk(off, hora, nombre, dep, sector, estado, prio, resp, _skus, diffs) {
    var d = new Date(); d.setDate(d.getDate() + off);
    return {
      id: seq, codigo: 'INV-' + pad(1000 + seq++), fecha: iso(d), hora: hora, nombre: nombre, deposito: dep,
      sector: sector, tipo: TIPOS[(seq) % TIPOS.length], ubicacion: 'Rack ' + sector.slice(0, 1) + pad((seq * 3) % 40) + ' – ' + sector.slice(0, 1) + pad((seq * 3 % 40) + 20),
      estado: estado, prioridad: prio, responsable: resp, items: sampleItems(), observacion: '', diffs: !!diffs, orden: null,
    };
  }
  var DATA = [
    mk(0, '09:00', 'Inventario cíclico Picking', 0, 'Picking', 'programado', 'ALTA', 'Carlos Gómez', 128, false),
    mk(0, '14:00', 'Conteo Reserva', 0, 'Reserva', 'en_proceso', 'NORMAL', 'Elias Cabrera', 340, false),
    mk(0, '16:30', 'Control Expedición', 0, 'Expedición', 'pendiente', 'NORMAL', 'David Espinola', 56, false),
    mk(2, '08:30', 'Inventario general Recepción', 0, 'Recepción', 'programado', 'NORMAL', 'Jonathan Peralta', 210, false),
    mk(-1, '17:00', 'Conteo rotativo Devoluciones', 0, 'Devoluciones', 'realizado', 'BAJA', 'Lisandro López', 74, true),
    mk(4, '10:30', 'Inventario Picking sector B', 0, 'Picking', 'programado', 'ALTA', 'Carlos Gómez', 156, false),
    mk(1, '09:30', 'Conteo cíclico Fábrica', 1, 'Reserva', 'programado', 'NORMAL', 'David Espinola', 420, false),
    mk(1, '15:00', 'Control materia prima', 1, 'Recepción', 'en_proceso', 'ALTA', 'Jonathan Peralta', 88, false),
    mk(-2, '11:00', 'Inventario insumos', 1, 'Picking', 'realizado', 'NORMAL', 'Elias Cabrera', 132, false),
    mk(3, '13:00', 'Conteo Luque Picking', 2, 'Picking', 'programado', 'NORMAL', 'Lisandro López', 98, false),
    mk(0, '10:00', 'Control Luque Reserva', 2, 'Reserva', 'pendiente', 'ALTA', 'Carlos Gómez', 64, false),
  ];

  /* ── Estado de la vista ──────────────────────────────────────────────── */
  var S = { root: null, depIdx: 0, cur: (function () { var d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; })(),
    sel: null, fEstado: 'all', fResp: '', fMarca: '', respOpen: false, drag: null, over: null };
  var tipEl = null;

  function deposito() { return DEPOSITOS[S.depIdx]; }
  function monthRows() {
    var y = S.cur.y, m = S.cur.m;
    return DATA.filter(function (x) { var d = new Date(x.fecha + 'T00:00:00'); return d.getFullYear() === y && d.getMonth() === m; });
  }
  function depMonthRows() { var dep = deposito(); return monthRows().filter(function (x) { return x.deposito === dep; }); }
  function depCount(i) {
    var dep = DEPOSITOS[i];
    return monthRows().filter(function (x) { return x.deposito === dep; }).length;
  }
  function listRows() {
    var rows = depMonthRows().slice();
    if (S.sel) rows = rows.filter(function (x) { return x.fecha === S.sel; });
    if (S.fEstado !== 'all') rows = rows.filter(function (x) { return x.estado === S.fEstado; });
    if (S.fResp) rows = rows.filter(function (x) { return x.responsable === S.fResp; });
    if (S.fMarca) rows = rows.filter(function (x) { return (x.tipo || '') === S.fMarca; });
    return rows.sort(function (a, b) {
      var oa = a.orden == null ? 1e9 : a.orden, ob = b.orden == null ? 1e9 : b.orden;
      if (oa !== ob) return oa - ob;
      return a.fecha === b.fecha ? (a.hora || '99').localeCompare(b.hora || '99') : a.fecha.localeCompare(b.fecha);
    });
  }
  function respList() {
    var set = {}; depMonthRows().forEach(function (x) { if (x.responsable) set[x.responsable] = 1; });
    return Object.keys(set).sort();
  }
  function marcaFilterList() {
    var set = {}; depMonthRows().forEach(function (x) { if (x.tipo) set[x.tipo] = 1; });
    return Object.keys(set).sort();
  }

  /* ── Capa de datos (Supabase; si no hay cliente → demo en memoria) ─────── */
  function DB() { return window.__inventarioDB || null; }
  var REMOTE = !!DB();
  function userName() { try { return (window.AlasAuthClient && window.AlasAuthClient.getCurrentUser && window.AlasAuthClient.getCurrentUser()) || 'Operador'; } catch (_) { return 'Operador'; } }
  function mapRow(r, its) {
    return {
      id: r.id, codigo: 'INV-' + (1000 + r.id), fecha: String(r.fecha).slice(0, 10), hora: r.hora ? String(r.hora).slice(0, 5) : '',
      nombre: 'Inventario ' + (r.marca || r.sector || ''), deposito: r.deposito, sector: r.sector, tipo: r.marca || 'General',
      ubicacion: r.ubicacion || '', estado: r.estado || 'programado', prioridad: r.prioridad || 'NORMAL', responsable: r.responsable || '',
      items: (its || []).map(function (it) { return { id: it.id, codigo: it.codigo, descripcion: it.descripcion || '', um: it.um || 'UN', sap: it.sap, contado: it.contado, diff: it.diff, motivo: it.motivo || '', nota: it.nota || '' }; }),
      observacion: r.observacion || '', diffs: !!r.diffs, orden: r.orden,
    };
  }
  function dbLoad(fromISO, toISO) {
    var db = DB(); if (!db) return Promise.resolve(null);
    return db.from('inventarios').select('*').gte('fecha', fromISO).lte('fecha', toISO).order('orden', { nullsFirst: false }).order('fecha')
      .then(function (inv) {
        if (inv.error) { console.error('[inv] load', inv.error); return []; }
        var rows = inv.data || []; if (!rows.length) return [];
        return db.from('inventario_items').select('*').in('inventario_id', rows.map(function (r) { return r.id; }))
          .then(function (its) {
            var by = {}; (its.data || []).forEach(function (it) { (by[it.inventario_id] = by[it.inventario_id] || []).push(it); });
            return rows.map(function (r) { return mapRow(r, by[r.id]); });
          });
      });
  }
  function dbCreate(obj) {
    var db = DB(); if (!db) return Promise.resolve(null);
    var ins = { fecha: obj.fecha, hora: obj.hora || null, deposito: obj.deposito, sector: obj.sector, marca: obj.tipo, prioridad: obj.prioridad, responsable: obj.responsable || null, ubicacion: obj.ubicacion || null, estado: obj.estado || 'programado', observacion: obj.observacion || null, orden: obj.orden, diffs: !!obj.diffs, usuario: userName() };
    return db.from('inventarios').insert(ins).select().single().then(function (r) {
      if (r.error) { console.error('[inv] create', r.error); return null; }
      var id = r.data.id;
      if (obj.items && obj.items.length) return db.from('inventario_items').insert(obj.items.map(function (it) { return { inventario_id: id, codigo: it.codigo, descripcion: it.descripcion || null, um: it.um || 'UN' }; })).then(function () { return id; });
      return id;
    });
  }
  function dbUpdate(id, patch) { var db = DB(); if (!db) return; db.from('inventarios').update(patch).eq('id', id).then(function (r) { if (r && r.error) console.error('[inv] update', r.error); }); }
  function dbSaveConteo(id, itemsArr, estado, diffs) {
    var db = DB(); if (!db) return;
    db.from('inventario_items').delete().eq('inventario_id', id).then(function () {
      if (itemsArr.length) db.from('inventario_items').insert(itemsArr.map(function (it) { return { inventario_id: id, codigo: it.codigo, descripcion: it.descripcion || null, um: it.um || 'UN', sap: it.sap == null ? null : it.sap, contado: it.contado == null ? null : it.contado, diff: it.diff == null ? null : it.diff, motivo: it.motivo || null, nota: it.nota || null }; })).then(function () {});
    });
    db.from('inventarios').update({ estado: estado, diffs: !!diffs }).eq('id', id).then(function () {});
  }
  function refresh(animate) {
    if (!REMOTE) { paintSeg(); paintKpis(); paintCalendar(animate); paintList(animate); return; }
    var cells = monthCells();
    dbLoad(iso(cells[0]), iso(cells[cells.length - 1])).then(function (rows) {
      if (rows) DATA = rows;
      paintSeg(); paintKpis(); paintCalendar(animate); paintList(animate);
    });
  }

  /* ── Render principal ────────────────────────────────────────────────── */
  function render(root) {
    S.root = root;
    root.innerHTML = '';
    var view = el('<div class="ci-root"></div>');
    view.appendChild(buildHeader());
    view.appendChild(buildKpis());
    var body = el('<div class="ci-body"></div>');
    body.appendChild(buildCalPanel());
    body.appendChild(buildListPanel());
    view.appendChild(body);
    root.appendChild(view);
    wire(); wirePress();
    if (REMOTE) DATA = [];
    paintSeg(); paintKpis(); paintCalendar(false); paintList(false);
    entrance();
    refresh(false);
  }

  function buildHeader() {
    var h = el('<div class="ci-head"></div>');
    h.innerHTML =
      '<div class="ci-head__brand"><span class="ci-head__ic">' + ICO.cal + '</span>' +
      '<div><h1 class="ci-head__ttl">Calendario de inventarios</h1><p class="ci-head__sub">Planificación y control por depósito</p></div></div>' +
      '<div class="ci-head__spacer"></div>' +
      '<div class="ci-seg" id="ciSeg"></div>' +
      '<div class="ci-head__spacer"></div>' +
      '<button class="ci-btn-exp" id="ciExport">' + ICO.download + ' Exportar Excel</button>' +
      '<button class="ci-btn-new" id="ciNew">' + ICO.plus + ' Nuevo inventario</button>';
    return h;
  }
  function buildKpis() {
    return el('<div class="ci-kpis" id="ciKpis"></div>');
  }
  function buildCalPanel() {
    var p = el('<div class="ci-panel"></div>');
    p.innerHTML =
      '<div class="ci-phead">' +
        '<button class="ci-phead__btn" id="ciPrev" aria-label="Mes anterior">' + ICO.left + '</button>' +
        '<button class="ci-phead__btn" id="ciNext" aria-label="Mes siguiente">' + ICO.right + '</button>' +
        '<span class="ci-phead__ttl" id="ciMonth"></span>' +
        '<button class="ci-phead__hoy" id="ciHoy">Hoy</button>' +
      '</div>' +
      '<div class="ci-cal">' +
        '<div class="ci-dow">' + DOW.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div>' +
        '<div class="ci-grid" id="ciGrid"></div>' +
      '</div>';
    return p;
  }
  function buildListPanel() {
    var p = el('<div class="ci-panel"></div>');
    p.innerHTML =
      '<div class="ci-phead">' +
        '<span class="ci-phead__ico">' + ICO.list + '</span>' +
        '<div class="ci-phead__meta"><div class="t" id="ciListTtl">Inventarios</div><div class="s" id="ciListSub"></div></div>' +
        '<button class="ci-phead__mes" id="ciVerMes" hidden>' + ICO.cal + ' Ver el mes</button>' +
      '</div>' +
      '<div class="ci-filters">' +
        '<div class="ci-estados" id="ciEstados"></div>' +
        '<div class="ci-resp" id="ciResp"><button class="ci-resp__btn" id="ciRespBtn">' + ICO.user + '<span id="ciRespLbl">Responsable</span>' + '<span class="cv">' + ICO.chevronD + '</span></button></div>' +
        '<div class="ci-resp" id="ciMarcaF"><button class="ci-resp__btn" id="ciMarcaBtn">' + ICO.tag + '<span id="ciMarcaLbl">Marca</span>' + '<span class="cv">' + ICO.chevronD + '</span></button></div>' +
        '<button class="ci-clear" id="ciClear" hidden>' + ICO.x + ' Limpiar</button>' +
      '</div>' +
      '<div class="ci-list" id="ciList"></div>';
    return p;
  }

  /* ── Pintado ─────────────────────────────────────────────────────────── */
  function paintSeg() {
    var seg = S.root.querySelector('#ciSeg'); if (!seg) return;
    seg.innerHTML = DEPOSITOS.map(function (d, i) {
      return '<button class="ci-seg__btn' + (i === S.depIdx ? ' on' : '') + '" data-dep="' + i + '" title="' + esc(d) + ' — ' + depCount(i) + ' inventarios en ' + MESES[S.cur.m] + '">' +
        '<span class="ci-seg__ic">' + DEP_ICO[i] + '</span>' +
        '<span class="ci-seg__col"><span class="ci-seg__lbl">' + esc(d) + '</span><span class="ci-seg__n">' + depCount(i) + '</span></span>' +
      '</button>';
    }).join('');
    seg.querySelectorAll('[data-dep]').forEach(function (b) {
      b.addEventListener('click', function () { setDep(+b.getAttribute('data-dep')); });
    });
  }
  function paintKpis() {
    var box = S.root.querySelector('#ciKpis'); if (!box) return;
    var rows = depMonthRows();
    var by = { programado: 0, en_proceso: 0, realizado: 0, pendiente: 0 };
    rows.forEach(function (x) { by[x.estado] = (by[x.estado] || 0) + 1; });
    var total = rows.length, cumpl = total ? Math.round(by.realizado / total * 100) : 0;
    box.innerHTML =
      '<div class="ci-kpi"><span class="ci-kpi__n">' + total + '</span><span class="ci-kpi__l">Inventarios</span></div><span class="ci-kpi__sep"></span>' +
      '<div class="ci-kpi ci-kpi--real"><span class="ci-kpi__n">' + by.realizado + '</span><span class="ci-kpi__l">Realizados</span></div>' +
      '<div class="ci-kpi ci-kpi--proc"><span class="ci-kpi__n">' + by.en_proceso + '</span><span class="ci-kpi__l">Contando</span></div>' +
      '<div class="ci-kpi ci-kpi--prog"><span class="ci-kpi__n">' + by.programado + '</span><span class="ci-kpi__l">Programados</span></div>' +
      '<div class="ci-kpi ci-kpi--pend"><span class="ci-kpi__n">' + by.pendiente + '</span><span class="ci-kpi__l">Pendientes</span></div>' +
      '<span class="ci-kpi__sep"></span><div class="ci-kpi"><span class="ci-kpi__n">' + cumpl + '%</span><span class="ci-kpi__l">Cumplimiento</span></div>';
  }

  function monthCells() {
    var y = S.cur.y, m = S.cur.m;
    var first = new Date(y, m, 1);
    var startOff = (first.getDay() + 6) % 7;
    var dim = new Date(y, m + 1, 0).getDate();
    var total = Math.ceil((startOff + dim) / 7) * 7;
    var start = new Date(y, m, 1 - startOff);
    var out = [];
    for (var i = 0; i < total; i++) { var d = new Date(start); d.setDate(start.getDate() + i); out.push(d); }
    return out;
  }
  function paintCalendar(animate) {
    var mo = S.root.querySelector('#ciMonth'); if (mo) mo.textContent = MESES[S.cur.m] + ' ' + S.cur.y;
    var grid = S.root.querySelector('#ciGrid'); if (!grid) return;
    var cells = monthCells();
    grid.style.gridTemplateRows = 'repeat(' + (cells.length / 7) + ', minmax(0,1fr))';
    var dep = deposito(), tISO = todayISO();
    var byDate = {}; depMonthRows().forEach(function (x) { (byDate[x.fecha] = byDate[x.fecha] || []).push(x); });
    grid.innerHTML = '';
    cells.forEach(function (d) {
      var isoS = iso(d), inMonth = d.getMonth() === S.cur.m, wknd = (d.getDay() === 0 || d.getDay() === 6);
      var evs = (byDate[isoS] || []).slice().sort(function (a, b) { return (a.hora || '99').localeCompare(b.hora || '99'); });
      var shown = evs.slice(0, 3);
      var cell = el('<div class="ci-cell' + (inMonth ? '' : ' out') + (wknd && inMonth ? ' wknd' : '') + (isoS === tISO ? ' today' : '') + (isoS === S.sel ? ' sel' : '') + '" data-iso="' + isoS + '"></div>');
      var evHtml = shown.map(function (x) {
        var lbl = (x.tipo && x.tipo !== 'General') ? x.tipo : (x.sector || x.nombre);
        return '<div class="ci-ev st-' + x.estado + '" draggable="true" data-id="' + x.id + '" title="' + esc(x.nombre + (x.sector ? ' · ' + x.sector : '')) + '">' +
          '<span class="ci-ev__bar"></span><span class="ci-ev__h">' + esc(x.hora) + '</span><span class="ci-ev__t">' + esc(lbl) + '</span></div>';
      }).join('');
      cell.innerHTML =
        '<div class="ci-cell__top"><span class="ci-cell__d">' + d.getDate() + '</span></div>' +
        '<div class="ci-cell__events">' + evHtml + (evs.length > shown.length ? '<div class="ci-more">+' + (evs.length - shown.length) + ' más</div>' : '') + '</div>';
      grid.appendChild(cell);
    });
    wireCalendar();
    if (animate && G() && !reduce()) G().from(grid.querySelectorAll('.ci-cell'), { opacity: 0, scale: .94, y: 6, duration: .32, stagger: .004, ease: 'power2.out', clearProps: 'all' });
  }

  function paintList(animate) {
    var listTtl = S.root.querySelector('#ciListTtl'), sub = S.root.querySelector('#ciListSub'), verMes = S.root.querySelector('#ciVerMes');
    if (listTtl) listTtl.textContent = S.sel ? ('Inventarios del ' + fmtDayLong(S.sel).replace(/^\w/, function (c) { return c.toUpperCase(); })) : ('Inventarios de ' + MESES[S.cur.m]);
    var rows = listRows();
    if (sub) sub.textContent = rows.length + ' inventario' + (rows.length === 1 ? '' : 's') + ' · ' + deposito();
    if (verMes) verMes.hidden = !S.sel;
    // filtros
    paintEstados(); paintRespBtn(); paintMarcaBtn();
    var clr = S.root.querySelector('#ciClear'); if (clr) clr.hidden = !(S.fEstado !== 'all' || S.fResp || S.fMarca);
    var list = S.root.querySelector('#ciList'); if (!list) return;
    if (!rows.length) {
      list.innerHTML =
        '<div class="ci-empty"><span class="ci-empty__ic">' + ICO.calEmpty + '</span>' +
        '<div><h4>Sin inventarios</h4><p>' + (S.fEstado !== 'all' || S.fResp || S.fMarca ? 'Probá con otros filtros.' : ('No hay inventarios ' + (S.sel ? 'este día' : 'este mes') + ' en ' + deposito() + '.')) + '</p></div>' +
        '<button class="ci-mbtn primary" id="ciEmptyNew">' + ICO.plus + ' Nuevo inventario</button></div>';
      var b = list.querySelector('#ciEmptyNew'); if (b) b.addEventListener('click', function () { openModal(S.sel || todayISO()); });
      if (animate && G() && !reduce()) G().from(list.querySelector('.ci-empty').children, { opacity: 0, y: 12, scale: .96, duration: .4, stagger: .07, ease: 'back.out(1.6)', clearProps: 'all' });
      return;
    }
    list.innerHTML = rows.map(function (x, i) { return rowHtml(x, i); }).join('');
    wireList();
    if (animate && G() && !reduce()) G().from(list.querySelectorAll('.ci-row'), { opacity: 0, y: 6, duration: .3, stagger: { amount: 0.32 }, ease: 'power2.out', clearProps: 'all' });
  }
  function rowHtml(x, i) {
    var d = new Date(x.fecha + 'T00:00:00');
    var flags = '';
    if (x.diffs) flags += '<span class="ci-flag diff">Con diferencias</span>';
    if (x.prioridad === 'ALTA') flags += '<span class="ci-flag">Alta prioridad</span>';
    return '<div class="ci-row st-' + x.estado + '" data-id="' + x.id + '" data-rowid="' + x.id + '" draggable="true">' +
      '<span class="ci-row__bar"></span>' +
      '<span class="ci-row__grip">' + ICO.grip + '</span>' +
      '<span class="ci-row__n">' + (i + 1) + '</span>' +
      '<div class="ci-row__date"><span class="d">' + d.getDate() + '</span><span class="m">' + MESES[d.getMonth()].slice(0, 3) + '</span></div>' +
      '<div class="ci-row__main"><div class="ci-row__ttl">' + esc(x.nombre) + (flags ? '<span class="ci-row__flags">' + flags + '</span>' : '') + '</div>' +
      '<div class="ci-row__meta">' +
        '<span class="ci-pill">' + ICO.clock + '<span>' + esc(x.hora) + '</span></span>' +
        '<span class="ci-pill">' + ICO.user + '<span>' + esc(x.responsable || '—') + '</span></span>' +
        '<span class="ci-pill">' + ICO.box + '<span>' + esc(x.sector) + ' · ' + (x.items ? x.items.length : 0) + ' ítems</span></span>' +
      '</div></div>' +
      '<span class="ci-badge-st st-' + x.estado + '">' + estBadgeInner(x.estado) + '</span>' +
    '</div>';
  }
  function paintEstados() {
    var box = S.root.querySelector('#ciEstados'); if (!box) return;
    var opts = [{ k: 'all', l: 'Todos', t: 'Todos' }].concat(EST_KEYS.map(function (k) { return { k: k, l: EST[k].short, t: EST[k].label }; }));
    box.innerHTML = opts.map(function (o) { return '<button class="' + (S.fEstado === o.k ? 'on e-' + o.k : '') + '" data-est="' + o.k + '" title="' + o.t + '">' + o.l + '</button>'; }).join('');
    box.querySelectorAll('[data-est]').forEach(function (b) { b.addEventListener('click', function () { S.fEstado = b.getAttribute('data-est'); paintList(true); }); });
  }
  function paintRespBtn() {
    var lbl = S.root.querySelector('#ciRespLbl'), btn = S.root.querySelector('#ciRespBtn');
    if (lbl) lbl.textContent = S.fResp || 'Responsable';
    if (btn) btn.classList.toggle('on', !!S.fResp);
  }
  function paintMarcaBtn() {
    var lbl = S.root.querySelector('#ciMarcaLbl'), btn = S.root.querySelector('#ciMarcaBtn');
    if (lbl) lbl.textContent = S.fMarca || 'Marca';
    if (btn) btn.classList.toggle('on', !!S.fMarca);
  }

  /* ── Interacciones ───────────────────────────────────────────────────── */
  function setDep(i) {
    if (i === S.depIdx) return; S.depIdx = i; S.sel = null; S.fResp = '';
    paintSeg(); paintKpis(); paintList(true);
    var grid = S.root.querySelector('#ciGrid');
    if (G() && !reduce()) {
      if (grid) G().fromTo(grid, { opacity: .5 }, { opacity: 1, duration: .25, ease: 'power2.out' });
      var act = S.root.querySelector('.ci-seg__btn.on');
      if (act) {
        G().fromTo(act, { scale: .92 }, { scale: 1, duration: .38, ease: 'back.out(3)', clearProps: 'transform' });
        var ic = act.querySelector('.ci-seg__ic svg'); if (ic) G().fromTo(ic, { scale: .4, rotate: -12 }, { scale: 1, rotate: 0, duration: .45, ease: 'back.out(4)' });
        var n = act.querySelector('.ci-seg__n'); if (n) G().fromTo(n, { scale: 1.45, opacity: .3 }, { scale: 1, opacity: 1, duration: .42, ease: 'back.out(2)' });
      }
    }
    paintCalendar(true);
  }
  function goMonth(delta) {
    var d = new Date(S.cur.y, S.cur.m + delta, 1); S.cur = { y: d.getFullYear(), m: d.getMonth() }; S.sel = null; S.fResp = '';
    refresh(true);
    var mo = S.root.querySelector('#ciMonth'); if (mo && G() && !reduce()) G().fromTo(mo, { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: .3, ease: 'power2.out' });
  }
  function goToday() { var d = new Date(); S.cur = { y: d.getFullYear(), m: d.getMonth() }; S.sel = null; refresh(true); }
  function selectDay(isoS) { S.sel = (S.sel === isoS ? null : isoS); paintCalendar(false); paintList(true); }

  function wire() {
    var root = S.root;
    root.querySelector('#ciNew').addEventListener('click', function () { openModal(S.sel || todayISO()); });
    root.querySelector('#ciExport').addEventListener('click', exportExcel);
    root.querySelector('#ciPrev').addEventListener('click', function () { goMonth(-1); });
    root.querySelector('#ciNext').addEventListener('click', function () { goMonth(1); });
    root.querySelector('#ciHoy').addEventListener('click', goToday);
    root.querySelector('#ciVerMes').addEventListener('click', function () { S.sel = null; paintCalendar(false); paintList(true); });
    root.querySelector('#ciClear').addEventListener('click', function () { S.fEstado = 'all'; S.fResp = ''; S.fMarca = ''; paintList(true); });
    // dropdown responsable
    root.querySelector('#ciRespBtn').addEventListener('click', function (e) { e.stopPropagation(); toggleResp(); });
    // dropdown marca
    root.querySelector('#ciMarcaBtn').addEventListener('click', function (e) { e.stopPropagation(); toggleMarcaF(); });
  }
  function toggleResp() {
    var rwrap = S.root.querySelector('#ciResp');
    if (rwrap.classList.contains('open')) { closeResp(); return; }
    var opts = respList();
    var menu = el('<div class="ci-resp__menu"></div>');
    menu.innerHTML =
      '<button class="ci-resp__opt' + (!S.fResp ? ' on' : '') + '" data-r=""><span class="ci-resp__av">' + ICO.user + '</span>Todos</button>' +
      opts.map(function (r) { return '<button class="ci-resp__opt' + (S.fResp === r ? ' on' : '') + '" data-r="' + esc(r) + '"><span class="ci-resp__av">' + esc(r.charAt(0).toUpperCase()) + '</span>' + esc(r) + '</button>'; }).join('');
    rwrap.appendChild(menu); rwrap.classList.add('open');
    menu.querySelectorAll('[data-r]').forEach(function (b) { b.addEventListener('click', function () { S.fResp = b.getAttribute('data-r'); closeResp(); paintList(true); }); });
    if (G() && !reduce()) G().fromTo(menu, { opacity: 0, y: -6, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .2, ease: 'back.out(2)', transformOrigin: 'top right' });
    setTimeout(function () { document.addEventListener('mousedown', onDocResp, true); document.addEventListener('keydown', onEscResp, true); }, 0);
  }
  function onDocResp(e) { var w = S.root && S.root.querySelector('#ciResp'); if (w && !w.contains(e.target)) closeResp(); }
  function onEscResp(e) { if (e.key === 'Escape') closeResp(); }
  function closeResp() {
    var w = S.root && S.root.querySelector('#ciResp'); if (!w) return;
    var m = w.querySelector('.ci-resp__menu'); if (m) m.remove(); w.classList.remove('open');
    document.removeEventListener('mousedown', onDocResp, true); document.removeEventListener('keydown', onEscResp, true);
  }
  function toggleMarcaF() {
    var wrap = S.root.querySelector('#ciMarcaF');
    if (wrap.classList.contains('open')) { closeMarcaF(); return; }
    var opts = marcaFilterList();
    var menu = el('<div class="ci-resp__menu"></div>');
    menu.innerHTML =
      '<button class="ci-resp__opt' + (!S.fMarca ? ' on' : '') + '" data-m=""><span class="ci-resp__av">' + ICO.tag + '</span>Todas</button>' +
      (opts.length ? opts.map(function (r) { return '<button class="ci-resp__opt' + (S.fMarca === r ? ' on' : '') + '" data-m="' + esc(r) + '"><span class="ci-resp__av">' + esc(r.charAt(0).toUpperCase()) + '</span>' + esc(r) + '</button>'; }).join('') : '<div class="ci-res__empty">Sin marcas este mes</div>');
    wrap.appendChild(menu); wrap.classList.add('open');
    menu.querySelectorAll('[data-m]').forEach(function (b) { b.addEventListener('click', function () { S.fMarca = b.getAttribute('data-m'); closeMarcaF(); paintList(true); }); });
    if (G() && !reduce()) G().fromTo(menu, { opacity: 0, y: -6, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .2, ease: 'back.out(2)', transformOrigin: 'top right' });
    setTimeout(function () { document.addEventListener('mousedown', onDocMarcaF, true); document.addEventListener('keydown', onEscMarcaF, true); }, 0);
  }
  function onDocMarcaF(e) { var w = S.root && S.root.querySelector('#ciMarcaF'); if (w && !w.contains(e.target)) closeMarcaF(); }
  function onEscMarcaF(e) { if (e.key === 'Escape') closeMarcaF(); }
  function closeMarcaF() {
    var w = S.root && S.root.querySelector('#ciMarcaF'); if (!w) return;
    var m = w.querySelector('.ci-resp__menu'); if (m) m.remove(); w.classList.remove('open');
    document.removeEventListener('mousedown', onDocMarcaF, true); document.removeEventListener('keydown', onEscMarcaF, true);
  }

  function wireCalendar() {
    var grid = S.root.querySelector('#ciGrid');
    grid.querySelectorAll('.ci-cell').forEach(function (cell) {
      var isoS = cell.getAttribute('data-iso');
      // El calendario es de solo lectura: SOLO tooltip (hover) + arrastrar a otra fecha.
      cell.addEventListener('dragover', function (e) { if (S.drag != null) { e.preventDefault(); cell.classList.add('over'); } });
      cell.addEventListener('dragleave', function () { cell.classList.remove('over'); });
      cell.addEventListener('drop', function (e) { e.preventDefault(); cell.classList.remove('over'); var id = +e.dataTransfer.getData('text/plain'); if (id) reschedule(id, isoS); S.drag = null; });
      cell.querySelectorAll('.ci-ev').forEach(function (ev) {
        var id = +ev.getAttribute('data-id');
        ev.addEventListener('mouseenter', function () { showTip(id, ev.getBoundingClientRect()); });
        ev.addEventListener('mouseleave', hideTip);
        ev.addEventListener('dragstart', function (e) { S.drag = id; hideTip(); e.dataTransfer.setData('text/plain', String(id)); e.dataTransfer.effectAllowed = 'move'; });
        ev.addEventListener('dragend', function () { S.drag = null; });
      });
    });
  }
  function wireList() {
    var list = S.root.querySelector('#ciList');
    list.querySelectorAll('.ci-row').forEach(function (row) {
      var id = +row.getAttribute('data-id');
      row.addEventListener('click', function () { openDetail(id); });
      row.addEventListener('dragstart', function (e) { S.drag = id; e.dataTransfer.setData('text/plain', String(id)); e.dataTransfer.effectAllowed = 'move'; row.classList.add('drag'); });
      row.addEventListener('dragend', function () { S.drag = null; row.classList.remove('drag'); });
      row.addEventListener('dragover', function (e) { if (S.drag != null && S.drag !== id) { e.preventDefault(); row.classList.add('over'); } });
      row.addEventListener('dragleave', function () { row.classList.remove('over'); });
      row.addEventListener('drop', function (e) { e.preventDefault(); row.classList.remove('over'); var from = +e.dataTransfer.getData('text/plain'); if (from) reorder(from, id); S.drag = null; });
    });
  }

  function reschedule(id, isoS) {
    var x = DATA.find(function (t) { return t.id === id; }); if (!x || x.fecha === isoS) return;
    x.fecha = isoS;
    if (REMOTE) dbUpdate(id, { fecha: isoS });
    paintSeg(); paintKpis(); paintCalendar(false); paintList(false);
    var cell = S.root.querySelector('.ci-cell[data-iso="' + isoS + '"]');
    if (cell && G() && !reduce()) G().fromTo(cell, { scale: .9 }, { scale: 1, duration: .4, ease: 'back.out(2.2)' });
  }
  function reorder(fromId, targetId) {
    if (fromId === targetId) return;
    var cur = listRows();
    var fi = cur.findIndex(function (t) { return t.id === fromId; }), ti = cur.findIndex(function (t) { return t.id === targetId; });
    if (fi < 0 || ti < 0) return;
    var moved = cur.splice(fi, 1)[0]; cur.splice(ti, 0, moved);
    cur.forEach(function (t, i) { var o = DATA.find(function (z) { return z.id === t.id; }); if (o) o.orden = i; if (REMOTE) dbUpdate(t.id, { orden: i }); });
    paintList(false);
    var row = S.root.querySelector('.ci-row[data-rowid="' + fromId + '"]');
    if (row && G() && !reduce()) G().fromTo(row, { backgroundColor: 'rgba(8,119,175,.16)' }, { backgroundColor: 'rgba(255,255,255,0)', duration: .6, ease: 'power2.out', clearProps: 'background-color' });
  }

  /* ── Tooltip ─────────────────────────────────────────────────────────── */
  function showTip(id, rect) {
    var x = DATA.find(function (t) { return t.id === id; }); if (!x) return;
    hideTip();
    tipEl = el('<div class="ci-tip"></div>');
    tipEl.innerHTML =
      '<div class="ci-tip__h"><div class="t">' + esc(x.tipo) + '</div><div class="s">' + esc(x.hora) + ' · ' + esc(x.sector) + '</div></div>' +
      '<div class="ci-tip__b">' +
        '<div class="ci-tip__row">' + ICO.box + '<span>' + esc(x.nombre) + '</span></div>' +
        '<div class="ci-tip__row">' + ICO.pin + '<span>' + esc(x.ubicacion) + '</span></div>' +
        '<div class="ci-tip__row">' + ICO.user + '<span>Responsable: <b>' + esc(x.responsable || '—') + '</b></span></div>' +
        '<div class="ci-tip__row">' + ICO.box + '<span><b>' + (x.items ? x.items.length : 0) + '</b> ítems a contar</span></div>' +
        '<span class="ci-tip__st st-' + x.estado + '">' + estBadgeInner(x.estado) + '</span>' +
      '</div>';
    document.body.appendChild(tipEl);
    var W = 250, left = Math.max(8, Math.min(rect.left + rect.width / 2 - W / 2, window.innerWidth - W - 8));
    var below = rect.top < 260;
    tipEl.style.left = left + 'px';
    if (below) tipEl.style.top = (rect.bottom + 8) + 'px'; else tipEl.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    if (G() && !reduce()) G().fromTo(tipEl, { opacity: 0, y: 6, scale: .98 }, { opacity: 1, y: 0, scale: 1, duration: .18, ease: 'power2.out' });
  }
  function hideTip() {
    if (!tipEl) return; var t = tipEl; tipEl = null;
    if (G() && !reduce()) G().to(t, { opacity: 0, duration: .12, ease: 'power2.in', onComplete: function () { t.remove(); } }); else t.remove();
  }

  /* ── Modal crear (wizard 2 pasos) ────────────────────────────────────── */
  function openModal(fechaDef) {
    var ov = el('<div class="ci-ov"></div>');
    ov.innerHTML =
      '<div class="ci-modal" role="dialog" aria-modal="true">' +
        '<div class="ci-modal__h"><h3>Programar inventario</h3>' +
          '<div class="ci-steps">' +
            '<div class="ci-steps__i on" id="st1"><span class="ci-steps__n">1</span><span class="ci-steps__l">Datos</span></div>' +
            '<span class="ci-steps__bar"></span>' +
            '<div class="ci-steps__i" id="st2"><span class="ci-steps__n">2</span><span class="ci-steps__l">Mercaderías</span></div>' +
          '</div>' +
          '<button class="ci-modal__x" aria-label="Cerrar">' + ICO.x + '</button></div>' +
        '<div class="ci-modal__b">' +
          '<div class="ci-step" id="step1">' +
            '<div class="ci-grid3"><div class="ci-field"><label>Fecha *</label><input id="mFecha" type="date" value="' + fechaDef + '"></div>' +
            '<div class="ci-field"><label>Hora</label><input id="mHora" type="time" value="' + nowHM() + '"></div>' +
            '<div class="ci-field"><label>Depósito</label><div class="ci-dep-badge">' + DEP_ICO[S.depIdx] + '<span>' + esc(DEPOSITOS[S.depIdx]) + '</span></div></div></div>' +
            '<div class="ci-grid2"><div class="ci-field"><label>Sector</label><div id="mSector"></div></div>' +
            '<div class="ci-field"><label>Prioridad</label><div id="mPrio"></div></div></div>' +
            '<div class="ci-grid2"><div class="ci-field"><label>Responsable</label><input id="mResp" placeholder="Nombre del responsable"></div>' +
            '<div class="ci-field"><label>Ubicación</label><input id="mUbic" placeholder="Rack A01 – A20"></div></div>' +
            '<div class="ci-field"><label>Observación</label><textarea id="mObs" placeholder="Detalle del inventario…"></textarea></div>' +
          '</div>' +
          '<div class="ci-step" id="step2" hidden>' +
            '<div class="ci-step2-head"><h4>' + ICO.box + ' Materiales a contar</h4><span class="ci-items__count" id="mItemsCount" hidden></span></div>' +
            '<div class="ci-field"><label>Buscar material (código, descripción o marca)</label>' +
              '<div class="ci-mat-row">' +
                '<div class="ci-items__search"><input id="mItem" placeholder="Ej: LLAVE · MECHA · LA010759TR…" autocomplete="off"><div class="ci-items__results" id="mItemRes" hidden></div></div>' +
                '<div class="ci-mfilt" id="mMkFilt"><button type="button" class="ci-mfilt__btn" id="mMkBtn">' + ICO.tag + '<span id="mMkLbl">Marca</span><span class="cv">' + ICO.chevronD + '</span></button></div>' +
              '</div>' +
            '</div>' +
            '<div class="ci-items__list" id="mItemsList"></div>' +
            '<div class="ci-items__empty" id="mItemsEmpty">Buscá y agregá los materiales que vas a contar.</div>' +
          '</div>' +
        '</div>' +
        '<div class="ci-modal__f">' +
          '<button class="ci-mbtn ghost" id="mBack" style="margin-right:auto" hidden>' + ICO.left + ' Atrás</button>' +
          '<button class="ci-mbtn ghost" id="mCancel">Cancelar</button>' +
          '<button class="ci-mbtn primary" id="mNext">Siguiente ' + ICO.right + '</button>' +
          '<button class="ci-mbtn primary" id="mSave" hidden>' + ICO.plus + ' Programar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    var selSector = mountSelect(ov.querySelector('#mSector'), SECTORES, SECTORES[0]);
    var selPrio = mountSelect(ov.querySelector('#mPrio'), ['NORMAL', 'ALTA', 'BAJA'], 'NORMAL');
    var depSel = S.depIdx;

    // ── Navegación de pasos ──
    var step = 1;
    function goStep(n) {
      step = n;
      ov.querySelector('#step1').hidden = n !== 1;
      ov.querySelector('#step2').hidden = n !== 2;
      ov.querySelector('#mBack').hidden = n === 1;
      ov.querySelector('#mNext').hidden = n === 2;
      var sv = ov.querySelector('#mSave'); sv.hidden = n === 1; sv.disabled = items.length === 0;
      var i1 = ov.querySelector('#st1'), i2 = ov.querySelector('#st2');
      i1.classList.toggle('on', n === 1); i2.classList.toggle('on', n === 2);
      var n1 = i1.querySelector('.ci-steps__n');
      if (n > 1) {
        i1.classList.add('done');
        if (n1.getAttribute('data-done') !== '1') {
          n1.setAttribute('data-done', '1'); n1.innerHTML = ICO.chk;
          if (G() && !reduce()) { var sv = n1.querySelector('svg'); if (sv) G().fromTo(sv, { scale: 0, rotate: -120 }, { scale: 1, rotate: 0, duration: .45, ease: 'back.out(3.5)' }); G().fromTo(i1, { scale: .9 }, { scale: 1, duration: .3, ease: 'back.out(3)' }); }
        }
      } else {
        i1.classList.remove('done');
        if (n1.getAttribute('data-done') === '1') { n1.setAttribute('data-done', ''); n1.textContent = '1'; }
      }
      var panel = ov.querySelector(n === 1 ? '#step1' : '#step2');
      if (G() && !reduce()) {
        G().fromTo(panel, { opacity: 0, x: n === 2 ? 22 : -22 }, { opacity: 1, x: 0, duration: .32, ease: 'power3.out', clearProps: 'all' });
        var kids = panel.querySelectorAll(':scope > .ci-field, :scope > .ci-grid2, :scope > .ci-grid3, :scope > .ci-step2-head, :scope > .ci-items__list');
        G().fromTo(kids, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .28, stagger: .045, ease: 'power2.out', delay: .06, clearProps: 'all' });
      }
      if (n === 2) setTimeout(function () { var f = ov.querySelector('#mItem'); if (f) f.focus(); }, 90);
    }
    ov.querySelector('#mNext').addEventListener('click', function () { goStep(2); });
    ov.querySelector('#mBack').addEventListener('click', function () { goStep(1); });

    // ── Cargador de mercaderías (buscador real desde InventarioAPI) ──
    var items = [];
    var itInput = ov.querySelector('#mItem'), itList = ov.querySelector('#mItemsList'), itEmpty = ov.querySelector('#mItemsEmpty'), itCount = ov.querySelector('#mItemsCount');
    var itRes = ov.querySelector('#mItemRes'), searchT2 = null, results = [], hl = -1, matMarca = '';
    function renderItems() {
      itEmpty.hidden = items.length > 0;
      itCount.hidden = !items.length;
      itCount.textContent = items.length + (items.length === 1 ? ' seleccionado' : ' seleccionados');
      itList.innerHTML = items.map(function (it, i) {
        return '<div class="ci-selrow" data-i="' + i + '" title="' + esc(it.descripcion || '') + '">' +
          '<span class="ci-selrow__n">' + (i + 1) + '</span>' +
          '<span class="ci-selrow__cod">' + esc(it.codigo) + '</span>' +
          '<span class="ci-selrow__desc">' + esc(it.descripcion || '') + '</span>' +
          (it.marca ? '<span class="ci-selrow__mk">' + esc(it.marca) + '</span>' : '') +
          '<span class="ci-selrow__um">' + esc(it.um || 'UN') + '</span>' +
          '<button type="button" class="ci-selrow__x" data-del="' + i + '" aria-label="Quitar">' + ICO.x + '</button>' +
        '</div>';
      }).join('');
      itList.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function (e) { e.stopPropagation(); var row = b.closest('.ci-selrow'); var idx = +b.getAttribute('data-del');
          if (row && G() && !reduce()) { G().to(row, { opacity: 0, x: 16, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, duration: .22, ease: 'power2.in', onComplete: function () { items.splice(idx, 1); renderItems(); } }); }
          else { items.splice(idx, 1); renderItems(); }
        });
      });
      if (G() && !reduce() && itList.lastElementChild) G().fromTo(itList.lastElementChild, { opacity: 0, y: -8, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .32, ease: 'back.out(2.2)' });
      var sv = ov.querySelector('#mSave');
      if (sv) { var was = sv.disabled; sv.disabled = items.length === 0; if (was && !sv.disabled && G() && !reduce()) G().fromTo(sv, { scale: .85 }, { scale: 1, duration: .32, ease: 'back.out(3)' }); }
    }
    function closeRes() { itRes.hidden = true; results = []; hl = -1; }
    function addMerc(m) { if (!m) return; if (!items.some(function (x) { return x.codigo === m.codigo; })) { items.push({ codigo: m.codigo, descripcion: m.descripcion, um: m.um || 'UN', marca: m.marca || '' }); renderItems(); } itInput.value = ''; closeRes(); }
    function renderRes() {
      var opening = itRes.hidden;   // solo animar al abrir; al tipear, actualizar sin parpadeo
      if (!results.length) { itRes.innerHTML = '<div class="ci-res__empty">Sin resultados</div>'; itRes.hidden = false; if (opening && G() && !reduce()) G().fromTo(itRes, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: .16, ease: 'power2.out' }); return; }
      itRes.innerHTML = results.map(function (m, i) {
        return '<button type="button" class="ci-res' + (i === hl ? ' hl' : '') + '" data-i="' + i + '"><span class="ci-res__cod">' + esc(m.codigo) + '</span><span class="ci-res__desc">' + esc(m.descripcion) + '</span>' + (m.marca ? '<span class="ci-res__mk">' + esc(m.marca) + '</span>' : '') + '<span class="ci-res__um">' + esc(m.um || 'UN') + '</span></button>';
      }).join('');
      itRes.hidden = false;
      itRes.querySelectorAll('[data-i]').forEach(function (b) { b.addEventListener('mousedown', function (e) { e.preventDefault(); addMerc(results[+b.getAttribute('data-i')]); }); });
      if (opening && G() && !reduce()) {
        G().fromTo(itRes, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: .18, ease: 'power2.out' });
        G().fromTo(itRes.querySelectorAll('.ci-res'), { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: .2, stagger: 0.015, ease: 'power2.out', clearProps: 'all' });
      }
    }
    function doSearch() {
      var term = itInput.value.trim().toLowerCase();
      var pool = window.MERCADERIAS_DEMO || [];
      if (matMarca) pool = pool.filter(function (m) { return m.marca === matMarca; });
      pool = pool.filter(function (m) { return !items.some(function (x) { return x.codigo === m.codigo; }); }); // ya agregados fuera
      results = (term ? pool.filter(function (m) { return (m.codigo + ' ' + m.descripcion + ' ' + (m.marca || '')).toLowerCase().indexOf(term) >= 0; }) : pool).slice(0, 30);
      hl = -1; renderRes();
    }
    itInput.addEventListener('input', function () { clearTimeout(searchT2); searchT2 = setTimeout(doSearch, 110); });
    itInput.addEventListener('focus', function () { doSearch(); });
    itInput.addEventListener('click', function () { if (itRes.hidden) doSearch(); }); // reabrir al volver a clickear
    itInput.addEventListener('keydown', function (e) {
      if (itRes.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); hl = Math.min(hl + 1, results.length - 1); renderRes(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); hl = Math.max(hl - 1, 0); renderRes(); }
      else if (e.key === 'Enter') { e.preventDefault(); addMerc(results[hl >= 0 ? hl : 0]); }
      else if (e.key === 'Escape') { closeRes(); }
    });
    itInput.addEventListener('blur', function () { setTimeout(closeRes, 120); });

    // ── Filtro de marca (opcional, acelera la búsqueda) ──
    var mkBtn = ov.querySelector('#mMkBtn'), mkFilt = ov.querySelector('#mMkFilt');
    function paintMkLbl() { ov.querySelector('#mMkLbl').textContent = matMarca || 'Marca'; mkBtn.classList.toggle('on', !!matMarca); }
    function onDocMkF(e) { if (!mkFilt.contains(e.target)) closeMkF(); }
    function onEscMkF(e) { if (e.key === 'Escape') closeMkF(); }
    function closeMkF() { var m = mkFilt.querySelector('.ci-resp__menu'); if (m) m.remove(); mkFilt.classList.remove('open'); document.removeEventListener('mousedown', onDocMkF, true); document.removeEventListener('keydown', onEscMkF, true); }
    function toggleMkF() {
      if (mkFilt.classList.contains('open')) { closeMkF(); return; }
      var opts = getMarcasReal();
      var menu = el('<div class="ci-resp__menu"></div>');
      menu.innerHTML = '<button type="button" class="ci-resp__opt' + (!matMarca ? ' on' : '') + '" data-m=""><span class="ci-resp__av">' + ICO.tag + '</span>Todas las marcas</button>' +
        opts.map(function (o) { return '<button type="button" class="ci-resp__opt' + (matMarca === o.name ? ' on' : '') + '" data-m="' + esc(o.name) + '"><span class="ci-resp__av">' + esc(o.name.charAt(0)) + '</span>' + esc(o.name) + '<span class="ci-res__um" style="margin-left:auto">' + o.n + '</span></button>'; }).join('');
      mkFilt.appendChild(menu); mkFilt.classList.add('open');
      menu.querySelectorAll('[data-m]').forEach(function (b) { b.addEventListener('click', function () { matMarca = b.getAttribute('data-m'); paintMkLbl(); closeMkF(); doSearch(); itInput.focus(); }); });
      if (G() && !reduce()) G().fromTo(menu, { opacity: 0, y: -6, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .2, ease: 'back.out(2)', transformOrigin: 'top right' });
      setTimeout(function () { document.addEventListener('mousedown', onDocMkF, true); document.addEventListener('keydown', onEscMkF, true); }, 0);
    }
    mkBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMkF(); });

    function close() { if (G() && !reduce()) { G().to(ov.querySelector('.ci-modal'), { opacity: 0, y: 10, scale: .97, duration: .16 }); G().to(ov, { opacity: 0, duration: .18, onComplete: function () { ov.remove(); } }); } else ov.remove(); }
    ov.querySelector('.ci-modal__x').addEventListener('click', close);
    ov.querySelector('#mCancel').addEventListener('click', close);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.querySelector('#mSave').addEventListener('click', function () {
      var sector = selSector.getValue();
      // Marca del inventario: filtro usado, o la marca más común entre los ítems, o "Varios".
      var mc = matMarca;
      if (!mc) { var cnt = {}; items.forEach(function (it) { if (it.marca) cnt[it.marca] = (cnt[it.marca] || 0) + 1; }); var best = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0]; mc = best || ''; }
      var marcaLbl = mc || sector;
      var obj = {
        fecha: ov.querySelector('#mFecha').value || todayISO(), hora: ov.querySelector('#mHora').value || '09:00',
        deposito: DEPOSITOS[depSel], sector: sector, tipo: mc || 'General',
        ubicacion: ov.querySelector('#mUbic').value.trim(), estado: 'programado', prioridad: selPrio.getValue(),
        responsable: ov.querySelector('#mResp').value.trim(), items: items.slice(), observacion: ov.querySelector('#mObs').value.trim(), diffs: false, orden: null,
      };
      S.depIdx = depSel;
      var okSub = marcaLbl + ' · ' + DEPOSITOS[depSel] + ' · ' + items.length + ' material' + (items.length === 1 ? '' : 'es');
      if (REMOTE) {
        var btn = ov.querySelector('#mSave'); if (btn) { btn.disabled = true; }
        dbCreate(obj).then(function (id) {
          if (!id) { if (btn) btn.disabled = false; flashOk('No se pudo guardar', 'Falta crear las tablas en Supabase (correr el SQL)', false); return; }
          close(); flashOk('Inventario programado', okSub); refresh(true);
        }).catch(function () { if (btn) btn.disabled = false; flashOk('Error al guardar', 'Revisá la conexión con Supabase', false); });
      }
      else {
        obj.id = seq; obj.codigo = 'INV-' + pad(1000 + seq++); obj.nombre = 'Inventario ' + marcaLbl;
        DATA.push(obj); close(); flashOk('Inventario programado', okSub); paintSeg(); paintKpis(); paintCalendar(true); paintList(true);
      }
    });
    if (G() && !reduce()) {
      G().fromTo(ov, { opacity: 0 }, { opacity: 1, duration: .18 });
      G().fromTo(ov.querySelector('.ci-modal'), { opacity: 0, y: 20, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .32, ease: 'power3.out' });
      G().from(ov.querySelectorAll('#step1 > .ci-field, #step1 > .ci-grid2, #step1 > .ci-grid3'), { opacity: 0, y: 10, duration: .3, stagger: .04, ease: 'power2.out', delay: .12, clearProps: 'all' });
    }
  }
  function nowHM() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  // Flash de éxito centrado con check azul PRO (rápido y fluido).
  function flashOk(msg, sub, ok) {
    if (ok === undefined) ok = true;
    var path = ok ? 'M15 27l7 7 15-16' : 'M18 18l16 16M34 18L18 34';
    var ov = el('<div class="ci-flash' + (ok ? '' : ' ci-flash--err') + '"><div class="ci-flash__card">' +
      '<div class="ci-flash__badge"><svg viewBox="0 0 52 52"><circle class="ci-flash__ring" cx="26" cy="26" r="24"/><path class="ci-flash__tick" d="' + path + '"/></svg></div>' +
      '<div class="ci-flash__txt">' + esc(msg || 'Inventario programado') + '</div>' +
      (sub ? '<div class="ci-flash__sub">' + esc(sub) + '</div>' : '') +
      '</div></div>');
    document.body.appendChild(ov);
    if (!G() || reduce()) { setTimeout(function () { ov.remove(); }, 900); return; }
    var card = ov.querySelector('.ci-flash__card'), tick = ov.querySelector('.ci-flash__tick');
    var L = tick.getTotalLength ? tick.getTotalLength() : 40;
    G().set(tick, { strokeDasharray: L, strokeDashoffset: L });
    var tl = G().timeline({ onComplete: function () { ov.remove(); } });
    tl.fromTo(ov, { opacity: 0 }, { opacity: 1, duration: .12, ease: 'power2.out' });
    tl.fromTo(card, { scale: .6, y: 12 }, { scale: 1, y: 0, duration: .34, ease: 'back.out(2.4)' }, 0);
    tl.to(tick, { strokeDashoffset: 0, duration: .3, ease: 'power2.out' }, .13);
    tl.to(card, { scale: 1.05, duration: .12, yoyo: true, repeat: 1, ease: 'power1.inOut' }, .42);
    tl.to(ov, { opacity: 0, duration: .22, ease: 'power2.in' }, '+=' + (ok ? 0.55 : 1.4));
  }
  /* ── Exportar a Excel (.xls HTML estilado, sin librería) ─────────────── */
  function exportExcel() {
    var mesLbl = MESES[S.cur.m] + ' ' + S.cur.y;
    var rows = monthRows().slice().sort(function (a, b) { return a.fecha === b.fecha ? (a.hora || '99').localeCompare(b.hora || '99') : a.fecha.localeCompare(b.fecha); });
    if (!rows.length) { flashOk('Sin inventarios', 'No hay datos para exportar en ' + mesLbl, false); return; }
    var estLbl = { programado: 'Programado', en_proceso: 'En proceso', realizado: 'Realizado', pendiente: 'Pendiente' };
    var by = { programado: 0, en_proceso: 0, realizado: 0, pendiente: 0 };
    rows.forEach(function (r) { by[r.estado] = (by[r.estado] || 0) + 1; });
    var incid = 0, sob = 0, fal = 0;
    rows.forEach(function (r) { (r.items || []).forEach(function (it) { if (it.diff != null && it.diff !== 0) { incid++; if (it.diff > 0) sob++; else fal++; } }); });
    var cumpl = rows.length ? Math.round(by.realizado / rows.length * 100) : 0;
    var byDate = {}, order = [];
    rows.forEach(function (r) { if (!byDate[r.fecha]) { byDate[r.fecha] = { inv: 0, real: 0, pend: 0, inc: 0, dep: {} }; order.push(r.fecha); } var d = byDate[r.fecha]; d.inv++; if (r.estado === 'realizado') d.real++; if (r.estado === 'pendiente') d.pend++; (r.items || []).forEach(function (it) { if (it.diff != null && it.diff !== 0) d.inc++; }); });
    var HB = 'background:#0B5F8D;color:#ffffff;font-weight:bold;padding:6px 9px;border:1px solid #0a5680;';
    var TD = 'padding:5px 9px;border:1px solid #e4ecf3;';
    var kpiC = 'padding:10px 14px;border:1px solid #cfe0ee;text-align:center;background:#f7fbff;';
    function estColor(e) { return e === 'realizado' ? '#127a4b' : e === 'en_proceso' ? '#a9740c' : e === 'pendiente' ? '#c0392b' : '#0b5f8d'; }
    function diffCell(d) { if (d == null) return '<td style="' + TD + 'color:#8a99a8">—</td>'; if (d === 0) return '<td style="' + TD + 'background:#e9f7ef;color:#127a4b;font-weight:bold">0 · Coincide</td>'; if (d > 0) return '<td style="' + TD + 'background:#eef5fc;color:#0b5f8d;font-weight:bold">+' + d + ' · Sobra</td>'; return '<td style="' + TD + 'background:#fdeded;color:#c0392b;font-weight:bold">' + d + ' · Faltante</td>'; }
    var h = '';
    h += '<h2 style="font-family:Arial;color:#0B5F8D;margin:0 0 2px">ALAS · Calendario de Inventarios</h2>';
    h += '<div style="font-family:Arial;font-size:12px;color:#475569;margin-bottom:12px">' + esc(mesLbl) + ' · Generado ' + new Date().toLocaleString('es-PY') + '</div>';
    h += '<table style="border-collapse:collapse;font-family:Arial;font-size:12px;margin-bottom:16px"><tr>'
      + '<td style="' + kpiC + '"><span style="font-size:18px;font-weight:bold">' + rows.length + '</span><br>Inventarios</td>'
      + '<td style="' + kpiC + 'color:#127a4b"><span style="font-size:18px;font-weight:bold">' + by.realizado + '</span><br>Realizados</td>'
      + '<td style="' + kpiC + 'color:#a9740c"><span style="font-size:18px;font-weight:bold">' + by.en_proceso + '</span><br>En proceso</td>'
      + '<td style="' + kpiC + 'color:#0b5f8d"><span style="font-size:18px;font-weight:bold">' + by.programado + '</span><br>Programados</td>'
      + '<td style="' + kpiC + 'color:#c0392b"><span style="font-size:18px;font-weight:bold">' + by.pendiente + '</span><br>Pendientes</td>'
      + '<td style="' + kpiC + '"><span style="font-size:18px;font-weight:bold">' + cumpl + '%</span><br>Cumplimiento</td>'
      + '<td style="' + kpiC + 'color:#c0392b"><span style="font-size:18px;font-weight:bold">' + incid + '</span><br>Incidencias</td>'
      + '</tr></table>';
    h += '<h3 style="font-family:Arial;color:#0B5F8D;margin:0 0 4px">Resumen por fecha</h3>';
    h += '<table style="border-collapse:collapse;font-family:Arial;font-size:12px;margin-bottom:18px"><tr>'
      + '<th style="' + HB + '">Fecha</th><th style="' + HB + '">Inventarios</th><th style="' + HB + '">Realizados</th><th style="' + HB + '">Pendientes</th><th style="' + HB + '">Incidencias</th></tr>';
    order.forEach(function (f) { var d = byDate[f]; h += '<tr><td style="' + TD + '">' + f + '</td><td style="' + TD + 'text-align:center">' + d.inv + '</td><td style="' + TD + 'text-align:center">' + d.real + '</td><td style="' + TD + 'text-align:center">' + d.pend + '</td><td style="' + TD + 'text-align:center;color:#c0392b;font-weight:bold">' + d.inc + '</td></tr>'; });
    h += '</table>';
    h += '<h3 style="font-family:Arial;color:#0B5F8D;margin:0 0 4px">Detalle de conteo</h3>';
    h += '<table style="border-collapse:collapse;font-family:Arial;font-size:11px"><tr>'
      + ['Fecha', 'Hora', 'Inventario', 'Depósito', 'Sector', 'Marca', 'Responsable', 'Estado', 'Material', 'Descripción', 'SAP', 'Contado', 'Diferencia', 'Motivo', 'Nota'].map(function (x) { return '<th style="' + HB + '">' + x + '</th>'; }).join('') + '</tr>';
    rows.forEach(function (r) {
      var head = '<td style="' + TD + '">' + r.fecha + '</td><td style="' + TD + '">' + esc(r.hora || '') + '</td><td style="' + TD + '">' + esc(r.codigo) + '</td><td style="' + TD + '">' + esc(r.deposito || '') + '</td><td style="' + TD + '">' + esc(r.sector || '') + '</td><td style="' + TD + '">' + esc(r.tipo || '') + '</td><td style="' + TD + '">' + esc(r.responsable || '') + '</td><td style="' + TD + 'color:' + estColor(r.estado) + ';font-weight:bold">' + (estLbl[r.estado] || r.estado) + '</td>';
      var its = r.items || [];
      if (!its.length) { h += '<tr>' + head + '<td style="' + TD + '" colspan="7">Sin materiales cargados</td></tr>'; return; }
      its.forEach(function (it) {
        h += '<tr>' + head + '<td style="' + TD + '">' + esc(it.codigo) + '</td><td style="' + TD + '">' + esc(it.descripcion || '') + '</td><td style="' + TD + 'text-align:right">' + (it.sap == null ? '' : it.sap) + '</td><td style="' + TD + 'text-align:right">' + (it.contado == null ? '' : it.contado) + '</td>' + diffCell(it.diff) + '<td style="' + TD + '">' + esc(it.motivo || '') + '</td><td style="' + TD + '">' + esc(it.nota || '') + '</td></tr>';
      });
    });
    h += '</table>';
    var full = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>' + h + '</body></html>';
    var blob = new Blob(['﻿' + full], { type: 'application/vnd.ms-excel' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'Inventarios_' + MESES[S.cur.m] + '_' + S.cur.y + '.xls';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 120);
    flashOk('Excel exportado', mesLbl + ' · ' + rows.length + ' inventarios · ' + incid + ' incidencias');
  }

  // "Marca / familia": el Excel no tiene columna Marca → agrupamos por la 1ª palabra de la descripción.
  function familyOf(d) { return String(d || '').trim().split(/\s+/)[0].toUpperCase(); }
  var _marcas = null;
  function getMarcas() {
    if (_marcas) return _marcas;
    var c = {}; (window.MERCADERIAS_DEMO || []).forEach(function (m) { var f = familyOf(m.descripcion); if (f) c[f] = (c[f] || 0) + 1; });
    _marcas = Object.keys(c).map(function (k) { return { name: k, n: c[k] }; }).sort(function (a, b) { return b.n - a.n; });
    return _marcas;
  }
  // Marcas REALES detectadas en el catálogo (campo marca), con cantidad.
  var _marcasReal = null;
  function getMarcasReal() {
    if (_marcasReal) return _marcasReal;
    var c = {}; (window.MERCADERIAS_DEMO || []).forEach(function (m) { if (m.marca) c[m.marca] = (c[m.marca] || 0) + 1; });
    _marcasReal = Object.keys(c).map(function (k) { return { name: k, n: c[k] }; }).sort(function (a, b) { return b.n - a.n; });
    return _marcasReal;
  }

  /* ── Detalle + Conteo ────────────────────────────────────────────────── */
  function openDetail(id) {
    var x = DATA.find(function (t) { return t.id === id; }); if (!x) return;
    var itemsArr = (x.items || []).map(function (i) { return typeof i === 'string' ? { codigo: i, descripcion: '', um: 'UN' } : i; });
    x.items = itemsArr; // normaliza
    var ov = el('<div class="ci-ov"></div>');
    function drow(k, v) { return '<div class="ci-detail-row"><span class="k">' + k + '</span><span class="v">' + esc(v) + '</span></div>'; }
    function cntCard(it, i) {
      return '<div class="ci-cnt" data-i="' + i + '">' +
        '<div class="ci-cnt__mat"><span class="ci-cnt__cod">' + esc(it.codigo) + '</span><span class="ci-cnt__desc">' + esc(it.descripcion || '') + '</span></div>' +
        '<div class="ci-cnt__grid">' +
          '<div class="ci-cnt__f"><label>Figura en SAP</label><input type="number" min="0" class="cnt-sap" value="' + (it.sap == null ? '' : it.sap) + '" placeholder="0"></div>' +
          '<div class="ci-cnt__f"><label>Contado</label><input type="number" min="0" class="cnt-cont" value="' + (it.contado == null ? '' : it.contado) + '" placeholder="0"></div>' +
          '<div class="ci-diff"><span class="ci-diff__n">—</span><span class="ci-diff__l">Sin datos</span></div>' +
        '</div>' +
        '<div class="ci-cnt__motivo" hidden><div class="cnt-mot"></div><input class="cnt-nota" placeholder="Nota (opcional)" value="' + esc(it.nota || '') + '"></div>' +
      '</div>';
    }
    var conteoHtml = itemsArr.length
      ? '<div class="ci-cnt-head"><h4>Conteo</h4><div class="ci-cnt-sum" id="dSum"></div></div><div class="ci-cnt-list" id="dCntList">' + itemsArr.map(cntCard).join('') + '</div>'
      : '<div class="ci-cnt-head"><h4>Conteo</h4></div><div class="ci-items__empty" style="padding:16px 0">Este inventario no tiene materiales cargados. Editá el inventario para agregarlos.</div>';
    ov.innerHTML =
      '<div class="ci-modal" role="dialog" aria-modal="true" style="width:min(820px,100%)">' +
        '<div class="ci-modal__h"><h3>' + esc(x.nombre) + '</h3><button class="ci-modal__x" aria-label="Cerrar">' + ICO.x + '</button></div>' +
        '<div class="ci-modal__b">' +
          '<span class="ci-badge-st st-' + x.estado + '" style="align-self:flex-start">' + estBadgeInner(x.estado) + '</span>' +
          '<div class="ci-grid2" style="gap:0 18px">' +
            drow('Código', x.codigo) + drow('Depósito', x.deposito) + drow('Sector', x.sector) + drow('Fecha', x.fecha) +
            drow('Hora', x.hora) + drow('Responsable', x.responsable || '—') + drow('Marca/familia', x.tipo) + drow('Prioridad', x.prioridad) +
          '</div>' +
          conteoHtml +
        '</div>' +
        '<div class="ci-modal__f">' +
          (itemsArr.length && x.estado !== 'realizado' ? '<button class="ci-mbtn ghost" id="dContar" style="margin-right:auto">' + ICO.play + ' Contar materiales</button>' : '') +
          '<button class="ci-mbtn ghost" id="dClose">Cerrar</button>' +
          (itemsArr.length ? '<button class="ci-mbtn primary" id="dGuardar">' + ICO.chk + ' Guardar conteo</button>' : '') +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    // ── Conteo: cálculo en vivo ──
    function updateSummary() {
      var ok = 0, sob = 0, fal = 0;
      itemsArr.forEach(function (it) { if (it.diff == null) return; if (it.diff === 0) ok++; else if (it.diff > 0) sob++; else fal++; });
      x.diffs = (sob + fal) > 0;
      var sum = ov.querySelector('#dSum');
      if (sum) sum.innerHTML = '<span class="ok">' + ICO.chk + ok + '</span><span class="sob">+' + sob + ' sobra</span><span class="fal">' + fal + ' falta</span>';
    }
    function bindCard(card) {
      var i = +card.getAttribute('data-i'), it = itemsArr[i];
      var sapI = card.querySelector('.cnt-sap'), conI = card.querySelector('.cnt-cont'), mot = card.querySelector('.ci-cnt__motivo');
      var dEl = card.querySelector('.ci-diff'), nEl = dEl.querySelector('.ci-diff__n'), lEl = dEl.querySelector('.ci-diff__l');
      function recompute(anim) {
        var s = parseFloat(sapI.value), c = parseFloat(conI.value);
        it.sap = isNaN(s) ? null : s; it.contado = isNaN(c) ? null : c;
        card.classList.remove('d-ok', 'd-sob', 'd-fal'); dEl.classList.remove('ok', 'sob', 'fal');
        if (it.sap == null || it.contado == null) { it.diff = null; nEl.textContent = '—'; lEl.textContent = 'Sin datos'; mot.hidden = true; }
        else {
          var d = it.contado - it.sap; it.diff = d;
          if (d === 0) { dEl.classList.add('ok'); card.classList.add('d-ok'); nEl.textContent = '0'; lEl.textContent = 'Coincide'; mot.hidden = true; }
          else if (d > 0) { dEl.classList.add('sob'); card.classList.add('d-sob'); nEl.textContent = '+' + d; lEl.textContent = 'Sobra'; mot.hidden = false; }
          else { dEl.classList.add('fal'); card.classList.add('d-fal'); nEl.textContent = String(d); lEl.textContent = 'Faltante'; mot.hidden = false; }
          if (anim && G() && !reduce()) G().fromTo(dEl, { scale: .8 }, { scale: 1, duration: .3, ease: 'back.out(3)' });
        }
        updateSummary();
      }
      sapI.addEventListener('input', function () { recompute(true); });
      conI.addEventListener('input', function () { recompute(true); });
      mountSelect(mot.querySelector('.cnt-mot'), MOTIVOS, it.motivo || '', { placeholder: 'Motivo…', onChange: function (v) { it.motivo = v; } });
      mot.querySelector('.cnt-nota').addEventListener('input', function (e) { it.nota = e.target.value; });
      recompute(false);
    }
    ov.querySelectorAll('.ci-cnt').forEach(bindCard);

    function close() { if (G() && !reduce()) { G().to(ov, { opacity: 0, duration: .16, onComplete: function () { ov.remove(); } }); } else ov.remove(); }
    ov.querySelector('.ci-modal__x').addEventListener('click', close);
    ov.querySelector('#dClose').addEventListener('click', close);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    // "Contar materiales" → marca el inventario como Contando (en proceso), sin cerrar.
    var cb = ov.querySelector('#dContar');
    if (cb) cb.addEventListener('click', function () {
      x.estado = 'en_proceso';
      if (REMOTE) dbUpdate(x.id, { estado: 'en_proceso' });
      var bdg = ov.querySelector('.ci-badge-st'); if (bdg) { bdg.className = 'ci-badge-st st-en_proceso'; bdg.style.alignSelf = 'flex-start'; bdg.innerHTML = estBadgeInner('en_proceso'); if (G() && !reduce()) G().fromTo(bdg, { scale: .85 }, { scale: 1, duration: .35, ease: 'back.out(3)' }); }
      cb.hidden = true;
      var f = ov.querySelector('.cnt-sap'); if (f) f.focus();
      paintKpis(); paintCalendar(false); paintList(true);
    });
    var gb = ov.querySelector('#dGuardar');
    if (gb) gb.addEventListener('click', function () {
      var counted = itemsArr.filter(function (it) { return it.diff != null; }).length;
      // Todo contado → Realizado; algo contado → Contando; nada → queda como está.
      if (counted === itemsArr.length && itemsArr.length) x.estado = 'realizado';
      else if (counted > 0) x.estado = 'en_proceso';
      if (REMOTE) dbSaveConteo(x.id, itemsArr, x.estado, x.diffs);
      close();
      flashOk(counted === itemsArr.length ? 'Conteo completo' : 'Conteo guardado', counted + '/' + itemsArr.length + ' materiales contados');
      paintKpis(); paintCalendar(false); paintList(true);
    });
    if (G() && !reduce()) {
      G().fromTo(ov, { opacity: 0 }, { opacity: 1, duration: .16 });
      G().fromTo(ov.querySelector('.ci-modal'), { opacity: 0, y: 18, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .3, ease: 'power3.out' });
      G().from(ov.querySelectorAll('.ci-cnt'), { opacity: 0, y: 10, duration: .3, stagger: { amount: 0.3 }, ease: 'power2.out', delay: .12, clearProps: 'all' });
    }
  }

  /* ── Feedback GSAP de click en TODOS los botones (delegado, una sola vez) ── */
  function wirePress() {
    if (window.__ciPressWired) return; window.__ciPressWired = true;
    var SEL = '.ci-btn-new,.ci-btn-exp,.ci-mbtn,.ci-phead__btn,.ci-phead__hoy,.ci-phead__mes,.ci-seg__btn,.ci-cell__add,.ci-estados button,.ci-resp__btn,.ci-mfilt__btn,.ci-clear,.ci-selrow__x,.ci-marca-chip__x,.ci-sel__btn,.ci-modal__x,.ci-res,.ci-sel__opt,.ci-resp__opt,.ci-cnt__f input';
    function pick(t) { return t && t.closest ? t.closest(SEL) : null; }
    function inScope(el) { return el && (el.closest('.ci-root') || el.closest('.ci-ov') || el.closest('.ci-tip')); }
    document.addEventListener('pointerdown', function (e) {
      var b = pick(e.target); if (!b || !inScope(b) || b.disabled) return;
      if (G() && !reduce()) G().to(b, { scale: 0.95, duration: 0.09, ease: 'power2.out', overwrite: true });
    }, true);
    function up(e) {
      var b = pick(e.target); if (!b || !inScope(b)) return;
      if (G() && !reduce()) G().to(b, { scale: 1, duration: 0.24, ease: 'back.out(3)', overwrite: true, clearProps: 'transform' });
    }
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
  }

  /* ── Entrada GSAP ────────────────────────────────────────────────────── */
  function entrance() {
    if (!G() || reduce()) return;
    var r = S.root;
    G().from(r.querySelector('.ci-head'), { opacity: 0, y: -8, duration: .4, ease: 'power2.out', clearProps: 'all' });
    G().from(r.querySelectorAll('.ci-seg__btn'), { opacity: 0, y: -6, duration: .35, stagger: .06, ease: 'power2.out', clearProps: 'all', delay: .05 });
    G().from(r.querySelector('.ci-kpis'), { opacity: 0, y: 8, duration: .4, ease: 'power2.out', clearProps: 'all', delay: .05 });
    G().from(r.querySelectorAll('.ci-kpi'), { opacity: 0, y: 6, duration: .3, stagger: .05, ease: 'power2.out', clearProps: 'all', delay: .12 });
    G().from(r.querySelectorAll('.ci-body .ci-panel')[0], { opacity: 0, x: -10, duration: .45, ease: 'power3.out', clearProps: 'all', delay: .08 });
    G().from(r.querySelectorAll('.ci-body .ci-panel')[1], { opacity: 0, x: 10, duration: .45, ease: 'power3.out', clearProps: 'all', delay: .12 });
    G().from(r.querySelector('.ci-btn-new'), { opacity: 0, scale: .8, duration: .4, ease: 'back.out(2.5)', clearProps: 'all', delay: .28 });
  }

  window.CalendarioInv = { render: render };
})();
