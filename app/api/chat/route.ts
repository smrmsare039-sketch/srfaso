import { NextResponse } from 'next/server'

/**
 * Passerelle vers l'agent de vente n8n (nœud « Chat Trigger »).
 *
 * Le webhook n'est jamais appelé depuis le navigateur : son URL reste côté
 * serveur. C'est indispensable, pas cosmétique — une instance n8n écoute
 * généralement sur un hôte privé (`localhost:5678`), inatteignable depuis le
 * téléphone d'un client, et une page servie en HTTPS n'a de toute façon pas le
 * droit d'appeler une adresse en `http://`.
 */

export const dynamic = 'force-dynamic'

/** Un agent qui interroge un catalogue met parfois plusieurs secondes. */
const TIMEOUT_MS = 45_000
const MAX_MESSAGE = 2_000

type ChatRequest = {
  sessionId?: unknown
  message?: unknown
  context?: unknown
}

/**
 * n8n renvoie la sortie du dernier nœud telle quelle : la forme dépend du
 * workflow (`output` pour un nœud Agent, `text` pour un LLM nu, un tableau
 * quand le nœud renvoie plusieurs items…). On accepte les variantes courantes
 * plutôt que d'imposer une mise en forme côté n8n.
 */
function extractReply(payload: unknown): string {
  if (typeof payload === 'string') return payload.trim()
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractReply(item)
      if (found) return found
    }
    return ''
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    for (const key of ['output', 'text', 'reply', 'message', 'answer', 'response']) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    // `{ json: { output } }` : forme d'un item n8n non aplati.
    if (record.json) return extractReply(record.json)
    if (record.data) return extractReply(record.data)
  }
  return ''
}

export async function POST(request: Request) {
  const webhook = process.env.N8N_CHAT_WEBHOOK_URL
  if (!webhook) {
    console.error('[chat] N8N_CHAT_WEBHOOK_URL manquant')
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 })
  }

  let body: ChatRequest
  try {
    body = (await request.json()) as ChatRequest
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 100) : ''
  if (!message || !sessionId) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Contrat du nœud « Chat Trigger » de n8n. `metadata` est libre : il
      // porte le contexte de navigation pour que l'agent puisse orienter le
      // client sans le lui faire répéter.
      body: JSON.stringify({
        action: 'sendMessage',
        sessionId,
        chatInput: message.slice(0, MAX_MESSAGE),
        metadata: body.context ?? {},
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })

    if (!res.ok) {
      // 404 sur une URL `/webhook/` = workflow non activé dans n8n (l'URL
      // `/webhook-test/` ne répond, elle, qu'après un « Execute workflow »).
      console.error(
        res.status === 404
          ? '[chat] webhook n8n introuvable — le workflow est-il activé ?'
          : `[chat] n8n a répondu ${res.status}`
      )
      return NextResponse.json({ error: res.status === 404 ? 'inactive' : 'upstream' }, { status: 502 })
    }

    const raw = await res.text()
    let reply = ''
    try {
      reply = extractReply(JSON.parse(raw))
    } catch {
      // Réponse non-JSON : le workflow renvoie du texte brut.
      reply = raw.trim()
    }

    if (!reply) {
      console.error('[chat] réponse n8n sans texte exploitable')
      return NextResponse.json({ error: 'empty' }, { status: 502 })
    }

    return NextResponse.json({ reply })
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    console.error('[chat] appel n8n en échec', error)
    return NextResponse.json({ error: timedOut ? 'timeout' : 'unreachable' }, { status: 504 })
  }
}
