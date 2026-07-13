/* ============================================================
   casos-ceco.js — Datos maestros del módulo Inventario
   Extraído de "CECO INVENTARIO.xlsx" (Hoja1).
   - CASOS_CECO: mapea la FORMA DE CARGA (uso) → cuenta mayor + ceco + orden + detalle.
     Se usa al cargar una línea a SAP para autocompletar esos campos.
   - CECO_DIC: diccionario de códigos CECO → área.
   - MERCADERIAS_DEMO: catálogo de ejemplo (el real lo cargás en Supabase).
   ============================================================ */
(function () {
  'use strict';

  // ── Casos / Formas de carga (de CECO INVENTARIO.xlsx — actualizado) ────────
  window.CASOS_CECO = [
    { forma:'MANT.LOCALES E INST.',                             cuenta:'61234006', ceco:'DAL2000000', orden:'1012752', detalle:'MAT. REPARACIONES ELECTRICAS' },
    { forma:'MANT.LOCALES E INST.',                             cuenta:'61234006', ceco:'EAD8400000', orden:'1012752', detalle:'MATERIALES Y REPARACIONES ELECTRICAS' },
    { forma:'GASTOS EMB/ FERRETERIA',                           cuenta:'61238004', ceco:'DAL2000000', orden:'1012787', detalle:'FLEJES Y SELLOS METALICOS' },
    { forma:'GASTOS EMB/ FERRETERIA',                           cuenta:'61238004', ceco:'DAL4000000', orden:'1012787', detalle:'FLEJES Y SELLOS METALICOS' },
    { forma:'ARTICULOS DE LIMPIEZA',                            cuenta:'61238018', ceco:'DAL2000000', orden:'1012801', detalle:'ARTÍCULOS DE LIMPIEZA' },
    { forma:'IMPUESTOS Y TASAS',                                cuenta:'61281101', ceco:'ECO7000000', orden:'1012973', detalle:'INFORME BIMESTRAL VUE' },
    { forma:'MANTENIMIENTO P/ MAQ/EQUIPOS',                     cuenta:'61234007', ceco:'FSI57HI000', orden:'1013080', detalle:'REPARACION DEL SOLDADOR' },
    { forma:'MANTENIMIENTO P/ MAQ/EQUIPOS',                     cuenta:'61234007', ceco:'DAL2000000', orden:'1013121', detalle:'MTTO MONTACARGAS' },
    { forma:'MANTENIMIENTO P/ MAQ/EQUIPOS',                     cuenta:'61234007', ceco:'DAL4000000', orden:'1013121', detalle:'MTTO MONTACARGAS' },
    { forma:'MANTENIMIENTO P/ MAQ/EQUIPOS',                     cuenta:'61234007', ceco:'DAL2000000', orden:'1013122', detalle:'REPARACION MANT/ MAQUINARIAS' },
    { forma:'MANT MUEBLES Y UTILES',                            cuenta:'61234005', ceco:'DAL2000000', orden:'1013228', detalle:'PINTURAS PAREDES Y PISOS' },
    { forma:'INSUMOS TALLER',                                   cuenta:'61213405', ceco:'FSI57HI000', orden:'1013839', detalle:'INSUMOS TALLER' },
    { forma:'EPP (PROTECCION PERS) / UNIFORMES',                cuenta:'61212411', ceco:'DAL2000000', orden:'1014452', detalle:'EQUIPO SEGURIDAD' },
    { forma:'EPP (PROTECCION PERS) / UNIFORMES',                cuenta:'61212411', ceco:'DAL4000000', orden:'1014452', detalle:'EQUIPOS DE SEGURIDAD Y/O PREVENCION' },
    { forma:'EPP (PROTECCION PERS) / UNIFORMES',                cuenta:'61212411', ceco:'FSI53HI000', orden:'1014452', detalle:'EQUIPO SEGURIDAD' },
    { forma:'GTOS DE EMB Y FERRET',                             cuenta:'61238004', ceco:'DAL2000000', orden:'1015444', detalle:'FAJAS PARA IZAJE DE MATERIALES' },
    { forma:'GTOS DE EMB Y FERRET',                             cuenta:'61238004', ceco:'FSI51HI000', orden:'1015444', detalle:'FAJAS PARA IZAJE DE MATERIALES' },
    { forma:'GTOS DE EMB Y FERRET',                             cuenta:'61238004', ceco:'DAL2000000', orden:'1015444', detalle:'INSUMOS MAT. PRODUCCION' },
    { forma:'GASTOS EMB/ FERRETERIA',                           cuenta:'61238004', ceco:'DAL2000000', orden:'1015492', detalle:'PALLETS PARA ALMACENAMIENTO' },
    { forma:'OTROS GASTOS RODADOS',                             cuenta:'61232005', ceco:'DAL4000000', orden:'1017195', detalle:'CELSO' },
    { forma:'OTROS GASTOS RODADOS',                             cuenta:'61232005', ceco:'DAL4000000', orden:'1015718', detalle:'JULIO' },
    { forma:'SERVICIOS DE FLETES P/ABASTECIMIENTO EN ALMACENES', cuenta:'61213502', ceco:'DAL2000000', orden:'1018360', detalle:'ALQUILER DE MAQUINARIAS' },
    { forma:'PINTURAS',                                         cuenta:'61238004', ceco:'DAL2000000', orden:'1020520', detalle:'MATERIALES SEÑALIZACION PRODUCTOS' },
    { forma:'(N.C) DEBITO A REGULACION',                        cuenta:'11321008', ceco:'',           orden:'',        detalle:'' }
  ];

  // ── Diccionario de CECO → área ─────────────────────────────────────────────
  window.CECO_DIC = {
    'DAL2000000': 'ALMACEN',
    'DAL4000000': 'FABRICA / EXPEDICION',
    'FSI57HI000': 'TALLER',
    'FSI51HI000': 'TODAS LAS MAQUINAS',
    'FSI53HI000': 'GENERICO DE ALMACENAJE',
    'EAD8400000': 'MANTENIMIENTO EDIFICIO',
    'ECO7000000': 'ADMINISTRACION'
  };

  // ── Catálogo demo (reemplazable por el de Supabase) ────────────────────────
  window.MERCADERIAS_DEMO = [
    { codigo:'LA6901998',     descripcion:'GUANTE DE CUERO CANO LARGO-NACIONAL', um:'PAR' },
    { codigo:'LA5500500',     descripcion:'GUANTE P/TRABAJO OPTIMA',             um:'PAR' },
    { codigo:'LAPE105E',      descripcion:'CINTA MET.KOMELON PRO ERGO',          um:'UN'  },
    { codigo:'LA010314TR',    descripcion:'CINTA+CATRACA "TR" 7500KGx9M',        um:'UN'  },
    { codigo:'LAHBLM1700/37', descripcion:'BOTIN MICRO.PUNT.COM.C/ CN°37',       um:'PAR' },
    { codigo:'LAHBLM1700/38', descripcion:'BOTIN MICRO.PUNT.COM.C/ CN°38',       um:'PAR' },
    { codigo:'LAHBLM1700/40', descripcion:'BOTIN MICRO.PUNT.COM.C/ CN°40',       um:'PAR' },
    { codigo:'LAHBLM1700/42', descripcion:'BOTIN MICRO.PUNT.COM.C/ CN°42',       um:'PAR' },
    { codigo:'LAHBLM1700/43', descripcion:'BOTIN MICRO.PUNT.COM.C/ CN°43',       um:'PAR' }
  ];

  // ── Sectores / Departamentos ───────────────────────────────────────────────
  window.SECTORES = [
    'ALMACENAMIENTO-DEPOSITO',
    'ALMACENAMIENTO-FABRICA',
    'PRODUCCION',
    'ADMINISTRACION'
  ];

})();
