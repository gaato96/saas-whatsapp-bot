import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Helper para crear el cliente de Supabase con service_role (privilegios de admin)
// Se usa únicamente en el servidor para operaciones administrativas
function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(req: Request) {
  try {
    // 1. Verificar que quien hace la llamada es un superadmin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado: se requiere rol superadmin' }, { status: 403 })
    }

    // 2. Parsear el body con los datos del negocio y las credenciales del owner
    const body = await req.json()
    const {
      name,
      rubro,
      subscription_price,
      expiration_date,
      enabled_modules,
      owner_email,
      owner_password,
      owner_name,
    } = body

    if (!name || !rubro || !owner_email || !owner_password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios: name, rubro, owner_email, owner_password' }, { status: 400 })
    }

    // 3. Usar el service role client para las operaciones privilegiadas
    const adminSupabase = createServiceRoleClient()

    // 4. Crear el usuario en Supabase Auth
    const { data: newUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email: owner_email,
      password: owner_password,
      email_confirm: true, // El superadmin confirma el email directamente, no es necesario verificación
      user_metadata: {
        name: owner_name || name,
        role: 'business_owner',
      }
    })

    if (createUserError) {
      return NextResponse.json({ error: `Error al crear usuario: ${createUserError.message}` }, { status: 400 })
    }

    const newUserId = newUser.user.id

    // 5. Crear el perfil del usuario en la tabla profiles
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: newUserId,
        email: owner_email,
        role: 'business_owner',
        name: owner_name || name,
      })

    if (profileError) {
      // Rollback: eliminar el usuario si el perfil falla
      await adminSupabase.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: `Error al crear perfil: ${profileError.message}` }, { status: 500 })
    }

    // 6. Crear el negocio (business)
    const { data: business, error: bizError } = await adminSupabase
      .from('businesses')
      .insert({
        name,
        rubro,
        subscription_price: Number(subscription_price) || 0,
        expiration_date: expiration_date ? new Date(expiration_date).toISOString() : null,
        enabled_modules: enabled_modules || ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog', 'agenda'],
        whatsapp_config: {
          phone_number_id: null,
          verify_token: null,
          access_token: null,
          waba_id: null,
        },
      })
      .select('id')
      .single()

    if (bizError) {
      // Rollback: eliminar usuario si falla
      await adminSupabase.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: `Error al crear negocio: ${bizError.message}` }, { status: 500 })
    }

    const businessId = business.id

    // 7. Vincular el usuario como owner del negocio (business_members)
    const { error: memberError } = await adminSupabase
      .from('business_members')
      .insert({
        business_id: businessId,
        profile_id: newUserId,
        role: 'business_owner',
      })

    if (memberError) {
      // Rollback
      await adminSupabase.from('businesses').delete().eq('id', businessId)
      await adminSupabase.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: `Error al vincular usuario al negocio: ${memberError.message}` }, { status: 500 })
    }

    // 8. Crear la fila inicial de rubro_data (vacía, el cliente la configura)
    const { error: rubroError } = await adminSupabase
      .from('business_rubro_data')
      .insert({
        business_id: businessId,
        custom_metadata: {},
      })

    if (rubroError) {
      console.warn('No se pudo crear business_rubro_data:', rubroError.message)
      // No es fatal, continuar
    }

    return NextResponse.json({
      success: true,
      business_id: businessId,
      owner_id: newUserId,
      message: `Negocio "${name}" creado y usuario "${owner_email}" vinculado correctamente.`
    })

  } catch (err: any) {
    console.error('Error en POST /api/admin/create-business:', err)
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 })
  }
}
