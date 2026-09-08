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
  };

  /* ── Config ──────────────────────────────────────────────────────────── */
  var DEPOSITOS = ['Depósito Central', 'Fábrica', 'Depósito Luque Sanber'];
  var DEP_ICO = [ICO.warehouse, ICO.factory, ICO.building];
  var SECTORES = ['Picking', 'Reserva', 'Recepción', 'Devoluciones', 'Expedición'];
  var TIPOS = ['Cíclico', 'General', 'Puntual', 'Rotativo'];
  var EST = {
    programado: { label: 'Programado', short: 'Prog.', ico: ICO.circle },
    en_proceso: { label: 'En proceso', short: 'Curso', ico: ICO.play },
    realizado: { label: 'Realizado', short: 'Hecho', ico: ICO.check },
    pendiente: { label: 'Pendiente', short: 'Pend.', ico: ICO.alert },
  };
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
  function mk(off, hora, nombre, dep, sector, estado, prio, resp, skus, diffs) {
    var d = new Date(); d.setDate(d.getDate() + off);
    return {
      id: seq, codigo: 'INV-' + pad(1000 + seq++), fecha: iso(d), hora: hora, nombre: nombre, deposito: dep,
      sector: sector, tipo: TIPOS[(seq) % TIPOS.length], ubicacion: 'Rack ' + sector.slice(0, 1) + pad((seq * 3) % 40) + ' – ' + sector.slice(0, 1) + pad((seq * 3 % 40) + 20),
      estado: estado, prioridad: prio, responsable: resp, skus: skus, observacion: '', diffs: !!diffs, orden: null,
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
    sel: null, fEstado: 'all', fResp: '', fSearch: '', respOpen: false, drag: null, over: null, searchT: null };
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
    var term = norm(S.fSearch).trim();
    if (term) rows = rows.filter(function (x) { return norm(x.nombre + ' ' + x.responsable + ' ' + x.sector + ' ' + x.ubicacion + ' ' + x.codigo).indexOf(term) >= 0; });
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
    wire();
    paintSeg(); paintKpis(); paintCalendar(false); paintList(false);
    entrance();
  }

  function buildHeader() {
    var h = el('<div class="ci-head"></div>');
    h.innerHTML =
      '<div class="ci-head__brand"><span class="ci-head__logo"><img src="/logo-alas-s.a.png" alt="ALAS"></span>' +
      '<div><h1 class="ci-head__ttl">Calendario de inventarios</h1><p class="ci-head__sub">Planificación y control por depósito</p></div></div>' +
      '<div class="ci-head__spacer"></div>' +
      '<div class="ci-seg" id="ciSeg"></div>' +
      '<div class="ci-head__spacer"></div>' +
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
        '<div class="ci-srch">' + ICO.search + '<input id="ciSearch" type="text" placeholder="Buscar inventario, responsable o sector…" autocomplete="off"></div>' +
        '<div class="ci-estados" id="ciEstados"></div>' +
        '<div class="ci-resp" id="ciResp"><button class="ci-resp__btn" id="ciRespBtn">' + ICO.user + '<span id="ciRespLbl">Responsable</span>' + '<span class="cv">' + ICO.chevronD + '</span></button></div>' +
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
      '<div class="ci-kpi ci-kpi--proc"><span class="ci-kpi__n">' + by.en_proceso + '</span><span class="ci-kpi__l">En proceso</span></div>' +
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
        return '<div class="ci-ev st-' + x.estado + '" draggable="true" data-id="' + x.id + '" title="' + esc(x.nombre) + '">' +
          '<span class="ci-ev__bar"></span><span class="ci-ev__h">' + esc(x.hora) + '</span><span class="ci-ev__t">' + esc(x.nombre) + '</span></div>';
      }).join('');
      cell.innerHTML =
        '<div class="ci-cell__top"><span class="ci-cell__d">' + d.getDate() + '</span>' +
        '<button class="ci-cell__add" data-add="' + isoS + '" tabindex="-1" aria-label="Nuevo inventario">' + ICO.plus + '</button></div>' +
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
    paintEstados(); paintRespBtn();
    var clr = S.root.querySelector('#ciClear'); if (clr) clr.hidden = !(S.fEstado !== 'all' || S.fResp || S.fSearch.trim());
    var list = S.root.querySelector('#ciList'); if (!list) return;
    if (!rows.length) {
      list.innerHTML =
        '<div class="ci-empty"><span class="ci-empty__ic">' + ICO.calEmpty + '</span>' +
        '<div><h4>Sin inventarios</h4><p>' + (S.fEstado !== 'all' || S.fResp || S.fSearch.trim() ? 'Probá con otros filtros.' : ('No hay inventarios ' + (S.sel ? 'este día' : 'este mes') + ' en ' + deposito() + '.')) + '</p></div>' +
        '<button class="ci-mbtn primary" id="ciEmptyNew">' + ICO.plus + ' Nuevo inventario</button></div>';
      var b = list.querySelector('#ciEmptyNew'); if (b) b.addEventListener('click', function () { openModal(S.sel || todayISO()); });
      if (animate && G() && !reduce()) G().from(list.querySelector('.ci-empty').children, { opacity: 0, y: 12, scale: .96, duration: .4, stagger: .07, ease: 'back.out(1.6)', clearProps: 'all' });
      return;
    }
    list.innerHTML = rows.map(function (x, i) { return rowHtml(x, i); }).join('');
    wireList();
    if (animate && G() && !reduce()) G().from(list.querySelectorAll('.ci-row'), { opacity: 0, y: 6, duration: .3, stagger: .035, ease: 'power2.out', clearProps: 'all' });
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
        '<span class="ci-pill">' + ICO.box + '<span>' + esc(x.sector) + ' · ' + x.skus + ' SKUs</span></span>' +
      '</div></div>' +
      '<span class="ci-badge-st st-' + x.estado + '">' + EST[x.estado].ico + EST[x.estado].label + '</span>' +
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

  /* ── Interacciones ───────────────────────────────────────────────────── */
  function setDep(i) {
    if (i === S.depIdx) return; S.depIdx = i; S.sel = null; S.fResp = '';
    paintSeg(); paintKpis(); paintList(true);
    var grid = S.root.querySelector('#ciGrid'), listPanel = S.root.querySelector('#ciList');
    if (G() && !reduce()) {
      if (grid) G().fromTo(grid, { opacity: .5 }, { opacity: 1, duration: .25, ease: 'power2.out' });
    }
    paintCalendar(true);
  }
  function goMonth(delta) {
    var d = new Date(S.cur.y, S.cur.m + delta, 1); S.cur = { y: d.getFullYear(), m: d.getMonth() }; S.sel = null; S.fResp = '';
    paintSeg(); paintKpis(); paintCalendar(true); paintList(true);
    var mo = S.root.querySelector('#ciMonth'); if (mo && G() && !reduce()) G().fromTo(mo, { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: .3, ease: 'power2.out' });
  }
  function goToday() { var d = new Date(); S.cur = { y: d.getFullYear(), m: d.getMonth() }; S.sel = null; paintSeg(); paintKpis(); paintCalendar(true); paintList(true); }
  function selectDay(isoS) { S.sel = (S.sel === isoS ? null : isoS); paintCalendar(false); paintList(true); }

  function wire() {
    var root = S.root;
    root.querySelector('#ciNew').addEventListener('click', function () { openModal(S.sel || todayISO()); });
    root.querySelector('#ciPrev').addEventListener('click', function () { goMonth(-1); });
    root.querySelector('#ciNext').addEventListener('click', function () { goMonth(1); });
    root.querySelector('#ciHoy').addEventListener('click', goToday);
    root.querySelector('#ciVerMes').addEventListener('click', function () { S.sel = null; paintCalendar(false); paintList(true); });
    var srch = root.querySelector('#ciSearch');
    srch.addEventListener('input', function () { S.fSearch = srch.value; clearTimeout(S.searchT); S.searchT = setTimeout(function () { paintList(true); }, 120); });
    root.querySelector('#ciClear').addEventListener('click', function () { S.fEstado = 'all'; S.fResp = ''; S.fSearch = ''; srch.value = ''; paintList(true); });
    // responsable dropdown
    var rwrap = root.querySelector('#ciResp'), rbtn = root.querySelector('#ciRespBtn');
    rbtn.addEventListener('click', function (e) { e.stopPropagation(); toggleResp(); });
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

  function wireCalendar() {
    var grid = S.root.querySelector('#ciGrid');
    grid.querySelectorAll('.ci-cell').forEach(function (cell) {
      var isoS = cell.getAttribute('data-iso');
      cell.addEventListener('click', function (e) { if (e.target.closest('.ci-cell__add') || e.target.closest('.ci-ev')) return; selectDay(isoS); });
      cell.addEventListener('dragover', function (e) { if (S.drag != null) { e.preventDefault(); cell.classList.add('over'); } });
      cell.addEventListener('dragleave', function () { cell.classList.remove('over'); });
      cell.addEventListener('drop', function (e) { e.preventDefault(); cell.classList.remove('over'); var id = +e.dataTransfer.getData('text/plain'); if (id) reschedule(id, isoS); S.drag = null; });
      var add = cell.querySelector('.ci-cell__add'); if (add) add.addEventListener('click', function (e) { e.stopPropagation(); openModal(isoS); });
      cell.querySelectorAll('.ci-ev').forEach(function (ev) {
        var id = +ev.getAttribute('data-id');
        ev.addEventListener('mouseenter', function () { showTip(id, ev.getBoundingClientRect()); });
        ev.addEventListener('mouseleave', hideTip);
        ev.addEventListener('click', function (e) { e.stopPropagation(); hideTip(); openDetail(id); });
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
    cur.forEach(function (t, i) { var o = DATA.find(function (z) { return z.id === t.id; }); if (o) o.orden = i; });
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
        '<div class="ci-tip__row">' + ICO.box + '<span><b>' + x.skus + '</b> SKUs</span></div>' +
        '<span class="ci-tip__st st-' + x.estado + '">' + EST[x.estado].ico + EST[x.estado].label + '</span>' +
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

  /* ── Modal crear ─────────────────────────────────────────────────────── */
  function openModal(fechaDef) {
    var ov = el('<div class="ci-ov"></div>');
    ov.innerHTML =
      '<div class="ci-modal" role="dialog" aria-modal="true">' +
        '<div class="ci-modal__h"><h3>Programar inventario</h3><button class="ci-modal__x" aria-label="Cerrar">' + ICO.x + '</button></div>' +
        '<div class="ci-modal__b">' +
          '<div class="ci-field"><label>Nombre del inventario *</label><input id="mNombre" placeholder="Ej: Inventario cíclico Picking"></div>' +
          '<div class="ci-grid2"><div class="ci-field"><label>Fecha *</label><input id="mFecha" type="date" value="' + fechaDef + '"></div>' +
          '<div class="ci-field"><label>Hora</label><input id="mHora" type="time" value="' + nowHM() + '"></div></div>' +
          '<div class="ci-field"><label>Depósito</label><div class="ci-depsel" id="mDep">' +
            DEPOSITOS.map(function (d, i) { return '<button type="button" data-i="' + i + '" class="' + (i === S.depIdx ? 'on' : '') + '">' + DEP_ICO[i] + esc(d) + '</button>'; }).join('') + '</div></div>' +
          '<div class="ci-grid2"><div class="ci-field"><label>Sector</label><select id="mSector">' + SECTORES.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div>' +
          '<div class="ci-field"><label>Tipo de inventario</label><select id="mTipo">' + TIPOS.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="ci-grid2"><div class="ci-field"><label>Responsable</label><input id="mResp" placeholder="Nombre del responsable"></div>' +
          '<div class="ci-field"><label>Ubicación</label><input id="mUbic" placeholder="Rack A01 – A20"></div></div>' +
          '<div class="ci-grid2"><div class="ci-field"><label>SKUs estimados</label><input id="mSkus" type="number" min="0" placeholder="0"></div>' +
          '<div class="ci-field"><label>Prioridad</label><select id="mPrio"><option>NORMAL</option><option>ALTA</option><option>BAJA</option></select></div></div>' +
          '<div class="ci-field"><label>Observación</label><textarea id="mObs" placeholder="Detalle del inventario…"></textarea></div>' +
        '</div>' +
        '<div class="ci-modal__f"><button class="ci-mbtn ghost" id="mCancel">Cancelar</button><button class="ci-mbtn primary" id="mSave">' + ICO.plus + ' Programar</button></div>' +
      '</div>';
    document.body.appendChild(ov);
    var depSel = S.depIdx;
    ov.querySelectorAll('#mDep [data-i]').forEach(function (b) { b.addEventListener('click', function () { depSel = +b.getAttribute('data-i'); ov.querySelectorAll('#mDep [data-i]').forEach(function (z) { z.classList.remove('on'); }); b.classList.add('on'); }); });
    function close() { if (G() && !reduce()) { G().to(ov.querySelector('.ci-modal'), { opacity: 0, y: 10, scale: .97, duration: .16 }); G().to(ov, { opacity: 0, duration: .18, onComplete: function () { ov.remove(); } }); } else ov.remove(); }
    ov.querySelector('.ci-modal__x').addEventListener('click', close);
    ov.querySelector('#mCancel').addEventListener('click', close);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.querySelector('#mSave').addEventListener('click', function () {
      var nombre = ov.querySelector('#mNombre').value.trim();
      if (!nombre) { ov.querySelector('#mNombre').focus(); return; }
      DATA.push({
        id: seq, codigo: 'INV-' + pad(1000 + seq++), fecha: ov.querySelector('#mFecha').value || todayISO(), hora: ov.querySelector('#mHora').value || '09:00',
        nombre: nombre, deposito: DEPOSITOS[depSel], sector: ov.querySelector('#mSector').value, tipo: ov.querySelector('#mTipo').value,
        ubicacion: ov.querySelector('#mUbic').value.trim(), estado: 'programado', prioridad: ov.querySelector('#mPrio').value,
        responsable: ov.querySelector('#mResp').value.trim(), skus: +ov.querySelector('#mSkus').value || 0, observacion: ov.querySelector('#mObs').value.trim(), diffs: false, orden: null,
      });
      S.depIdx = depSel;
      close(); paintSeg(); paintKpis(); paintCalendar(true); paintList(true);
    });
    if (G() && !reduce()) { G().fromTo(ov, { opacity: 0 }, { opacity: 1, duration: .18 }); G().fromTo(ov.querySelector('.ci-modal'), { opacity: 0, y: 20, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .32, ease: 'power3.out' }); }
    setTimeout(function () { ov.querySelector('#mNombre').focus(); }, 60);
  }
  function nowHM() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  /* ── Detalle ─────────────────────────────────────────────────────────── */
  function openDetail(id) {
    var x = DATA.find(function (t) { return t.id === id; }); if (!x) return;
    var ov = el('<div class="ci-ov"></div>');
    function drow(k, v) { return '<div class="ci-detail-row"><span class="k">' + k + '</span><span class="v">' + esc(v) + '</span></div>'; }
    ov.innerHTML =
      '<div class="ci-modal" role="dialog" aria-modal="true" style="width:min(560px,100%)">' +
        '<div class="ci-modal__h"><h3>' + esc(x.nombre) + '</h3><button class="ci-modal__x" aria-label="Cerrar">' + ICO.x + '</button></div>' +
        '<div class="ci-modal__b">' +
          '<span class="ci-badge-st st-' + x.estado + '" style="align-self:flex-start">' + EST[x.estado].ico + EST[x.estado].label + '</span>' +
          drow('Código', x.codigo) + drow('Tipo', x.tipo) + drow('Depósito', x.deposito) + drow('Sector', x.sector) +
          drow('Ubicación', x.ubicacion || '—') + drow('Fecha', x.fecha) + drow('Hora', x.hora) + drow('Responsable', x.responsable || '—') +
          drow('SKUs', x.skus) + drow('Prioridad', x.prioridad) + drow('Diferencias', x.diffs ? 'Sí' : 'No') + drow('Observación', x.observacion || '—') +
        '</div>' +
        '<div class="ci-modal__f">' +
          '<button class="ci-mbtn ghost" id="dEstado">Avanzar estado</button>' +
          '<button class="ci-mbtn primary" id="dClose">Cerrar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    function close() { if (G() && !reduce()) { G().to(ov, { opacity: 0, duration: .16, onComplete: function () { ov.remove(); } }); } else ov.remove(); }
    ov.querySelector('.ci-modal__x').addEventListener('click', close);
    ov.querySelector('#dClose').addEventListener('click', close);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.querySelector('#dEstado').addEventListener('click', function () {
      var order = ['programado', 'en_proceso', 'realizado']; var i = order.indexOf(x.estado);
      x.estado = i < 0 ? 'programado' : order[(i + 1) % order.length];
      close(); paintKpis(); paintCalendar(false); paintList(true);
    });
    if (G() && !reduce()) { G().fromTo(ov, { opacity: 0 }, { opacity: 1, duration: .16 }); G().fromTo(ov.querySelector('.ci-modal'), { opacity: 0, y: 18, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .3, ease: 'power3.out' }); }
  }

  /* ── Entrada GSAP ────────────────────────────────────────────────────── */
  function entrance() {
    if (!G() || reduce()) return;
    var r = S.root;
    G().from(r.querySelector('.ci-head'), { opacity: 0, y: -8, duration: .4, ease: 'power2.out', clearProps: 'all' });
    G().from(r.querySelectorAll('.ci-seg__btn'), { opacity: 0, y: -6, duration: .35, stagger: .06, ease: 'power2.out', clearProps: 'all', delay: .05 });
    G().from(r.querySelector('.ci-kpis'), { opacity: 0, y: 8, duration: .4, ease: 'power2.out', clearProps: 'all', delay: .05 });
    G().from(r.querySelectorAll('.ci-body .ci-panel')[0], { opacity: 0, x: -10, duration: .45, ease: 'power3.out', clearProps: 'all', delay: .08 });
    G().from(r.querySelectorAll('.ci-body .ci-panel')[1], { opacity: 0, x: 10, duration: .45, ease: 'power3.out', clearProps: 'all', delay: .12 });
  }

  window.CalendarioInv = { render: render };
})();
