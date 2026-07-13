-- ========================================================
-- MIGRACIÓN: Imágenes de Productos
-- Pegar en Supabase > SQL Editor > New query
-- ========================================================

-- 1. Columna image_url en products_services
ALTER TABLE public.products_services
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Políticas RLS del bucket (borrar si ya existen para evitar duplicados)
DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;

CREATE POLICY "product_images_select"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');
