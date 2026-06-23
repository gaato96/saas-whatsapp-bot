-- =========================================================================
-- SAAS CHATBOT PLATFORM DATABASE SCHEMA UPDATE
-- ESTAS CONSULTAS AGREGAN LOS NUEVOS CAMPOS REQUERIDOS PARA LA SUSCRIPCIÓN,
-- EL RUBRO 'AGENCIA', ARCHIVADO DE CHATS Y NOTAS/ALIAS DE CLIENTES.
-- =========================================================================

-- 1. Agregar nuevas columnas a la tabla de negocios (public.businesses)
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_price numeric(10, 2) DEFAULT 0.00;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS expiration_date timestamptz DEFAULT (now() + interval '30 days');
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS enabled_modules text[] DEFAULT ARRAY['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog', 'agenda'];

-- 2. Registrar el nuevo valor 'Agencia' en el enum 'rubro_type' si no existe
-- Usamos un bloque anónimo para evitar que dé error si ya existe el valor en el enum.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'rubro_type' AND e.enumlabel = 'Agencia'
  ) THEN
    ALTER TYPE rubro_type ADD VALUE 'Agencia';
  END IF;
END
$$;

-- 3. Agregar columnas en la tabla de sesiones de chat (public.chat_sessions) para el CRM y archivado
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- 4. Asegurar política de actualización (update) para miembros de negocios en businesses
-- Así pueden actualizar su propia configuración de WhatsApp y datos de negocio.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'businesses' AND policyname = 'Miembros del negocio pueden actualizar su negocio'
  ) THEN
    CREATE POLICY "Miembros del negocio pueden actualizar su negocio" ON public.businesses
      FOR UPDATE USING (public.is_member_of_business(id));
  END IF;
END
$$;
