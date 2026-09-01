# Cahier des charges fonctionnel — Site web **SUPER & RESISTANT / SR Faso**

## 1. Présentation du projet

Le projet consiste à développer une nouvelle version professionnelle du site web **SR Faso / SUPER & RESISTANT**, spécialisée dans les **pièces détachées, accessoires et services liés aux motos**.

Le site devra principalement permettre de :

* présenter les produits ;
* organiser les produits par catégories ;
* permettre une recherche rapide ;
* présenter les différentes boutiques ;
* présenter les services de mécanique ;
* faciliter la prise de contact et les commandes ;
* informer sur la livraison et les retours ;
* administrer l'ensemble du contenu depuis un **back-office** ;
* obtenir un excellent référencement naturel sur Google au **Burkina Faso**, particulièrement sur des recherches liées à **Ouagadougou, Bobo-Dioulasso et aux autres villes du pays**.

Le site sera développé avec :

* **Next.js**
* **Supabase**
* charte graphique : **blanc + rouge + noir**

Le cahier des charges ci-dessous reprend les pages visibles sur les captures fournies et ajoute uniquement les écrans techniques nécessaires au fonctionnement du catalogue, des commandes et du back-office.

---

# 2. Objectifs du site

Le site devra remplir quatre fonctions principales.

### Objectif commercial

Permettre aux visiteurs de trouver rapidement une pièce ou un accessoire et de passer à l'action :

**recherche → consultation → ajout au panier / contact → commande.**

### Objectif marketing

Renforcer l'image de **SUPER & RESISTANT** comme spécialiste des pièces moto.

### Objectif opérationnel

Permettre aux responsables de gérer les produits, catégories, boutiques, commandes et contenus sans intervenir directement dans le code.

### Objectif SEO

Positionner progressivement le site sur des recherches pertinentes telles que :

* pièces détachées moto Burkina Faso ;
* pièces moto Ouagadougou ;
* accessoires moto Ouagadougou ;
* pièces moto Bobo-Dioulasso ;
* magasin pièces moto Burkina Faso ;
* batterie moto Ouagadougou ;
* huile moto Burkina Faso ;
* amortisseur moto ;
* moteur et pièces moteur moto ;
* mécanique moto Ouagadougou ;

ainsi que sur les recherches spécifiques correspondant aux **produits réellement disponibles**.

> Les mots-clés définitifs devront être établis à partir du catalogue réel et d'une étude SEO. Il ne faudra pas créer artificiellement des produits ou services uniquement pour cibler des mots-clés.

---

# 3. Utilisateurs du système

## 3.1 Visiteur

Il peut :

* parcourir les produits ;
* rechercher un produit ;
* parcourir les catégories ;
* consulter les détails d'un produit ;
* consulter les boutiques ;
* découvrir les services mécaniques ;
* consulter les conditions de livraison ;
* contacter l'entreprise ;
* utiliser WhatsApp ;
* ajouter des produits au panier ;
* transmettre une commande.

---

## 3.2 Administrateur

L'administrateur accède au **back-office sécurisé**.

Il peut gérer :

* produits ;
* catégories ;
* sous-catégories ;
* boutiques ;
* stocks ;
* commandes ;
* clients ;
* contenus ;
* mécanique ;
* livraison ;
* paramètres SEO ;
* images ;
* utilisateurs administratifs ;
* informations générales du site.

---

# 4. Structure principale du site

La navigation publique devra conserver exactement les sections principales demandées :

1. **Produits**
2. **Catégories**
3. **Boutiques**
4. **Mécanique**
5. **Contact**
6. **Livraison & Retour**

Le **logo SUPER & RESISTANT** permettra également de revenir à l'accueil.

Les fiches produits et catégories sont des écrans internes nécessaires au catalogue, mais ne constituent pas de nouvelles rubriques dans le menu principal.

---

# 5. En-tête du site

L'en-tête doit reprendre l'organisation générale des captures.

## 5.1 Logo

Affichage du logo **SUPER & RESISTANT**.

Au clic :

> retour à l'accueil.

---

## 5.2 Barre de recherche

Une grande barre :

> **Rechercher des produits**

Recherche possible à partir de :

* nom ;
* référence ;
* marque ;
* catégorie ;
* modèle compatible ;
* description ;
* mots-clés.

