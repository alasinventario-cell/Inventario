/* ============================================================
   ALAS — Inventario · app.js
   Control de Usos Internos: menú, wizard, carga a SAP (caso CECO),
   baja, auditoría y reporte (correo/imprimir/PDF).
   ============================================================ */
(function () {
  'use strict';

  var LAUNCHER_URL = (window.ALAS_SSO_CONFIG && window.ALAS_SSO_CONFIG.launcherUrl) || 'https://launcher-tawny.vercel.app';
  var API = window.InventarioAPI;

  var SECTOR_CARDS = [
    { key:'ALMACENAMIENTO-DEPOSITO', label:'Depósito',       icon:'warehouse' },
    { key:'ALMACENAMIENTO-FABRICA',  label:'Fábrica',        icon:'factory'   },
    { key:'PRODUCCION',              label:'Producción',     icon:'gear'      },
    { key:'ADMINISTRACION',          label:'Administración', icon:'building'  }
  ];
  var SECTOR_DESC = {
    'ALMACENAMIENTO-DEPOSITO':'Almacén principal',
    'ALMACENAMIENTO-FABRICA' :'Almacén fábrica',
    'PRODUCCION'             :'Planta de producción',
    'ADMINISTRACION'         :'Oficinas administrativas'
  };

  var _curMonth=(function(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); })();
  var state = { view:'menu', sector:null, listFilter:null, search:'', casos:[], mercaderias:[], _rows:[], dateFilter:null, bajaSector:'', menuMonth:_curMonth, _menuUsos:null, resumenMode:'barras' };
  var MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  function monthLabel(m){ if(!m) return 'Todos los meses'; var p=m.split('-'); return MESES[+p[1]-1]+' '+p[0]; }
  function shiftMonth(m, delta){ var d=m?new Date(+m.split('-')[0], +m.split('-')[1]-1, 1):new Date(); d.setMonth(d.getMonth()+delta); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
  function inMonth(u){ return !state.menuMonth || String(u.fecha_emision).slice(0,7)===state.menuMonth; }
  function monthNavHTML(){ return '<div class="month-nav">'+
      '<button class="mn-btn" type="button" data-mn="prev" aria-label="Mes anterior">'+ICONS.back+'</button>'+
      '<span class="mn-label">'+esc(monthLabel(state.menuMonth))+'</span>'+
      '<button class="mn-btn" type="button" data-mn="next" aria-label="Mes siguiente">'+ARROW+'</button>'+
      '<button class="mn-all'+(state.menuMonth?'':' on')+'" type="button" data-mn="all">Todos</button></div>'; }
  function wireMonthNav(root, onChange){
    root.querySelectorAll('[data-mn]').forEach(function(b){ b.addEventListener('click',function(){
      var a=b.getAttribute('data-mn');
      if(a==='all') state.menuMonth=''; else state.menuMonth=shiftMonth(state.menuMonth || (new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')), a==='prev'?-1:1);
      var lab=root.querySelector('.mn-label'); if(lab) lab.textContent=monthLabel(state.menuMonth);
      var all=root.querySelector('.mn-all'); if(all) all.classList.toggle('on',!state.menuMonth);
      onChange();
    }); });
  }

  /* ── Helpers ──────────────────────────────────────────────── */
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function fmtFecha(iso){ if(!iso) return ''; var d=String(iso).slice(0,10).split('-'); return d.length===3? d[2]+'/'+d[1]+'/'+d[0] : iso; }
  function fmtDT(iso){ if(!iso) return ''; var d=new Date(iso); return fmtFecha(iso)+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  function q(sel,root){ return (root||document).querySelector(sel); }
  function elFrom(html){ var t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }

  function toast(msg,type){
    var t=document.createElement('div'); t.className='toast'+(type?' toast--'+type:''); t.textContent=msg;
    document.body.appendChild(t); requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.remove(); },350); }, 2600);
  }

  var ICONS = {
    warehouse:'<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L2 8v13h20V8L12 3zm0 2.2L19 8.7V19h-3v-6H8v6H5V8.7L12 5.2zM10 15h4v4h-4v-4z"/></svg>',
    gear:'<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94L2.85 15.06a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
    building:'<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 21V7l8-4v4l8-3v17H3zm2-2h4v-3H5v3zm0-5h4v-3H5v3zm0-5h4V6L5 7.5V9zm6 10h8v-9l-8 3v6zm2-2v-2h2v2h-2zm3 0v-2h2v2h-2z"/></svg>',
    factory:'<svg fill="currentColor" viewBox="0 0 24 24"><path d="M2 22V11l6 3.5V11l6 3.5V8l6 4v10H2zm4-2v-3H4v3h2zm5 0v-3H9v3h2zm5 0v-3h-2v3h2zM17 3h3v6h-2V5h-1V3z"/></svg>',
    plus:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke-width="2.2" stroke-linecap="round"/></svg>',
    edit:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    thumb:'<svg fill="currentColor" viewBox="0 0 24 24"><path d="M2 21h2V9H2v12zM23 10a2 2 0 00-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L14 1 7.6 7.4c-.4.4-.6.9-.6 1.4V19a2 2 0 002 2h9c.8 0 1.5-.5 1.8-1.2l3-7c.1-.2.2-.5.2-.8v-2z"/></svg>',
    file:'<svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm0 2l4 4h-4V4zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/></svg>',
    print:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>',
    sap:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke-width="1.6"/></svg>',
    check:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    calendar:'<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    chevron:'<svg fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>',
    search:'<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
    filter:'<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 5h16M7 12h10M10 19h4" stroke-linecap="round"/></svg>',
    tag:'<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    hash:'<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    trash:'<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    back:'<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    chart:'<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></svg>',
    donut:'<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 018.5 8.5"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  function sapBadge(estado){
    if(estado==='baja')    return '<span class="badge badge--baja">'+ICONS.check+'BAJA</span>';
    if(estado==='cargado') return '<span class="badge badge--cargado">'+ICONS.sap+'CARGADO</span>';
    return '<span class="badge badge--pendiente">'+ICONS.clock+'PENDIENTE</span>';
  }
  function docBadge(estado){ return '<span class="badge badge--'+estado+'">'+esc(estado.toUpperCase())+'</span>'; }

  /* ── Modales (apilables) ──────────────────────────────────── */
  function openModal(inner, opts){
    opts=opts||{};
    var bd=elFrom('<div class="modal-backdrop"><div class="modal '+(opts.wide?'modal--wide':'')+'"><div class="modal__bar"></div>'+inner+'</div></div>');
    q('#modalHost').appendChild(bd);
    requestAnimationFrame(function(){ bd.classList.add('is-open'); });
    if(window.gsap && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
      var _mb=bd.querySelector('.modal__body');
      if(_mb && _mb.children.length){ window.gsap.from(_mb.children, { y:14, opacity:0, duration:.42, stagger:.05, ease:'power2.out', delay:.14, overwrite:'auto', clearProps:'transform,opacity' }); }
    }
    function close(){ bd.classList.remove('is-open'); setTimeout(function(){ bd.remove(); },320); }
    bd.addEventListener('click',function(e){ if(e.target===bd) close(); });
    bd.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click',close); });
    document.addEventListener('keydown',function onEsc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown',onEsc); } });
    return { bd:bd, close:close };
  }

  /* ── SSelect: desplegable "pro" (estilo itemsborrados) ────── */
  function SSelect(host, cfg){
    cfg = cfg || {};
    var options = cfg.options || [];
    var value = (cfg.value != null ? String(cfg.value) : null);
    var icon = cfg.icon || ICONS.tag;
    var placeholder = cfg.placeholder || 'Seleccionar…';
    host.innerHTML = '<div class="ssel"><div class="ssel-display" tabindex="0">'+
      '<div class="ssel-btn-left"><span class="ssel-ico">'+icon+'</span><span class="ssel-dt"></span></div>'+
      '<span class="ssel-arrow">'+ICONS.chevron+'</span></div></div>';
    var wrap=host.querySelector('.ssel'), disp=host.querySelector('.ssel-display'), dt=host.querySelector('.ssel-dt');
    var dd=null, isOpen=false, onDoc=null, onScroll=null, onKey=null;
    var _dynOpts=[], searchSeq=0;
    function optByVal(v){ return options.concat(_dynOpts).find(function(o){ return String(o.value)===String(v); }); }
    function paint(){ var o=(value!=null?optByVal(value):null); var lbl=o?o.label:(cfg.current&&String(cfg.current.value)===String(value)?cfg.current.label:null); dt.textContent=lbl||placeholder; dt.style.color=lbl?'':'#8b9cb2'; }
    paint();
    function position(){ if(!dd) return; var r=disp.getBoundingClientRect(); dd.style.position='fixed'; dd.style.left=r.left+'px'; dd.style.top=(r.bottom+6)+'px'; dd.style.width=r.width+'px'; }
    function doRender(items){
      var list=dd&&dd.querySelector('.ssel-list'); if(!list) return;
      _dynOpts=items||[];
      if(!_dynOpts.length){ list.innerHTML='<div class="ssel-empty">Sin resultados</div>'; return; }
      list.innerHTML=_dynOpts.slice(0,60).map(function(o){
        return '<button type="button" class="ssel-item'+(String(o.value)===String(value)?' on':'')+'" data-value="'+esc(o.value)+'">'+
          '<span class="ssel-lbl">'+esc(o.label)+(o.sub?' <small>· '+esc(o.sub)+'</small>':'')+'</span>'+
          '<span class="ssel-check">'+ICONS.check+'</span></button>';
      }).join('');
      list.querySelectorAll('.ssel-item').forEach(function(b){
        b.addEventListener('click',function(){ value=b.getAttribute('data-value'); paint(); close(); if(cfg.onChange) cfg.onChange(value, optByVal(value)); });
      });
    }
    function renderList(f){
      var list=dd&&dd.querySelector('.ssel-list'); if(!list) return; f=(f||'');
      if(cfg.asyncSearch){
        var term=f.trim();
        if(!term){ list.innerHTML='<div class="ssel-empty">Escribí para buscar (código o descripción)…</div>'; return; }
        list.innerHTML='<div class="ssel-empty">Buscando…</div>';
        var myReq=++searchSeq;
        cfg.asyncSearch(term).then(function(items){ if(myReq!==searchSeq||!dd) return; doRender(items||[]); })
          .catch(function(){ if(myReq===searchSeq&&dd){ var l=dd.querySelector('.ssel-list'); if(l) l.innerHTML='<div class="ssel-empty">Error al buscar</div>'; } });
        return;
      }
      var fl=f.toLowerCase();
      doRender(options.filter(function(o){ return !fl || (o.label+' '+(o.sub||'')).toLowerCase().indexOf(fl)!==-1; }));
    }
    function open(){
      if(isOpen) return; isOpen=true; wrap.classList.add('is-open');
      dd=document.createElement('div'); dd.className='ssel-dd';
      dd.innerHTML='<div class="ssel-search-box"><span class="ssel-search-icon">'+ICONS.search+'</span><input class="ssel-inp" placeholder="Buscar…"></div><div class="ssel-list"></div>'+(cfg.onAddNew?'<button type="button" class="ssel-addnew" id="sselAddNew">'+ICONS.plus+' '+esc(cfg.addNewLabel||'Agregar nuevo')+'</button>':'');
      document.body.appendChild(dd); position(); renderList('');
      var inp=dd.querySelector('.ssel-inp'); var _deb=null;
      inp.addEventListener('input',function(){ if(cfg.asyncSearch){ clearTimeout(_deb); _deb=setTimeout(function(){ renderList(inp.value); },260); } else { renderList(inp.value); } });
      var _addB=dd.querySelector('#sselAddNew');
      if(_addB) _addB.addEventListener('mousedown',function(e){ e.preventDefault(); }); // no perder foco/cerrar antes
      if(_addB) _addB.addEventListener('click',function(){ var term=inp.value.trim(); close(); cfg.onAddNew(term, function(opt){ value=String(opt.value); _dynOpts=[opt]; paint(); if(cfg.onChange) cfg.onChange(value, opt); }); });
      requestAnimationFrame(function(){ dd.classList.add('open'); inp.focus(); });
      onDoc=function(e){ if(dd && !dd.contains(e.target) && !disp.contains(e.target)) close(); };
      onScroll=function(){ close(); };
      onKey=function(e){ if(e.key==='Escape'){ e.stopPropagation(); close(); } };
      setTimeout(function(){ document.addEventListener('mousedown',onDoc); document.addEventListener('keydown',onKey,true); window.addEventListener('scroll',onScroll,true); window.addEventListener('resize',onScroll); },0);
    }
    function close(){
      if(!isOpen) return; isOpen=false; wrap.classList.remove('is-open');
      document.removeEventListener('mousedown',onDoc); document.removeEventListener('keydown',onKey,true); window.removeEventListener('scroll',onScroll,true); window.removeEventListener('resize',onScroll);
      var d=dd; dd=null; if(d){ d.classList.remove('open'); setTimeout(function(){ d.remove(); },200); }
    }
    disp.addEventListener('click',function(){ isOpen?close():open(); });
    disp.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); isOpen?close():open(); } });
    return { getValue:function(){ return value; }, setValue:function(v){ value=(v!=null?String(v):null); paint(); }, option:function(){ return optByVal(value); } };
  }

  /* ── CasoPicker: selector de Caso/CECO como modal-tabla ───── */
  function casoTriggerLabel(c){ return c ? c.forma_carga + (c.ceco?' · '+c.ceco:'') : ''; }
  function CasoPicker(host, cfg){
    cfg = cfg || {};
    var value = (cfg.value != null ? String(cfg.value) : null);
    host.innerHTML='<div class="ssel"><div class="ssel-display" tabindex="0"><div class="ssel-btn-left"><span class="ssel-ico">'+ICONS.hash+'</span><span class="ssel-dt"></span></div><span class="ssel-arrow">'+ICONS.chevron+'</span></div></div>';
    var dt=host.querySelector('.ssel-dt'), trig=host.querySelector('.ssel-display');
    function cur(){ return state.casos.find(function(c){ return String(c.id)===String(value); }); }
    function paint(){ var c=cur(); dt.textContent=c?casoTriggerLabel(c):(cfg.placeholder||'Elegir caso / CECO…'); dt.style.color=c?'':'#8b9cb2'; }
    paint();
    function openPicker(){
      var m=openModal(
        '<div class="modal__head"><div class="modal__title">Elegir caso / CECO</div>'+
          '<div class="modal__head-actions"><div class="cp-search"><span>'+ICONS.search+'</span><input id="cp_q" placeholder="Buscar forma, CECO, cuenta, orden…" autocomplete="off"></div>'+
          '<button class="modal__close" data-close>&times;</button></div></div>'+
        '<div class="modal__body cp-body"><div class="cp-table-wrap"><table class="cp-table"><thead><tr>'+
          '<th>Forma de carga</th><th>Cuenta Mayor</th><th>CECO</th><th>Área</th><th>Orden</th><th>Detalle</th>'+
          '</tr></thead><tbody id="cp_rows"></tbody></table></div></div>'+
        '<div class="modal__foot cp-foot"><span class="cp-foot-hint">¿No está el CECO que buscás?</span>'+
          '<button class="btn btn--primary" id="cp_new">'+ICONS.plus+' Agregar CECO nuevo</button></div>',
        { wide:true }
      );
      var inp=q('#cp_q',m.bd), rowsHost=q('#cp_rows',m.bd);
      function render(f){
        f=(f||'').toLowerCase();
        var items=state.casos.filter(function(c){ return !f || (c.forma_carga+' '+c.cuenta_mayor+' '+c.ceco+' '+c.orden+' '+(c.detalle||'')+' '+(API.cecoArea(c.ceco)||'')).toLowerCase().indexOf(f)!==-1; });
        if(!items.length){ rowsHost.innerHTML='<tr><td colspan="6" class="cp-empty">Sin resultados. Podés agregarlo con “Agregar CECO nuevo”.</td></tr>'; return; }
        rowsHost.innerHTML=items.map(function(c){
          return '<tr class="cp-row'+(String(c.id)===String(value)?' is-sel':'')+'" data-id="'+c.id+'">'+
            '<td class="cp-forma">'+esc(c.forma_carga)+(c.custom?' <span class="cp-new-tag">NUEVO</span>':'')+'</td>'+
            '<td>'+esc(c.cuenta_mayor||'—')+'</td>'+
            '<td><span class="cp-ceco">'+esc(c.ceco||'—')+'</span></td>'+
            '<td class="cp-muted">'+esc(API.cecoArea(c.ceco)||'—')+'</td>'+
            '<td>'+esc(c.orden||'—')+'</td>'+
            '<td class="cp-muted">'+esc(c.detalle||'—')+'</td></tr>';
        }).join('');
        rowsHost.querySelectorAll('.cp-row').forEach(function(r){ r.addEventListener('click',function(){ value=r.getAttribute('data-id'); paint(); m.close(); if(cfg.onChange) cfg.onChange(cur()); }); });
      }
      inp.addEventListener('input',function(){ render(inp.value); });
      q('#cp_new',m.bd).addEventListener('click',function(){ openNewCaso(inp.value, m); });
      render(''); setTimeout(function(){ inp.focus(); },60);
    }
    function openNewCaso(prefill, pickerM){
      var mf=openModal(
        '<div class="modal__head"><div class="modal__title">Agregar CECO / caso nuevo</div><button class="modal__close" data-close>&times;</button></div>'+
        '<div class="modal__body"><div class="nc-grid">'+
          '<div class="field nc-wide"><label class="field__label">Forma de carga *</label><input class="input" id="nc_forma" placeholder="Ej: MANT.LOCALES E INST." autocomplete="off"></div>'+
          '<div class="field"><label class="field__label">Cuenta Mayor</label><input class="input" id="nc_cuenta" placeholder="61234006" autocomplete="off"></div>'+
          '<div class="field"><label class="field__label">CECO *</label><input class="input" id="nc_ceco" placeholder="DAL2000000" autocomplete="off"></div>'+
          '<div class="field"><label class="field__label">Área <span class="field__opt">(opcional)</span></label><input class="input" id="nc_area" placeholder="ALMACEN" autocomplete="off"></div>'+
          '<div class="field"><label class="field__label">Orden</label><input class="input" id="nc_orden" placeholder="1012752" autocomplete="off"></div>'+
          '<div class="field nc-wide"><label class="field__label">Detalle</label><input class="input" id="nc_detalle" placeholder="Descripción del uso" autocomplete="off"></div>'+
        '</div></div>'+
        '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn btn--primary" id="nc_save">'+ICONS.check+' Guardar CECO</button></div>'
      );
      var f0=q('#nc_forma',mf.bd); if(prefill && f0) f0.value=prefill;
      q('#nc_save',mf.bd).addEventListener('click',function(){
        var data={ forma_carga:q('#nc_forma',mf.bd).value, cuenta_mayor:q('#nc_cuenta',mf.bd).value, ceco:q('#nc_ceco',mf.bd).value, area:q('#nc_area',mf.bd).value, orden:q('#nc_orden',mf.bd).value, detalle:q('#nc_detalle',mf.bd).value };
        if(!data.forma_carga.trim() || !data.ceco.trim()){ toast('Forma de carga y CECO son obligatorios','err'); return; }
        API.createCaso(data).then(function(nc){
          API.listCasos().then(function(cs){
            state.casos=cs; mf.close(); if(pickerM) pickerM.close();
            value=String(nc.id); paint(); toast('CECO agregado','ok');
            if(cfg.onChange) cfg.onChange(cur());
          });
        });
      });
      setTimeout(function(){ if(f0) f0.focus(); },60);
    }
    trig.addEventListener('click', openPicker);
    trig.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openPicker(); } });
    return { getValue:function(){ return value; } };
  }

  /* ── Filtro de fecha (estilo itemsborrados) ───────────────── */
  function ymd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function inDateRange(f){ if(!state.dateFilter) return true; var d=String(f).slice(0,10);
    if(state.dateFilter.desde && d<state.dateFilter.desde) return false;
    if(state.dateFilter.hasta && d>state.dateFilter.hasta) return false; return true; }
  function setDateFilter(desde,hasta,label){ state.dateFilter=(desde||hasta)?{desde:desde||'',hasta:hasta||'',label:label}:null; refreshCurrent(); }

  function openDateFilter(){
    var f=state.dateFilter||{};
    function quickBtn(k,lbl,sub,mod){ return '<button class="date-quick-btn'+(mod?' date-quick-btn--'+mod:'')+'" data-quick="'+k+'">'+
      '<span class="date-quick-ic">'+(k==='todos'?'&times;':ICONS.calendar)+'</span>'+
      '<span class="date-quick-txt"><span class="date-quick-lbl">'+lbl+'</span><span class="date-quick-sub">'+sub+'</span></span></button>'; }
    var m=openModal(
      '<div class="modal__head"><div class="modal__title">Filtrar por fechas</div><button class="modal__close" data-close>&times;</button></div>'+
      '<div class="modal__body">'+
        '<div class="date-section-title">'+ICONS.calendar+' Rango personalizado</div>'+
        '<div class="date-fields">'+
          '<div class="field"><label class="field__label">Desde</label><input class="input" type="date" id="df_desde" value="'+esc(f.desde||'')+'"></div>'+
          '<div class="field"><label class="field__label">Hasta</label><input class="input" type="date" id="df_hasta" value="'+esc(f.hasta||'')+'"></div>'+
        '</div>'+
        '<div class="field" style="margin-top:12px"><label class="field__label">O elegí un mes completo</label><input class="input" type="month" id="df_mes"></div>'+
        '<button class="btn btn--primary" id="df_apply" style="margin-top:6px">'+ICONS.check+' Aplicar filtro</button>'+
        '<div class="date-divider"></div>'+
        '<div class="date-section-title">'+ICONS.clock+' Selección rápida</div>'+
        '<div class="date-quick-grid">'+
          quickBtn('hoy','Hoy','Solo hoy','')+
          quickBtn('semana','Últimos 7 días','','')+
          quickBtn('mes','Este mes','','')+
          quickBtn('todos','Quitar filtro','Mostrar todo','danger')+
        '</div>'+
      '</div>', {}
    );
    q('#df_apply',m.bd).addEventListener('click',function(){
      var desde=q('#df_desde',m.bd).value, hasta=q('#df_hasta',m.bd).value, mes=q('#df_mes',m.bd).value;
      if(mes && !desde && !hasta){ var p=mes.split('-'); var first=new Date(+p[0],+p[1]-1,1), last=new Date(+p[0],+p[1],0);
        setDateFilter(ymd(first),ymd(last), fmtFecha(ymd(first)).slice(3)); m.close(); return; }
      if(!desde && !hasta){ toast('Elegí un rango o un mes','err'); return; }
      var lbl=(desde?fmtFecha(desde):'…')+' – '+(hasta?fmtFecha(hasta):'…');
      setDateFilter(desde,hasta,lbl); m.close();
    });
    m.bd.querySelectorAll('[data-quick]').forEach(function(b){
      b.addEventListener('click',function(){
        var k=b.getAttribute('data-quick'), now=new Date();
        if(k==='hoy'){ setDateFilter(ymd(now),ymd(now),'Hoy'); }
        else if(k==='semana'){ var a=new Date(now); a.setDate(a.getDate()-6); setDateFilter(ymd(a),ymd(now),'Últimos 7 días'); }
        else if(k==='mes'){ var fr=new Date(now.getFullYear(),now.getMonth(),1), ls=new Date(now.getFullYear(),now.getMonth()+1,0); setDateFilter(ymd(fr),ymd(ls),'Este mes'); }
        else { setDateFilter('','',''); }
        m.close();
      });
    });
  }

  /* ── Notificaciones (campana + auditoría, patrón CajaVenta) ── */
  var NOTIF = { lastCheck: localStorage.getItem('inv.notifLastCheck')||'', count:0, open:false, poll:null };
  var NOTIF_COLOR = {
    crear:        {dot:'#64748b', bg:'#f1f5f9', color:'#475569', label:'Creó'},
    autorizar:    {dot:'#6366f1', bg:'#eef2ff', color:'#4338ca', label:'Autorizó'},
    cargar_sap:   {dot:'#2563eb', bg:'#dbeafe', color:'#1d4ed8', label:'Cargó a SAP'},
    dar_baja:     {dot:'#16a34a', bg:'#dcfce7', color:'#15803d', label:'Dio de baja'},
    terminar:     {dot:'#16a34a', bg:'#dcfce7', color:'#15803d', label:'Terminado'},
    editar:       {dot:'#d97706', bg:'#fef3c7', color:'#b45309', label:'Editó'},
    asignar_ceco: {dot:'#7c3aed', bg:'#f3e8ff', color:'#6d28d9', label:'Asignó CECO'},
    eliminar_item:{dot:'#dc2626', bg:'#fee2e2', color:'#b91c1c', label:'Eliminó'},
    eliminar:     {dot:'#dc2626', bg:'#fee2e2', color:'#b91c1c', label:'Eliminó doc'},
    anular:       {dot:'#dc2626', bg:'#fee2e2', color:'#b91c1c', label:'Anuló'}
  };
  function timeAgo(iso){ if(!iso) return ''; var s=Math.floor((Date.now()-new Date(iso).getTime())/1000); if(s<60) return 'hace un momento'; var m=Math.floor(s/60); if(m<60) return 'hace '+m+' min'; var h=Math.floor(m/60); if(h<24) return 'hace '+h+' h'; var d=Math.floor(h/24); return 'hace '+d+' día'+(d>1?'s':''); }
  function notifBeep(){ try{ var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; var ac=new AC(); var o=ac.createOscillator(), g=ac.createGain(); o.type='sine'; o.frequency.value=880; g.gain.value=0.05; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime+0.25); o.stop(ac.currentTime+0.27); }catch(_){}}
  function notifItemHTML(r){
    var c=NOTIF_COLOR[r.accion]||{dot:'#94a3b8',bg:'#f1f5f9',color:'#475569',label:(ACC_LABEL[r.accion]||r.accion)};
    var main = r.detalle ? esc(r.detalle) : esc(c.label);
    return '<div class="notif-item"><span class="notif-dot" style="background:'+c.dot+'"></span>'+
      '<div class="notif-item__body"><div class="notif-item__txt"><b>'+esc(r.usuario||'Sistema')+'</b> '+main+'</div>'+
      '<div class="notif-meta"><span class="notif-tag" style="background:'+c.bg+';color:'+c.color+'">'+esc(c.label)+'</span>'+
      '<span class="notif-time">'+timeAgo(r.created_at)+'</span></div></div></div>';
  }
  function toggleNotif(){
    var dd=q('#notifDD'); if(!dd) return;
    if(NOTIF.open){ dd.classList.remove('is-open'); NOTIF.open=false; return; }
    dd.classList.add('is-open'); NOTIF.open=true;
    NOTIF.count=0; var b=q('#notifBadge'); if(b){ b.hidden=true; b.textContent='0'; }
    NOTIF.lastCheck=new Date().toISOString(); localStorage.setItem('inv.notifLastCheck',NOTIF.lastCheck);
    var body=q('#notifBody'); if(!body) return;
    body.innerHTML='<div class="notif-empty">Cargando…</div>';
    API.listAuditoria().then(function(list){
      var items=(list||[]).slice(0,20);
      body.innerHTML = items.length ? items.map(notifItemHTML).join('') : '<div class="notif-empty">Sin actividad reciente</div>';
    }).catch(function(){ body.innerHTML='<div class="notif-empty">Error al cargar</div>'; });
  }
  function pollNotif(){
    function check(){
      API.listAuditoria().then(function(list){
        list=list||[];
        if(!NOTIF.lastCheck){ NOTIF.lastCheck=new Date().toISOString(); localStorage.setItem('inv.notifLastCheck',NOTIF.lastCheck); return; }
        var nuevos=list.filter(function(a){ return a.created_at && a.created_at>NOTIF.lastCheck; }).length;
        if(nuevos>NOTIF.count){ if(!NOTIF.open) notifBeep(); NOTIF.count=nuevos; var b=q('#notifBadge'); if(b){ b.textContent=nuevos>9?'9+':String(nuevos); b.hidden=false; } }
      }).catch(function(){});
    }
    check();
    if(!NOTIF.poll) NOTIF.poll=setInterval(function(){ if(!document.hidden) check(); }, 15000);
  }
  function initNotifications(){
    var btn=q('#btnNotif'); if(btn) btn.addEventListener('click',function(e){ e.stopPropagation(); toggleNotif(); });
    document.addEventListener('click',function(e){ if(NOTIF.open && !e.target.closest('#notifDD') && !e.target.closest('#btnNotif')) toggleNotif(); });
    pollNotif();
  }

  /* ── SSO gate ─────────────────────────────────────────────── */
  function hideLoader(){ var l=q('#loader'); if(l) l.classList.add('loader--hidden'); if(window.ALASTransition) window.ALASTransition.enterProject(); }

  // Bypass de PREVISUALIZACIÓN: solo en localhost / file:// para poder ver la UI sin el Launcher.
  function isLocalPreview(){
    var h=location.hostname;
    return location.protocol==='file:' || h==='localhost' || h==='127.0.0.1' || h==='' || h==='0.0.0.0';
  }
  function installDemoSession(){
    window.AlasAuthClient={ isAuthenticated:true, user:{ name:'Vista Local', role:'operador' },
      getCurrentUser:function(){ return 'Vista Local'; }, getRole:function(){ return 'operador'; },
      hasPermission:function(){ return true; }, logout:function(){ window.location.replace(LAUNCHER_URL); } };
    console.info('[Inventario] localhost → sesión demo de previsualización (sin SSO).');
  }

  function waitForAlasAuth(){
    var ready=window.__alasAuthReady||Promise.resolve();
    ready.then(function(){
      var a=window.AlasAuthClient;
      if(a&&a.isAuthenticated){ startApp(); }
      else if(isLocalPreview()){ installDemoSession(); startApp(); }
      else { console.warn('[Inventario] Sin sesión SSO. Redirigiendo al launcher…'); window.location.replace(LAUNCHER_URL); }
    });
    setTimeout(function(){ if(!window._invStarted){
      if(window.AlasAuthClient&&window.AlasAuthClient.isAuthenticated) startApp();
      else if(isLocalPreview()){ installDemoSession(); startApp(); }
      else window.location.replace(LAUNCHER_URL);
    } },10000);
  }

  function startApp(){
    if(window._invStarted) return; window._invStarted=true;
    // Chip usuario + sync
    var u=window.AlasAuthClient;
    var ROLE_LABEL={ admin:'Administrador', supervisor:'Supervisor', operador:'Operador', invitado:'Invitado' };
    var nm=q('#sidebarUserName'), rl=q('#sidebarUserRole');
    if(nm) nm.textContent=(u&&u.getCurrentUser&&u.getCurrentUser())||'Operador';
    if(rl){ var urole=(u&&u.getRole&&u.getRole())||''; rl.textContent=ROLE_LABEL[urole]||urole||''; }
    var sync=q('#syncChip');
    if(sync){ if(API.isRemote){ sync.style.display='none'; } else { sync.textContent='Modo demo (local)'; sync.classList.add('demo'); } }

    wireSidebar(); wireSearch(); initNotifications();
    q('#btnVolver').addEventListener('click',function(e){ if(window.alasGoToLauncher) window.alasGoToLauncher(e); });

    // Cargar catálogos y arrancar
    API.listCasos().then(function(cs){
      state.casos=cs||[]; state.mercaderias=[];
      hideLoader(); go('menu');
    }).catch(function(e){ console.error(e); state.mercaderias=[]; hideLoader(); go('menu'); });
  }

  /* ── Navegación ───────────────────────────────────────────── */
  function wireSidebar(){
    document.querySelectorAll('.sidebar-icon[data-view]').forEach(function(btn){
      btn.addEventListener('click',function(){ go(btn.getAttribute('data-view')); });
    });
  }
  function setActive(view){ document.querySelectorAll('.sidebar-icon[data-view]').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-view')===view); }); }
  function setBreadcrumb(parts){
    var bc=q('#breadcrumb'); if(!bc) return;
    bc.innerHTML = parts.map(function(p,i){ return (i?'<span class="sep">›</span>':'')+'<span>'+esc(p)+'</span>'; }).join('');
  }
  function wireSearch(){
    var inp=q('#searchInput');
    inp.addEventListener('input',function(){ state.search=inp.value.trim().toLowerCase(); if(typeof state._reRender==='function') state._reRender(); });
  }
  function resetSearch(ph){ state.search=''; var inp=q('#searchInput'); if(inp){ inp.value=''; inp.placeholder=ph||'Buscar…'; } state._reRender=null; }
  function toggleSearch(show){ var s=document.querySelector('.stage__search'); if(s) s.style.display=show?'':'none'; }
  function greeting(){ var h=new Date().getHours(); return h<12?'Buenos días':(h<19?'Buenas tardes':'Buenas noches'); }
  function countUp(el,to){ if(!el) return; to=+to||0; var dur=650,t0=performance.now();
    (function tick(now){ var p=Math.min(1,(now-t0)/dur); el.textContent=Math.round(to*(1-Math.pow(1-p,3))); if(p<1) requestAnimationFrame(tick); })(t0); }
  function staggerIn(els, base, step){ base=base||0; step=step||65;
    Array.prototype.forEach.call(els,function(el,i){
      el.classList.add('anim-in'); el.style.animationDelay=(base+i*step)+'ms';
      el.addEventListener('animationend',function(){ el.classList.remove('anim-in'); el.style.animation=''; el.style.opacity=''; el.style.animationDelay=''; },{once:true});
    });
  }

  function go(view, sectorKey){
    state.view=view;
    toggleSearch(view!=='menu');
    if(view==='menu'){ setActive('menu'); resetSearch('Buscar MENU'); setBreadcrumb(['MENU']); renderMenu(); return; }
    if(view==='uso-interno'){ setActive('uso-interno'); wizardNuevo(); setActive(state.sector?'menu':'menu'); return; }
    if(view==='pendientes'){ setActive('pendientes'); resetSearch('Buscar PENDIENTES'); setBreadcrumb(['MENU','PENDIENTES']); renderLista({ estado:'pendientes' }, 'Pendientes'); return; }
    if(view==='terminados'){ setActive('terminados'); resetSearch('Buscar TERMINADOS'); setBreadcrumb(['MENU','TERMINADOS']); renderLista({ estado:'terminados' }, 'Terminados'); return; }
    if(view==='porbaja'){ renderPorBaja(); return; }
    if(view==='resumen'){ renderResumen(); return; }
    if(view==='auditoria'){ setActive('auditoria'); resetSearch('Buscar AUDITORÍA'); setBreadcrumb(['MENU','AUDITORÍA']); renderAuditoria(); return; }
    if(view==='sector'){ setActive('menu'); state.sector=sectorKey; var label=(SECTOR_CARDS.find(function(s){return s.key===sectorKey;})||{}).label||sectorKey; resetSearch('Buscar '+label); setBreadcrumb(['MENU',label]); renderLista({ sector:sectorKey }, label); return; }
  }

  /* ── Vista MENU (dashboard minimalista) ───────────────────── */
  var ARROW='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path d="M9 5l7 7-7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ── Colores de sector (paleta dataviz validada · categórica) ── */
  var SECTOR_COLOR = {
    'ALMACENAMIENTO-DEPOSITO':'#2a78d6', 'ALMACENAMIENTO-FABRICA':'#1baf7a',
    'PRODUCCION':'#eda100', 'ADMINISTRACION':'#008300'
  };
  // Imágenes de fondo por sector (colocá estos archivos en la carpeta Inventario/).
  var SECTOR_IMG = {
    'ALMACENAMIENTO-DEPOSITO':'/sec-deposito.jpg', 'ALMACENAMIENTO-FABRICA':'/sec-fabrica.jpg',
    'PRODUCCION':'/sec-produccion.jpg', 'ADMINISTRACION':'/sec-administracion.jpg'
  };

  /* ── Tooltip compartido de gráficos ──────────────────────── */
  function chartTipEl(){ var t=q('#chartTip'); if(!t){ t=document.createElement('div'); t.id='chartTip'; t.className='chart-tip'; document.body.appendChild(t); } return t; }
  function wireChartTips(root){
    root.querySelectorAll('[data-tip]').forEach(function(el){
      el.addEventListener('mousemove',function(e){ var t=chartTipEl(); t.innerHTML=el.getAttribute('data-tip'); t.style.opacity='1';
        var x=e.clientX+14; if(x+t.offsetWidth+8>window.innerWidth) x=e.clientX-14-t.offsetWidth; t.style.left=x+'px'; t.style.top=(e.clientY+14)+'px'; });
      el.addEventListener('mouseleave',function(){ chartTipEl().style.opacity='0'; });
    });
  }

  /* ── Animación GSAP de los gráficos (reveal PRO) ─────────── */
  function animateCharts(root){
    if(!window.gsap) return;
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var g=window.gsap;
    g.from(root.querySelectorAll('.stat-tile'), { y:16, opacity:0, duration:.5, stagger:.06, ease:'power2.out', overwrite:'auto' });
    g.from(root.querySelectorAll('.ct2-col .ct-stack'), { scaleY:0, transformOrigin:'50% 100%', duration:.6, stagger:.02, ease:'back.out(1.4)', delay:.08, overwrite:'auto', clearProps:'transform' });
    g.from(root.querySelectorAll('.hbar-fill'), { scaleX:0, transformOrigin:'0% 50%', duration:.75, stagger:.06, ease:'power3.out', delay:.15, overwrite:'auto', clearProps:'transform' });
    g.from(root.querySelectorAll('.estado-seg'), { scaleX:0, transformOrigin:'0% 50%', duration:.75, stagger:.08, ease:'power3.out', delay:.18, overwrite:'auto', clearProps:'transform' });
    g.from(root.querySelectorAll('.ct-leg, .estado-leg'), { opacity:0, y:6, duration:.4, stagger:.04, ease:'power2.out', delay:.32, overwrite:'auto' });
    // Modo Anillos
    g.from(root.querySelectorAll('.donut'), { rotation:-90, scale:.85, opacity:0, transformOrigin:'50% 50%', duration:.7, stagger:.12, ease:'power3.out', overwrite:'auto' });
    root.querySelectorAll('.ar-line').forEach(function(p){ if(p.getTotalLength){ var L=p.getTotalLength(); g.set(p,{strokeDasharray:L, strokeDashoffset:L}); g.to(p,{strokeDashoffset:0, duration:1.1, ease:'power2.out'}); } });
    g.from(root.querySelectorAll('.ar-area'), { opacity:0, duration:.9, delay:.15, overwrite:'auto' });
    g.from(root.querySelectorAll('.ar-dot'), { scale:0, transformOrigin:'50% 50%', stagger:.03, duration:.4, ease:'back.out(2)', delay:.5, overwrite:'auto' });
    g.from(root.querySelectorAll('.rank-row'), { x:-16, opacity:0, stagger:.06, duration:.5, ease:'power2.out', overwrite:'auto' });
    g.from(root.querySelectorAll('.rank-fill'), { scaleX:0, transformOrigin:'0% 50%', stagger:.06, duration:.7, ease:'power3.out', delay:.15, overwrite:'auto', clearProps:'transform' });
  }

  /* ── Animación GSAP del menú (KPIs + sectores) ───────────── */
  function animateMenu(root){
    var host=root.querySelector('#d_sectores');
    if(!window.gsap || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
      staggerIn(root.querySelectorAll('.dash-kpis .kpi'), 30, 55);
      if(host) staggerIn(host.querySelectorAll('.sector-card'), 140, 55);
      return;
    }
    var g=window.gsap;
    var cards=host?host.querySelectorAll('.sector-card'):[];
    // Minimalista: fade suave con leve desplazamiento, sin giros ni rebotes.
    var tl=g.timeline({ defaults:{ ease:'power2.out', overwrite:'auto' } });
    tl.from(root.querySelectorAll('.dash-hero > *'), { y:12, opacity:0, duration:.5, stagger:.06 }, 0);
    tl.from(root.querySelectorAll('.dash-kpis .kpi'), { y:14, opacity:0, duration:.5, stagger:.06, clearProps:'transform,opacity' }, .1);
    tl.from(root.querySelectorAll('.dash-section__head'), { y:10, opacity:0, duration:.45 }, .26);
    tl.from(cards, { y:16, opacity:0, duration:.5, stagger:.06, clearProps:'transform,opacity' }, .3);
  }

  /* ── Animación GSAP de la tabla (sectores / listas) ──────── */
  function animateTable(host){
    var g=window.gsap, tbl=host && host.querySelector('.inv-table');
    if(!g || !tbl) return;
    g.from(tbl.querySelectorAll('thead th'), { y:-10, opacity:0, duration:.4, stagger:.015, ease:'power2.out', overwrite:'auto', clearProps:'transform,opacity' });
    var heads=tbl.querySelectorAll('tbody tr.row-date .row-date__inner');
    g.from(heads, { x:-14, opacity:0, duration:.45, stagger:{ amount:Math.min(.35, heads.length*0.03) }, ease:'power2.out', delay:.04, overwrite:'auto', clearProps:'transform,opacity' });
    // Solo animar filas VISIBLES (grupo abierto) — evita animar cientos de <tr> ocultos y la traba.
    var vis=tbl.querySelectorAll('tbody tr:not(.row-date):not(.is-collapsed)');
    if(vis.length) g.from(vis, { y:12, opacity:0, duration:.42, stagger:{ amount:Math.min(.45, vis.length*0.012) }, ease:'power2.out', delay:.08, overwrite:'auto', clearProps:'transform,opacity' });
  }

  /* ── Animación GSAP de la barra de herramientas / cabecera ── */
  function animateToolbar(root){
    if(!window.gsap || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var g=window.gsap;
    g.from(root.querySelectorAll('.list-toolbar > *'), { y:-12, opacity:0, duration:.45, stagger:.08, ease:'power2.out', overwrite:'auto', clearProps:'transform,opacity' });
    g.from(root.querySelectorAll('.sector-chips .sector-chip'), { y:10, opacity:0, scale:.9, duration:.4, stagger:.04, ease:'back.out(1.6)', delay:.15, overwrite:'auto', clearProps:'transform,opacity' });
  }

  /* ── Agregaciones para gráficos ──────────────────────────── */
  function lastNDates(n){ var out=[], d=new Date(); d.setHours(0,0,0,0); for(var i=n-1;i>=0;i--){ var x=new Date(d); x.setDate(d.getDate()-i); out.push(ymd(x)); } return out; }
  function aggByDates(usos, dates){
    var map={}; dates.forEach(function(dt){ map[dt]={date:dt,seg:{},total:0}; });
    usos.forEach(function(u){ if(u.estado==='anulado') return; var dt=String(u.fecha_emision).slice(0,10); if(!map[dt]) return; map[dt].seg[u.sector]=(map[dt].seg[u.sector]||0)+1; map[dt].total++; });
    return dates.map(function(dt){ return map[dt]; });
  }
  function monthDates(m){ var y=+m.split('-')[0], mo=+m.split('-')[1], last=new Date(y,mo,0).getDate(), out=[]; for(var d=1;d<=last;d++) out.push(y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0')); return out; }
  function aggByDay(usos, n){ return aggByDates(usos, lastNDates(n)); }
  function aggByMonth(usos){
    var minM=null, maxM=null;
    usos.forEach(function(u){ if(u.estado==='anulado') return; var m=String(u.fecha_emision).slice(0,7); if(m.length!==7) return; if(!minM||m<minM)minM=m; if(!maxM||m>maxM)maxM=m; });
    if(!minM){ var now=new Date(); minM=maxM=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0'); }
    var y=+minM.slice(0,4), mo=+minM.slice(5,7), ey=+maxM.slice(0,4), emo=+maxM.slice(5,7);
    var order=[], map={};
    while(y<ey || (y===ey && mo<=emo)){
      var key=y+'-'+String(mo).padStart(2,'0');
      map[key]={ date:key+'-01', label:(MESES[mo-1]||'').slice(0,3), tip:(MESES[mo-1]||'')+' '+y, seg:{}, total:0 };
      order.push(key); mo++; if(mo>12){ mo=1; y++; }
    }
    usos.forEach(function(u){ if(u.estado==='anulado') return; var m=String(u.fecha_emision).slice(0,7); if(!map[m]) return; map[m].seg[u.sector]=(map[m].seg[u.sector]||0)+1; map[m].total++; });
    return order.map(function(k){ return map[k]; });
  }
  function aggTopItems(usos, n){
    var m={};
    usos.forEach(function(u){ if(u.estado==='anulado') return; (u.items||[]).forEach(function(it){ var k=it.cod_mercaderia||'—'; if(!m[k]) m[k]={cod:k,desc:it.descripcion||'',qty:0}; m[k].qty+=Number(it.cantidad)||0; }); });
    return Object.keys(m).map(function(k){return m[k];}).sort(function(a,b){return b.qty-a.qty;}).slice(0,n);
  }

  /* ── Chart: usos por fecha (barras apiladas + eje Y) ─────── */
  function chartTimeHTML(days){
    var maxT=Math.max.apply(null, days.map(function(d){return d.total;}).concat([1]));
    var ticks=[maxT]; var mid=Math.round(maxT/2); if(mid>0&&mid<maxT) ticks.push(mid); ticks.push(0);
    var grid=ticks.map(function(v){ return '<div class="ct2-line" style="top:'+((1-v/maxT)*100)+'%"><span class="ct2-tick">'+v+'</span></div>'; }).join('');
    var every=Math.ceil(days.length/8), bars='', xax='';
    days.forEach(function(d,i){
      var stackPct=d.total?(d.total/maxT*100):0, segs='';
      SECTOR_CARDS.forEach(function(s){ var c=d.seg[s.key]||0; if(!c) return; segs+='<div class="ct-seg" style="height:'+(c/d.total*100)+'%;background:'+SECTOR_COLOR[s.key]+'"></div>'; });
      var brk=d.total? SECTOR_CARDS.filter(function(s){return d.seg[s.key];}).map(function(s){ return '<span style=\'color:'+SECTOR_COLOR[s.key]+'\'>&#9632;</span> '+esc(s.label)+': '+d.seg[s.key]; }).join('<br>')+'<br><b>Total: '+d.total+'</b>':'Sin usos';
      var tip=('<b>'+esc(fmtFecha(d.date))+'</b><br>'+brk).replace(/"/g,'&quot;');
      bars+='<div class="ct2-col" data-tip="'+tip+'"><div class="ct-stack" style="height:'+stackPct+'%">'+segs+'</div></div>';
      xax+='<div class="ct2-x">'+((i%every===0||i===days.length-1)?fmtFecha(d.date).slice(0,5):'')+'</div>';
    });
    var legend=SECTOR_CARDS.map(function(s){ return '<span class="ct-leg"><span class="ct-leg__dot" style="background:'+SECTOR_COLOR[s.key]+'"></span>'+esc(s.label)+'</span>'; }).join('');
    return '<div class="ct2"><div class="ct2-plot"><div class="ct2-grid">'+grid+'</div><div class="ct2-bars">'+bars+'</div></div><div class="ct2-xaxis">'+xax+'</div></div><div class="ct-legend">'+legend+'</div>';
  }

  /* ── Chart: estado de líneas SAP (barra apilada %) ───────── */
  function chartEstadoHTML(usos){
    var c={pendiente:0,cargado:0,baja:0}, total=0;
    usos.forEach(function(u){ if(u.estado==='anulado') return; (u.items||[]).forEach(function(it){ if(c[it.sap_estado]!=null){ c[it.sap_estado]++; total++; } }); });
    var defs=[{k:'pendiente',lbl:'Pendiente',col:'#d97706'},{k:'cargado',lbl:'Cargado a SAP',col:'#2a78d6'},{k:'baja',lbl:'Baja',col:'#16a34a'}];
    if(!total) return '<div class="chart-empty">Sin líneas aún</div>';
    var seg=defs.map(function(d){ var p=c[d.k]/total*100; if(p<=0) return ''; var tip=('<b>'+d.lbl+'</b><br>'+c[d.k]+' línea(s) · '+Math.round(p)+'%').replace(/"/g,'&quot;'); return '<div class="estado-seg" data-tip="'+tip+'" style="width:'+p+'%;background:'+d.col+'"></div>'; }).join('');
    var legend=defs.map(function(d){ return '<div class="estado-leg"><span class="estado-leg__dot" style="background:'+d.col+'"></span><span class="estado-leg__lbl">'+d.lbl+'</span><span class="estado-leg__val">'+c[d.k]+'</span></div>'; }).join('');
    return '<div class="estado-bar">'+seg+'</div><div class="estado-legend">'+legend+'</div>';
  }

  /* ── Alt: área/línea de usos por fecha ───────────────────── */
  function chartAreaHTML(days){
    var W=600,H=180,padL=26,padR=8,padT=12,padB=24, iw=W-padL-padR, ih=H-padT-padB, n=days.length;
    var maxT=Math.max.apply(null,days.map(function(d){return d.total;}).concat([1]));
    function xs(i){ return padL+(n<=1?iw/2:(i/(n-1))*iw); }
    function ys(v){ return padT+(1-v/maxT)*ih; }
    var pts=days.map(function(d,i){ return [xs(i),ys(d.total)]; });
    var line=pts.map(function(p,i){ return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1); }).join(' ');
    var area=line+' L '+xs(n-1).toFixed(1)+' '+(padT+ih)+' L '+xs(0).toFixed(1)+' '+(padT+ih)+' Z';
    var ticks=[maxT,Math.round(maxT/2),0].filter(function(v,i,a){return a.indexOf(v)===i;});
    var grid=ticks.map(function(v){ var y=ys(v); return '<line x1="'+padL+'" x2="'+(W-padR)+'" y1="'+y+'" y2="'+y+'" class="ar-grid"/><text x="'+(padL-6)+'" y="'+(y+3)+'" text-anchor="end" class="ar-tick">'+v+'</text>'; }).join('');
    var dots=pts.map(function(p,i){ return '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.6" class="ar-dot" data-tip="'+('<b>'+esc(days[i].tip||fmtFecha(days[i].date))+'</b><br>'+days[i].total+' uso(s)').replace(/"/g,'&quot;')+'"/>'; }).join('');
    var xl=days.map(function(d,i){ return (i%Math.ceil(n/7)===0||i===n-1)?'<text x="'+xs(i).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" class="ar-x">'+(d.label||fmtFecha(d.date).slice(0,5))+'</text>':''; }).join('');
    return '<svg class="areachart" viewBox="0 0 '+W+' '+H+'"><defs><linearGradient id="arGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a78d6" stop-opacity=".26"/><stop offset="1" stop-color="#2a78d6" stop-opacity="0"/></linearGradient></defs>'+grid+'<path d="'+area+'" class="ar-area" fill="url(#arGrad)"/><path d="'+line+'" class="ar-line" fill="none" stroke="#2a78d6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'+dots+xl+'</svg>';
  }

  /* ── Alt: donut ──────────────────────────────────────────── */
  function svgDonut(segs, centerV, centerS){
    var total=segs.reduce(function(a,s){return a+s.value;},0);
    var size=160, sw=22, R=(size-sw)/2-2, cx=size/2, cy=size/2, C=2*Math.PI*R, acc=0;
    var arcs=total? segs.filter(function(s){return s.value>0;}).map(function(s){
      var len=s.value/total*C, gap=2, dash=(len-gap)+' '+(C-len+gap), rot=(acc/total)*360-90; acc+=s.value;
      var tip=('<b>'+esc(s.label)+'</b><br>'+s.value+' · '+Math.round(s.value/total*100)+'%').replace(/"/g,'&quot;');
      return '<circle class="donut-arc" cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="none" stroke="'+s.color+'" stroke-width="'+sw+'" stroke-dasharray="'+dash+'" transform="rotate('+rot+' '+cx+' '+cy+')" data-tip="'+tip+'"/>';
    }).join('') : '';
    return '<div class="donut-wrap"><svg class="donut" viewBox="0 0 '+size+' '+size+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="none" stroke="#eef2f7" stroke-width="'+sw+'"/>'+arcs+
      '<text x="'+cx+'" y="'+(cy-3)+'" text-anchor="middle" class="donut-v">'+esc(centerV)+'</text>'+
      '<text x="'+cx+'" y="'+(cy+15)+'" text-anchor="middle" class="donut-s">'+esc(centerS)+'</text></svg>'+
      '<div class="donut-legend">'+segs.map(function(s){ return '<div class="dl-row"><span class="dl-dot" style="background:'+s.color+'"></span><span class="dl-lbl">'+esc(s.label)+'</span><span class="dl-val">'+s.value+'</span></div>'; }).join('')+'</div></div>';
  }

  /* ── Alt: ranking de ítems ───────────────────────────────── */
  function chartRankHTML(items){
    if(!items.length) return '<div class="chart-empty">Sin datos aún</div>';
    var max=Math.max.apply(null, items.map(function(it){return it.qty;}).concat([1]));
    return '<div class="rank-list">'+items.map(function(it,i){
      var tip=('<b>'+esc(it.cod)+'</b><br>'+esc(it.desc)+'<br>Cantidad: '+it.qty).replace(/"/g,'&quot;');
      return '<div class="rank-row" data-tip="'+tip+'"><span class="rank-num'+(i<3?' rank-num--top':'')+'">'+(i+1)+'</span>'+
        '<div class="rank-body"><div class="rank-name">'+esc(it.desc||it.cod)+'</div>'+
        '<div class="rank-track"><div class="rank-fill" style="width:'+(it.qty/max*100)+'%"></div></div></div>'+
        '<span class="rank-qty">'+it.qty+'</span></div>';
    }).join('')+'</div>';
  }

  /* ── Stat tiles del resumen ──────────────────────────────── */
  function statTilesHTML(usos){
    var act=usos.filter(function(u){return u.estado!=='anulado';});
    var totalItems=0, totalCant=0;
    act.forEach(function(u){ (u.items||[]).forEach(function(it){ totalItems++; totalCant+=Number(it.cantidad)||0; }); });
    var term=act.filter(function(u){return u.estado==='terminado';}).length;
    var tasa=act.length?Math.round(term/act.length*100):0;
    var tiles=[
      {l:'Usos internos', v:act.length, s:'documentos activos'},
      {l:'Líneas / ítems', v:totalItems, s:'mercaderías'},
      {l:'Cantidad total', v:totalCant.toLocaleString('es'), s:'unidades pedidas'},
      {l:'Terminados', v:tasa+'%', s:term+' de '+act.length}
    ];
    return '<div class="stat-tiles">'+tiles.map(function(t){
      return '<div class="stat-tile"><div class="stat-tile__label">'+esc(t.l)+'</div><div class="stat-tile__value">'+esc(t.v)+'</div><div class="stat-tile__sub">'+esc(t.s)+'</div></div>';
    }).join('')+'</div>';
  }

  /* ── Chart: barras horizontales ──────────────────────────── */
  function chartHBarsHTML(rows){
    if(!rows.length) return '<div class="chart-empty">Sin datos aún</div>';
    var max=Math.max.apply(null, rows.map(function(r){return r.value;}).concat([1]));
    return '<div class="hbars">'+rows.map(function(r){
      var pct=r.value>0?Math.max(4, r.value/max*100):0;
      return '<div class="hbar-row"'+(r.tip?' data-tip="'+r.tip.replace(/"/g,'&quot;')+'"':'')+'>'+
        '<div class="hbar-label" title="'+esc(r.label)+'">'+esc(r.label)+'</div>'+
        '<div class="hbar-track"><div class="hbar-fill" style="width:'+pct+'%;background:'+(r.color||'#2a78d6')+'"></div></div>'+
        '<div class="hbar-val">'+esc(r.value)+'</div></div>';
    }).join('')+'</div>';
  }

  function kpiCard(cls, ic, label, valId, foot, goKey){
    var tag=goKey?'button':'div';
    return '<'+tag+' class="kpi '+cls+'"'+(goKey?' data-go="'+goKey+'"':'')+'>'+
      '<span class="kpi__top"><span class="kpi__label">'+label+'</span><span class="kpi__ic">'+ic+'</span></span>'+
      '<span class="kpi__value" id="'+valId+'">0</span>'+
      '<span class="kpi__foot">'+foot+(goKey?' '+ARROW:'')+'</span></'+tag+'>';
  }

  function renderMenu(){
    var root=q('#viewRoot');
    root.innerHTML=
      '<div class="view dash">'+
        '<header class="dash-hero"><h1 class="dash-title">Inventario · Control de Usos Internos</h1>'+
          '<div class="dash-hero__ctl">'+monthNavHTML()+'<button class="dash-cta dash-cta--ghost" id="d_resumen">'+ICONS.chart+' Ver resumen</button></div></header>'+
        '<div class="dash-kpis">'+
          kpiCard('kpi--pend', ICONS.clock, 'Pendientes',       'k_pend',  'En proceso',      'pendientes')+
          kpiCard('kpi--baja', ICONS.sap,   'Para dar de baja', 'k_baja',  'Cargados a SAP',  'porbaja')+
          kpiCard('kpi--term', ICONS.check, 'Terminados',       'k_term',  'Dados de baja',   'terminados')+
          kpiCard('kpi--muted',ICONS.file,  'Total documentos', 'k_total', 'Histórico',       '')+
        '</div>'+
        '<section class="dash-section"><div class="dash-section__head"><span>Sectores</span><span class="hr"></span></div>'+
          '<div class="sector-list" id="d_sectores"></div></section>'+
      '</div>';

    q('#d_resumen').addEventListener('click',function(){ go('resumen'); });
    root.querySelectorAll('.kpi[data-go]').forEach(function(b){ b.addEventListener('click',function(){ go(b.getAttribute('data-go')); }); });

    var host=q('#d_sectores');
    host.innerHTML=SECTOR_CARDS.map(function(s){
      return '<button class="sector-card" data-sec="'+esc(s.key)+'">'+
        '<span class="sector-card__ic">'+ICONS[s.icon]+'</span>'+
        '<span class="sector-card__body"><span class="sector-card__name">'+esc(s.label)+'</span>'+
        '<span class="sector-card__desc">'+esc(SECTOR_DESC[s.key]||'')+'</span></span>'+
        '<span class="sector-card__count-wrap"><span class="sector-card__count" data-c="'+esc(s.key)+'">·</span>'+
        '<span class="sector-card__count-lbl">materiales en curso</span></span>'+
        '<span class="sector-card__arrow">'+ARROW+'</span></button>';
    }).join('');
    host.querySelectorAll('.sector-card').forEach(function(b){ b.addEventListener('click',function(){ go('sector',b.getAttribute('data-sec')); }); });

    animateMenu(root);

    function fillMenu(){
      var usos=(state._menuUsos||[]).filter(inMonth);
      var term=usos.filter(function(u){return u.estado==='terminado';}).length;
      var pend=0, baja=0; usos.forEach(function(u){ if(u.estado==='anulado') return; (u.items||[]).forEach(function(it){ if(it.sap_estado==='pendiente') pend++; else if(it.sap_estado==='cargado') baja++; }); });
      countUp(q('#k_pend'),pend); countUp(q('#k_term'),term); countUp(q('#k_total'),usos.length); countUp(q('#k_baja'),baja);
      SECTOR_CARDS.forEach(function(s){
        var enCurso=0; usos.forEach(function(u){ if(u.sector!==s.key||u.estado==='anulado') return; (u.items||[]).forEach(function(it){ if(it.sap_estado==='pendiente'||it.sap_estado==='cargado') enCurso++; }); });
        countUp(host.querySelector('.sector-card__count[data-c="'+s.key+'"]'), enCurso);
      });
    }
    wireMonthNav(root, fillMenu);
    API.listUsos({}).then(function(usos){ state._menuUsos=usos; fillMenu(); });
  }

  /* ── Vista RESUMEN (gráficos) ─────────────────────────────── */
  function renderResumen(){
    state.view='resumen'; setActive('resumen'); toggleSearch(false); resetSearch(''); setBreadcrumb(['MENU','RESUMEN']);
    var root=q('#viewRoot');
    root.innerHTML='<div class="view">'+
      '<div class="list-toolbar list-toolbar--3">'+
        '<div class="lt-left"><button class="btn btn--secondary" id="btnVolverMenu">'+ICONS.back+' Volver al menú</button></div>'+
        '<div class="lt-center"><span class="lt-center__ic">'+ICONS.chart+'</span><span class="lt-center__title">Resumen</span></div>'+
        '<div class="lt-right">'+monthNavHTML()+'</div>'+
      '</div>'+
      '<div class="dash" style="margin-top:2px"><div id="resumenBody"></div></div></div>';
    q('#btnVolverMenu').addEventListener('click',function(){ go('menu'); });

    function panel(title, sub, inner, wide){ return '<div class="panel'+(wide?' panel--wide':'')+'"><div class="panel__head"><span class="panel__title">'+title+'</span>'+(sub?'<span class="panel__sub">'+sub+'</span>':'')+'</div><div class="panel__body">'+inner+'</div></div>'; }

    function fillResumen(){
      var usos=(state._menuUsos||[]).filter(inMonth);
      var tot=usos.filter(function(u){return u.estado!=='anulado';}).length;
      var months = aggByMonth(state._menuUsos||[]);
      var _yrs={}; (state._menuUsos||[]).forEach(function(u){ if(u.estado!=='anulado') _yrs[String(u.fecha_emision).slice(0,4)]=1; });
      var _yl=Object.keys(_yrs).sort(); var timeSub=_yl.length?(_yl.length>1?_yl[0]+'–'+_yl[_yl.length-1]:_yl[0]):'';
      var sectorRows=SECTOR_CARDS.map(function(s){ var c=usos.filter(function(u){return u.sector===s.key&&u.estado!=='anulado';}).length; return {label:s.label,value:c,color:SECTOR_COLOR[s.key]}; });
      var ec={pendiente:0,cargado:0,baja:0}; usos.forEach(function(u){ if(u.estado==='anulado')return; (u.items||[]).forEach(function(it){ if(ec[it.sap_estado]!=null) ec[it.sap_estado]++; }); });
      var estadoSegs=[{label:'Pendiente',value:ec.pendiente,color:'#d97706'},{label:'Cargado',value:ec.cargado,color:'#2a78d6'},{label:'Baja',value:ec.baja,color:'#16a34a'}];
      var estadoTotal=ec.pendiente+ec.cargado+ec.baja;
      var top=aggTopItems(usos,7);

      var body=statTilesHTML(usos)+
        panel('Usos internos por mes', timeSub, chartAreaHTML(months), true)+
        '<div class="dash-2col">'+
          panel('Usos por sector','', svgDonut(sectorRows, String(tot), 'usos'))+
          panel('Estado de líneas SAP','', estadoTotal? svgDonut(estadoSegs, String(estadoTotal), 'líneas') : '<div class="chart-empty">Sin líneas aún</div>')+
        '</div>'+
        panel('Ítems más pedidos','ranking por cantidad', chartRankHTML(top), true);
      q('#resumenBody').innerHTML=body;
      wireChartTips(root);
      animateCharts(root);
    }
    wireMonthNav(root, fillResumen);
    API.listUsos({}).then(function(usos){ state._menuUsos=usos; fillResumen(); });
  }

  /* ── Tabla compartida (agrupa por fecha) ──────────────────── */
  function sectorShort(sec){ var c=SECTOR_CARDS.find(function(s){return s.key===sec;}); return c?c.label:sec; }
  function paintTable(host, rows, opts){
    opts=opts||{}; if(!host) return;
    var s=state.search;
    var filtered=rows.filter(function(r){
      if(opts.monthFilter && !inMonth(r.uso)) return false;
      if(!s) return true;
      return (r.it.cod_mercaderia+' '+r.it.descripcion+' '+r.it.uso_texto+' '+r.uso.nro+' '+(r.it.n_reserva||'')+' '+r.uso.sector).toLowerCase().indexOf(s)!==-1;
    });
    if(!filtered.length){
      host.innerHTML='<div class="empty-state"><div class="empty-state__icon">'+ICONS.file+'</div><div class="empty-state__title">Sin registros</div><p class="empty-state__text">'+(opts.emptyText||('No hay usos internos'+(s?' que coincidan con la búsqueda':(state.menuMonth?' en '+monthLabel(state.menuMonth):' en esta vista'))))+'.</p></div>';
      return;
    }
    var groups={}, order=[];
    filtered.forEach(function(r){ var f=r.uso.fecha_emision; if(!groups[f]){ groups[f]=[]; order.push(f); } groups[f].push(r); });
    order.sort(function(a,b){ return String(b).localeCompare(String(a)); });
    // Fechas desplegables: hoy abierta, resto cerrado. Se resetea al cambiar de vista/mes.
    var sig=(opts.sig||'')+'|'+(state.menuMonth||'all');
    if(state._tableSig!==sig || !state._openDates){ state._tableSig=sig; state._openDates={}; var _today=ymd(new Date()); var _def=order.indexOf(_today)>=0?_today:order[0]; if(_def) state._openDates[_def]=true; }
    var openAll=!!s; // al buscar, mostrar todos los grupos
    function isOpen(f){ return openAll || !!state._openDates[f]; }
    var colspan=(opts.showSector?13:12), animate=!state.search, ri=0, sel={};
    var reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var useGsap=animate && !!window.gsap && !reduce;
    var cssAnim=animate && !useGsap;
    function moAttr(base){ if(cssAnim){ var d=Math.min(ri++,18)*30; return ' class="'+(base?base+' ':'')+'mo-row" style="animation-delay:'+d+'ms"'; } return (base?' class="'+base+'"':''); }
    var body='';
    order.forEach(function(f){
      var open=isOpen(f);
      var hasCargado=groups[f].some(function(r){return r.it.sap_estado==='cargado';});
      var hasPend=groups[f].some(function(r){return r.it.sap_estado==='pendiente';});
      body+='<tr class="row-date'+(open?' is-open':'')+'" data-toggle="'+esc(f)+'"><td colspan="'+colspan+'"><div class="row-date__inner"><span class="row-date__chev">'+ICONS.chevron+'</span><span class="cal-ic">'+ICONS.calendar+'</span>'+esc(fmtFecha(f))+'<span class="date-count">'+groups[f].length+'</span><button class="date-report-btn" data-date="'+esc(f)+'">'+ICONS.file+' Ver reporte</button>'+(hasPend?'<button class="date-ceco-btn" data-ceco-date="'+esc(f)+'">'+ICONS.tag+' Asignar CECO</button>':'')+(hasCargado?'<button class="date-baja-btn" data-baja-date="'+esc(f)+'">'+ICONS.check+' Dar de baja</button>':'')+'</div></td></tr>';
      groups[f].forEach(function(r){
        var it=r.it, u=r.uso, hl=(state._highlightUso&&u.id===state._highlightUso);
        var rcls=(open?'':'is-collapsed')+((cssAnim&&open)?' mo-row':'');
        var rst=(cssAnim&&open)?' style="animation-delay:'+(Math.min(ri++,18)*30)+'ms"':'';
        var chk = (it.sap_estado==='pendiente'||it.sap_estado==='cargado') ? '<input type="checkbox" class="baja-check" data-baja-item="'+it.id+'" data-baja-uso="'+u.id+'" data-estado="'+it.sap_estado+'" aria-label="Seleccionar">' : '';
        body+='<tr class="'+rcls+'"'+rst+(hl?' data-hl="1"':'')+' data-group="'+esc(f)+'" data-d="'+esc(f)+'" data-row-item="'+it.id+'">'+
          '<td class="cell-check">'+chk+'</td>'+
          '<td class="cell-cod">'+esc(it.cod_mercaderia)+'</td>'+
          (opts.showSector?'<td><span class="sector-tag">'+esc(sectorShort(u.sector))+'</span></td>':'')+
          '<td class="cell-desc"><div class="truncate" title="'+esc(it.descripcion)+'">'+esc(it.descripcion)+'</div></td>'+
          '<td class="cell-num">'+esc(it.cantidad)+'</td>'+
          '<td class="cell-muted">'+esc(it.um)+'</td>'+
          '<td><div class="truncate" title="'+esc(it.uso_texto)+'">'+esc(it.uso_texto||'—')+'</div></td>'+
          '<td class="cell-muted">'+esc(it.cuenta_mayor||'—')+'</td>'+
          '<td class="cell-muted">'+esc(it.ceco||'—')+'</td>'+
          '<td class="cell-muted">'+esc(it.orden||'—')+'</td>'+
          '<td class="cell-muted">'+(it.n_reserva?'<b>'+esc(it.n_reserva)+'</b>':'—')+'</td>'+
          '<td class="cell-sap">'+sapBadge(it.sap_estado)+'</td>'+
          '<td><div class="row-actions">'+rowActions(u,it)+'</div></td>'+
        '</tr>';
      });
    });
    host.innerHTML=
      '<div class="bulk-bar" id="bulkBar" hidden><div class="bulk-bar__info"><span class="bulk-count">0</span> línea(s) seleccionada(s)</div>'+
        '<div class="bulk-bar__actions"><button class="btn btn--ghost" id="bulkClear">Deseleccionar</button><button class="btn btn--primary" id="bulkCeco" hidden>'+ICONS.tag+' Asignar CECO</button><button class="btn btn--success" id="bulkBaja" hidden>'+ICONS.check+' Dar de baja</button></div></div>'+
      '<div class="table-wrap"><table class="inv-table"><thead><tr>'+
      '<th class="th-check"></th><th>Código</th>'+(opts.showSector?'<th>Sector</th>':'')+'<th>Descripción</th><th>Cant</th><th>UM</th><th>Uso</th>'+
      '<th>Cuenta Mayor</th><th>CECO</th><th>Orden</th><th>N.Reserva</th><th>SAP</th><th></th>'+
      '</tr></thead><tbody>'+body+'</tbody></table></div>';
    host.querySelectorAll('[data-act]').forEach(function(btn){
      btn.addEventListener('click',function(){ onAction(btn.getAttribute('data-act'), +btn.getAttribute('data-uso'), +btn.getAttribute('data-item'), btn.closest('tr')); });
    });
    host.querySelectorAll('.date-report-btn').forEach(function(btn){
      btn.addEventListener('click',function(e){ e.stopPropagation(); var d=btn.getAttribute('data-date'); reporteFechaModal(d, groups[d]); });
    });

    // ── Fechas desplegables (acordeón) ──
    host.querySelectorAll('tr.row-date[data-toggle]').forEach(function(h){
      h.addEventListener('click',function(e){
        if(e.target.closest('.date-report-btn')||e.target.closest('.date-baja-btn')||e.target.closest('.date-ceco-btn')) return;
        var f=h.getAttribute('data-toggle'), willOpen=!h.classList.contains('is-open');
        h.classList.toggle('is-open',willOpen);
        if(willOpen) state._openDates[f]=true; else delete state._openDates[f];
        var rws=host.querySelectorAll('tr[data-group="'+f+'"]');
        rws.forEach(function(tr){ tr.classList.toggle('is-collapsed',!willOpen); });
        if(willOpen && window.gsap && !reduce){ window.gsap.from(rws,{ y:10, opacity:0, duration:.38, stagger:{ amount:Math.min(.35, rws.length*0.012) }, ease:'power2.out', overwrite:'auto', clearProps:'transform,opacity' }); }
      });
    });

    // ── Selección múltiple: Asignar CECO (pendientes) + baja en lote (cargados) ──
    function selCounts(){ var p=0,c=0; Object.keys(sel).forEach(function(k){ if(sel[k].estado==='pendiente')p++; else if(sel[k].estado==='cargado')c++; }); return {p:p,c:c}; }
    function updateBulk(){ var n=Object.keys(sel).length; var bar=host.querySelector('#bulkBar'); if(!bar) return; bar.hidden=(n===0); var cc=host.querySelector('.bulk-count'); if(cc) cc.textContent=n;
      var ct=selCounts(); var bc=host.querySelector('#bulkCeco'), bb=host.querySelector('#bulkBaja');
      if(bc){ bc.hidden=ct.p===0; bc.innerHTML=ICONS.tag+' Asignar CECO'+(ct.p?' ('+ct.p+')':''); }
      if(bb){ bb.hidden=ct.c===0; bb.innerHTML=ICONS.check+' Dar de baja'+(ct.c?' ('+ct.c+')':''); } }
    function setSel(cb){ var id=+cb.getAttribute('data-baja-item'), tr=cb.closest('tr'); if(cb.checked){ sel[id]={usoId:+cb.getAttribute('data-baja-uso'), itemId:id, estado:cb.getAttribute('data-estado')}; if(tr) tr.classList.add('is-selected'); } else { delete sel[id]; if(tr) tr.classList.remove('is-selected'); } }
    host.querySelectorAll('.baja-check').forEach(function(cb){ cb.addEventListener('change',function(){ setSel(cb); updateBulk(); }); });
    host.querySelectorAll('.date-ceco-btn').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); host.querySelectorAll('tr[data-d="'+b.getAttribute('data-ceco-date')+'"] .baja-check[data-estado="pendiente"]').forEach(function(cb){ if(!cb.checked){ cb.checked=true; setSel(cb); } }); updateBulk(); }); });
    host.querySelectorAll('.date-baja-btn').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); host.querySelectorAll('tr[data-d="'+b.getAttribute('data-baja-date')+'"] .baja-check[data-estado="cargado"]').forEach(function(cb){ if(!cb.checked){ cb.checked=true; setSel(cb); } }); updateBulk(); }); });
    var bClr=host.querySelector('#bulkClear'); if(bClr) bClr.addEventListener('click',function(){ host.querySelectorAll('.baja-check:checked').forEach(function(cb){ cb.checked=false; setSel(cb); }); updateBulk(); });
    var bBaja=host.querySelector('#bulkBaja'); if(bBaja) bBaja.addEventListener('click',function(){ bulkBaja(sel, host); });
    var bCeco=host.querySelector('#bulkCeco'); if(bCeco) bCeco.addEventListener('click',function(){ bulkAsignarCeco(sel, host); });

    if(useGsap) animateTable(host);

    if(state._highlightUso){
      host.querySelectorAll('tr[data-hl]').forEach(function(tr,i){
        var d=220+i*150;
        setTimeout(function(){ sweepRow(tr,'amber'); setTimeout(function(){ tr.classList.add('row-arrive-amber'); }, 880); }, d);
      });
      state._highlightUso=null;
    }
    if(state._arrive && state._arrive.length){
      state._arrive.forEach(function(a){ var tr=host.querySelector('tr[data-row-item="'+a.itemId+'"]'); if(tr) tr.classList.add('row-arrive-'+a.color); });
      state._arrive=null;
    }
  }

  // Alta de material nuevo en el catálogo (desde el buscador de mercaderías)
  function openNewMaterial(prefill, select){
    var m=openModal(
      '<div class="modal__head"><div class="modal__title">Agregar material nuevo</div><button class="modal__close" data-close>&times;</button></div>'+
      '<div class="modal__body">'+
        '<div class="field"><label class="field__label">Código <span class="req">*</span></label><input class="input" id="nm_cod" placeholder="Ej: LA6901998" autocomplete="off"></div>'+
        '<div class="grid-2"><div class="field"><label class="field__label">Descripción <span class="req">*</span></label><input class="input" id="nm_desc" placeholder="Descripción del material" autocomplete="off"></div>'+
        '<div class="field"><label class="field__label">UM</label><input class="input" id="nm_um" placeholder="UN" value="UN" autocomplete="off"></div></div>'+
      '</div>'+
      '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn btn--primary" id="nm_save">'+ICONS.check+' Guardar material</button></div>'
    );
    var c0=q('#nm_cod',m.bd), d0=q('#nm_desc',m.bd);
    if(prefill){ if(/^la/i.test(prefill)||/\d/.test(prefill)) c0.value=prefill; else d0.value=prefill; }
    q('#nm_save',m.bd).addEventListener('click',function(){
      var cod=q('#nm_cod',m.bd).value.trim(), desc=q('#nm_desc',m.bd).value.trim(), um=(q('#nm_um',m.bd).value.trim()||'UN');
      if(!cod || !desc){ toast('Código y descripción son obligatorios','err'); return; }
      var btn=q('#nm_save',m.bd); btn.disabled=true;
      API.createMercaderia({ codigo:cod, descripcion:desc, um:um }).then(function(mm){
        m.close(); toast('Material agregado al catálogo','ok');
        if(select) select({ value:mm.codigo, label:mm.codigo+' — '+mm.descripcion, descripcion:mm.descripcion, um:mm.um });
      }).catch(function(){ btn.disabled=false; toast('Error al guardar','err'); });
    });
    setTimeout(function(){ if(c0) c0.focus(); },60);
  }

  // Asignar CECO/caso a varias líneas pendientes seleccionadas
  function bulkAsignarCeco(sel, host){
    var items=Object.keys(sel).map(function(k){return sel[k];}).filter(function(x){return x.estado==='pendiente';});
    if(!items.length){ toast('Seleccioná líneas pendientes','err'); return; }
    var chosen=null;
    var m=openModal(
      '<div class="modal__head"><div class="modal__title">Asignar CECO a '+items.length+' línea(s)</div><button class="modal__close" data-close>&times;</button></div>'+
      '<div class="modal__body">'+
        '<p class="list-hint" style="margin:0 0 14px">Elegí el caso / CECO que se aplicará a las <b>'+items.length+'</b> líneas pendientes seleccionadas.</p>'+
        '<div class="field"><label class="field__label">Caso / CECO <span class="req">*</span></label><div id="bulk_caso_host"></div></div>'+
        '<div class="caso-preview" id="bulk_prev" style="display:none">'+
          '<div class="caso-preview__row"><span>Cuenta Mayor</span><span id="bp_cuenta">—</span></div>'+
          '<div class="caso-preview__row"><span>CECO (Centro)</span><span id="bp_ceco">—</span></div>'+
          '<div class="caso-preview__row"><span>Área CECO</span><span id="bp_area">—</span></div>'+
          '<div class="caso-preview__row"><span>Orden</span><span id="bp_orden">—</span></div></div>'+
      '</div>'+
      '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn btn--primary" id="okBulkCeco">'+ICONS.tag+' Asignar a '+items.length+'</button></div>'
    );
    function paintPrev(){ var p=q('#bulk_prev',m.bd); if(!chosen){ p.style.display='none'; return; } p.style.display='block';
      q('#bp_cuenta',m.bd).textContent=chosen.cuenta_mayor||'—'; q('#bp_ceco',m.bd).textContent=chosen.ceco||'—';
      q('#bp_area',m.bd).textContent=API.cecoArea(chosen.ceco)||'—'; q('#bp_orden',m.bd).textContent=chosen.orden||'—'; }
    CasoPicker(q('#bulk_caso_host',m.bd), { placeholder:'Elegir caso / CECO…', onChange:function(c){ chosen=c; paintPrev(); } });
    q('#okBulkCeco',m.bd).addEventListener('click',function(){
      if(!chosen){ toast('Elegí el caso / CECO','err'); return; }
      var ok=q('#okBulkCeco',m.bd); ok.disabled=true;
      API.asignarCeco(items, { id:chosen.id, cuenta_mayor:chosen.cuenta_mayor, ceco:chosen.ceco, orden:chosen.orden }).then(function(n){
        m.close(); toast('CECO asignado a '+n+' línea(s)','ok'); setTimeout(refreshCurrent, 300);
      });
    });
  }

  // Baja en lote de las líneas seleccionadas (secuencial + barrido verde)
  function bulkBaja(sel, host){
    var items=Object.keys(sel).map(function(k){return sel[k];}).filter(function(x){return x.estado==='cargado';});
    if(!items.length) return;
    var m=openModal(
      '<div class="modal__head"><div class="modal__title">Dar de baja en lote</div><button class="modal__close" data-close>&times;</button></div>'+
      '<div class="modal__body"><div class="baja-hero"><span class="baja-hero__ic">'+ICONS.check+'</span><div><div class="baja-hero__t">Dar de baja '+items.length+' línea(s)</div><div class="baja-hero__s">Se marcarán como <b>consumidas en SAP</b> y quedan terminadas.</div></div></div></div>'+
      '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn btn--success" id="okBulk">'+ICONS.check+' Confirmar baja ('+items.length+')</button></div>'
    );
    q('#okBulk',m.bd).addEventListener('click',function(){
      var okBtn=q('#okBulk',m.bd); okBtn.disabled=true; var i=0;
      state._arrive=items.map(function(it){ return {itemId:it.itemId,color:'green'}; });
      (function next(){
        if(i>=items.length){ m.close(); toast(items.length+' línea(s) dadas de baja','ok'); setTimeout(refreshCurrent, 900); return; }
        var it=items[i++], tr=host.querySelector('tr[data-row-item="'+it.itemId+'"]');
        API.darBaja(it.usoId, it.itemId).then(function(){ if(tr) sweepRow(tr,'green'); setTimeout(next, 100); });
      })();
    });
  }

  // Reporte de TODO lo cargado en una fecha (puede abarcar varios documentos)
  function reporteFechaModal(fecha, rows){
    var items=(rows||[]).map(function(r){ return r.it; });
    var sectors=[]; (rows||[]).forEach(function(r){ if(sectors.indexOf(r.uso.sector)===-1) sectors.push(r.uso.sector); });
    reporteModal({ nro:'Fecha '+fmtFecha(fecha), fecha_emision:fecha, sector: sectors.length===1?sectors[0]:'Varios sectores', solicitante:'', items:items });
  }

  function fechaToolbarHTML(){
    return (state.dateFilter?'<span class="filter-chip">'+esc(state.dateFilter.label||'Filtrado')+'<button id="btnClearFecha" aria-label="Quitar filtro">&times;</button></span>':'')+
      '<button class="filter-btn'+(state.dateFilter?' is-active':'')+'" id="btnFecha">'+ICONS.filter+' Filtrar fechas</button>';
  }
  function wireFechaToolbar(root){
    var bf=q('#btnFecha',root); if(bf) bf.addEventListener('click',openDateFilter);
    var bc=q('#btnClearFecha',root); if(bc) bc.addEventListener('click',function(){ setDateFilter('','',''); });
  }

  /* ── Vista LISTA (sector / pendientes / terminados) ───────── */
  function renderLista(filter, titulo){
    var root=q('#viewRoot');
    var iconSvg = filter.sector ? (function(){ var c=SECTOR_CARDS.find(function(s){return s.key===filter.sector;}); return c?ICONS[c.icon]:ICONS.file; })()
                : (filter.estado==='pendientes' ? ICONS.clock : (filter.estado==='terminados' ? ICONS.check : ICONS.file));
    root.innerHTML='<div class="view">'+
      '<div class="list-toolbar list-toolbar--3">'+
        '<div class="lt-left"><button class="btn btn--secondary" id="btnVolverMenu">'+ICONS.back+' Volver al menú</button></div>'+
        '<div class="lt-center"><span class="lt-center__ic">'+iconSvg+'</span><span class="lt-center__title">'+esc(titulo)+'</span></div>'+
        '<div class="lt-right">'+ monthNavHTML() +'<button class="btn btn--primary" id="btnNuevo">'+ICONS.plus+' Nuevo Uso Interno</button></div>'+
      '</div><div id="listHost"></div></div>';
    q('#btnNuevo').addEventListener('click',wizardNuevo);
    q('#btnVolverMenu').addEventListener('click',function(){ go('menu'); });
    wireMonthNav(root, function(){ if(state._reRender) state._reRender(); });
    animateToolbar(root);
    var showSector=!filter.sector, sig=filter.sector||filter.estado||'list';
    API.listUsos(filter).then(function(usos){
      var rows=[];
      usos.forEach(function(u){ (u.items||[]).forEach(function(it){ rows.push({ uso:u, it:it }); }); });
      state._rows=rows;
      state._reRender=function(){ paintTable(q('#listHost'), rows, {showSector:showSector, monthFilter:true, sig:sig}); };
      state._reRender();
    });
  }

  /* ── Vista PARA DAR DE BAJA (por sectores) ────────────────── */
  function renderPorBaja(){
    state.view='porbaja'; setActive('porbaja'); toggleSearch(true); resetSearch('Buscar por reserva, código…'); setBreadcrumb(['MENU','PARA DAR DE BAJA']);
    var root=q('#viewRoot');
    var chips=[''].concat(SECTOR_CARDS.map(function(s){return s.key;}));
    root.innerHTML='<div class="view">'+
      '<div class="list-toolbar"><div><div class="list-title">Para dar de baja</div>'+
        '<p class="list-hint">Materiales con N.º de reserva cargado, esperando la baja en SAP.</p></div>'+
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'+ fechaToolbarHTML() +'</div></div>'+
      '<div class="sector-chips" id="bajaChips">'+ chips.map(function(k){ var lbl=k===''?'Todos':sectorShort(k); return '<button class="sector-chip'+(state.bajaSector===k?' on':'')+'" data-sec="'+esc(k)+'">'+esc(lbl)+'</button>'; }).join('') +'</div>'+
      '<div id="listHost"></div></div>';
    wireFechaToolbar();
    animateToolbar(root);
    q('#bajaChips').querySelectorAll('.sector-chip').forEach(function(b){ b.addEventListener('click',function(){ state.bajaSector=b.getAttribute('data-sec'); renderPorBaja(); }); });
    API.listUsos({}).then(function(usos){
      usos=usos.filter(function(u){ return inDateRange(u.fecha_emision); });
      var rows=[];
      usos.forEach(function(u){ if(state.bajaSector && u.sector!==state.bajaSector) return; (u.items||[]).forEach(function(it){ if(it.sap_estado!=='cargado') return; rows.push({uso:u,it:it}); }); });
      state._rows=rows;
      state._reRender=function(){ paintTable(q('#listHost'), rows, {showSector:!state.bajaSector, emptyText:'No hay materiales esperando baja'+(state.bajaSector?' en este sector':'')}); };
      state._reRender();
    });
  }

  function actBtn(cls,label,icon,act,usoId,itemId){
    return '<button class="action-btn '+cls+'" aria-label="'+esc(label)+'" data-act="'+act+'" data-uso="'+usoId+'"'+(itemId?' data-item="'+itemId+'"':'')+'>'+
      '<span class="tip">'+esc(label)+'</span>'+icon+'</button>';
  }
  function rowActions(u,it){
    var h='';
    if(it.sap_estado==='pendiente') h+=actBtn('a-sap','Cargar a SAP',ICONS.sap,'cargar',u.id,it.id);
    if(it.sap_estado==='cargado')   h+=actBtn('a-baja','Dar de baja',ICONS.check,'baja',u.id,it.id);
    h+=actBtn('a-print','Imprimir',ICONS.print,'imprimir',u.id,'');
    h+=actBtn('a-edit','Editar',ICONS.edit,'editar',u.id,it.id);
    h+=actBtn('a-del','Eliminar',ICONS.trash,'eliminar',u.id,it.id);
    return h;
  }

  // Barrido de luz al cambiar de estado (método de CajaVenta: overlay fijo + beam translateX).
  function sweepRow(rowEl, color, done){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!rowEl || reduce){ if(done) done(); return; }
    var r=rowEl.getBoundingClientRect();
    var wrap=document.createElement('div'); wrap.className='sweep-overlay';
    wrap.style.cssText='position:fixed;top:'+r.top+'px;left:'+r.left+'px;width:'+r.width+'px;height:'+r.height+'px;z-index:120;pointer-events:none;';
    var beam=document.createElement('div'); beam.className='sweep-beam sweep-beam--'+color; wrap.appendChild(beam);
    document.body.appendChild(wrap);
    rowEl.classList.add('row-sweep-'+color);
    setTimeout(function(){ wrap.remove(); }, 950);
    // El resaltado (arrive) recién arranca cuando el barrido de luz TERMINA.
    setTimeout(function(){ if(done) done(); }, 880);
  }

  function onAction(act, usoId, itemId, rowEl){
    if(act==='reporte' || act==='imprimir'){ API.getUso(usoId).then(function(u){ if(act==='reporte') reporteModal(u); else printReporte(u); }); return; }
    if(act==='cargar'){ API.getUso(usoId).then(function(u){ var it=(u.items||[]).find(function(x){return x.id===itemId;}); cargarSAPModal(u,it,rowEl); }); return; }
    if(act==='editar'){ API.getUso(usoId).then(function(u){ var it=(u.items||[]).find(function(x){return x.id===itemId;}); editItemModal(usoId, it); }); return; }
    if(act==='eliminar'){
      API.getUso(usoId).then(function(u){ var it=(u.items||[]).find(function(x){return x.id===itemId;}); var last=(u.items||[]).length<=1;
        var m=openModal('<div class="modal__head"><div class="modal__title">Eliminar material</div><button class="modal__close" data-close>&times;</button></div>'+
          '<div class="modal__body"><p style="font-size:13.5px;line-height:1.6;color:var(--alas-text-2)">¿Seguro que querés eliminar esta línea del uso interno?</p>'+
          '<div class="caso-preview"><div class="caso-preview__row"><span>Mercadería</span><span>'+esc(it.cod_mercaderia)+'</span></div>'+
          '<div class="caso-preview__row"><span>Cantidad</span><span>'+esc(it.cantidad)+' '+esc(it.um)+'</span></div>'+
          '<div class="caso-preview__row"><span>Estado</span><span>'+esc((it.sap_estado||'').toUpperCase())+'</span></div></div>'+
          (last?'<p style="font-size:12px;color:var(--alas-warning);margin-top:10px;font-weight:700">Es la única línea: se eliminará todo el documento '+esc(u.nro)+'.</p>':'')+
          '</div>'+
          '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn" style="background:#dc2626;color:#fff" id="okDel">'+ICONS.trash+' Eliminar</button></div>');
        q('#okDel',m.bd).addEventListener('click',function(){ API.deleteItem(usoId,itemId).then(function(){ m.close(); toast('Material eliminado','ok'); sweepRow(rowEl,'red',refreshCurrent); }); });
      });
      return;
    }
    if(act==='baja'){
      API.getUso(usoId).then(function(u){ var it=(u.items||[]).find(function(x){return x.id===itemId;});
        function di(l,v,wide){ return '<div class="detail-item'+(wide?' detail-item--wide':'')+'"><span class="detail-item__l">'+l+'</span><span class="detail-item__v">'+v+'</span></div>'; }
        var m=openModal(
          '<div class="modal__head"><div class="modal__title">Dar de baja en SAP</div><button class="modal__close" data-close>&times;</button></div>'+
          '<div class="modal__body">'+
            '<div class="baja-hero"><span class="baja-hero__ic">'+ICONS.check+'</span><div><div class="baja-hero__t">Confirmar baja de la línea</div><div class="baja-hero__s">Se marca como <b>consumida en SAP</b> y la línea queda terminada.</div></div></div>'+
            '<div class="detail-card">'+
              '<div class="detail-card__head"><span class="detail-card__cod">'+esc(it.cod_mercaderia)+'</span>'+sapBadge(it.sap_estado)+'</div>'+
              '<div class="detail-card__desc">'+esc(it.descripcion||'—')+'</div>'+
              '<div class="detail-grid">'+
                di('Cantidad', '<b>'+esc(it.cantidad)+'</b> '+esc(it.um))+
                di('N.º Reserva', it.n_reserva?('<b>'+esc(it.n_reserva)+'</b>'):'—')+
                di('Uso', esc(it.uso_texto||'—'), true)+
                di('Cuenta Mayor', esc(it.cuenta_mayor||'—'))+
                di('CECO', esc(it.ceco||'—'))+
                di('Orden', esc(it.orden||'—'))+
                di('Sector', esc(sectorShort(u.sector)))+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn btn--success" id="okBaja">'+ICONS.check+' Confirmar baja</button></div>'
        );
        if(window.gsap && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
          window.gsap.from(m.bd.querySelectorAll('.baja-hero, .detail-card'), { y:12, opacity:0, duration:.42, stagger:.08, ease:'power2.out', delay:.1 });
          window.gsap.from(m.bd.querySelectorAll('.detail-item'), { y:8, opacity:0, duration:.34, stagger:.04, ease:'power2.out', delay:.24 });
        }
        q('#okBaja',m.bd).addEventListener('click',function(){
          API.darBaja(usoId,itemId).then(function(){ m.close(); toast('Línea dada de baja','ok'); state._arrive=[{itemId:itemId,color:'green'}]; sweepRow(rowEl,'green',refreshCurrent); });
        });
      });
      return;
    }
  }

  function refreshCurrent(){
    if(state.view==='sector') renderLista({ sector:state.sector }, (SECTOR_CARDS.find(function(s){return s.key===state.sector;})||{}).label||state.sector);
    else if(state.view==='pendientes') renderLista({ estado:'pendientes' }, 'Pendientes');
    else if(state.view==='terminados') renderLista({ estado:'terminados' }, 'Terminados');
    else if(state.view==='porbaja') renderPorBaja();
    else if(state.view==='resumen') renderResumen();
    else if(state.view==='menu') renderMenu();
    else if(state.view==='auditoria') renderAuditoria();
  }

  /* ── Wizard: nuevo Uso Interno ────────────────────────────── */
  function wizardNuevo(){
    var hoy=new Date().toISOString().slice(0,10);
    var draft={ fecha_emision:hoy, sector:null, items:[] };

    var m=openModal(
      '<div class="modal__head"><div class="modal__title">Nuevo Uso Interno</div><button class="modal__close" data-close>&times;</button></div>'+
      '<div class="modal__body">'+
        '<div class="field"><label class="field__label">Fecha de emisión <span class="req">*</span></label><input class="input" type="date" id="w_fecha" value="'+hoy+'"></div>'+
        '<div class="field"><label class="field__label">Departamento / Sector <span class="req">*</span></label>'+
          '<div class="sector-grid" id="w_sectores">'+ (window.SECTORES||[]).map(function(s){ return '<button type="button" class="sector-btn" data-sec="'+esc(s)+'">'+esc(s)+'</button>'; }).join('') +'</div></div>'+
        '<div class="field"><label class="field__label">Mercaderías <span class="req">*</span></label>'+
          '<div class="items-box"><div id="w_items"><div class="empty-mini">Sin mercaderías agregadas</div></div>'+
          '<button type="button" class="add-item-btn" id="w_add" style="margin-top:8px">'+ICONS.plus+' Agregar mercadería</button></div></div>'+
      '</div>'+
      '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn btn--primary" id="w_save">Guardar</button></div>',
      { wide:true }
    );

    q('#w_fecha',m.bd).addEventListener('change',function(e){ draft.fecha_emision=e.target.value; });
    m.bd.querySelectorAll('#w_sectores .sector-btn').forEach(function(b){
      b.addEventListener('click',function(){ draft.sector=b.getAttribute('data-sec'); m.bd.querySelectorAll('#w_sectores .sector-btn').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); });
    });
    q('#w_add',m.bd).addEventListener('click',function(){ itemModal(function(item){ draft.items.push(item); paintItems(); }); });
    q('#w_save',m.bd).addEventListener('click',function(){
      if(!draft.sector){ toast('Elegí un sector','err'); return; }
      if(!draft.items.length){ toast('Agregá al menos una mercadería','err'); return; }
      q('#w_save',m.bd).disabled=true;
      API.createUso(draft).then(function(uso){ state._highlightUso = uso && uso.id; m.close(); toast('Uso interno guardado','ok'); go('sector',draft.sector); });
    });

    function paintItems(){
      var host=q('#w_items',m.bd);
      if(!draft.items.length){ host.innerHTML='<div class="empty-mini">Sin mercaderías agregadas</div>'; return; }
      host.innerHTML=draft.items.map(function(it,idx){
        return '<div class="item-row"><div class="item-row__main"><div class="item-row__cod">'+esc(it.cod_mercaderia)+(it.ceco?' <span class="item-row__ceco">'+esc(it.ceco)+'</span>':'')+'</div>'+
          '<div class="item-row__desc">'+esc(it.descripcion)+' · '+esc(it.uso_texto||'')+'</div></div>'+
          '<div class="item-row__qty">'+esc(it.cantidad)+' '+esc(it.um)+'</div>'+
          '<button class="icon-btn item-row__del" data-del="'+idx+'" title="Quitar">&times;</button></div>';
      }).join('');
      host.querySelectorAll('[data-del]').forEach(function(b){ b.addEventListener('click',function(){ draft.items.splice(+b.getAttribute('data-del'),1); paintItems(); }); });
    }
  }

  /* ── Modal: agregar mercadería (incluye caso / CECO) ──────── */
  function itemModal(onAdd){
    var m=openModal(
      '<div class="modal__head"><div class="modal__title">Agregar mercadería</div><button class="modal__close" data-close>&times;</button></div>'+
      '<div class="modal__body">'+
        '<div class="field"><label class="field__label">Cod. Mercadería <span class="req">*</span></label><div id="i_cod_host"></div></div>'+
        '<div class="grid-2"><div class="field"><label class="field__label">Cantidad <span class="req">*</span></label><input class="input" type="number" min="0" step="1" id="i_cant"></div>'+
        '<div class="field"><label class="field__label">UM</label><input class="input input--readonly" id="i_um" readonly></div></div>'+
        '<div class="field"><label class="field__label">Uso <span class="req">*</span></label><textarea class="textarea" id="i_uso" placeholder="Motivo / destino del uso"></textarea></div>'+
        '<div class="field"><label class="field__label">Caso / CECO <span class="req">*</span></label><div id="i_caso_host"></div></div>'+
        '<div class="caso-preview" id="i_prev" style="display:none">'+
          '<div class="caso-preview__row"><span>Cuenta Mayor</span><span id="ip_cuenta">—</span></div>'+
          '<div class="caso-preview__row"><span>CECO (Centro)</span><span id="ip_ceco">—</span></div>'+
          '<div class="caso-preview__row"><span>Área CECO</span><span id="ip_area">—</span></div>'+
          '<div class="caso-preview__row"><span>Orden</span><span id="ip_orden">—</span></div></div>'+
      '</div>'+
      '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn btn--primary" id="i_save">Guardar</button></div>'
    );
    var um=q('#i_um',m.bd), prev=q('#i_prev',m.bd), chosenMerc=null, chosenCaso=null;
    SSelect(q('#i_cod_host',m.bd), { icon:ICONS.tag, placeholder:'Buscar mercadería (código o descripción)…',
      asyncSearch:function(t){ return API.searchMercaderias(t).then(function(rows){ return rows.map(function(mm){ return { value:mm.codigo, label:mm.codigo+' — '+mm.descripcion, um:mm.um, descripcion:mm.descripcion }; }); }); },
      addNewLabel:'Agregar material nuevo', onAddNew:function(term, select){ openNewMaterial(term, select); },
      onChange:function(v,opt){ chosenMerc=opt?{codigo:opt.value,descripcion:opt.descripcion,um:opt.um}:null; um.value=opt?opt.um:''; } });
    CasoPicker(q('#i_caso_host',m.bd), { placeholder:'Elegir caso / CECO…', onChange:function(c){ chosenCaso=c; paintPrev(); } });
    function paintPrev(){ if(!chosenCaso){ prev.style.display='none'; return; } prev.style.display='block';
      q('#ip_cuenta',m.bd).textContent=chosenCaso.cuenta_mayor||'—'; q('#ip_ceco',m.bd).textContent=chosenCaso.ceco||'—';
      q('#ip_area',m.bd).textContent=API.cecoArea(chosenCaso.ceco)||'—'; q('#ip_orden',m.bd).textContent=chosenCaso.orden||'—'; }
    q('#i_save',m.bd).addEventListener('click',function(){
      var cant=q('#i_cant',m.bd).value, uso=q('#i_uso',m.bd).value.trim();
      if(!chosenMerc){ toast('Elegí una mercadería','err'); return; }
      if(!(Number(cant)>0)){ toast('Cantidad inválida','err'); return; }
      if(!uso){ toast('Ingresá el uso','err'); return; }
      if(!chosenCaso){ toast('Elegí el caso / CECO','err'); return; }
      onAdd({ cod_mercaderia:chosenMerc.codigo, descripcion:chosenMerc.descripcion, um:chosenMerc.um, cantidad:Number(cant), uso_texto:uso,
        caso_id:chosenCaso.id, cuenta_mayor:chosenCaso.cuenta_mayor, ceco:chosenCaso.ceco, orden:chosenCaso.orden });
      m.close();
    });
  }

  /* ── Modal: editar material ───────────────────────────────── */
  function editItemModal(usoId, it){
    var m=openModal(
      '<div class="modal__head"><div class="modal__title">Editar material</div><button class="modal__close" data-close>&times;</button></div>'+
      '<div class="modal__body">'+
        '<div class="field"><label class="field__label">Cod. Mercadería <span class="req">*</span></label><div id="i_cod_host"></div></div>'+
        '<div class="grid-2"><div class="field"><label class="field__label">Cantidad <span class="req">*</span></label><input class="input" type="number" min="0" step="1" id="i_cant"></div>'+
        '<div class="field"><label class="field__label">UM</label><input class="input input--readonly" id="i_um" readonly></div></div>'+
        '<div class="field"><label class="field__label">Uso <span class="req">*</span></label><textarea class="textarea" id="i_uso" placeholder="Motivo / destino del uso"></textarea></div>'+
        '<div class="field"><label class="field__label">Caso / CECO <span class="req">*</span></label><div id="i_caso_host"></div></div>'+
        '<div class="caso-preview" id="i_prev" style="display:none">'+
          '<div class="caso-preview__row"><span>Cuenta Mayor</span><span id="ip_cuenta">—</span></div>'+
          '<div class="caso-preview__row"><span>CECO (Centro)</span><span id="ip_ceco">—</span></div>'+
          '<div class="caso-preview__row"><span>Área CECO</span><span id="ip_area">—</span></div>'+
          '<div class="caso-preview__row"><span>Orden</span><span id="ip_orden">—</span></div></div>'+
      '</div>'+
      '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn btn--primary" id="i_save">Guardar cambios</button></div>'
    );
    var um=q('#i_um',m.bd), prev=q('#i_prev',m.bd);
    var chosenMerc=state.mercaderias.find(function(x){return x.codigo===it.cod_mercaderia;}) || { codigo:it.cod_mercaderia, descripcion:it.descripcion, um:it.um };
    var chosenCaso=it.caso_id ? state.casos.find(function(c){return String(c.id)===String(it.caso_id);})
                 : (it.ceco ? state.casos.find(function(c){return c.ceco===it.ceco && String(c.orden)===String(it.orden);}) : null);
    um.value=it.um||''; q('#i_cant',m.bd).value=it.cantidad; q('#i_uso',m.bd).value=it.uso_texto||'';
    SSelect(q('#i_cod_host',m.bd), { icon:ICONS.tag, placeholder:'Buscar mercadería (código o descripción)…', value:it.cod_mercaderia,
      current:{ value:it.cod_mercaderia, label:it.cod_mercaderia+(it.descripcion?' — '+it.descripcion:'') },
      asyncSearch:function(t){ return API.searchMercaderias(t).then(function(rows){ return rows.map(function(mm){ return { value:mm.codigo, label:mm.codigo+' — '+mm.descripcion, um:mm.um, descripcion:mm.descripcion }; }); }); },
      addNewLabel:'Agregar material nuevo', onAddNew:function(term, select){ openNewMaterial(term, select); },
      onChange:function(v,opt){ chosenMerc=opt?{codigo:opt.value,descripcion:opt.descripcion,um:opt.um}:null; um.value=opt?opt.um:''; } });
    CasoPicker(q('#i_caso_host',m.bd), { value: chosenCaso?chosenCaso.id:null, placeholder:'Elegir caso / CECO…', onChange:function(c){ chosenCaso=c; paintPrev(); } });
    function paintPrev(){ if(!chosenCaso){ prev.style.display='none'; return; } prev.style.display='block';
      q('#ip_cuenta',m.bd).textContent=chosenCaso.cuenta_mayor||'—'; q('#ip_ceco',m.bd).textContent=chosenCaso.ceco||'—';
      q('#ip_area',m.bd).textContent=API.cecoArea(chosenCaso.ceco)||'—'; q('#ip_orden',m.bd).textContent=chosenCaso.orden||'—'; }
    if(chosenCaso) paintPrev();
    q('#i_save',m.bd).addEventListener('click',function(){
      var cant=q('#i_cant',m.bd).value, uso=q('#i_uso',m.bd).value.trim();
      if(!chosenMerc||!chosenMerc.codigo){ toast('Elegí una mercadería','err'); return; }
      if(!(Number(cant)>0)){ toast('Cantidad inválida','err'); return; }
      if(!uso){ toast('Ingresá el uso','err'); return; }
      if(!chosenCaso){ toast('Elegí el caso / CECO','err'); return; }
      API.updateItem(usoId, it.id, { cod_mercaderia:chosenMerc.codigo, descripcion:chosenMerc.descripcion, um:chosenMerc.um, cantidad:Number(cant), uso_texto:uso,
        caso_id:chosenCaso.id, cuenta_mayor:chosenCaso.cuenta_mayor, ceco:chosenCaso.ceco, orden:chosenCaso.orden })
        .then(function(){ m.close(); toast('Material actualizado','ok'); refreshCurrent(); });
    });
  }

  /* ── Modal: cargar a SAP (autocompleta desde el caso CECO) ── */
  function cargarSAPModal(uso,it,rowEl){
    // El CECO/caso ya se eligió al crear el material → este paso solo pide la N.º de reserva.
    var chosen = it.caso_id ? state.casos.find(function(c){return String(c.id)===String(it.caso_id);})
               : (it.ceco ? state.casos.find(function(c){return c.ceco===it.ceco && String(c.orden)===String(it.orden);}) : null);
    var hasCaso = !!(chosen || it.ceco);
    var casoBlock = hasCaso
      ? '<div class="caso-preview" style="margin-bottom:16px">'+
          '<div class="caso-preview__row"><span>Mercadería</span><span>'+esc(it.cod_mercaderia)+'</span></div>'+
          '<div class="caso-preview__row"><span>Cuenta Mayor</span><span>'+esc((chosen&&chosen.cuenta_mayor)||it.cuenta_mayor||'—')+'</span></div>'+
          '<div class="caso-preview__row"><span>CECO</span><span>'+esc((chosen&&chosen.ceco)||it.ceco||'—')+'</span></div>'+
          '<div class="caso-preview__row"><span>Orden</span><span>'+esc((chosen&&chosen.orden)||it.orden||'—')+'</span></div></div>'
      : '<div class="field"><label class="field__label">Caso / CECO <span class="req">*</span></label><div id="s_caso_host"></div></div>'+
        '<div class="caso-preview" id="s_prev" style="display:none;margin-bottom:16px">'+
          '<div class="caso-preview__row"><span>Cuenta Mayor</span><span id="p_cuenta">—</span></div>'+
          '<div class="caso-preview__row"><span>CECO</span><span id="p_ceco">—</span></div>'+
          '<div class="caso-preview__row"><span>Orden</span><span id="p_orden">—</span></div></div>';
    var m=openModal(
      '<div class="modal__head"><div class="modal__title">Cargar a SAP — '+esc(it.cod_mercaderia)+'</div><button class="modal__close" data-close>&times;</button></div>'+
      '<div class="modal__body">'+
        '<p style="font-size:12.5px;color:var(--alas-text-3);margin-bottom:14px">Ingresá el <b>N.º de reserva</b> que devolvió SAP para marcar la línea como cargada.</p>'+
        casoBlock +
        '<div class="field"><label class="field__label">N.º de Reserva (SAP) <span class="req">*</span></label><input class="input" id="s_reserva" placeholder="Ej: 0001490246"></div>'+
      '</div>'+
      '<div class="modal__foot"><button class="btn btn--secondary" data-close>Cancelar</button><button class="btn btn--primary" id="s_save">'+ICONS.sap+' Marcar como cargado</button></div>'
    );
    if(!hasCaso){
      CasoPicker(q('#s_caso_host',m.bd), { placeholder:'Elegir caso / CECO…', onChange:function(c){ chosen=c;
        var prev=q('#s_prev',m.bd); prev.style.display='block';
        q('#p_cuenta',m.bd).textContent=c.cuenta_mayor||'—'; q('#p_ceco',m.bd).textContent=c.ceco||'—'; q('#p_orden',m.bd).textContent=c.orden||'—'; } });
    }
    setTimeout(function(){ var r=q('#s_reserva',m.bd); if(r) r.focus(); },80);
    q('#s_save',m.bd).addEventListener('click',function(){
      var reserva=q('#s_reserva',m.bd).value.trim();
      if(!chosen && !it.ceco){ toast('Falta el caso / CECO','err'); return; }
      if(!reserva){ toast('Ingresá el N.º de reserva','err'); return; }
      var data = chosen ? { caso_id:chosen.id, cuenta_mayor:chosen.cuenta_mayor, ceco:chosen.ceco, orden:chosen.orden, n_reserva:reserva }
                        : { caso_id:it.caso_id||null, cuenta_mayor:it.cuenta_mayor, ceco:it.ceco, orden:it.orden, n_reserva:reserva };
      API.cargarSAP(uso.id, it.id, data).then(function(){ m.close(); toast('Línea cargada a SAP','ok'); state._arrive=[{itemId:it.id,color:'blue'}]; sweepRow(rowEl,'blue',refreshCurrent); });
    });
  }

  /* ── Reporte / formato correo ─────────────────────────────── */
  function reporteHTML(u){
    var rows=(u.items||[]).map(function(it){
      return '<tr><td><b>'+esc(it.cod_mercaderia)+'</b></td><td>'+esc(it.descripcion)+'</td><td style="text-align:center">'+esc(it.cantidad)+'</td>'+
        '<td>'+esc(it.um)+'</td><td>'+esc(it.uso_texto||'')+'</td><td>'+esc(it.n_reserva||'—')+'</td></tr>';
    }).join('');
    return '<div class="report-card" id="reportCard"><h3>Inventario – Uso Interno '+esc(u.nro||'')+'</h3>'+
      '<div class="report-meta"><b>Fecha:</b> '+esc(fmtFecha(u.fecha_emision))+'<br><b>Sector:</b> '+esc(u.sector)+' &nbsp;·&nbsp; <b>Estado:</b> '+esc((u.estado||'').toUpperCase())+'<br><b>Solicitante:</b> '+esc(u.solicitante||'')+'</div>'+
      '<table class="report-table"><thead><tr><th>Cód. Mercadería</th><th>Descripción</th><th>Cant</th><th>UM</th><th>Uso</th><th>N.Reserva</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }

  function reporteModal(u){
    var m=openModal(
      '<div class="modal__head"><div class="modal__title">Reporte · '+esc(u.nro||'Uso Interno')+'</div><button class="modal__close" data-close>&times;</button></div>'+
      '<div class="modal__body">'+'<div style="max-width:760px;margin:0 auto">'+reporteEmailHTML(u)+'</div>'+
        '<div class="report-actions" style="max-width:760px;margin:20px auto 0">'+
          '<button class="btn btn--primary" id="r_copy">📋 Copiar para Outlook</button>'+
          '<button class="btn btn--success" id="r_print">'+ICONS.print+' Imprimir</button>'+
          '<button class="btn btn--dark" id="r_pdf">⬇ Descargar PDF</button>'+
        '</div></div>', { wide:true });
    q('#r_copy',m.bd).addEventListener('click',function(){ copyReport(u); });
    q('#r_print',m.bd).addEventListener('click',function(){ printReporte(u); });
    q('#r_pdf',m.bd).addEventListener('click',function(){ printReporte(u); });
  }

  // Reporte de correo (tabla). Clave anti-negrita de Outlook: font-weight:normal EXPLÍCITO en
  // cada contenedor y celda (gana sobre la herencia), y la negrita solo en <span> al FINAL de su
  // línea (Inventario, Sector) para que no se "derrame". Sin <b> ni !important.
  function reporteEmailHTML(u){
    var ink='#1f2937', muted='#6b7280', line='#e5e7eb', blue='#08486A', ff='Arial,Helvetica,sans-serif';
    function td(txt, extra){ return '<td style="padding:9px 18px;border-bottom:1px solid '+line+';font-family:'+ff+';font-size:13px;font-weight:normal;color:'+ink+';vertical-align:top;'+(extra||'')+'">'+txt+'</td>'; }
    function head(txt, extra){ return '<td style="padding:9px 18px;background-color:#f1f5f9;border-bottom:1px solid #e2e8f0;font-family:'+ff+';font-size:12px;font-weight:normal;color:#475569;white-space:nowrap;'+(extra||'')+'">'+txt+'</td>'; }
    var rows=(u.items||[]).map(function(it){
      return '<tr>'+
        td(esc(it.cod_mercaderia),'white-space:nowrap;')+
        td(esc(it.descripcion))+
        td(esc(it.cantidad),'text-align:center;white-space:nowrap;')+
        td(esc(it.um),'text-align:center;color:'+muted+';white-space:nowrap;')+
        td(esc(it.uso_texto||''))+
        td(it.n_reserva?esc(it.n_reserva):'—','white-space:nowrap;color:'+muted+';')+
      '</tr>';
    }).join('');
    return '<div style="font-family:'+ff+';font-weight:normal;color:'+ink+';">'+
      '<div style="font-family:'+ff+';font-size:19px;font-weight:normal;color:#111827;margin:0 0 12px;"><span style="font-weight:bold;">Inventario - Uso Interno</span></div>'+
      '<div style="font-family:'+ff+';font-size:13px;font-weight:normal;color:#374151;margin:0 0 16px;">Fecha: '+esc(fmtFecha(u.fecha_emision))+' &nbsp;·&nbsp; Sector: <font color="'+blue+'" style="font-weight:bold;">'+esc(u.sector)+'</font></div>'+
      '<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid '+line+';font-weight:normal;">'+
        '<tr>'+head('Cód. Mercadería')+head('Descripción')+head('Cant','text-align:center')+head('UM','text-align:center')+head('Uso')+head('N.Reserva')+'</tr>'+
        rows+
      '</table>'+
    '</div>';
  }

  function copyReport(u){
    var html=reporteEmailHTML(u);
    try{
      var data=[new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([plainReport(u)],{type:'text/plain'})})];
      navigator.clipboard.write(data).then(function(){ toast('Copiado — pegalo en Outlook','ok'); }, function(){ legacyCopy(u); });
    }catch(_){ legacyCopy(u); }
  }
  function legacyCopy(u){
    var cont=document.createElement('div'); cont.innerHTML=reporteEmailHTML(u); cont.style.position='fixed'; cont.style.left='-9999px'; cont.style.fontWeight='normal'; document.body.appendChild(cont);
    var range=document.createRange(); range.selectNode(cont); var sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    try{ document.execCommand('copy'); toast('Copiado — pegalo en Outlook','ok'); }catch(e){ toast('No se pudo copiar','err'); }
    sel.removeAllRanges(); cont.remove();
  }
  function plainReport(u){
    var lines=['Inventario – Uso Interno '+(u.nro||''),'Fecha: '+fmtFecha(u.fecha_emision),'Sector: '+u.sector,''];
    (u.items||[]).forEach(function(it){ lines.push(it.cod_mercaderia+'  '+it.descripcion+'  '+it.cantidad+' '+it.um+'  '+(it.uso_texto||'')); });
    return lines.join('\n');
  }
  function printReporte(u){
    var old=q('#printArea'); if(old) old.remove();
    var area=document.createElement('div'); area.id='printArea'; area.innerHTML=reporteEmailHTML(u);
    document.body.appendChild(area); window.print(); setTimeout(function(){ area.remove(); }, 500);
  }

  /* ── Vista AUDITORÍA ──────────────────────────────────────── */
  var ACC_LABEL={ crear:'Creó el uso interno', autorizar:'Autorizó', cargar_sap:'Cargó a SAP', dar_baja:'Dio de baja', terminar:'Terminado', anular:'Anuló', editar:'Editó', asignar_ceco:'Asignó CECO', eliminar_item:'Eliminó un material', eliminar:'Eliminó el documento' };
  function renderAuditoria(){
    var root=q('#viewRoot');
    root.innerHTML='<div class="view"><div class="list-toolbar"><div class="list-title">Auditoría de acciones</div></div><div id="auditHost"></div></div>';
    Promise.all([API.listAuditoria(), API.listUsos()]).then(function(res){
      var list=res[0]||[], usos=res[1]||[];
      var usoMap={}, itemMap={};
      usos.forEach(function(u){ usoMap[u.id]=u; (u.items||[]).forEach(function(it){ itemMap[it.id]=it; }); });
      state._reRender=function(){ paint(list, usoMap, itemMap); };
      paint(list, usoMap, itemMap);
    });
    var ITEM_ACC={ cargar_sap:1, dar_baja:1, editar:1, eliminar_item:1 };
    function enrich(a, usoMap, itemMap){
      var uso=usoMap[a.uso_id], it=a.item_id?itemMap[a.item_id]:null, chips=[], primary;
      if(ITEM_ACC[a.accion] && it){
        primary=it.descripcion||it.cod_mercaderia||'—';
        if(it.cod_mercaderia) chips.push(it.cod_mercaderia);
        if(it.cantidad) chips.push(String(it.cantidad)+' '+(it.um||'UN'));
        if(it.n_reserva) chips.push('Reserva '+it.n_reserva);
        if(it.ceco) chips.push('CECO '+it.ceco);
        if(uso) chips.push(sectorShort(uso.sector));
      } else if(uso){
        primary='Uso interno '+uso.nro;
        chips.push(sectorShort(uso.sector));
        if(uso.items) chips.push(uso.items.length+(uso.items.length===1?' línea':' líneas'));
        if(uso.solicitante) chips.push(uso.solicitante);
      } else {
        var parts=String(a.detalle||'').split(' · ');
        primary=parts[0]||(ACC_LABEL[a.accion]||a.accion); chips=parts.slice(1);
      }
      var sub=[]; if(ITEM_ACC[a.accion] && uso) sub.push(uso.nro); sub.push(a.usuario||'Sistema');
      return { primary:primary, meta:chips.join('   ·   '), sub:sub.join('  ·  ') };
    }
    function paint(list, usoMap, itemMap){
      var s=state.search;
      var f=list.filter(function(a){ if(!s) return true; var e=enrich(a,usoMap,itemMap); return ((ACC_LABEL[a.accion]||a.accion)+' '+e.primary+' '+e.meta+' '+e.sub).toLowerCase().indexOf(s)!==-1; });
      var host=q('#auditHost');
      if(!f.length){ host.innerHTML='<div class="empty-state"><div class="empty-state__icon">'+ICONS.clock+'</div><div class="empty-state__title">Sin acciones registradas</div><p class="empty-state__text">Las acciones aparecerán acá a medida que se creen, autoricen, carguen y den de baja usos internos.</p></div>'; return; }
      var groups={}, order=[];
      f.forEach(function(a){ var d=String(a.created_at).slice(0,10); if(!groups[d]){ groups[d]=[]; order.push(d); } groups[d].push(a); });
      order.sort(function(a,b){ return String(b).localeCompare(String(a)); });
      var animate=!state.search, ri=0;
      var html=order.map(function(d){
        var evs=groups[d].map(function(a){
          var c=NOTIF_COLOR[a.accion]||{dot:'#94a3b8',bg:'#f1f5f9',color:'#475569',label:(ACC_LABEL[a.accion]||a.accion)};
          var t=String(fmtDT(a.created_at)).slice(11);
          var cls='audit-ev'+(animate?' mo-row':''), st=animate?' style="animation-delay:'+(Math.min(ri++,20)*28)+'ms"':'';
          var e=enrich(a, usoMap, itemMap);
          return '<div class="'+cls+'"'+st+'>'+
            '<div class="audit-ev__time">'+esc(t)+'</div>'+
            '<div class="audit-ev__mk"><span class="audit-ev__dot" style="background:'+c.dot+'"></span></div>'+
            '<div class="audit-ev__body"><div class="audit-ev__line">'+
              '<span class="audit-ev__tag" style="background:'+c.bg+';color:'+c.color+'">'+esc(c.label)+'</span>'+
              '<span class="audit-ev__obj">'+esc(e.primary)+'</span>'+
              (e.meta?'<span class="audit-ev__meta">'+esc(e.meta)+'</span>':'')+'</div>'+
            '<div class="audit-ev__sub">'+esc(e.sub)+'</div></div></div>';
        }).join('');
        return '<div class="audit-day"><div class="audit-day__head"><span class="cal-ic">'+ICONS.calendar+'</span>'+esc(fmtFecha(d))+'<span class="date-count">'+groups[d].length+'</span></div><div class="audit-tl">'+evs+'</div></div>';
      }).join('');
      host.innerHTML='<div class="table-wrap" style="padding:16px 22px 8px">'+html+'</div>';
    }
  }

  /* ── Init ─────────────────────────────────────────────────── */
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',waitForAlasAuth); else waitForAlasAuth();

})();
