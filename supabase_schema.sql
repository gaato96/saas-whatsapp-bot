-- ==========================================
-- SAAS MULTI-TENANT CHATBOT PLATFORM SCHEMA
-- PHASE 1: DATABASE STRUCTURE (SUPABASE / POSTGRESQL)
-- ==========================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- 1. ENUMS Y TIPOS PERSONALIZADOS
create type user_role as enum ('superadmin', 'business_owner', 'business_agent');
create type rubro_type as enum (
  'Comida', 
  'Peluquería', 
  'Gym', 
  'Médico', 
  'Hotel', 
  'E-commerce', 
  'Cursos', 
  'Servicios', 
  'Automotriz', 
  'Personalizado'
);
create type order_status as enum (
  'pending_payment', 
  'confirmed', 
  'processing', 
  'completed', 
  'cancelled'
);
create type payment_method_type as enum (
  'transfer', 
  'cash'
);
create type chat_session_status as enum (
  'bot_handling', 
  'human_required'
);
create type sender_type as enum (
  'bot', 
  'customer', 
  'agent'
);

-- 2. TABLA DE PERFILES DE USUARIOS (Vinculado a Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role user_role default 'business_owner'::user_role,
  name text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. TABLA DE NEGOCIOS (Multi-tenant principal)
create table public.businesses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  rubro rubro_type not null default 'Personalizado'::rubro_type,
  whatsapp_config jsonb default '{
    "phone_number_id": null,
    "verify_token": null,
    "access_token": null,
    "waba_id": null
  }'::jsonb not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Tabla de relación entre usuarios y negocios (permite que un admin maneje varios o que haya agentes por negocio)
create table public.business_members (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role user_role default 'business_agent'::user_role,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (business_id, profile_id)
);