### Suggestions automatiques

Lorsque l'utilisateur saisit :

> `batt...`

le site pourra afficher immédiatement :

* Batterie 12V…
* Batterie moto…
* Catégorie : Batteries

---

## 5.3 Contact WhatsApp

Bloc visible dans l'en-tête :

**Support WhatsApp**

avec :

* icône WhatsApp ;
* numéro ;
* clic ouvrant directement WhatsApp.

Le numéro devra être modifiable depuis le back-office.

---

## 5.4 Livraison

Afficher un bloc du type :

> 🛵 **Livraison**
> Partout au Faso

Le texte sera administrable.

---

# 6. Menu catégories

Un bouton important :

> ☰ **Toutes les catégories**

Au clic, afficher un menu comprenant les catégories enregistrées dans le back-office.

Exemple de fonctionnement :

```text
Toutes les catégories
├── Moteur
├── Transmission
├── Embrayage
├── Électricité
├── Batterie
├── Éclairage
├── Pneus
├── Huiles
└── Accessoires
```

Les catégories réelles devront venir de la base Supabase.

---

# 7. Page Accueil

Même si **Accueil** ne figure pas obligatoirement dans le menu principal, `/` sera la page d'entrée du site.

Elle devra présenter les éléments commerciaux les plus importants.

## Contenu proposé

### Bannière principale

Contenant :

* image professionnelle ;
* message commercial ;
* bouton **Voir les produits** ;
* bouton **Commander sur WhatsApp**.

---

### Catégories principales

Présentation visuelle des catégories populaires.

Exemple :

```text
[Moteur]
[Batterie]
[Électricité]
[Transmission]
[Pneus]
[Huiles]
```

---

### Produits populaires

Section :

> 🔥 Nos produits populaires

---

### Nouveautés

> 🆕 Nouveaux arrivages

---

### Promotions

> 🏷️ Promotions

La section peut être masquée lorsqu'aucune promotion n'est active.

---

### Produits recommandés

Possibilité pour l'administrateur de choisir certains produits à mettre en avant.

---

### Avantages

Exemple de présentation :

* disponibilité ;
* conseils ;
* livraison ;
* commande rapide ;
* assistance WhatsApp.

Les formulations exactes devront correspondre aux services réellement proposés.

---

### Boutiques

Petit aperçu des points de vente avec bouton :

> **Voir nos boutiques**

---

### Mécanique

Présentation courte des services disponibles.

---

### Bloc SEO

Une section rédactionnelle naturelle devra présenter :

* l'activité ;
* les principales familles de produits ;
* les zones desservies ;
* Ouagadougou ;
* Bobo-Dioulasso ;
* Burkina Faso.

L'objectif n'est pas de répéter artificiellement les villes, mais de fournir à Google un contenu pertinent.

---

# 8. Page **Produits**

URL principale :

```text
/produits
```

Cette page constitue le cœur du site.

## 8.1 Liste des produits

Chaque carte produit affiche au minimum :

* photo ;
* nom ;
* prix ;
* prix promotionnel éventuel ;
* disponibilité ;
* catégorie ;
* bouton panier ;
* bouton détails.

---

# 9. Filtres produits

Les visiteurs pourront filtrer les produits.

### Filtres recommandés

* catégorie ;
* sous-catégorie ;
* marque ;
* prix ;
* disponibilité ;
* promotion ;
* nouveautés.

Selon les données disponibles, on pourra également gérer :

* type de moto ;
* modèle compatible ;
* cylindrée ;
* marque de moto.

---

# 10. Tri des produits

Options :

* pertinence ;
* nouveautés ;
* prix croissant ;
* prix décroissant ;
* produits populaires.

---

# 11. Pagination

Éviter d'afficher des centaines de produits simultanément.

Le catalogue utilisera :

* pagination classique ;

ou

* chargement progressif.

---

# 12. Fiche produit

Chaque produit devra disposer d'une URL SEO propre.

Exemple :

```text
/produits/batterie-moto-12v-xyz
```

### Informations

* nom ;
* plusieurs images ;
* prix ;
* prix promotionnel ;
* disponibilité ;
* référence ;
* catégorie ;
* marque ;
* description ;
* caractéristiques ;
* compatibilité ;
* état du stock ;
* boutique disponible, si nécessaire.

### Actions

