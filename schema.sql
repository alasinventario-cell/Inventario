-- ============================================================
-- ALAS — Inventario · schema.sql
-- Control de Usos Internos de mercadería con auditoría de estados.
-- Proyecto Supabase DEDICADO. Idempotente (se puede correr varias veces).
--
-- Flujo por línea:  PENDIENTE -> CARGADO (SAP) -> BAJA (terminado)
-- Documento:        EMITIDO -> AUTORIZADO -> TERMINADO (todas las líneas en baja)
-- ============================================================

-- ── Catálogo de mercaderías ────────────────────────────────────────────────
create table if not exists mercaderias (
  codigo      text primary key,
  descripcion text not null,
  um          text default 'UN',
  activo      boolean default true,
  created_at  timestamptz default now()
);

-- ── Casos / Formas de carga (de CECO INVENTARIO.xlsx) ──────────────────────
create table if not exists casos_ceco (
  id           bigint generated always as identity primary key,
  forma_carga  text not null,
  cuenta_mayor text,
  ceco         text,
  orden        text,
  detalle      text,
  activo       boolean default true
);

-- ── Diccionario CECO -> área ───────────────────────────────────────────────
create table if not exists ceco_dic (
  codigo text primary key,
  area   text not null
);

-- ── Documento: Uso Interno (cabecera) ──────────────────────────────────────
create table if not exists usos_internos (
  id             bigint generated always as identity primary key,
  nro            text unique,
  fecha_emision  date not null default current_date,
  sector         text not null,          -- ALMACENAMIENTO-DEPOSITO | -FABRICA | PRODUCCION | ADMINISTRACION
  solicitante    text,
  estado         text not null default 'emitido',  -- emitido | autorizado | terminado | anulado
  created_by     text,
  created_at     timestamptz default now(),
  autorizado_por text,
  autorizado_at  timestamptz
);

-- ── Línea: mercadería del uso interno ──────────────────────────────────────
create table if not exists uso_items (
  id            bigint generated always as identity primary key,
  uso_id        bigint not null references usos_internos(id) on delete cascade,
  cod_mercaderia text,
  descripcion   text,
  cantidad      numeric not null default 0,
  um            text default 'UN',
  uso_texto     text,                    -- motivo / uso libre
  -- Datos SAP (se completan al cargar; el caso los autocompleta desde casos_ceco)
  caso_id       bigint references casos_ceco(id),
  cuenta_mayor  text,
  ceco          text,
  orden         text,
  n_reserva     text,
  -- Estado de la línea
  sap_estado    text not null default 'pendiente',  -- pendiente | cargado | baja
  cargado_por   text,
  cargado_at    timestamptz,
  baja_por      text,
  baja_at       timestamptz,
  created_at    timestamptz default now()
);
create index if not exists idx_uso_items_uso   on uso_items(uso_id);
create index if not exists idx_uso_items_estado on uso_items(sap_estado);

-- ── Auditoría: log de acciones y cambios de estado ─────────────────────────
create table if not exists uso_auditoria (
  id              bigint generated always as identity primary key,
  uso_id          bigint,
  item_id         bigint,
  accion          text not null,         -- crear | autorizar | cargar_sap | dar_baja | anular | editar
  estado_anterior text,
  estado_nuevo    text,
  usuario         text,
  detalle         text,
  created_at      timestamptz default now()
);
create index if not exists idx_auditoria_uso on uso_auditoria(uso_id);

-- ── RLS: patrón del ecosistema (seguridad por SSO del launcher; anon permitido) ──
alter table mercaderias    enable row level security;
alter table casos_ceco     enable row level security;
alter table ceco_dic       enable row level security;
alter table usos_internos  enable row level security;
alter table uso_items      enable row level security;
alter table uso_auditoria  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['mercaderias','casos_ceco','ceco_dic','usos_internos','uso_items','uso_auditoria']
  loop
    execute format('drop policy if exists anon_all on %I;', t);
    execute format('create policy anon_all on %I for all to anon using (true) with check (true);', t);
  end loop;
end $$;

