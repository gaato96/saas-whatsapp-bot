-- =========================================================================
-- SAAS CHATBOT PLATFORM DATABASE SCHEMA UPDATE FOR IPHONES & ORDER OBSERVATIONS
-- Ejecutar en Supabase SQL Editor
-- =========================================================================

-- 1. Registrar el nuevo valor 'iPhones' en el enum 'rubro_type' si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'rubro_type' AND e.enumlabel = 'iPhones'
  ) THEN
    ALTER TYPE rubro_type ADD VALUE 'iPhones';
  END IF;
END
$$;

-- 2. Agregar la columna 'notes' a public.orders_bookings para observaciones generales
ALTER TABLE public.orders_bookings ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.orders_bookings.notes IS 'Observaciones generales del pedido (ej. instrucciones de entrega, cambio, etc.)';

-- 3. Actualizar la función process_automatic_checkout para soportar
-- nombre del cliente, dirección de entrega y observaciones generales (notes).
CREATE OR REPLACE FUNCTION public.process_automatic_checkout(
  p_business_id uuid,
  p_customer_phone text,
  p_payment_method payment_method_type,
  p_total numeric,
  p_items jsonb,
  p_customer_name text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_item json;
  v_product_id uuid;
  v_qty integer;
  v_current_stock integer;
  v_product_name text;
  v_rubro text;
  v_order_status order_status;
  v_payment_status text;
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

  -- 3. Determinar estado y payment_status según método de pago
  -- Transferencia → pending_payment + payment_status='pending'
  -- Efectivo      → confirmed + payment_status='pending'
  IF p_payment_method = 'transfer' THEN
    v_order_status := 'pending_payment'::order_status;
  ELSE
    v_order_status := 'confirmed'::order_status;
  END IF;
  v_payment_status := 'pending';

  -- 4. Crear el pedido con todos los campos adicionales
  INSERT INTO public.orders_bookings (
    business_id,
    customer_phone,
    status,
    payment_method,
    payment_status,
    total,
    items,
    customer_name,
    delivery_address,
    notes
  ) VALUES (
    p_business_id,
    p_customer_phone,
    v_order_status,
    p_payment_method,
    v_payment_status,
    p_total,
    p_items,
    p_customer_name,
    p_delivery_address,
    p_notes
  ) RETURNING id INTO v_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