* **Ajouter au panier**
* **Commander**
* **Commander sur WhatsApp**
* partager.

---

# 13. Produits similaires

En bas de la fiche :

> **Produits similaires**

Produits sélectionnés principalement selon :

* catégorie ;
* marque ;
* compatibilité.

---

# 14. Page **Catégories**

URL :

```text
/categories
```

Elle présente toutes les catégories disponibles.

Chaque catégorie comprend :

* image ;
* nom ;
* description courte ;
* nombre de produits éventuellement ;
* bouton de consultation.

---

# 15. Fiche catégorie

Exemple :

```text
/categories/batteries
```

Elle présente :

* titre ;
* description ;
* image ;
* produits ;
* filtres ;
* contenu SEO.

Exemple de titre SEO :

> Batteries moto disponibles au Burkina Faso

Le texte doit rester naturel et correspondre aux produits proposés.

---

# 16. Page **Boutiques**

URL :

```text
/boutiques
```

Elle permettra de présenter les points de vente de SUPER & RESISTANT.

Pour chaque boutique :

* nom ;
* photo ;
* adresse ;
* ville ;
* quartier ;
* téléphone ;
* WhatsApp ;
* horaires ;
* indication géographique ;
* bouton **Appeler** ;
* bouton **WhatsApp** ;
* bouton **Itinéraire**.

---

# 17. Localisation des boutiques

Possibilité d'intégrer une carte.

Chaque boutique pourra avoir :

* latitude ;
* longitude.

Ces informations seront administrées depuis le back-office.

---

# 18. Page **Mécanique**

URL :

```text
/mecanique
```

Cette page présente les services mécaniques réellement proposés.

Chaque service peut comprendre :

* nom ;
* image ;
* courte description ;
* détails ;
* tarif éventuel ;
* bouton WhatsApp ;
* bouton prendre contact.

Exemple de présentation :

```text
Diagnostic
Réparation moteur
Transmission
Embrayage
Électricité
Freinage
Entretien
```

La liste finale sera définie par l'entreprise.

---

# 19. Page **Contact**

URL :

```text
/contact
```

## Informations affichées

* téléphone ;
* WhatsApp ;
* email ;
* adresse ;
* horaires ;
* boutiques ;
* réseaux sociaux.

---

## Formulaire de contact

Champs :

* nom ;
* téléphone ;
* email facultatif ;
* sujet ;
* message.

Après envoi :

> Votre message a bien été envoyé.

Les demandes pourront être enregistrées dans Supabase.

---

# 20. Contact WhatsApp rapide

Le bouton WhatsApp devra rester très accessible sur mobile.

Exemple :

> 💬 **Discuter avec nous**

Possibilité de préremplir :

> Bonjour SUPER & RESISTANT, je souhaite avoir des informations concernant…

---

# 21. Page **Livraison & Retour**

URL :

```text
/livraison-retour
```

Elle devra contenir les politiques réelles de l'entreprise concernant :

### Livraison

* zones desservies ;
* villes ;
* délais ;
* coût ;
* modes de livraison ;
* réception.

### Retour

* conditions ;
* délais ;
* état attendu du produit ;
* procédure ;
* exclusions éventuelles.

### Important

Ces informations devront être **entièrement modifiables depuis le back-office**.

---

# 22. Panier

Même s'il ne constitue pas une rubrique du menu principal, le panier visible sur la maquette devra fonctionner.

Fonctionnalités :

* ajouter ;
* supprimer ;
* modifier quantité ;
* calculer total ;
* vider panier.

---

# 23. Passage de commande

Le client pourra transmettre une commande.

Informations minimales :

* nom ;
* numéro téléphone ;
* ville ;
* quartier/adresse ;
* produits ;
* quantités ;
* observations.

---

# 24. Commande via WhatsApp

Fonction particulièrement pertinente.

À partir du panier :

> **Commander via WhatsApp**

Le site peut générer automatiquement un message du type :

```text
Bonjour, je souhaite commander :

2 × Produit A
1 × Produit B

Total : XX XXX FCFA

Nom :
Ville :
Quartier :
```

Le client finalise ensuite la discussion avec l'entreprise.

---

# 25. Commandes enregistrées sur le site

Le back-office devra également permettre d'enregistrer les commandes.

Statuts possibles :

