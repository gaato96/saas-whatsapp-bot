-- =========================================================
-- MIGRACIÓN: Follow-up automático
-- REQUISITO: Habilitar pg_cron y pg_net en
--   Dashboard > Database > Extensions
-- =========================================================

-- PASO 1: Columna followup_sent_at en chat_sessions
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ DEFAULT NULL;


-- PASO 2: Cron job (ejecutar SOLO después de habilitar pg_cron y pg_net)
-- Dispara la Edge Function cada 30 minutos

SELECT cron.schedule(
  'follow-up-scheduler',
  '0,30 * * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://ghhezjfjabbhwrwaieyv.supabase.co/functions/v1/follow-up-scheduler',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $cron$
);

-- Para verificar que quedó registrado:
-- SELECT jobname, schedule, command FROM cron.job;

-- Para borrar y reconfigurar:
-- SELECT cron.unschedule('follow-up-scheduler');