-- 4. TABLA DE DATOS VARIABLES POR RUBRO
create table public.business_rubro_data (
  business_id uuid references public.businesses(id) on delete cascade primary key,
  custom_metadata jsonb default '{}'::jsonb not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. TABLA DE PRODUCTOS Y SERVICIOS
create table public.products_services (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  stock integer default 0 not null check (stock >= 0),
  image_url text,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. TABLA DE PEDIDOS Y TURNOS (CRM / ERP Compacto)
create table public.orders_bookings (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  customer_phone text not null,
  status order_status default 'pending_payment'::order_status not null,
  payment_method payment_method_type default 'cash'::payment_method_type not null,
  total numeric(10, 2) default 0.00 not null check (total >= 0),
  items jsonb default '[]'::jsonb not null, -- [{ "product_id": "uuid", "name": "Hamburguesa", "qty": 2, "price": 10.50 }]
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. TABLA DE SESIONES DE CHAT
create table public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  customer_phone text not null,
  last_interaction timestamptz default timezone('utc'::text, now()) not null,
  status chat_session_status default 'bot_handling'::chat_session_status not null,
  unique (business_id, customer_phone)
);

-- 8. TABLA DE HISTORIAL DE CHATS
create table public.chat_history (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  sender sender_type not null,
  message_text text not null,
  timestamp timestamptz default timezone('utc'::text, now()) not null
);

-- Habilitar el canal en tiempo real (Supabase Realtime) para orders_bookings
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.orders_bookings;

-- 9. POLÍTICAS DE SEGURIDAD POR FILA (RLS) - Aislamiento Multi-tenant
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.business_rubro_data enable row level security;
alter table public.products_services enable row level security;
alter table public.orders_bookings enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_history enable row level security;

-- Función de ayuda para verificar pertenencia al negocio
create or replace function public.is_member_of_business(business_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 
    from public.business_members 
    where business_members.business_id = business_uuid 
      and business_members.profile_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Función de ayuda para verificar si es superadmin
create or replace function public.is_superadmin()
returns boolean as $$
begin
  return exists (
    select 1 
    from public.profiles 
    where profiles.id = auth.uid() 
      and profiles.role = 'superadmin'::user_role
  );
end;
$$ language plpgsql security definer;

-- Políticas de Perfiles
create policy "Superadmins pueden todo en perfiles" on public.profiles
  for all using (is_superadmin());
create policy "Usuarios pueden ver su propio perfil" on public.profiles
  for select using (auth.uid() = id);

-- Políticas de Negocios
create policy "Superadmins pueden todo en negocios" on public.businesses
  for all using (is_superadmin());
create policy "Miembros del negocio pueden ver su negocio" on public.businesses
  for select using (is_member_of_business(id));

-- Políticas de Miembros del Negocio
create policy "Superadmins pueden todo en business_members" on public.business_members
  for all using (is_superadmin());
create policy "Miembros pueden ver otros miembros de su negocio" on public.business_members
  for select using (is_member_of_business(business_id));

-- Políticas de Datos de Rubro
create policy "Superadmins pueden todo en rubro_data" on public.business_rubro_data
  for all using (is_superadmin());
create policy "Miembros pueden ver y actualizar datos de su rubro" on public.business_rubro_data
  for all using (is_member_of_business(business_id));

-- Políticas de Productos
create policy "Miembros pueden gestionar productos de su negocio" on public.products_services
  for all using (is_member_of_business(business_id));

-- Políticas de Pedidos/Turnos
create policy "Miembros pueden gestionar pedidos de su negocio" on public.orders_bookings
  for all using (is_member_of_business(business_id));

-- Políticas de Sesiones de Chat
create policy "Miembros pueden ver/gestionar sesiones de chat de su negocio" on public.chat_sessions
  for all using (is_member_of_business(business_id));

-- Políticas de Historial de Chat
create policy "Miembros pueden ver/gestionar historial de su negocio" on public.chat_history
  for all using (
    exists (
      select 1 from public.chat_sessions 
      where chat_sessions.id = chat_history.session_id 
        and is_member_of_business(chat_sessions.business_id)
    )
  );

-- Trigger para crear perfil al registrarse en Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'business_owner'::user_role),
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. FUNCIÓN PARA DEDUCIR STOCK DE PRODUCTOS
create or replace function public.deduct_product_stock(product_uuid uuid, qty_to_deduct integer)
returns void as $$
begin
  update public.products_services
  set stock = stock - qty_to_deduct
  where id = product_uuid;
end;
$$ language plpgsql security definer;
-- 11. FUNCIÓN TRANSACCIONAL PARA CHECKOUT AUTOMÁTICO
create or replace function public.process_automatic_checkout(
  p_business_id uuid,
  p_customer_phone text,
  p_payment_method payment_method_type,
  p_total numeric,
  p_items jsonb
) returns jsonb as $$
declare
  v_order_id uuid;
  v_item json;
  v_product_id uuid;
  v_qty integer;
  v_current_stock integer;
  v_product_name text;
begin
  -- 1. Verificar stock de todos los ítems antes de proceder
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    
    select name, stock into v_product_name, v_current_stock 
    from public.products_services 
    where id = v_product_id and business_id = p_business_id;
    
    if v_current_stock is null then
      return jsonb_build_object('success', false, 'error', 'Producto no encontrado en el catálogo');
    end if;
    
    if v_current_stock < v_qty then
      return jsonb_build_object('success', false, 'error', 'Stock insuficiente para "' || v_product_name || '". Stock disponible: ' || v_current_stock);
    end if;
  end loop;

  -- 2. Restar stock de todos los ítems
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    
    update public.products_services
    set stock = stock - v_qty
    where id = v_product_id;
  end loop;

  -- 3. Crear el pedido
  insert into public.orders_bookings (
    business_id,
    customer_phone,
    status,
    payment_method,
    total,
    items
  ) values (
    p_business_id,
    p_customer_phone,
    case when p_payment_method = 'transfer' then 'pending_payment'::order_status else 'confirmed'::order_status end,
    p_payment_method,
    p_total,
    p_items
  ) returning id into v_order_id;

  return jsonb_build_object('success', true, 'order_id', v_order_id);
exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;