```text
Nouvelle
Confirmée
En préparation
Expédiée
Livrée
Annulée
```

Les libellés pourront être ajustés aux procédures internes de SR Faso.

---

# 26. Back-office

Le back-office constitue une partie essentielle du projet.

URL protégée, par exemple :

```text
/admin
```

Il ne devra pas être accessible aux visiteurs.

---

# 27. Tableau de bord administrateur

Le dashboard affichera notamment :

* nombre de produits ;
* catégories ;
* produits en rupture ;
* commandes ;
* nouvelles commandes ;
* produits populaires ;
* messages reçus.

---

# 28. Gestion des produits

L'administrateur pourra :

* ajouter ;
* modifier ;
* supprimer ;
* activer/désactiver ;
* dupliquer un produit.

### Informations produit

* nom ;
* slug ;
* référence ;
* catégorie ;
* sous-catégorie ;
* marque ;
* prix ;
* ancien prix ;
* description ;
* description courte ;
* stock ;
* images ;
* compatibilité ;
* caractéristiques ;
* statut ;
* produit en vedette ;
* promotion ;
* nouveauté.

---

# 29. Gestion des images

Upload depuis le back-office.

Possibilité de :

* ajouter plusieurs images ;
* définir l'image principale ;
* supprimer ;
* réordonner.

Les fichiers pourront être enregistrés dans **Supabase Storage**.

---

# 30. Gestion des catégories

Fonctions :

* ajouter ;
* modifier ;
* supprimer ;
* activer ;
* réordonner.

Données :

* nom ;
* slug ;
* image ;
* description ;
* catégorie parente éventuelle ;
* métadonnées SEO.

---

# 31. Gestion des boutiques

L'administrateur pourra gérer :

* nom ;
* ville ;
* quartier ;
* adresse ;
* coordonnées GPS ;
* numéro ;
* WhatsApp ;
* horaires ;
* images ;
* statut.

---

# 32. Gestion de la mécanique

Créer et modifier les prestations :

* titre ;
* description ;
* image ;
* ordre d'affichage ;
* statut.

---

# 33. Gestion des commandes

Tableau avec :

| N° | Client | Téléphone | Ville | Montant | Statut |
| -- | ------ | --------- | ----- | ------: | ------ |

L'administrateur pourra consulter une commande et changer son statut.

---

# 34. Gestion des clients

La base pourra conserver les coordonnées associées aux commandes.

Informations possibles :

* nom ;
* téléphone ;
* ville ;
* quartier ;
* historique de commandes.

---

# 35. Gestion des contacts

Les demandes du formulaire apparaîtront dans le back-office.

Statuts :

* nouveau ;
* lu ;
* traité.

---

# 36. Gestion de Livraison & Retour

Éditeur permettant de modifier directement le contenu de la page sans toucher au code.

---

# 37. Paramètres généraux

Depuis le back-office :

* logo ;
* favicon ;
* nom de l'entreprise ;
* téléphone ;
* WhatsApp ;
* email ;
* réseaux sociaux ;
* adresse ;
* texte livraison ;
* horaires ;
* informations légales disponibles ;
* liens Facebook ;
* TikTok ;
* Instagram éventuellement.

---

# 38. SEO — exigence prioritaire

Le SEO doit être pensé **dès le développement**, et non ajouté après la création du site.

Next.js permet notamment de générer des métadonnées pour les pages et routes dynamiques. La documentation officielle décrit son API Metadata pour les titres, descriptions et données associées.
Source : **Vercel / Next.js Documentation, Metadata and OG images** — [Documentation Next.js – Metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images?utm_source=chatgpt.com)

---

# 39. SEO géographique Burkina Faso 🇧🇫

Le contenu devra permettre de travailler les intentions géographiques pertinentes.

Exemples :

```text
Pièces moto Burkina Faso
Pièces détachées moto Ouagadougou
Accessoires moto Ouagadougou
Pièces moto Bobo-Dioulasso
Pièces moteur moto Burkina Faso
Batterie moto Ouagadougou
Huile moto Ouagadougou
Magasin pièces moto Burkina Faso
```

Mais **aucun bourrage de mots-clés**.

Les villes seront intégrées uniquement lorsque cela correspond :

* à une zone desservie ;
* une boutique ;
* une livraison ;
* un service réel.

---

# 40. SEO des fiches produits

