-- =====================================================================
-- Données de base : paramètres, catégories, boutiques, services, contenus
-- Idempotent — rejouable sans écraser les modifications du back-office
-- (les insert utilisent "on conflict do nothing" sur le slug / l'id).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Paramètres généraux
-- ---------------------------------------------------------------------
insert into public.site_settings (
  id, company_name, tagline, phone_primary, phone_secondary, whatsapp,
  whatsapp_message, email, address, hours,
  delivery_title, delivery_text,
  seo_title, seo_description, seo_keywords,
  home_hero_title, home_hero_subtitle, home_seo_content
) values (
  1,
  'SUPER & RESISTANT',
  'Pièces détachées, accessoires et mécanique moto au Burkina Faso',
  '+226 60 00 22 20',
  '+226 78 47 40 44',
  '+22660002220',
  'Bonjour SUPER & RESISTANT, je souhaite avoir des informations concernant ',
  'contact@srfaso.com',
  'Rue 7.07, Samandin, Ouagadougou',
  'Lundi – Samedi : 07h30 – 19h00',
  'Livraison',
  'Partout au Faso',
  'Pièces détachées moto au Burkina Faso | SR Faso',
  'SUPER & RESISTANT (SR Faso) : pièces détachées moto, accessoires et services de mécanique à Ouagadougou, Bobo-Dioulasso et partout au Burkina Faso. Livraison rapide et conseils d''experts.',
  'pièces détachées moto Burkina Faso, pièces moto Ouagadougou, accessoires moto Ouagadougou, batterie moto Ouagadougou, huile moto Burkina Faso, mécanique moto Ouagadougou',
  'Toutes les pièces de votre moto, au même endroit',
  'Moteur, transmission, électricité, éclairage, pneus, huiles et accessoires. Disponibles en boutique à Ouagadougou et livrés partout au Burkina Faso.',
  'SUPER & RESISTANT est un spécialiste des pièces détachées et accessoires moto installé à Ouagadougou. Notre catalogue couvre les principales familles de pièces : moteur, transmission, embrayage, électricité, éclairage, compteurs, injection, refroidissement, freinage, pneus et roues, huiles et lubrifiants. Nos équipes conseillent chaque jour des particuliers, des mécaniciens et des flottes de motos-taxis sur le choix des références compatibles avec leur machine. Nos deux boutiques de Ouagadougou — Rue 7.07 à Samandin et le Marché du cycle — accueillent les clients pour l''achat de pièces et les prestations d''atelier, et nous livrons les commandes à Ouagadougou, à Bobo-Dioulasso et dans les autres villes du Burkina Faso.'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Contenu Livraison & Retour
-- ---------------------------------------------------------------------
insert into public.delivery_content (
  id, delivery_title, delivery_body, return_title, return_body,
  seo_title, seo_description
) values (
  1,
  'Livraison',
  E'## Zones desservies\n\nNous livrons à Ouagadougou, à Bobo-Dioulasso et dans les autres villes du Burkina Faso via nos partenaires de transport.\n\n## Délais\n\n- Ouagadougou : livraison le jour même ou sous 24 heures pour toute commande validée avant 16h.\n- Autres villes du Burkina Faso : 24 à 72 heures selon la destination et la compagnie de transport.\n\n## Coût\n\nLes frais de livraison dépendent de la zone et du volume de la commande. Ils vous sont communiqués par téléphone ou sur WhatsApp au moment de la confirmation de la commande.\n\n## Modes de livraison\n\n- Retrait gratuit dans l''une de nos deux boutiques de Ouagadougou.\n- Livraison à domicile ou au lieu de travail à Ouagadougou.\n- Expédition par compagnie de transport vers les autres villes.\n\n## Réception\n\nVérifiez la conformité et l''état des pièces au moment de la réception, en présence du livreur.',
  'Retour & échange',
  E'## Conditions\n\nUne pièce peut être reprise ou échangée si elle n''a pas été montée, qu''elle est dans son emballage d''origine et accompagnée du reçu d''achat.\n\n## Délais\n\nLa demande doit nous parvenir dans un délai de 7 jours après la réception de la commande.\n\n## État attendu du produit\n\nLe produit doit être complet, non installé, non modifié et sans trace d''utilisation.\n\n## Procédure\n\n1. Contactez-nous par téléphone ou sur WhatsApp en indiquant votre numéro de commande.\n2. Rapportez la pièce en boutique ou convenez d''un enlèvement avec notre équipe.\n3. Après contrôle, nous procédons à l''échange ou à l''avoir.\n\n## Exclusions\n\nLes huiles et lubrifiants ouverts, les pièces électriques montées et les articles commandés spécialement à la demande du client ne sont pas repris.',
  'Livraison et retour — SR Faso',
  'Zones desservies, délais, coûts et procédure de retour pour vos commandes de pièces moto chez SUPER & RESISTANT au Burkina Faso.'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Catégories principales
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, icon, position, description, seo_title, seo_description)
values
  ('Éclairage', 'eclairage', 'lightbulb', 10,
   'Phares, feux arrière, clignotants et ampoules pour toutes les motos.',
   'Éclairage moto au Burkina Faso — phares, feux et ampoules',
   'Phares, feux arrière, clignotants et ampoules moto disponibles à Ouagadougou et livrés partout au Burkina Faso.'),
  ('Électrique', 'electrique', 'battery-charging', 20,
   'Batteries, régulateurs, bobines, faisceaux et pièces électriques.',
   'Pièces électriques moto — batteries et faisceaux | SR Faso',
   'Batteries moto, régulateurs, bobines et faisceaux électriques en stock à Ouagadougou. Livraison au Burkina Faso.'),
  ('Moteur et Moto', 'moteur-et-moto', 'cog', 30,
   'Cylindres, pistons, culasses, soupapes et pièces moteur.',
   'Pièces moteur moto au Burkina Faso | SR Faso',
   'Cylindres, pistons, culasses et pièces moteur pour motos, disponibles à Ouagadougou et livrés dans tout le Burkina Faso.'),
  ('Compteurs', 'compteurs', 'gauge', 40,
   'Compteurs de vitesse, câbles et instruments de bord.',
   'Compteurs moto — vitesse et instruments | SR Faso',
   'Compteurs de vitesse, câbles et instruments de bord pour moto à Ouagadougou.'),
  ('Transmission', 'transmission', 'settings-2', 50,
   'Chaînes, couronnes, pignons et kits de transmission.',
   'Transmission moto — chaînes, couronnes et pignons | SR Faso',
   'Kits chaîne, couronnes et pignons pour moto disponibles au Burkina Faso.'),
  ('Injection', 'injection', 'fuel', 60,
   'Carburateurs, injecteurs, pompes et circuits de carburant.',
   'Injection et carburation moto | SR Faso',
   'Carburateurs, injecteurs et pompes à essence pour moto à Ouagadougou et au Burkina Faso.'),
  ('Accessoires', 'accessoires', 'briefcase', 70,
   'Rétroviseurs, protections, supports, casques et équipements.',
   'Accessoires moto Ouagadougou | SR Faso',
   'Rétroviseurs, protections, supports téléphone et équipements moto disponibles à Ouagadougou.'),
  ('Embrayage', 'embrayage', 'disc', 80,
   'Disques, ressorts, câbles et kits d''embrayage.',
   'Embrayage moto — disques et kits | SR Faso',
   'Disques, ressorts et câbles d''embrayage pour moto au Burkina Faso.'),
  ('Refroidissement', 'refroidissement', 'fan', 90,
   'Radiateurs, ventilateurs, durites et liquides de refroidissement.',
   'Refroidissement moto — radiateurs et ventilateurs | SR Faso',
   'Radiateurs, ventilateurs et durites de refroidissement moto disponibles à Ouagadougou.'),
  ('Huiles & Lubrifiants', 'huiles-lubrifiants', 'droplets', 100,
   'Huiles moteur, huiles de fourche, graisses et additifs.',
   'Huile moto Burkina Faso — moteur et lubrifiants | SR Faso',
   'Huiles moteur, huiles de fourche et graisses pour moto, disponibles à Ouagadougou et livrées au Burkina Faso.'),
  ('Pneus & Roues', 'pneus-roues', 'circle-dot', 110,
   'Pneus, chambres à air, jantes et rayons.',
   'Pneus moto au Burkina Faso — pneus, chambres et jantes | SR Faso',
   'Pneus moto, chambres à air et jantes disponibles à Ouagadougou et livrés partout au Burkina Faso.'),
  ('Freinage', 'freinage', 'octagon-alert', 120,
   'Plaquettes, mâchoires, disques, câbles et liquides de frein.',
   'Freinage moto — plaquettes et disques | SR Faso',
   'Plaquettes, mâchoires et disques de frein moto disponibles à Ouagadougou.')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Boutiques
-- ---------------------------------------------------------------------
insert into public.shops (name, slug, address, city, district, phone, whatsapp, hours, position, description)
values
  ('Boutique Principale', 'boutique-principale', 'Rue 7.07, Samandin, Ouagadougou',
   'Ouagadougou', 'Samandin', '+226 60 00 22 20', '+22660002220',
   'Lundi – Samedi : 07h30 – 19h00', 10,
   'Notre boutique principale, avec le stock le plus complet de pièces détachées et d''accessoires moto.'),
  ('Boutique Secondaire', 'boutique-secondaire', 'Marché du cycle, Ouagadougou',
   'Ouagadougou', 'Marché du cycle', '+226 78 47 40 44', '+22678474044',
   'Lundi – Samedi : 07h30 – 19h00', 20,
   'Au cœur du Marché du cycle, pour trouver rapidement les pièces d''usage courant.')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Services mécaniques
-- ---------------------------------------------------------------------
insert into public.services (title, slug, description, details, icon, position)
values
  ('Diagnostic', 'diagnostic',
   'Identification de la panne avant toute intervention.',
   'Nos mécaniciens contrôlent le moteur, l''allumage, la transmission et le circuit électrique afin d''identifier précisément l''origine de la panne et de vous proposer une réparation adaptée.',
   'stethoscope', 10),
  ('Réparation moteur', 'reparation-moteur',
   'Réfection et remise en état du moteur.',
   'Démontage, contrôle des jeux, remplacement des cylindres, pistons, segments et joints, puis remontage et essai.',
   'cog', 20),
  ('Transmission', 'transmission',
   'Chaîne, couronne, pignon et réglages.',
   'Remplacement des kits chaîne, réglage de la tension et contrôle de l''alignement pour une transmission silencieuse et durable.',
   'settings-2', 30),
  ('Embrayage', 'embrayage',
   'Remplacement et réglage de l''embrayage.',
   'Changement des disques et ressorts, réglage du câble et contrôle du patinage.',
   'disc', 40),
  ('Électricité', 'electricite',
   'Batterie, faisceau, démarrage et éclairage.',
   'Diagnostic du circuit de charge, remplacement de la batterie, réparation du faisceau, du démarreur et de l''éclairage.',
   'battery-charging', 50),
  ('Freinage', 'freinage',
   'Contrôle et remise en état du système de freinage.',
   'Remplacement des plaquettes et mâchoires, contrôle des disques, purge et réglage.',
   'octagon-alert', 60),
  ('Entretien', 'entretien',
   'Vidange, filtres et révision périodique.',
   'Vidange moteur, remplacement des filtres, contrôle des niveaux, du jeu aux soupapes et des points de sécurité.',
   'wrench', 70)
on conflict (slug) do nothing;
