import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Cargar credenciales con fallbacks para evitar que falle el build o el arranque sin Supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  // Si no hay variables de entorno o son valores por defecto, asumimos modo demo local
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                     url.includes('placeholder') || 
                     url === 'http://localhost:54321'

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          } catch {
            // Ignorar errores al manipular cookies en componentes de servidor
          }
        },
      },
    }
  )

  let user = null

  // Intentar obtener usuario sólo si no estamos en modo demostración local
  if (!isDemoMode) {
    try {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser()
      user = supabaseUser
    } catch (err) {
      console.log("Error conectando a Supabase Auth, ingresando en modo demo fallback.", err)
    }
  }

  const path = request.nextUrl.pathname

  // En modo demo local, evitamos las redirecciones restrictivas para que el usuario pueda previsualizar las interfaces
  if (isDemoMode) {
    return supabaseResponse
  }

  // 1. Protección de rutas /dashboard
  if (path.startsWith('/dashboard') && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Protección de rutas /admin (Solo superadmin)
  if (path.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!profile || profile.role !== 'superadmin') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    } catch (err) {
      console.error("Error validando rol de superadmin:", err)
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 3. Si el usuario ya está logueado pero intenta acceder al login, lo mandamos al dashboard
  if (path.startsWith('/login') && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