Chaque produit devra disposer de :

### Title

Exemple de structure :

```text
Nom du produit | Pièces Moto Burkina Faso | SR Faso
```

### Meta description

Générable depuis le back-office.

### URL

Courte et lisible :

```text
/produits/amortisseur-sirius
```

et non :

```text
/product?id=839394
```

---

# 41. SEO des catégories

Exemple :

```text
/categories/pieces-moteur
/categories/batteries
/categories/huiles
```

Chaque catégorie aura :

* Title ;
* description ;
* H1 ;
* contenu SEO ;
* image ;
* alt image ;
* canonical.

---

# 42. Données structurées

Lorsque les données le permettent, implémenter des données structurées Schema.org adaptées, notamment :

* `Product`
* `Offer`
* `BreadcrumbList`
* `Organization`
* `LocalBusiness`

Google documente l'utilisation des données structurées produit afin de fournir des informations supplémentaires sur les produits dans les résultats de recherche.
Source : **Google Search Central, Product structured data**, documentation officielle — [Google – Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product?utm_source=chatgpt.com)

---

# 43. Sitemap

Génération automatique :

```text
/sitemap.xml
```

contenant :

* pages principales ;
* catégories ;
* produits ;
* boutiques lorsque pertinent.

---

# 44. Robots.txt

Créer :

```text
/robots.txt
```

Le back-office devra être exclu de l'indexation.

---

# 45. Canonical

Utilisation de balises canonical afin de limiter les problèmes de contenus dupliqués lorsque plusieurs URLs peuvent afficher des contenus très proches.

---

# 46. Breadcrumb

Exemple :

```text
Accueil > Produits > Batterie Moto XYZ
```

Comme le principe visible sur la capture :

> Accueil / Produits

---

# 47. SEO Images

Chaque image devra pouvoir disposer de :

* nom pertinent ;
* texte alternatif ;
* dimensions ;
* compression.

Exemple :

❌

```text
IMG_938393.jpg
```

✅

```text
batterie-moto-12v-sr-faso.jpg
```

---

# 48. Open Graph

Lors du partage d'un produit sur Facebook ou WhatsApp :

* image ;
* nom ;
* prix éventuellement ;
* description ;
* URL.

Le partage devra présenter une carte propre.

---

# 49. Google Search Console

Après mise en production, prévoir la connexion du domaine à :

**Google Search Console**.

Elle servira notamment à surveiller :

* indexation ;
* impressions ;
* clics ;
* requêtes ;
* erreurs SEO.