-- ── Seed: casos CECO (de CECO INVENTARIO.xlsx — actualizado, códigos completos) ──
delete from casos_ceco;
insert into casos_ceco (forma_carga, cuenta_mayor, ceco, orden, detalle) values
 ('MANT.LOCALES E INST.','61234006','DAL2000000','1012752','MAT. REPARACIONES ELECTRICAS'),
 ('MANT.LOCALES E INST.','61234006','EAD8400000','1012752','MATERIALES Y REPARACIONES ELECTRICAS'),
 ('GASTOS EMB/ FERRETERIA','61238004','DAL2000000','1012787','FLEJES Y SELLOS METALICOS'),
 ('GASTOS EMB/ FERRETERIA','61238004','DAL4000000','1012787','FLEJES Y SELLOS METALICOS'),
 ('ARTICULOS DE LIMPIEZA','61238018','DAL2000000','1012801','ARTÍCULOS DE LIMPIEZA'),
 ('IMPUESTOS Y TASAS','61281101','ECO7000000','1012973','INFORME BIMESTRAL VUE'),
 ('MANTENIMIENTO P/ MAQ/EQUIPOS','61234007','FSI57HI000','1013080','REPARACION DEL SOLDADOR'),
 ('MANTENIMIENTO P/ MAQ/EQUIPOS','61234007','DAL2000000','1013121','MTTO MONTACARGAS'),
 ('MANTENIMIENTO P/ MAQ/EQUIPOS','61234007','DAL4000000','1013121','MTTO MONTACARGAS'),
 ('MANTENIMIENTO P/ MAQ/EQUIPOS','61234007','DAL2000000','1013122','REPARACION MANT/ MAQUINARIAS'),
 ('MANT MUEBLES Y UTILES','61234005','DAL2000000','1013228','PINTURAS PAREDES Y PISOS'),
 ('INSUMOS TALLER','61213405','FSI57HI000','1013839','INSUMOS TALLER'),
 ('EPP (PROTECCION PERS) / UNIFORMES','61212411','DAL2000000','1014452','EQUIPO SEGURIDAD'),
 ('EPP (PROTECCION PERS) / UNIFORMES','61212411','DAL4000000','1014452','EQUIPOS DE SEGURIDAD Y/O PREVENCION'),
 ('EPP (PROTECCION PERS) / UNIFORMES','61212411','FSI53HI000','1014452','EQUIPO SEGURIDAD'),
 ('GTOS DE EMB Y FERRET','61238004','DAL2000000','1015444','FAJAS PARA IZAJE DE MATERIALES'),
 ('GTOS DE EMB Y FERRET','61238004','FSI51HI000','1015444','FAJAS PARA IZAJE DE MATERIALES'),
 ('GTOS DE EMB Y FERRET','61238004','DAL2000000','1015444','INSUMOS MAT. PRODUCCION'),
 ('GASTOS EMB/ FERRETERIA','61238004','DAL2000000','1015492','PALLETS PARA ALMACENAMIENTO'),
 ('OTROS GASTOS RODADOS','61232005','DAL4000000','1017195','CELSO'),
 ('OTROS GASTOS RODADOS','61232005','DAL4000000','1015718','JULIO'),
 ('SERVICIOS DE FLETES P/ABASTECIMIENTO EN ALMACENES','61213502','DAL2000000','1018360','ALQUILER DE MAQUINARIAS'),
 ('PINTURAS','61238004','DAL2000000','1020520','MATERIALES SEÑALIZACION PRODUCTOS'),
 ('(N.C) DEBITO A REGULACION','11321008',null,null,null);

-- ── Seed: diccionario CECO (códigos completos) ─────────────────────────────
insert into ceco_dic (codigo, area) values
 ('DAL2000000','ALMACEN'),
 ('DAL4000000','FABRICA / EXPEDICION'),
 ('FSI57HI000','TALLER'),
 ('FSI51HI000','TODAS LAS MAQUINAS'),
 ('FSI53HI000','GENERICO DE ALMACENAJE'),
 ('EAD8400000','MANTENIMIENTO EDIFICIO'),
 ('ECO7000000','ADMINISTRACION')
on conflict (codigo) do update set area = excluded.area;

-- ── Seed: mercaderías demo (reemplazar por el catálogo real) ───────────────
insert into mercaderias (codigo, descripcion, um) values
 ('LA6901998','GUANTE DE CUERO CANO LARGO-NACIONAL','PAR'),
 ('LA5500500','GUANTE P/TRABAJO OPTIMA','PAR'),
 ('LAPE105E','CINTA MET.KOMELON PRO ERGO','UN'),
 ('LA010314TR','CINTA+CATRACA "TR" 7500KGx9M','UN'),
 ('LAHBLM1700/37','BOTIN MICRO.PUNT.COM.C/ CN°37','PAR'),
 ('LAHBLM1700/38','BOTIN MICRO.PUNT.COM.C/ CN°38','PAR'),
 ('LAHBLM1700/40','BOTIN MICRO.PUNT.COM.C/ CN°40','PAR'),
 ('LAHBLM1700/42','BOTIN MICRO.PUNT.COM.C/ CN°42','PAR'),
 ('LAHBLM1700/43','BOTIN MICRO.PUNT.COM.C/ CN°43','PAR')
on conflict (codigo) do nothing;
