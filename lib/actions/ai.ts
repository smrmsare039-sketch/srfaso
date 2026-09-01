'use server'

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string }

const SuggestionSchema = z.object({
  name: z.string().describe('Nom commercial court et vendeur, optimisé pour la recherche.'),
  brand: z.string().nullable().describe('Marque lisible sur la pièce ou l’emballage, sinon null.'),
  reference: z
    .string()
    .nullable()
    .describe('Référence ou code produit lisible sur l’image, sinon null.'),
  category: z
    .string()
    .nullable()
    .describe('Nom exact repris de la liste de catégories fournie, sinon null.'),
  short_description: z.string().describe('Une à deux phrases, 200 caractères maximum.'),
  description: z.string().describe('Description détaillée en 2 à 4 paragraphes séparés par \\n\\n.'),
  specifications: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .describe('Caractéristiques techniques visibles ou déductibles avec certitude.'),
  compatibility: z.array(z.string()).describe('Modèles de moto compatibles, si identifiables.'),
  keywords: z.array(z.string()).describe('6 à 12 mots-clés de recherche en français.'),
  seo_title: z.string().describe('Titre SEO de 60 caractères maximum.'),
  seo_description: z.string().describe('Meta description de 155 caractères maximum.'),
  notes: z
    .string()
    .describe(
      'Ce que l’image ne permet pas de déterminer et qu’un humain doit vérifier. Chaîne vide si tout est clair.'
    ),
})

export type ProductSuggestion = z.infer<typeof SuggestionSchema>

const SYSTEM = `Tu rédiges les fiches produit de SUPER & RESISTANT (SR Faso), vendeur de pièces
détachées et accessoires moto à Ouagadougou, au Burkina Faso.

À partir de la photo fournie, identifie la pièce et rédige sa fiche en français,
dans un registre commercial clair et concret, adapté à des motards et mécaniciens
burkinabè. Le vocabulaire local du marché est privilégié quand il existe.

Règles :
- Ne déduis JAMAIS de prix, de tarif, de stock ou de disponibilité : ce n'est pas ton rôle.
- N'invente pas de marque, de référence ni de compatibilité : si ce n'est pas lisible
  sur l'image ou certain, mets null ou une liste vide.
- Le titre SEO suit la structure « Nom du produit | Pièces Moto Burkina Faso | SR Faso »
  en restant sous 60 caractères ; raccourcis le nom si besoin.
- Les caractéristiques ne contiennent que ce qui est visible ou techniquement certain.
- Si la photo ne montre pas une pièce ou un accessoire moto, dis-le dans « notes »
  et reste factuel sur le reste.`

/**
 * Analyse la photo d'un produit et propose les champs de la fiche.
 * Les prix, le stock et les statuts restent à la main de l'administrateur.
 */
export async function analyzeProductImage(
  imageUrl: string,
  categoryNames: string[] = []
): Promise<AiResult<ProductSuggestion>> {
  await requireAdmin()

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error: 'La clé ANTHROPIC_API_KEY n’est pas configurée sur le serveur.',
    }
  }
  if (!/^https?:\/\//.test(imageUrl)) {
    return { ok: false, error: 'Image introuvable : envoyez d’abord une photo.' }
  }

  const categoryList = categoryNames.length
    ? `Catégories disponibles sur le site (reprends le nom exact, ou null) :\n${categoryNames.map((c) => `- ${c}`).join('\n')}`
    : 'Aucune catégorie n’est encore définie : renvoie null pour « category ».'

  try {
    const client = new Anthropic()
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: SYSTEM,
      thinking: { type: 'adaptive' },
      output_config: { format: zodOutputFormat(SuggestionSchema) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: imageUrl } },
            {
              type: 'text',
              text: `Rédige la fiche produit correspondant à cette photo.\n\n${categoryList}`,
            },
          ],
        },
      ],
    })

    if (response.stop_reason === 'refusal') {
      return { ok: false, error: 'L’analyse de cette image a été refusée. Essayez une autre photo.' }
    }
    if (!response.parsed_output) {
      return { ok: false, error: 'L’analyse n’a rien renvoyé d’exploitable. Réessayez.' }
    }

    return { ok: true, data: response.parsed_output }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: 'Clé ANTHROPIC_API_KEY invalide.' }
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: 'Trop de demandes d’analyse. Patientez quelques secondes.' }
    }
    if (error instanceof Anthropic.APIError) {
      return { ok: false, error: `L’analyse a échoué (erreur ${error.status}).` }
    }
    return { ok: false, error: 'L’analyse a échoué. Réessayez dans un instant.' }
  }
}
