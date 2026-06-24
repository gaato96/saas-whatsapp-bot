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

-- 5. Agregar soporte para imágenes y documentos en el historial de chats
ALTER TABLE public.chat_history ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.chat_history ADD COLUMN IF NOT EXISTS media_type text;

-- 6. Modificar la función process_automatic_checkout para omitir stock en rubro 'Comida'
CREATE OR REPLACE FUNCTION public.process_automatic_checkout(
  p_business_id uuid,
  p_customer_phone text,
  p_payment_method payment_method_type,
  p_total numeric,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_item json;
  v_product_id uuid;
  v_qty integer;
  v_current_stock integer;
  v_product_name text;
  v_rubro text;
BEGIN
  -- Obtener el rubro del negocio
  SELECT rubro::text INTO v_rubro FROM public.businesses WHERE id = p_business_id;

  -- 1. Verificar existencia de todos los ítems (y stock si no es rubro 'Comida')
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    
    SELECT name, stock INTO v_product_name, v_current_stock 
    FROM public.products_services 
    WHERE id = v_product_id AND business_id = p_business_id;
    
    IF v_current_stock IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Producto no encontrado en el catálogo: ' || (v_item->>'name'));
    END IF;
    
    -- Solo verificar stock si NO es rubro Comida
    IF v_rubro <> 'Comida' THEN
      IF v_current_stock < v_qty THEN
        RETURN jsonb_build_object('success', false, 'error', 'Stock insuficiente para "' || v_product_name || '". Stock disponible: ' || v_current_stock);
      END IF;
    END IF;
  END LOOP;

  -- 2. Restar stock (solo si NO es rubro Comida)
  IF v_rubro <> 'Comida' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      v_product_id := (v_item->>'product_id')::uuid;
      v_qty := (v_item->>'qty')::integer;
      
      UPDATE public.products_services
      SET stock = stock - v_qty
      WHERE id = v_product_id;
    END LOOP;
  END IF;

  -- 3. Crear el pedido
  INSERT INTO public.orders_bookings (
    business_id,
    customer_phone,
    status,
    payment_method,
    total,
    items
  ) VALUES (
    p_business_id,
    p_customer_phone,
    CASE WHEN p_payment_method = 'transfer' THEN 'pending_payment'::order_status ELSE 'confirmed'::order_status END,
    p_payment_method,
    p_total,
    p_items
  ) RETURNING id INTO v_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Asegurar que las tablas de chat y sesiones estén en la publicación de Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_history;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
  END IF;
END
$$;
