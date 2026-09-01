# SR FASO — SUPER & RESISTANT

Site vitrine et catalogue e‑commerce de **SUPER & RESISTANT** (pièces détachées,
accessoires et mécanique moto au Burkina Faso), avec back‑office complet.

**Stack** : Next.js 16 (App Router, Turbopack) · React 19 · TypeScript ·
Tailwind CSS v4 · Supabase (PostgreSQL, Auth, Storage).

---

## 1. Mise en route

### a. Renseigner `.env.local`

| Variable | Où la trouver |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem (clé `anon` / publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API keys (**secrète**) |
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens (permet aux scripts d'exécuter le SQL) |
| `DATABASE_URL` | *optionnel* — Supabase → Connect → Session pooler (remplacer `[YOUR-PASSWORD]`) |
| `NEXT_PUBLIC_SITE_URL` | `https://srfaso.com` en production |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | compte administrateur à créer |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys — active l'analyse IA des photos produit |

### b. Créer le schéma de base

Deux méthodes au choix.

**Avec les scripts (recommandé)**

```bash
npm run db:migrate          # schéma + RLS + fonctions + données de base
npm run db:migrate:demo     # idem + catalogue de démonstration (optionnel)
```

Les migrations sont idempotentes et suivies dans la table `public._migrations`.
Le script passe par l'API Management Supabase avec `SUPABASE_ACCESS_TOKEN` ;
si `DATABASE_URL` est renseignée, il utilise une connexion Postgres directe.

**Sans script**

Ouvrir Supabase → **SQL Editor**, puis exécuter dans l’ordre :

1. `supabase/schema.sql` — schéma, RLS, fonctions, catégories, boutiques, services, contenus ;
2. `supabase/demo-products.sql` — catalogue de démonstration (facultatif, supprimable depuis le back‑office).

### c. Créer le compte administrateur

```bash
npm run admin:create
# ou : node scripts/create-admin.mjs email@exemple.com "MotDePasse" "Nom complet"
```

Le script crée l’utilisateur dans Supabase Auth (e‑mail confirmé) et son profil
back‑office. Connexion ensuite sur `/admin/login`.

### d. Lancer le site

```bash
npm run dev     # http://localhost:3000
npm run build   # build de production
```

---

## 2. Structure

```
app/
  (public)/            pages publiques (layout : rail catégories + en-tête + pied de page)
    page.tsx           accueil
    produits/          liste + fiche produit
    categories/        liste + fiche catégorie
    boutiques/  mecanique/  contact/  livraison-retour/
    panier/     commande/
  admin/
    login/             connexion back-office
    (dash)/            back-office (sidebar réductible + topbar)
  api/search/          suggestions de recherche
  sitemap.ts  robots.ts
components/            composants publics et back-office (components/admin/)
lib/
  data.ts              lecture du contenu public (client anonyme, pages en ISR)
  actions/public.ts    commandes et messages du public (service role, côté serveur)
  actions/admin.ts     écritures du back-office (session admin, RLS appliquée)
  supabase/            clients navigateur / serveur / anonyme / service role
proxy.ts               protection de /admin + rafraîchissement de session
supabase/migrations/   migrations SQL
scripts/               migrate.mjs, create-admin.mjs
```

---

## 3. Sécurité

- **RLS activée** sur toutes les tables. Le public ne lit que le contenu actif
  (catégories, produits, images, boutiques, services, paramètres, contenus).
- **Aucune écriture anonyme** : commandes et messages de contact sont insérés
  côté serveur via des Server Actions utilisant la clé `service_role`, après
  validation des champs et **relecture des prix en base** (le panier du
  navigateur ne fait pas foi).
- Le back‑office écrit avec la session de l’administrateur : les politiques RLS
  s’appliquent, `public.is_admin()` vérifiant la présence d’un profil actif.
- `/admin` est protégé par `proxy.ts` (redirection vers `/admin/login`) **et**
  par `requireAdmin()` dans chaque page.
- Storage : bucket `media` public en lecture, écriture réservée aux admins.

---

## 4. Commander sans compte

Le parcours client ne demande aucune inscription :

`recherche → fiche produit → panier → /commande`

Champs requis : **nom, prénom, numéro WhatsApp, ville**. L’e‑mail, le quartier et
les observations sont facultatifs. Une référence `SR-AAMM-XXXX` est générée et la
commande apparaît immédiatement dans le back‑office. Le client peut aussi
commander directement via WhatsApp (message pré‑rempli depuis le panier ou la
fiche produit).

---

## 5. SEO

- `generateMetadata` sur l’accueil, les produits, les catégories et la page
  livraison ; titres, descriptions et canoniques administrables.
- Données structurées : `Store`/`Organization` (layout public), `Product` + `Offer`
  (fiche produit), `LocalBusiness` (boutiques), `BreadcrumbList` (fil d’Ariane).
- `sitemap.xml` généré automatiquement (pages, catégories, produits),
  `robots.txt` excluant `/admin`, `/api`, `/panier` et `/commande`.
- Open Graph sur les fiches produits (image, titre, description).
- Pages publiques rendues statiquement avec revalidation (ISR) pour la vitesse
  sur connexions mobiles.

---

## 6. Back-office

`/admin` — sidebar fixe et réductible (fond sombre) + topbar, contenu clair.

| Écran | Contenu |
| --- | --- |
| Tableau de bord | produits, ruptures, commandes, messages, chiffre d’affaires, dernières commandes |
| Produits | liste filtrable, création/édition, images (ordre, image principale), duplication, activation |
| Catégories | création/édition, icône du rail, image, position, SEO |
| Commandes | suivi, statut, frais de livraison, note interne, contact WhatsApp |
| Clients | fiches issues des commandes, historique et total dépensé |
| Messages | demandes du formulaire de contact, statuts nouveau/lu/traité |
| Boutiques | adresse, horaires, GPS, photo, activation |
| Mécanique | prestations de l’atelier |
| Livraison & Retour | éditeur du contenu de la page publique, avec aperçu |
| Paramètres | identité, contacts, réseaux sociaux, bannière d’accueil, SEO global |
| Utilisateurs | comptes du back‑office (création, activation, suppression) |
