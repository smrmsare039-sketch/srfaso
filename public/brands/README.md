# Logos des marques partenaires

Les marques affichées par la section « Nos marques partenaires » de la page
d'accueil sont désormais gérées au back-office (`/admin/marques`) : nom, logo,
site officiel, ordre d'affichage et activation.

Ce dossier ne sert plus qu'aux logos livrés avec le site et référencés par le
jeu de données initial (`supabase/migrations/0007_partner_brands.sql`) :

- `kawasaki.png`
- `honda.png`
- `suzuki.png`
- `yamaha.png`

Les logos ajoutés depuis le back-office sont envoyés dans le stockage Supabase
(dossier `brands`) et n'ont pas besoin d'être déposés ici.

Format conseillé : PNG ou SVG à fond transparent, hauteur ~160 px.
Tant qu'un logo est absent, le nom de la marque s'affiche à la place
(repli typographique, aucune image cassée).
