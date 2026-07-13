-- =========================================================
-- MIGRACIÓN: Follow-up automático
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- 1. Agregar columna followup_sent_at a chat_sessions
--    para registrar cuándo se envió el último follow-up
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Crear el cron job que dispara la Edge Function
--    cada 30 minutos (requiere pg_cron habilitado en Supabase)
SELECT cron.schedule(
  'follow-up-scheduler',           -- nombre del job
  '*/30 * * * *',                   -- cada 30 minutos
  $$
  SELECT net.http_post(
    url    := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_URL'') || ''/functions/v1/follow-up-scheduler'',
    headers := jsonb_build_object(
      ''Content-Type'',  ''application/json'',
      ''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''CRON_SECRET'')
    ),
    body   := ''{}''::jsonb
  );
  $$
);

-- Alternativa simple si no hay vault configurado:
-- Reemplaza YOUR_SUPABASE_URL y YOUR_CRON_SECRET con tus valores reales
-- y ejecuta solo el bloque de abajo:

/*
SELECT cron.schedule(
  'follow-up-scheduler',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://YOUR_SUPABASE_URL.supabase.co/functions/v1/follow-up-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
*/