Source officielle : **Google Search Console** — [Google Search Console](https://search.google.com/search-console/about?utm_source=chatgpt.com)

---

# 50. Performance

Le site devra rester rapide, particulièrement sur téléphone et sur connexions mobiles.

Priorités :

* optimisation des images ;
* chargement progressif ;
* limitation des scripts inutiles ;
* mise en cache ;
* Server Components lorsque pertinent ;
* pages rendues côté serveur ou statiquement lorsqu'elles s'y prêtent.

---

# 51. Responsive Design

Le site sera conçu pour :

* smartphone ;
* tablette ;
* ordinateur.

### Mobile

La navigation pourra reprendre le principe visible sur ta deuxième capture :

```text
☰
💡
🔋
⚙️
...
```

avec une barre latérale compacte et adaptée au tactile.

---

# 52. Charte graphique

## Couleurs obligatoires

### Rouge

Couleur d'action principale.

Utilisations :

* boutons ;
* promotions ;
* liens actifs ;
* icônes ;
* CTA.

### Noir

Utilisations :

* textes importants ;
* menu ;
* titres ;
* contrastes.

### Blanc

Utilisations :

* fond principal ;
* cartes ;
* espaces ;
* lisibilité.

---

# 53. Style visuel

L'identité devra être :

* moderne ;
* professionnelle ;
* commerciale ;
* claire ;
* robuste ;
* adaptée au secteur moto.

Éviter une interface excessivement chargée.

---

# 54. Base de données Supabase

Organisation logique possible :

```text
profiles
categories
products
product_images
shops
services
orders
order_items
customers
contact_messages
site_settings
delivery_content
```

Selon l'évolution du projet, des tables supplémentaires pourront être nécessaires.

---

# 55. Stockage

**Supabase Storage** pourra stocker :

* produits ;
* catégories ;
* boutiques ;
* services ;
* logo ;
* médias.

Supabase documente Storage comme un système de gestion de fichiers intégré à sa plateforme et contrôlable par des politiques d'accès.
Source : **Supabase Documentation – Storage** — [Supabase Storage Documentation](https://supabase.com/docs/guides/storage?utm_source=chatgpt.com)

---

# 56. Authentification administrateur

Utilisation de **Supabase Auth** pour les comptes du back-office.

Le public n'a pas besoin de compte pour consulter le catalogue.

---

# 57. Sécurité Supabase

Mettre en place des politiques **Row Level Security — RLS**.

Principe :

```text
VISITEUR
↓
lecture des contenus publics uniquement

ADMIN
↓
création / modification / suppression
```

Supabase recommande l'utilisation de RLS pour contrôler l'accès aux données exposées via son API.
Source : **Supabase Documentation – Row Level Security** — [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com)

---

# 58. Recherche

La recherche devra être rapide et tolérante.

Elle devra rechercher notamment dans :

```text
nom produit
référence
catégorie
marque
description
compatibilité
```

Exemple :

```text
Utilisateur : sirius

Résultats :
Amortisseur Sirius
Cylindre Sirius
Compteur Sirius
...
```

---

# 59. URL du projet

Structure recommandée :

```text
srfaso.com
│
├── /
├── /produits
│   └── /produits/[slug]
│
├── /categories
│   └── /categories/[slug]
│
├── /boutiques
├── /mecanique
├── /contact
├── /livraison-retour
│
└── /admin
```

Ainsi, **le menu public reste exactement centré sur les six sections demandées**, tout en permettant à Google et aux visiteurs d'accéder aux fiches produits et catégories.

---

# 60. Parcours client principal

```text
Google / Facebook / TikTok
          ↓
       SRFASO.COM
          ↓
    Recherche produit
          ↓
      Fiche produit
          ↓
      Ajouter panier
          ↓
   Commander / WhatsApp
          ↓
 Confirmation entreprise
          ↓
       Livraison
```

---

# 61. Parcours administrateur

```text
/admin
   ↓
Connexion sécurisée
   ↓
Dashboard
   ↓
Produits / Catégories / Commandes
   ↓
Ajout ou modification
   ↓
Publication
   ↓
Visible immédiatement sur le site
```

---

# 62. Fonctionnalités prioritaires V1

Pour éviter de transformer le projet en énorme marketplace, la **V1** devrait se concentrer sur :

* ✅ Accueil
* ✅ Produits
* ✅ Fiches produits
* ✅ Recherche
* ✅ Catégories
* ✅ Boutiques
* ✅ Mécanique
* ✅ Contact
* ✅ Livraison & Retour
* ✅ Panier
* ✅ Commande
* ✅ WhatsApp
* ✅ Back-office
* ✅ gestion produits
* ✅ gestion catégories
* ✅ gestion boutiques
* ✅ gestion commandes
* ✅ gestion contenus
* ✅ SEO technique
* ✅ SEO local Burkina Faso
* ✅ responsive
* ✅ optimisation des performances

---

# 63. Technologies retenues

| Besoin                | Technologie                   |
| --------------------- | ----------------------------- |
| Application web       | **Next.js**                   |
| Interface             | React / Next.js               |
| Base de données       | **Supabase PostgreSQL**       |
| Authentification      | **Supabase Auth**             |
| Images/fichiers       | **Supabase Storage**          |
| API / logique serveur | Next.js                       |
| Hébergement possible  | Vercel                        |
| SEO                   | Next.js Metadata + Schema.org |
| Responsive            | CSS/Tailwind CSS si retenu    |

---

# 64. Résultat attendu

À la livraison, **SRFASO.COM** devra être à la fois :

> 🔴 **un catalogue professionnel**

> 🛒 **un outil de vente**

> 💬 **un canal de génération de demandes WhatsApp**

> 🏍️ **une vitrine de SUPER & RESISTANT**

> 📍 **un site optimisé pour les recherches locales au Burkina Faso**

> ⚙️ **une plateforme entièrement administrable**

avec une identité visuelle uniforme :

**⬜ BLANC — 🔴 ROUGE — ⬛ NOIR**

et une priorité très forte sur **mobile + rapidité + SEO + conversion**.
