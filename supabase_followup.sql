-- =========================================================
-- MIGRACIÓN: Follow-up automático
-- Pegar en Supabase > SQL Editor > New query
-- =========================================================

-- PASO 1: Columna followup_sent_at en chat_sessions
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ DEFAULT NULL;


-- =========================================================
-- PASO 2: Cron job (elegí UNA de las dos opciones abajo)
-- =========================================================

-- OPCIÓN A — Cron sin secret (más simple, recomendada para empezar)
-- Reemplazá SOLO "TU_PROJECT_REF" por tu ref de proyecto Supabase
-- (lo ves en Settings > General, ej: "abcdefghijklmn")

SELECT cron.schedule(
  'follow-up-scheduler',
  '0,30 * * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://TU_PROJECT_REF.supabase.co/functions/v1/follow-up-scheduler',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $cron$
);


-- OPCIÓN B — Cron con Authorization header (más seguro)
-- Reemplazá TU_PROJECT_REF y TU_ANON_KEY (Settings > API)

-- SELECT cron.schedule(
--   'follow-up-scheduler',
--   '0,30 * * * *',
--   $cron$
--   SELECT net.http_post(
--     url     := 'https://TU_PROJECT_REF.supabase.co/functions/v1/follow-up-scheduler',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer TU_ANON_KEY"}'::jsonb,
--     body    := '{}'::jsonb
--   );
--   $cron$
-- );


-- Para verificar que el cron quedó registrado:
-- SELECT * FROM cron.job;

-- Para borrar el cron si querés reconfigurarlo:
-- SELECT cron.unschedule('follow-up-scheduler');
