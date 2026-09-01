import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Retour d'un fournisseur externe (Google) ou d'un lien e-mail :
 * échange le code contre une session, puis renvoie vers `suivant`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const rawNext = searchParams.get('suivant')
  // On n'accepte qu'un chemin interne : pas de redirection ouverte.
  const hasExplicitNext = Boolean(rawNext?.startsWith('/') && !rawNext.startsWith('//'))
  const next = hasExplicitNext ? (rawNext as string) : '/compte'

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?erreur=oauth`)
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=oauth`)
  }

  // Un administrateur arrive directement dans le back-office.
  const destination = !hasExplicitNext && (await getCurrentProfile()) ? '/admin' : next

  return NextResponse.redirect(`${origin}${destination}`)
}
