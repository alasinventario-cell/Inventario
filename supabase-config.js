/**
 * supabase-config.js — Cliente Supabase del módulo Inventario
 *
 * Cuando tengas el proyecto Supabase DEDICADO de Inventario, pegá su URL + anon key
 * abajo. Mientras sigan los placeholders, el módulo corre en MODO DEMO (localStorage).
 *
 * La anon key es pública por diseño. La seguridad real recae en RLS.
 * NUNCA poner aquí la service_role key.
 */
(function () {
  'use strict';

  // Proyecto Supabase dedicado de Inventario
  var SUPABASE_URL  = 'https://ztzmhkjvfoutoprtttha.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0em1oa2p2Zm91dG9wcnR0dGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MTc4NDIsImV4cCI6MjA5OTQ5Mzg0Mn0.Wxf72I2zjivUqpIqgzxmJ91NeeFK644Y8bdfOx5z8Ug';

  var placeholder = SUPABASE_URL.indexOf('TU-PROYECTO') !== -1 || SUPABASE_ANON === 'TU_ANON_KEY';

  if (placeholder) {
    window.__inventarioDB = null;
    console.info('[Inventario] Sin credenciales Supabase → MODO DEMO (localStorage).');
    return;
  }

  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.warn('[Inventario] supabase-js no cargado todavía.');
    window.__inventarioDB = null;
    return;
  }

  window.__inventarioDB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false }
  });

  console.info('[Inventario] Supabase conectado:', SUPABASE_URL);
})();
