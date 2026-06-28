-- ==========================================
-- ZAPFLOW — MIGRACIÓN DE CAMPOS ADICIONALES
-- Ejecutar en Supabase SQL Editor
-- ==========================================

-- 1. Agregar nuevo estado 'shipped' (Enviado) al enum order_status
-- NOTA: En PostgreSQL no se puede eliminar valores de enum, solo agregar
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'shipped';

-- 2. Agregar campos a orders_bookings (pedidos)
ALTER TABLE public.orders_bookings
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- 3. Agregar campo 'apodo' y detalles de contacto a chat_sessions
-- (customer_name y notes ya fueron agregados en supabase_update_schema.sql)
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS contact_details JSONB DEFAULT '{}'::JSONB;

-- 4. Comentarios documentando los campos JSONB
COMMENT ON COLUMN public.chat_sessions.contact_details IS 
  'Detalles de contacto frecuente: { "address": "...", "neighborhood": "...", "delivery_notes": "...", "preferences": "..." }';

COMMENT ON COLUMN public.orders_bookings.customer_name IS 
  'Nombre del cliente en el pedido (puede ser el alias definido por el operador)';

COMMENT ON COLUMN public.orders_bookings.delivery_address IS 
  'Dirección de entrega del pedido';

-- 5. Función para enviar notificación de pedido enviado (para registro)
-- El envío real lo hace el frontend via WhatsApp Cloud API
CREATE OR REPLACE FUNCTION public.mark_order_shipped(p_order_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.orders_bookings
  SET status = 'shipped'::order_status
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
