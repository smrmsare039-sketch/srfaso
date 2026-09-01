-- =====================================================================
-- Catalogue de démonstration
-- Ces produits servent à mettre le site en route ; ils peuvent être
-- modifiés ou supprimés depuis le back-office (Produits).
-- =====================================================================

insert into public.products (
  name, slug, reference, category_id, brand, price, old_price,
  short_description, description, compatibility, keywords, stock,
  is_featured, is_new, is_promo, specifications
)
select v.name, v.slug, v.reference, c.id, v.brand, v.price, v.old_price,
       v.short_description, v.description, v.compatibility, v.keywords, v.stock,
       v.is_featured, v.is_new, v.is_promo, v.specifications
from (values
  ('Batterie moto 12V 7Ah', 'batterie-moto-12v-7ah', 'SR-BAT-127', 'electrique', 'Yuasa', 22000, 26000,
   'Batterie 12 volts 7 ampères-heures, prête à l''emploi.',
   'Batterie moto 12V 7Ah livrée chargée, adaptée aux motos et scooters de 100 à 150 cm³. Bornes protégées et boîtier étanche.',
   array['Sirius','Boxer','TVS Star','Haojue'], array['batterie','12v','7ah','demarrage'], 24, true, false, true,
   '[{"label":"Tension","value":"12 V"},{"label":"Capacité","value":"7 Ah"},{"label":"Type","value":"Plomb scellé"}]'::jsonb),

  ('Batterie moto 12V 9Ah', 'batterie-moto-12v-9ah', 'SR-BAT-129', 'electrique', 'Yuasa', 28000, null,
   'Batterie 12V 9Ah pour motos 150 à 200 cm³.',
   'Batterie 12V 9Ah offrant une réserve de démarrage supérieure, recommandée pour les motos équipées de démarreur électrique et d''un éclairage renforcé.',
   array['Bajaj Boxer','Apsonic','Kinetic'], array['batterie','12v','9ah'], 12, false, true, false,
   '[{"label":"Tension","value":"12 V"},{"label":"Capacité","value":"9 Ah"}]'::jsonb),

  ('Régulateur de tension 12V', 'regulateur-de-tension-12v', 'SR-REG-012', 'electrique', 'SR', 7500, null,
   'Régulateur redresseur 5 broches.',
   'Régulateur de tension 12V à 5 broches, protège la batterie et le circuit d''éclairage contre les surtensions.',
   array['Sirius','Boxer'], array['regulateur','redresseur','12v'], 30, false, false, false,
   '[{"label":"Broches","value":"5"},{"label":"Tension","value":"12 V"}]'::jsonb),

  ('Bobine d''allumage', 'bobine-d-allumage', 'SR-BOB-001', 'electrique', 'SR', 6000, null,
   'Bobine haute tension avec antiparasite.',
   'Bobine d''allumage complète avec fil et antiparasite, pour un démarrage franc et une étincelle régulière.',
   array['Sirius','Star','Boxer'], array['bobine','allumage','antiparasite'], 40, false, false, false,
   '[]'::jsonb),

  ('Phare avant LED', 'phare-avant-led', 'SR-PHA-LED', 'eclairage', 'SR', 15000, 18000,
   'Optique LED haute luminosité, montage universel.',
   'Phare avant LED offrant un faisceau large et une consommation réduite. Livré avec support de fixation universel.',
   array['Sirius','Boxer','TVS Star'], array['phare','led','eclairage','feu avant'], 18, true, true, true,
   '[{"label":"Technologie","value":"LED"},{"label":"Tension","value":"12 V"}]'::jsonb),

  ('Feu arrière complet', 'feu-arriere-complet', 'SR-FEU-ARR', 'eclairage', 'SR', 5500, null,
   'Feu stop arrière avec cabochon rouge.',
   'Feu arrière complet avec cabochon rouge, ampoule et connectique, compatible avec la majorité des motos urbaines.',
   array['Sirius','Boxer'], array['feu arriere','stop','eclairage'], 26, false, false, false,
   '[]'::jsonb),

  ('Jeu de clignotants (4 pièces)', 'jeu-de-clignotants-4-pieces', 'SR-CLI-004', 'eclairage', 'SR', 6500, null,
   'Quatre clignotants ambre avec ampoules.',
   'Jeu complet de quatre clignotants avec cabochons ambre et ampoules 12V, fixation universelle.',
   array['Sirius','Star','Boxer'], array['clignotant','indicateur','eclairage'], 22, false, false, false,
   '[]'::jsonb),

  ('Kit cylindre-piston 110cc', 'kit-cylindre-piston-110cc', 'SR-CYL-110', 'moteur-et-moto', 'SR', 32000, null,
   'Cylindre, piston, segments et joints.',
   'Kit complet de réfection moteur 110 cm³ : cylindre, piston, axe, segments, clips et jeu de joints.',
   array['Sirius 110','Star 110'], array['cylindre','piston','moteur','110cc'], 9, true, false, false,
   '[{"label":"Cylindrée","value":"110 cm³"},{"label":"Contenu","value":"Cylindre, piston, segments, joints"}]'::jsonb),

  ('Kit cylindre-piston 125cc', 'kit-cylindre-piston-125cc', 'SR-CYL-125', 'moteur-et-moto', 'SR', 38000, null,
   'Kit moteur complet 125 cm³.',
   'Kit de réfection 125 cm³ comprenant cylindre, piston, segments, axe et jeu de joints moteur.',
   array['Boxer 125','Apsonic 125'], array['cylindre','piston','125cc','moteur'], 7, false, false, false,
   '[{"label":"Cylindrée","value":"125 cm³"}]'::jsonb),

  ('Culasse complète 110cc', 'culasse-complete-110cc', 'SR-CUL-110', 'moteur-et-moto', 'SR', 45000, null,
   'Culasse assemblée avec soupapes et arbre à cames.',
   'Culasse complète prête au montage, livrée avec soupapes, ressorts, arbre à cames et joint de culasse.',
   array['Sirius 110'], array['culasse','soupape','arbre a cames'], 5, false, false, false,
   '[]'::jsonb),

  ('Joint de culasse', 'joint-de-culasse', 'SR-JNT-CUL', 'moteur-et-moto', 'SR', 2500, null,
   'Joint de culasse renforcé.',
   'Joint de culasse en matériau renforcé assurant une bonne étanchéité et une résistance élevée à la chaleur.',
   array['Sirius','Boxer'], array['joint','culasse','etancheite'], 60, false, false, false,
   '[]'::jsonb),

  ('Compteur de vitesse universel', 'compteur-de-vitesse-universel', 'SR-CPT-001', 'compteurs', 'SR', 12000, null,
   'Compteur mécanique avec compte-tours.',
   'Compteur de vitesse universel avec totalisateur kilométrique, témoins d''éclairage et de clignotants.',
   array['Sirius','Star','Boxer'], array['compteur','vitesse','kilometrage'], 14, false, true, false,
   '[]'::jsonb),

  ('Câble de compteur', 'cable-de-compteur', 'SR-CAB-CPT', 'compteurs', 'SR', 2000, null,
   'Câble souple gainé pour compteur.',
   'Câble de compteur gainé, résistant à l''humidité et à la poussière.',
   array['Sirius','Boxer'], array['cable','compteur'], 55, false, false, false,
   '[]'::jsonb),

  ('Kit chaîne complet 428', 'kit-chaine-complet-428', 'SR-KIT-428', 'transmission', 'DID', 24000, 28000,
   'Chaîne, couronne et pignon en pas 428.',
   'Kit de transmission complet au pas 428 : chaîne renforcée, couronne et pignon de sortie de boîte.',
   array['Sirius','Star','Boxer'], array['chaine','couronne','pignon','428','transmission'], 16, true, false, true,
   '[{"label":"Pas","value":"428"},{"label":"Contenu","value":"Chaîne + couronne + pignon"}]'::jsonb),

  ('Chaîne de transmission 428H', 'chaine-de-transmission-428h', 'SR-CHA-428', 'transmission', 'DID', 11000, null,
   'Chaîne renforcée 428H, 120 maillons.',
   'Chaîne de transmission renforcée au pas 428H, 120 maillons, avec attache rapide.',
   array['Sirius','Boxer'], array['chaine','428','transmission'], 28, false, false, false,
   '[{"label":"Pas","value":"428H"},{"label":"Maillons","value":"120"}]'::jsonb),

  ('Carburateur complet 110cc', 'carburateur-complet-110cc', 'SR-CARB-110', 'injection', 'SR', 18000, null,
   'Carburateur assemblé et pré-réglé.',
   'Carburateur complet pour moteur 110 cm³, livré pré-réglé avec gicleurs et joints.',
   array['Sirius 110','Star 110'], array['carburateur','injection','essence'], 11, false, false, false,
   '[]'::jsonb),

  ('Pompe à essence électrique', 'pompe-a-essence-electrique', 'SR-POM-ESS', 'injection', 'SR', 14000, null,
   'Pompe 12V pour circuit d''injection.',
   'Pompe à essence électrique 12V avec filtre intégré, pour motos à injection.',
   array['Apsonic','Haojue'], array['pompe','essence','injection'], 8, false, true, false,
   '[]'::jsonb),

  ('Kit disques d''embrayage', 'kit-disques-d-embrayage', 'SR-EMB-KIT', 'embrayage', 'SR', 13000, null,
   'Disques garnis et ressorts.',
   'Kit d''embrayage comprenant les disques garnis, les disques lisses et les ressorts de pression.',
   array['Sirius','Boxer'], array['embrayage','disque','ressort'], 17, false, false, false,
   '[]'::jsonb),

  ('Câble d''embrayage', 'cable-d-embrayage', 'SR-CAB-EMB', 'embrayage', 'SR', 2500, null,
   'Câble gainé avec réglage micrométrique.',
   'Câble d''embrayage gainé avec molette de réglage, longueur standard.',
   array['Sirius','Boxer'], array['cable','embrayage'], 45, false, false, false,
   '[]'::jsonb),

  ('Radiateur moto', 'radiateur-moto', 'SR-RAD-001', 'refroidissement', 'SR', 42000, null,
   'Radiateur aluminium avec bouchon.',
   'Radiateur en aluminium avec bouchon de remplissage, pour motos refroidies par liquide.',
   array['Haojue','Apsonic'], array['radiateur','refroidissement'], 4, false, false, false,
   '[]'::jsonb),

  ('Liquide de refroidissement 1L', 'liquide-de-refroidissement-1l', 'SR-LIQ-REF', 'refroidissement', 'Total', 4000, null,
   'Liquide prêt à l''emploi, 1 litre.',
   'Liquide de refroidissement prêt à l''emploi protégeant le circuit contre la corrosion et l''ébullition.',
   array[]::text[], array['liquide','refroidissement','antigel'], 50, false, false, false,
   '[{"label":"Volume","value":"1 L"}]'::jsonb),

  ('Huile moteur 20W-50 1L', 'huile-moteur-20w-50-1l', 'SR-HUI-2050', 'huiles-lubrifiants', 'Total', 5000, 6000,
   'Huile minérale 4 temps, 1 litre.',
   'Huile moteur 4 temps 20W-50 adaptée au climat chaud, pour vidange courante des motos urbaines.',
   array[]::text[], array['huile','moteur','20w50','vidange'], 80, true, false, true,
   '[{"label":"Viscosité","value":"20W-50"},{"label":"Volume","value":"1 L"}]'::jsonb),

  ('Huile moteur 10W-40 semi-synthèse 1L', 'huile-moteur-10w-40-1l', 'SR-HUI-1040', 'huiles-lubrifiants', 'Elf', 7000, null,
   'Semi-synthèse 4 temps, 1 litre.',
   'Huile semi-synthétique 10W-40 pour motos exigeantes, meilleure protection au démarrage.',
   array[]::text[], array['huile','10w40','semi synthese'], 35, false, true, false,
   '[{"label":"Viscosité","value":"10W-40"},{"label":"Volume","value":"1 L"}]'::jsonb),

  ('Pneu avant 2.75-18', 'pneu-avant-2-75-18', 'SR-PNE-27518', 'pneus-roues', 'Vee Rubber', 16000, null,
   'Pneu avant 2.75-18 à gomme renforcée.',
   'Pneu avant 2.75-18 avec sculpture adaptée aux routes bitumées et pistes latéritiques.',
   array['Sirius','Boxer'], array['pneu','2.75-18','avant'], 20, false, false, false,
   '[{"label":"Dimension","value":"2.75-18"}]'::jsonb),

  ('Pneu arrière 3.00-18', 'pneu-arriere-3-00-18', 'SR-PNE-30018', 'pneus-roues', 'Vee Rubber', 19000, null,
   'Pneu arrière 3.00-18 renforcé.',
   'Pneu arrière 3.00-18 à carcasse renforcée, conçu pour les charges lourdes et les trajets quotidiens.',
   array['Sirius','Boxer'], array['pneu','3.00-18','arriere'], 18, true, false, false,
   '[{"label":"Dimension","value":"3.00-18"}]'::jsonb),

  ('Chambre à air 18 pouces', 'chambre-a-air-18-pouces', 'SR-CHB-18', 'pneus-roues', 'SR', 3500, null,
   'Chambre à air renforcée, valve droite.',
   'Chambre à air 18 pouces en caoutchouc renforcé, valve droite métallique.',
   array[]::text[], array['chambre a air','18','pneu'], 60, false, false, false,
   '[]'::jsonb),

  ('Mâchoires de frein arrière', 'machoires-de-frein-arriere', 'SR-FRE-MAC', 'freinage', 'SR', 4500, null,
   'Paire de mâchoires garnies.',
   'Paire de mâchoires de frein arrière garnies, avec ressorts de rappel.',
   array['Sirius','Boxer'], array['frein','machoire','arriere'], 32, false, false, false,
   '[]'::jsonb),

  ('Plaquettes de frein avant', 'plaquettes-de-frein-avant', 'SR-FRE-PLA', 'freinage', 'SR', 5000, null,
   'Jeu de plaquettes pour frein à disque.',
   'Jeu de plaquettes de frein avant pour étrier à disque, garniture organique.',
   array['Haojue','Apsonic'], array['plaquette','frein','disque'], 25, false, false, false,
   '[]'::jsonb),

  ('Rétroviseurs (paire)', 'retroviseurs-paire', 'SR-ACC-RET', 'accessoires', 'SR', 4500, null,
   'Paire de rétroviseurs universels.',
   'Paire de rétroviseurs à tige réglable, filetage universel, miroir convexe grand angle.',
   array[]::text[], array['retroviseur','accessoire','miroir'], 40, false, false, false,
   '[]'::jsonb),

  ('Support téléphone guidon', 'support-telephone-guidon', 'SR-ACC-SUP', 'accessoires', 'SR', 5500, 7000,
   'Support antivibration pour guidon.',
   'Support de téléphone à fixation sur guidon, serrage rapide et amorti antivibration.',
   array[]::text[], array['support','telephone','guidon','accessoire'], 30, true, true, true,
   '[]'::jsonb)
) as v(name, slug, reference, category_slug, brand, price, old_price,
       short_description, description, compatibility, keywords, stock,
       is_featured, is_new, is_promo, specifications)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
