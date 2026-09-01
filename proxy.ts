import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Rafraîchit la session Supabase et protège le back-office
 * ainsi que l'espace client.
 * (En Next.js 16, `middleware` s'appelle désormais `proxy`.)
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const { pathname } = request.nextUrl

  if (!url || !anonKey) return response

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLogin = pathname === '/admin/login'

  // Espace client : réservé aux visiteurs identifiés.
  if (pathname.startsWith('/compte') && !user) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/connexion'
    redirect.search = `?suivant=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(redirect)
  }

  if (pathname.startsWith('/admin') && !isLogin && !user) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/admin/login'
    redirect.search = `?suivant=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(redirect)
  }

  if (isLogin && user) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/admin'
    redirect.search = ''
    return NextResponse.redirect(redirect)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/compte/:path*', '/connexion', '/inscription'],
}
