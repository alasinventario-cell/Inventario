/* ============================================================
   inventario-api.js — Capa de datos del módulo Inventario
   Habla con Supabase (window.__inventarioDB) si está configurado;
   si no, cae a un modo DEMO en localStorage para poder probar la UI.
   API pública: window.InventarioAPI
   ============================================================ */
(function () {
  'use strict';

  var DB   = window.__inventarioDB || null;
  var REMOTE = !!DB;
  var LS_KEY = 'inventario.demo.v1';

  function nowISO() { return new Date().toISOString(); }
  function usuario() {
    try { return (window.AlasAuthClient && window.AlasAuthClient.getCurrentUser && window.AlasAuthClient.getCurrentUser()) || 'Operador'; }
    catch (_) { return 'Operador'; }
  }

  /* ── Estado documento derivado de sus líneas ──────────────── */
  function derivarEstado(uso) {
    if (uso.estado === 'anulado') return 'anulado';
    var its = uso.items || [];
    if (its.length && its.every(function (i) { return i.sap_estado === 'baja'; })) return 'terminado';
    return uso.estado === 'autorizado' ? 'autorizado' : 'emitido';
  }

  /* ============================================================
     MODO DEMO (localStorage)
     ============================================================ */
  var Local = {
    _load: function () {
      try { return JSON.parse(localStorage.getItem(LS_KEY)) || { usos: [], audit: [], seq: 0, itemSeq: 0 }; }
      catch (_) { return { usos: [], audit: [], seq: 0, itemSeq: 0 }; }
    },
    _save: function (s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (_) {} },

    listMercaderias: function () { return Promise.resolve((window.MERCADERIAS_DEMO || []).slice()); },
    searchMercaderias: function (term) {
      term = (term || '').toLowerCase().trim();
      var all = window.MERCADERIAS_DEMO || [];
      if (!term) return Promise.resolve(all.slice(0, 40));
      return Promise.resolve(all.filter(function (m) {
        return (m.codigo + ' ' + m.descripcion).toLowerCase().indexOf(term) !== -1;
      }).slice(0, 40));
    },
    createMercaderia: function (data) {
      var m = { codigo: (data.codigo || '').trim(), descripcion: (data.descripcion || '').trim(), um: ((data.um || 'UN').trim() || 'UN') };
      if (!window.MERCADERIAS_DEMO) window.MERCADERIAS_DEMO = [];
      if (!window.MERCADERIAS_DEMO.some(function (x) { return x.codigo === m.codigo; })) window.MERCADERIAS_DEMO.unshift(m);
      return Promise.resolve(m);
    },
    listCasos: function () {
      var base = (window.CASOS_CECO || []).map(function (c, i) {
        return { id: i + 1, forma_carga: c.forma, cuenta_mayor: c.cuenta, ceco: c.ceco, orden: c.orden, detalle: c.detalle };
      });
      var s = this._load();
      return Promise.resolve(base.concat(s.casos || []));
    },
    createCaso: function (data) {
      var s = this._load();
      if (!s.casos) s.casos = [];
      var caso = {
        id: 100000 + s.casos.length + 1, custom: true,
        forma_carga: (data.forma_carga || '').trim(), cuenta_mayor: (data.cuenta_mayor || '').trim(),
        ceco: (data.ceco || '').trim().toUpperCase(), orden: (data.orden || '').trim(), detalle: (data.detalle || '').trim()
      };
      s.casos.push(caso);
      var area = (data.area || '').trim();
      if (caso.ceco && area) { if (!s.cecoDic) s.cecoDic = {}; s.cecoDic[caso.ceco] = area; window.CECO_DIC[caso.ceco] = area; }
      this._save(s);
      return Promise.resolve(caso);
    },

    listUsos: function (filtro) {
      var s = this._load();
      var out = s.usos.map(function (u) { u.estado = derivarEstado(u); return u; });
      if (filtro && filtro.sector)  out = out.filter(function (u) { return u.sector === filtro.sector; });
      if (filtro && filtro.estado === 'pendientes') out = out.filter(function (u) { return u.estado !== 'terminado' && u.estado !== 'anulado'; });
      if (filtro && filtro.estado === 'terminados') out = out.filter(function (u) { return u.estado === 'terminado'; });
      out.sort(function (a, b) { return (b.fecha_emision || '').localeCompare(a.fecha_emision || '') || b.id - a.id; });
      return Promise.resolve(out);
    },
    getUso: function (id) {
      var s = this._load();
      var u = s.usos.find(function (x) { return x.id === id; });
      if (u) u.estado = derivarEstado(u);
      return Promise.resolve(u || null);
    },

    createUso: function (doc) {
      var s = this._load();
      s.seq += 1;
      var id = s.seq;
      var nro = 'UI-' + String(id).padStart(4, '0');
      var items = (doc.items || []).map(function (it) {
        s.itemSeq += 1;
        return {
          id: s.itemSeq, cod_mercaderia: it.cod_mercaderia, descripcion: it.descripcion,
          cantidad: Number(it.cantidad) || 0, um: it.um || 'UN', uso_texto: it.uso_texto || '',
          caso_id: it.caso_id || null, cuenta_mayor: it.cuenta_mayor || '', ceco: it.ceco || '', orden: it.orden || '', n_reserva: '',
          sap_estado: 'pendiente', cargado_por: null, cargado_at: null, baja_por: null, baja_at: null
        };
      });
      var uso = {
        id: id, nro: nro, fecha_emision: doc.fecha_emision, sector: doc.sector,
        solicitante: doc.solicitante || usuario(), estado: 'emitido',
        created_by: usuario(), created_at: nowISO(), autorizado_por: null, autorizado_at: null,
        items: items
      };
      s.usos.push(uso);
      s.audit.push({ id: s.audit.length + 1, uso_id: id, item_id: null, accion: 'crear', estado_anterior: null, estado_nuevo: 'emitido', usuario: usuario(), detalle: 'Uso interno ' + nro + ' · ' + items.length + ' líneas', created_at: nowISO() });
      this._save(s);
      return Promise.resolve(uso);
    },

    autorizar: function (id) {
      var s = this._load();
      var u = s.usos.find(function (x) { return x.id === id; });
      if (u && u.estado === 'emitido') {
        u.estado = 'autorizado'; u.autorizado_por = usuario(); u.autorizado_at = nowISO();
        s.audit.push({ id: s.audit.length + 1, uso_id: id, item_id: null, accion: 'autorizar', estado_anterior: 'emitido', estado_nuevo: 'autorizado', usuario: usuario(), detalle: 'Uso interno ' + u.nro, created_at: nowISO() });
      }
      this._save(s);
      return Promise.resolve(u);
    },

    anular: function (id) {
      var s = this._load();
      var u = s.usos.find(function (x) { return x.id === id; });
      if (u) {
        var prev = u.estado; u.estado = 'anulado';
        s.audit.push({ id: s.audit.length + 1, uso_id: id, item_id: null, accion: 'anular', estado_anterior: prev, estado_nuevo: 'anulado', usuario: usuario(), detalle: 'Uso interno ' + u.nro, created_at: nowISO() });
      }
      this._save(s);
      return Promise.resolve(u);
    },

    cargarSAP: function (usoId, itemId, datos) {
      var s = this._load();
      var u = s.usos.find(function (x) { return x.id === usoId; });
      if (!u) return Promise.resolve(null);
      var it = u.items.find(function (x) { return x.id === itemId; });
      if (it) {
        it.caso_id = datos.caso_id || null; it.cuenta_mayor = datos.cuenta_mayor || '';
        it.ceco = datos.ceco || ''; it.orden = datos.orden || ''; it.n_reserva = datos.n_reserva || '';
        it.sap_estado = 'cargado'; it.cargado_por = usuario(); it.cargado_at = nowISO();
        s.audit.push({ id: s.audit.length + 1, uso_id: usoId, item_id: itemId, accion: 'cargar_sap', estado_anterior: 'pendiente', estado_nuevo: 'cargado', usuario: usuario(), detalle: (it.descripcion || it.cod_mercaderia) + ' · ' + it.cod_mercaderia + ' · Reserva ' + it.n_reserva, created_at: nowISO() });
      }
      this._save(s);
      return Promise.resolve(it);
    },

    darBaja: function (usoId, itemId) {
      var s = this._load();
      var u = s.usos.find(function (x) { return x.id === usoId; });
      if (!u) return Promise.resolve(null);
      var it = u.items.find(function (x) { return x.id === itemId; });
      if (it && it.sap_estado === 'cargado') {
        it.sap_estado = 'baja'; it.baja_por = usuario(); it.baja_at = nowISO();
        s.audit.push({ id: s.audit.length + 1, uso_id: usoId, item_id: itemId, accion: 'dar_baja', estado_anterior: 'cargado', estado_nuevo: 'baja', usuario: usuario(), detalle: (it.descripcion || it.cod_mercaderia) + (it.ceco ? ' · CECO ' + it.ceco : '') + (it.n_reserva ? ' · Reserva ' + it.n_reserva : ''), created_at: nowISO() });
        if (u.items.every(function (x) { return x.sap_estado === 'baja'; })) {
          u.estado = 'terminado';
          s.audit.push({ id: s.audit.length + 1, uso_id: usoId, item_id: null, accion: 'terminar', estado_anterior: 'autorizado', estado_nuevo: 'terminado', usuario: usuario(), detalle: 'Uso interno ' + u.nro, created_at: nowISO() });
        }
      }
      this._save(s);
      return Promise.resolve(it);
    },

    listAuditoria: function (usoId) {
      var s = this._load();
      var out = s.audit.filter(function (a) { return !usoId || a.uso_id === usoId; });
      out.sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || '') || (b.id - a.id); });
      return Promise.resolve(out);
    },

    updateItem: function (usoId, itemId, fields) {
      var s = this._load();
      var u = s.usos.find(function (x) { return x.id === usoId; });
      if (!u) return Promise.resolve(false);
      var it = (u.items || []).find(function (x) { return x.id === itemId; });
      if (!it) return Promise.resolve(false);
      Object.keys(fields).forEach(function (k) { it[k] = fields[k]; });
      s.audit.push({ id: s.audit.length + 1, uso_id: usoId, item_id: itemId, accion: 'editar', estado_anterior: null, estado_nuevo: null, usuario: usuario(), detalle: (it.descripcion || it.cod_mercaderia) + ' · ' + it.cod_mercaderia, created_at: nowISO() });
      this._save(s);
      return Promise.resolve(true);
    },

    asignarCeco: function (items, caso) {
      var s = this._load(); var n = 0;
      (items || []).forEach(function (ref) {
        var u = s.usos.find(function (x) { return x.id === ref.usoId; }); if (!u) return;
        var it = (u.items || []).find(function (x) { return x.id === ref.itemId; }); if (!it) return;
        it.caso_id = caso.id || null; it.cuenta_mayor = caso.cuenta_mayor || ''; it.ceco = caso.ceco || ''; it.orden = caso.orden || ''; n++;
      });
      if (n) s.audit.push({ id: s.audit.length + 1, uso_id: null, item_id: null, accion: 'asignar_ceco', estado_anterior: null, estado_nuevo: null, usuario: usuario(), detalle: (caso.ceco || '—') + ' · ' + n + ' línea' + (n !== 1 ? 's' : ''), created_at: nowISO() });
      this._save(s);
      return Promise.resolve(n);
    },

    marcarEntregado: function (itemIds) {
      var s = this._load(); var set = {}; (itemIds || []).forEach(function (id) { set[id] = 1; });
      s.usos.forEach(function (u) { (u.items || []).forEach(function (it) { if (set[it.id]) { it.entregado = true; it.entregado_at = nowISO(); } }); });
      this._save(s); return Promise.resolve(true);
    },
    cargarSAPBulk: function (items, reserva) {
      var s = this._load(); var set = {}; (items || []).forEach(function (x) { set[x.itemId] = 1; }); var n = 0;
      s.usos.forEach(function (u) { (u.items || []).forEach(function (it) { if (set[it.id] && it.sap_estado === 'pendiente') { it.n_reserva = reserva; it.sap_estado = 'cargado'; it.cargado_por = usuario(); it.cargado_at = nowISO(); n++; } }); });
      if (n) s.audit.push({ id: s.audit.length + 1, uso_id: null, item_id: null, accion: 'cargar_sap', estado_anterior: 'pendiente', estado_nuevo: 'cargado', usuario: usuario(), detalle: 'Reserva ' + reserva + ' · ' + n + ' línea' + (n !== 1 ? 's' : ''), created_at: nowISO() });
      this._save(s); return Promise.resolve(n);
    },

    deleteItem: function (usoId, itemId) {
      var s = this._load();
      var u = s.usos.find(function (x) { return x.id === usoId; });
      if (!u) return Promise.resolve(false);
      var it = (u.items || []).find(function (x) { return x.id === itemId; });
      u.items = (u.items || []).filter(function (x) { return x.id !== itemId; });
      s.audit.push({ id: s.audit.length + 1, uso_id: usoId, item_id: itemId, accion: 'eliminar_item', estado_anterior: it ? it.sap_estado : '', estado_nuevo: 'eliminado', usuario: usuario(), detalle: it ? ((it.descripcion || it.cod_mercaderia) + ' · ' + it.cod_mercaderia) : '', created_at: nowISO() });
      if (!u.items.length) {
        s.usos = s.usos.filter(function (x) { return x.id !== usoId; });
        s.audit.push({ id: s.audit.length + 1, uso_id: usoId, item_id: null, accion: 'eliminar', estado_anterior: null, estado_nuevo: 'eliminado', usuario: usuario(), detalle: 'Uso interno ' + u.nro, created_at: nowISO() });
      }
      this._save(s);
      return Promise.resolve(true);
    }
  };

  /* ============================================================
     MODO SUPABASE
     ============================================================ */
  var Remote = {
    listMercaderias: function () {
      return DB.from('mercaderias').select('*').eq('activo', true).order('descripcion').limit(1000)
        .then(function (r) { return (r.data || []).map(function (m) { return { codigo: m.codigo, descripcion: m.descripcion, um: m.um }; }); });
    },
    searchMercaderias: function (term) {
      term = (term || '').trim().replace(/[,()%*]/g, ' ').trim();
      var q = DB.from('mercaderias').select('codigo,descripcion,um').eq('activo', true);
      if (term) q = q.or('codigo.ilike.%' + term + '%,descripcion.ilike.%' + term + '%');
      return q.order('descripcion').limit(40)
        .then(function (r) { return (r.data || []).map(function (m) { return { codigo: m.codigo, descripcion: m.descripcion, um: m.um }; }); });
    },
    createMercaderia: function (data) {
      return DB.from('mercaderias').upsert({
        codigo: (data.codigo || '').trim(), descripcion: (data.descripcion || '').trim(), um: ((data.um || 'UN').trim() || 'UN'), activo: true
      }, { onConflict: 'codigo' }).select().single()
        .then(function (r) { return r.data || { codigo: data.codigo, descripcion: data.descripcion, um: data.um }; });
    },
    listCasos: function () {
      return DB.from('casos_ceco').select('*').eq('activo', true).order('id')
        .then(function (r) { return r.data || []; });
    },
    createCaso: function (data) {
      return DB.from('casos_ceco').insert({
        forma_carga: (data.forma_carga || '').trim(), cuenta_mayor: (data.cuenta_mayor || '').trim(),
        ceco: (data.ceco || '').trim().toUpperCase(), orden: (data.orden || '').trim(), detalle: (data.detalle || '').trim(), activo: true
      }).select().single().then(function (r) {
        var area = (data.area || '').trim();
        if (r.data && r.data.ceco && area) window.CECO_DIC[r.data.ceco] = area;
        return r.data;
      });
    },
    _audit: function (row) {
      row.usuario = usuario(); row.created_at = nowISO();
      return DB.from('uso_auditoria').insert(row);
    },
    listUsos: function (filtro) {
      var q = DB.from('usos_internos').select('*, items:uso_items(*)').order('fecha_emision', { ascending: false }).order('id', { ascending: false });
      if (filtro && filtro.sector) q = q.eq('sector', filtro.sector);
      return q.then(function (r) {
        var out = (r.data || []).map(function (u) { u.estado = derivarEstado(u); return u; });
        if (filtro && filtro.estado === 'pendientes') out = out.filter(function (u) { return u.estado !== 'terminado' && u.estado !== 'anulado'; });
        if (filtro && filtro.estado === 'terminados') out = out.filter(function (u) { return u.estado === 'terminado'; });
        return out;
      });
    },
    getUso: function (id) {
      return DB.from('usos_internos').select('*, items:uso_items(*)').eq('id', id).single()
        .then(function (r) { if (r.data) r.data.estado = derivarEstado(r.data); return r.data || null; });
    },
    createUso: function (doc) {
      var self = this;
      return DB.from('usos_internos').insert({
        fecha_emision: doc.fecha_emision, sector: doc.sector,
        solicitante: doc.solicitante || usuario(), estado: 'emitido', created_by: usuario()
      }).select().single().then(function (r) {
        var uso = r.data;
        return DB.from('usos_internos').update({ nro: 'UI-' + String(uso.id).padStart(4, '0') }).eq('id', uso.id)
          .then(function () {
            var rows = (doc.items || []).map(function (it) {
              return { uso_id: uso.id, cod_mercaderia: it.cod_mercaderia, descripcion: it.descripcion, cantidad: Number(it.cantidad) || 0, um: it.um || 'UN', uso_texto: it.uso_texto || '',
                caso_id: it.caso_id || null, cuenta_mayor: it.cuenta_mayor || '', ceco: it.ceco || '', orden: it.orden || '', sap_estado: 'pendiente' };
            });
            return DB.from('uso_items').insert(rows);
          })
          .then(function () { return self._audit({ uso_id: uso.id, accion: 'crear', estado_nuevo: 'emitido', detalle: (doc.items || []).length + ' líneas' }); })
          .then(function () { return self.getUso(uso.id); });
      });
    },
    autorizar: function (id) {
      var self = this;
      return DB.from('usos_internos').update({ estado: 'autorizado', autorizado_por: usuario(), autorizado_at: nowISO() }).eq('id', id).eq('estado', 'emitido')
        .then(function () { return self._audit({ uso_id: id, accion: 'autorizar', estado_anterior: 'emitido', estado_nuevo: 'autorizado' }); })
        .then(function () { return self.getUso(id); });
    },
    anular: function (id) {
      var self = this;
      return DB.from('usos_internos').update({ estado: 'anulado' }).eq('id', id)
        .then(function () { return self._audit({ uso_id: id, accion: 'anular', estado_nuevo: 'anulado' }); })
        .then(function () { return self.getUso(id); });
    },
    cargarSAP: function (usoId, itemId, datos) {
      var self = this;
      return DB.from('uso_items').update({
        caso_id: datos.caso_id || null, cuenta_mayor: datos.cuenta_mayor || '', ceco: datos.ceco || '',
        orden: datos.orden || '', n_reserva: datos.n_reserva || '', sap_estado: 'cargado', cargado_por: usuario(), cargado_at: nowISO()
      }).eq('id', itemId)
        .then(function () { return self._audit({ uso_id: usoId, item_id: itemId, accion: 'cargar_sap', estado_anterior: 'pendiente', estado_nuevo: 'cargado', detalle: 'N.Res ' + (datos.n_reserva || '') }); });
    },
    darBaja: function (usoId, itemId) {
      var self = this;
      return DB.from('uso_items').select('cod_mercaderia,descripcion,ceco,n_reserva').eq('id', itemId).single()
        .then(function (r) {
          var it = r.data || {};
          var det = (it.descripcion || it.cod_mercaderia || '') + (it.ceco ? ' · CECO ' + it.ceco : '') + (it.n_reserva ? ' · Reserva ' + it.n_reserva : '');
          return DB.from('uso_items').update({ sap_estado: 'baja', baja_por: usuario(), baja_at: nowISO() }).eq('id', itemId).eq('sap_estado', 'cargado')
            .then(function () { return self._audit({ uso_id: usoId, item_id: itemId, accion: 'dar_baja', estado_anterior: 'cargado', estado_nuevo: 'baja', detalle: det }); });
        })
        .then(function () { return self.getUso(usoId); })
        .then(function (u) {
          if (u && (u.items || []).length && u.items.every(function (x) { return x.sap_estado === 'baja'; })) {
            return DB.from('usos_internos').update({ estado: 'terminado' }).eq('id', usoId)
              .then(function () { return self._audit({ uso_id: usoId, accion: 'terminar', estado_nuevo: 'terminado', detalle: 'Uso interno ' + (u.nro || '') }); });
          }
        });
    },
    listAuditoria: function (usoId) {
      var q = DB.from('uso_auditoria').select('*').order('created_at', { ascending: false });
      if (usoId) q = q.eq('uso_id', usoId);
      return q.then(function (r) { return r.data || []; });
    },
    updateItem: function (usoId, itemId, fields) {
      var self = this;
      return DB.from('uso_items').update(fields).eq('id', itemId)
        .then(function () { return self._audit({ uso_id: usoId, item_id: itemId, accion: 'editar', detalle: fields.cod_mercaderia || '' }); });
    },
    asignarCeco: function (items, caso) {
      var self = this;
      var ids = (items || []).map(function (x) { return x.itemId; });
      if (!ids.length) return Promise.resolve(0);
      return DB.from('uso_items').update({ caso_id: caso.id || null, cuenta_mayor: caso.cuenta_mayor || '', ceco: caso.ceco || '', orden: caso.orden || '' }).in('id', ids)
        .then(function () { return self._audit({ accion: 'asignar_ceco', detalle: (caso.ceco || '—') + ' · ' + ids.length + ' línea' + (ids.length !== 1 ? 's' : '') }); })
        .then(function () { return ids.length; });
    },
    marcarEntregado: function (itemIds) {
      if (!itemIds || !itemIds.length) return Promise.resolve(false);
      return DB.from('uso_items').update({ entregado: true, entregado_at: nowISO() }).in('id', itemIds).then(function () { return true; });
    },
    cargarSAPBulk: function (items, reserva) {
      var self = this; var ids = (items || []).map(function (x) { return x.itemId; }); if (!ids.length) return Promise.resolve(0);
      return DB.from('uso_items').update({ n_reserva: reserva, sap_estado: 'cargado', cargado_por: usuario(), cargado_at: nowISO() }).in('id', ids).eq('sap_estado', 'pendiente')
        .then(function () { return self._audit({ accion: 'cargar_sap', estado_anterior: 'pendiente', estado_nuevo: 'cargado', detalle: 'Reserva ' + reserva + ' · ' + ids.length + ' línea' + (ids.length !== 1 ? 's' : '') }); })
        .then(function () { return ids.length; });
    },
    deleteItem: function (usoId, itemId) {
      var self = this;
      return DB.from('uso_items').delete().eq('id', itemId)
        .then(function () { return self._audit({ uso_id: usoId, item_id: itemId, accion: 'eliminar_item', estado_nuevo: 'eliminado' }); })
        .then(function () { return self.getUso(usoId); })
        .then(function (u) {
          if (u && (u.items || []).length === 0) {
            return DB.from('usos_internos').delete().eq('id', usoId)
              .then(function () { return self._audit({ uso_id: usoId, accion: 'eliminar', estado_nuevo: 'eliminado' }); });
          }
        });
    }
  };

  /* ── Fachada pública ──────────────────────────────────────── */
  var impl = REMOTE ? Remote : Local;
  window.InventarioAPI = {
    isRemote: REMOTE,
    cecoArea: function (code) { return (window.CECO_DIC && window.CECO_DIC[code]) || ''; },
    listMercaderias: function ()               { return impl.listMercaderias(); },
    searchMercaderias: function (term)         { return impl.searchMercaderias(term); },
    createMercaderia:  function (data)         { return impl.createMercaderia(data); },
    listCasos:       function ()               { return impl.listCasos(); },
    createCaso:      function (data)           { return impl.createCaso(data); },
    listUsos:        function (f)              { return impl.listUsos(f); },
    getUso:          function (id)             { return impl.getUso(id); },
    createUso:       function (doc)            { return impl.createUso(doc); },
    autorizar:       function (id)             { return impl.autorizar(id); },
    anular:          function (id)             { return impl.anular(id); },
    cargarSAP:       function (usoId, it, d)   { return impl.cargarSAP(usoId, it, d); },
    darBaja:         function (usoId, it)      { return impl.darBaja(usoId, it); },
    updateItem:      function (usoId, it, f)   { return impl.updateItem(usoId, it, f); },
    asignarCeco:     function (items, caso)    { return impl.asignarCeco(items, caso); },
    marcarEntregado: function (itemIds)        { return impl.marcarEntregado(itemIds); },
    cargarSAPBulk:   function (items, reserva) { return impl.cargarSAPBulk(items, reserva); },
    deleteItem:      function (usoId, it)      { return impl.deleteItem(usoId, it); },
    listAuditoria:   function (usoId)          { return impl.listAuditoria(usoId); }
  };

  // Rehidratar áreas CECO personalizadas guardadas en modo demo
  if (!REMOTE) {
    try { var _s = Local._load(); if (_s.cecoDic) { window.CECO_DIC = window.CECO_DIC || {}; Object.keys(_s.cecoDic).forEach(function (k) { window.CECO_DIC[k] = _s.cecoDic[k]; }); } } catch (_) {}
  }

  console.info('[Inventario] API lista. Modo:', REMOTE ? 'Supabase' : 'DEMO (localStorage)');
})();
