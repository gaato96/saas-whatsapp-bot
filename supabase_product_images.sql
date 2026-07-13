-- ========================================================
-- ZAPFLOW — MIGRACIÓN PARA IMÁGENES DE PRODUCTOS Y STORAGE
-- Ejecutar en Supabase SQL Editor
-- ========================================================

-- 1. Agregar columna image_url a la tabla products_services
ALTER TABLE public.products_services
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Crear bucket de storage para imágenes de productos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Crear políticas de acceso para el bucket 'product-images'
-- Eliminar políticas anteriores si existen para evitar errores de duplicación
DROP POLICY IF EXISTS "Permitir lectura publica de imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizar a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrar a usuarios autenticados" ON storage.objects;

-- Permitir que cualquier persona (público) lea las imágenes
CREATE POLICY "Permitir lectura publica de imagenes"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Permitir que usuarios autenticados suban imágenes
CREATE POLICY "Permitir subida a usuarios autenticados"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Permitir que usuarios autenticados actualicen sus imágenes
CREATE POLICY "Permitir actualizar a usuarios autenticados"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Permitir que usuarios autenticados borren sus imágenes
CREATE POLICY "Permitir borrar a usuarios autenticados"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
