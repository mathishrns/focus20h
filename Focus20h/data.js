// Contenu de l'appli Focus 20h : formats, citations, idées, modèles, guide.
// Tout est modifiable ici sans toucher au reste du code.
window.F20_DATA = {
  formats: [
    { id: 'citation', label: 'Citation', emoji: '💬' },
    { id: 'pov', label: 'Vlog POV', emoji: '🎥' },
    { id: 'entrainement', label: 'Suivi entraînement', emoji: '🏋️' },
    { id: 'comique', label: 'Humour', emoji: '😂' },
    { id: 'storytelling', label: 'Storytelling', emoji: '🎙️' },
    { id: 'defi', label: 'Défi', emoji: '🔥' },
    { id: 'carrousel', label: 'Carrousel', emoji: '🖼️' },
    { id: 'conseil', label: 'Conseil rapide', emoji: '💡' },
    { id: 'recette', label: 'Repas / recette', emoji: '🍽️' },
    { id: 'autre', label: 'Autre', emoji: '✨' },
  ],
  // Formats cochés dans le questionnaire : le coach propose de les tester en priorité.
  wantedFormats: ['citation', 'pov', 'entrainement', 'comique', 'storytelling', 'defi', 'carrousel'],

  platforms: [
    { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
    { id: 'instagram', label: 'Instagram', emoji: '📸' },
    { id: 'shorts', label: 'YouTube Shorts', emoji: '▶️' },
  ],

  stages: [
    { id: 'idee', label: 'Idée', emoji: '💡' },
    { id: 'tournee', label: 'Tournée', emoji: '🎬' },
    { id: 'montee', label: 'Montée', emoji: '✂️' },
    { id: 'publiee', label: 'Publiée', emoji: '✅' },
  ],

  themes: [
    { id: 'discipline', label: 'Discipline' },
    { id: 'sport', label: 'Sport' },
    { id: 'devperso', label: 'Dév. perso' },
    { id: 'nutrition', label: 'Nutrition' },
  ],

  seed: {
    why: "Aider les gens en leur montrant mon train de vie et la discipline que j'ai, et essayer d'avoir un revenu supplémentaire.",
    success: ['Gagner de l’argent (partenariats, coaching, produits)', 'Rester régulier et progresser, peu importe les chiffres', 'Aider des gens concrètement'],
    wins: [
      { text: '15 vidéos publiées en 2 semaines sur TikTok', icon: '🎬' },
      { text: 'Lancement de Focus 20h', icon: '🚀' },
    ],
  },

  encouragements: [
    'Chaque vidéo t’apprend quelque chose. Même celles à 23 vues.',
    'Tu compares ton chapitre 1 au chapitre 20 des autres. Continue d’écrire.',
    'Ta citation a fait 1 000 vues. Le potentiel est là.',
    'Régulier vaut mieux que parfait.',
    'Aujourd’hui, une seule petite action suffit.',
    'Tous les gros comptes ont commencé à 0 abonné.',
    'Tu fais ce que la plupart ne feront jamais : tu commences.',
    'Ce n’est pas une course, c’est une construction.',
    'La discipline que tu as à la salle, mets-la ici aussi.',
    'Tester, c’est déjà avancer. Il n’y a pas d’échec, juste des données.',
    'Personne ne voit le travail du début. Toi, tu le sais.',
    'Une vidéo de plus, c’est une chance de plus.',
    'Les vues suivent la régularité, pas l’inverse.',
    'Tu n’as pas besoin d’être prêt. Tu as besoin de commencer.',
  ],

  journalPrompts: [
    'Qu’est-ce qui t’a rendu fier aujourd’hui ?',
    'Qu’as-tu appris aujourd’hui ?',
    'Qu’est-ce qui t’a donné de l’énergie ?',
    'Une idée de vidéo qui t’est venue ?',
    'Pour quoi es-tu reconnaissant aujourd’hui ?',
    'Qu’est-ce qui a été difficile, et comment tu l’as géré ?',
    'Si tu refaisais ta journée, tu changerais quoi ?',
  ],

  moods: [
    { v: 1, e: '😞', l: 'Dur' },
    { v: 2, e: '😕', l: 'Bof' },
    { v: 3, e: '😐', l: 'Neutre' },
    { v: 4, e: '🙂', l: 'Bien' },
    { v: 5, e: '😄', l: 'Top' },
  ],

  defaultHabits: [
    { id: 'sport', name: 'Séance de sport', icon: '🏋️' },
    { id: 'manger', name: 'Bien mangé', icon: '🥗' },
    { id: 'sommeil', name: 'Sommeil 7 h+', icon: '😴' },
    { id: 'eau', name: 'Eau 2 L', icon: '💧' },
    { id: 'devperso', name: 'Lecture / dév. perso', icon: '📖' },
    { id: 'contenu', name: 'Travail sur le contenu', icon: '🎬' },
  ],

  defaultGoals: [
    { text: 'Tester 5 formats différents', auto: 'formats', target: 5 },
    { text: 'Publier sur TikTok, Instagram et YouTube Shorts', auto: 'platforms', target: 3 },
    { text: 'Terminer 3 phases de test', auto: 'phases', target: 3 },
    { text: 'Publier 50 vidéos', auto: 'published', target: 50 },
  ],

  intentionPresets: [
    '💡 Noter 3 idées', '🎬 Tourner une vidéo', '✂️ Monter une vidéo', '✅ Publier',
    '📊 Noter mes stats', '🏋️ Séance salle', '🏃 Course', '⚡ Hyrox',
    '📖 Lire 20 min', '📝 Écrire dans le journal', '🥗 Préparer mes repas', '😴 Couché tôt',
  ],

  exercises: [
    { id: 'hyrox', name: 'Hyrox (temps total)', type: 'time' },
    { id: 'run1k', name: 'Course 1 km', type: 'time' },
    { id: 'run5k', name: 'Course 5 km', type: 'time' },
    { id: 'skierg', name: 'SkiErg 1 000 m', type: 'time' },
    { id: 'row', name: 'Rameur 1 000 m', type: 'time' },
    { id: 'wallballs', name: 'Wall balls (100)', type: 'time' },
    { id: 'squat', name: 'Squat', type: 'kg' },
    { id: 'bench', name: 'Développé couché', type: 'kg' },
    { id: 'deadlift', name: 'Soulevé de terre', type: 'kg' },
    { id: 'pullups', name: 'Tractions (max)', type: 'reps' },
  ],
  exerciseTypes: [
    { id: 'time', label: 'Temps (plus bas = mieux)', unit: '' },
    { id: 'kg', label: 'Charge (kg)', unit: 'kg' },
    { id: 'reps', label: 'Répétitions', unit: 'reps' },
    { id: 'km', label: 'Distance (km)', unit: 'km' },
  ],

  // type: 'citation' ou 'accroche'
  quotes: [
    { type: 'citation', text: 'Nous sommes ce que nous répétons chaque jour. L’excellence n’est donc pas une action, c’est une habitude.', author: 'Will Durant (d’après Aristote)' },
    { type: 'citation', text: 'L’obstacle à l’action fait avancer l’action. Ce qui se dresse sur le chemin devient le chemin.', author: 'Marc Aurèle' },
    { type: 'citation', text: 'Ce n’est pas parce que les choses sont difficiles que nous n’osons pas, c’est parce que nous n’osons pas qu’elles sont difficiles.', author: 'Sénèque' },
    { type: 'citation', text: 'Il n’y a pas de vent favorable pour celui qui ne sait pas où il va.', author: 'Sénèque' },
    { type: 'citation', text: 'Ce qui trouble les hommes, ce ne sont pas les choses, mais les jugements qu’ils portent sur ces choses.', author: 'Épictète' },
    { type: 'citation', text: 'Un voyage de mille lieues commence toujours par un premier pas.', author: 'Lao Tseu' },
    { type: 'citation', text: 'Tu ne t’élèves pas au niveau de tes objectifs. Tu tombes au niveau de tes systèmes.', author: 'James Clear' },
    { type: 'citation', text: 'Chaque action est un vote pour la personne que tu veux devenir.', author: 'D’après James Clear' },
    { type: 'citation', text: 'Le travail bat le talent quand le talent ne travaille pas.', author: 'Tim Notke' },
    { type: 'citation', text: 'Soit tu diriges ta journée, soit c’est elle qui te dirige.', author: 'Jim Rohn' },
    { type: 'citation', text: 'Commence là où tu es. Utilise ce que tu as. Fais ce que tu peux.', author: 'Arthur Ashe' },
    { type: 'citation', text: 'Le hasard ne favorise que les esprits préparés.', author: 'Louis Pasteur' },
    { type: 'citation', text: 'Tombe sept fois, relève-toi huit.', author: 'Proverbe japonais' },
    { type: 'citation', text: 'La discipline, c’est choisir entre ce que tu veux maintenant et ce que tu veux le plus.', author: '' },
    { type: 'citation', text: 'La motivation te fait commencer. L’habitude te fait continuer.', author: '' },
    { type: 'citation', text: 'Personne ne viendra te sauver. Et c’est une bonne nouvelle.', author: '' },
    { type: 'citation', text: 'Fais-le fatigué. Fais-le sans envie. Mais fais-le.', author: '' },
    { type: 'citation', text: 'Compare-toi à celui que tu étais hier, pas à quelqu’un d’autre aujourd’hui.', author: '' },
    { type: 'citation', text: 'Les résultats arrivent en silence. Continue.', author: '' },
    { type: 'citation', text: 'Tu n’as pas besoin de motivation. Tu as besoin d’une heure fixe.', author: '' },
    { type: 'citation', text: 'Un jour, ou jour un. C’est toi qui choisis.', author: '' },
    { type: 'citation', text: 'La douleur de la discipline pèse des grammes. Celle du regret pèse des tonnes.', author: '' },
    { type: 'citation', text: 'Ton futur toi te regarde. Ne le déçois pas.', author: '' },
    { type: 'citation', text: 'La version de toi que tu veux devenir fait déjà ce que tu repousses.', author: '' },
    { type: 'citation', text: 'Ce que tu fais quand personne ne regarde, c’est ce que tu deviens.', author: '' },
    { type: 'citation', text: 'Pas de raccourci. Juste des répétitions.', author: '' },
    { type: 'citation', text: 'Les excuses ne brûlent pas de calories.', author: '' },
    { type: 'citation', text: 'Le confort est l’ennemi du progrès.', author: '' },
    { type: 'citation', text: 'Discipline aujourd’hui, liberté demain.', author: '' },
    { type: 'citation', text: 'Sois trop régulier pour être ignoré.', author: '' },
    { type: 'citation', text: 'Lentement, c’est toujours plus rapide que l’arrêt.', author: '' },
    { type: 'citation', text: 'Tu n’as pas échoué. Tu as appris ce qui ne marche pas.', author: '' },
    { type: 'citation', text: 'Petit progrès chaque jour, grands résultats chaque année.', author: '' },
    { type: 'citation', text: 'Le corps abandonne quand l’esprit le décide.', author: '' },
    { type: 'citation', text: 'Personne ne regarde ? Parfait. C’est là que tout se construit.', author: '' },

    { type: 'accroche', text: 'Personne ne te dira ça, alors je le fais.' },
    { type: 'accroche', text: 'Si tu procrastines, regarde ça jusqu’au bout.' },
    { type: 'accroche', text: 'J’ai testé [X] pendant 30 jours. Voilà le résultat.' },
    { type: 'accroche', text: 'Arrête de faire ça si tu veux progresser.' },
    { type: 'accroche', text: 'Ce que personne ne voit derrière ma discipline.' },
    { type: 'accroche', text: 'Il est 5 h. Voilà pourquoi je suis debout.' },
    { type: 'accroche', text: '3 choses que j’aurais aimé savoir avant de commencer [X].' },
    { type: 'accroche', text: 'Tu fais cette erreur à la salle sans le savoir.' },
    { type: 'accroche', text: 'Garde cette vidéo pour les jours sans motivation.' },
    { type: 'accroche', text: 'Si tu tombes sur cette vidéo, c’est un signe.' },
    { type: 'accroche', text: 'Jour 1. Je documente tout.' },
    { type: 'accroche', text: 'Écoute ça avant ta séance.' },
    { type: 'accroche', text: 'Une phrase qui a changé ma façon de m’entraîner.' },
    { type: 'accroche', text: 'Envoie ça à quelqu’un qui a besoin de l’entendre.' },
    { type: 'accroche', text: 'POV : tu as décidé d’arrêter de te chercher des excuses.' },
    { type: 'accroche', text: 'Ce que je mange en une journée d’entraînement Hyrox.' },
    { type: 'accroche', text: 'Le secret ? Il n’y a pas de secret.' },
    { type: 'accroche', text: 'Lis ça si tu as envie d’abandonner.' },
    { type: 'accroche', text: 'Mes 15 premières vidéos ont fait 23 vues. Voilà pourquoi je continue.' },
    { type: 'accroche', text: 'La différence entre ceux qui y arrivent et les autres ? Ça.' },
  ],

  // f: format, t: thème. « how » = comment filmer sans montrer son visage.
  ideas: [
    { f: 'citation', t: 'discipline', title: 'Citation « Personne ne viendra te sauver »', hook: 'Personne ne viendra te sauver. Et c’est une bonne nouvelle.', how: 'Photo sombre de salle vide ou ciel à l’aube, texte centré, son lent et grave.' },
    { f: 'citation', t: 'discipline', title: 'Citation « Fais-le fatigué »', hook: 'Fais-le fatigué. Fais-le sans envie. Mais fais-le.', how: 'Photo de tes chaussures devant la porte au petit matin.' },
    { f: 'citation', t: 'devperso', title: 'Citation Marc Aurèle sur l’obstacle', hook: 'Ce qui se dresse sur le chemin devient le chemin.', how: 'Vidéo d’ambiance : route, escaliers, pluie. Texte en blanc, son épique.' },
    { f: 'citation', t: 'devperso', title: 'Citation « Compare-toi à toi d’hier »', hook: 'Compare-toi à celui que tu étais hier.', how: 'Ton reflet flou dans une vitre ou ton ombre au sol.' },
    { f: 'citation', t: 'sport', title: 'Citation « Les excuses ne brûlent pas de calories »', hook: 'Les excuses ne brûlent pas de calories.', how: 'Gros plan sur une barre chargée ou un kettlebell.' },
    { f: 'citation', t: 'discipline', title: 'Série de 3 citations (même fond, même son)', hook: '3 phrases à relire quand tu veux abandonner.', how: 'Format photo TikTok : 3 images, même style. Comme ta vidéo à 1 000 vues.' },

    { f: 'pov', t: 'discipline', title: 'Ma routine du matin à 5 h 30', hook: '5 h 30. Personne ne me voit faire ça.', how: 'Caméra au torse : réveil, verre d’eau, tenue, porte qui s’ouvre.' },
    { f: 'pov', t: 'discipline', title: 'Ce que je fais quand j’ai zéro motivation', hook: 'Zéro motivation aujourd’hui. Regarde ce que je fais quand même.', how: 'Mains qui préparent le sac, trajet, première série.' },
    { f: 'pov', t: 'discipline', title: 'Une journée de discipline de A à Z', hook: 'Une journée normale quand tu arrêtes d’attendre la motivation.', how: 'Plans courts (2 s) à chaque étape de la journée, toujours sans visage.' },
    { f: 'pov', t: 'sport', title: 'POV : ta première compétition Hyrox', hook: 'POV : tu arrives à ta première Hyrox.', how: 'Caméra torse dans le hall, échauffement, ligne de départ.' },
    { f: 'pov', t: 'sport', title: 'Prépare ton sac de salle avec moi', hook: 'Ce qu’il y a dans mon sac de sport (le 4e est indispensable).', how: 'Plan du dessus, chaque objet posé un par un.' },
    { f: 'pov', t: 'nutrition', title: 'Ce que je mange en une journée d’entraînement', hook: 'Ce que je mange en une journée d’entraînement Hyrox.', how: 'Chaque repas filmé du dessus, macros à l’écran.' },
    { f: 'pov', t: 'devperso', title: 'Ma routine du soir pour bien dormir', hook: 'Ce que je fais chaque soir pour être en forme à 5 h.', how: 'Lumière tamisée, mains, livre, téléphone posé loin.' },

    { f: 'entrainement', t: 'sport', title: 'Ma séance Hyrox du jour', hook: 'Séance Hyrox du jour : tu tiendrais combien de temps ?', how: 'Plans larges de dos, gros plans SkiErg et sled, chrono à l’écran.' },
    { f: 'entrainement', t: 'sport', title: 'Mon chrono 1 km, semaine après semaine', hook: 'Semaine 1 : [chrono]. On verra en semaine 8.', how: 'Gros plan sur la montre ou l’écran du tapis.' },
    { f: 'entrainement', t: 'sport', title: 'Avant / après : 3 mois de progression', hook: 'Il y a 3 mois je soulevais [X] kg. Aujourd’hui :', how: 'Même angle, même exercice, filmé de côté au niveau des jambes.' },
    { f: 'entrainement', t: 'sport', title: 'Séance jambes complète en 45 min', hook: 'La séance jambes que je fais chaque semaine.', how: 'Un plan par exercice, nombre de séries et reps à l’écran.' },

    { f: 'comique', t: 'discipline', title: 'Mon cerveau à 6 h du matin', hook: 'Mon cerveau quand le réveil sonne à 6 h :', how: 'Texte à l’écran, plan sur le réveil puis la couette, voix off qui fait le dialogue.' },
    { f: 'comique', t: 'sport', title: 'Les 5 types de personnes à la salle', hook: 'Les 5 personnes que tu croises à chaque séance :', how: 'Texte + plans d’objets ou de machines, voix off qui imite.' },
    { f: 'comique', t: 'sport', title: 'Après la séance jambes', hook: 'Après la séance jambes, les escaliers deviennent le boss final.', how: 'Plan sur tes jambes dans un escalier, son dramatique.' },
    { f: 'comique', t: 'devperso', title: '« Lundi je change de vie »', hook: 'Moi chaque dimanche soir : « Lundi je change de vie. »', how: 'Texte + calendrier + plan sur le canapé.' },
    { f: 'comique', t: 'nutrition', title: 'Moi au restaurant pendant une sèche', hook: 'Le serveur : « Un dessert ? » Moi pendant ma sèche :', how: 'Plan sur la carte des desserts, texte à l’écran, son tendance.' },
    { f: 'comique', t: 'sport', title: 'Quand on te dit que l’Hyrox c’est facile', hook: '« L’Hyrox ? C’est juste courir un peu. »', how: 'Plans de toi épuisé au sol, de dos, après les wall balls.' },

    { f: 'storytelling', t: 'devperso', title: 'Le jour où j’ai décidé de changer', hook: 'Il y a [X] ans, j’étais [situation]. Voilà ce qui a tout déclenché.', how: 'Voix off sur des plans de dos, en marchant, à la salle.' },
    { f: 'storytelling', t: 'devperso', title: 'Mes 15 premières vidéos ont fait 23 vues', hook: 'Mes 15 premières vidéos ont fait 23 vues. Voilà pourquoi je continue.', how: 'Voix off sur ton écran (stats floutées) puis plans de salle. Les gens adorent suivre un début.' },
    { f: 'storytelling', t: 'sport', title: 'Pourquoi je me suis mis à l’Hyrox', hook: 'Je ne savais même pas ce qu’était l’Hyrox il y a [X] mois.', how: 'Voix off sur des images d’entraînement et de compétition.' },
    { f: 'storytelling', t: 'devperso', title: 'Ce que la salle m’a appris sur la vie', hook: 'La salle m’a appris 3 choses que l’école ne m’a jamais apprises.', how: 'Une leçon par plan : barre, sueur, chrono.' },
    { f: 'storytelling', t: 'devperso', title: 'Le jour où j’ai arrêté de me comparer', hook: 'J’ai failli tout arrêter parce que je me comparais.', how: 'Voix off calme, plans du quotidien, lumière douce.' },
    { f: 'storytelling', t: 'discipline', title: 'Pourquoi « Focus 20h » ?', hook: 'On me demande pourquoi Focus 20h. Voilà l’histoire.', how: 'Plan sur une horloge à 20 h, puis ce que tu fais à ce moment-là.' },

    { f: 'defi', t: 'discipline', title: '30 jours : pas de téléphone avant 9 h', hook: 'Jour 1/30 : pas de téléphone avant 9 h.', how: 'Même plan chaque jour : téléphone retourné sur la table + « Jour X ».' },
    { f: 'defi', t: 'discipline', title: 'Debout à 5 h pendant 30 jours', hook: 'Jour 1 : je me lève à 5 h pendant 30 jours. Suis-moi pour voir si je tiens.', how: 'Plan fixe sur le réveil, l’heure à l’écran.' },
    { f: 'defi', t: 'sport', title: '100 wall balls par jour pendant 30 jours', hook: 'Jour 1/30 : 100 wall balls. Je note mon temps chaque jour.', how: 'Même angle de dos, chrono à l’écran, courbe de progression à la fin.' },
    { f: 'defi', t: 'devperso', title: '30 jours de journal', hook: 'Jour 1/30 : j’écris 3 lignes chaque soir.', how: 'Mains et carnet (ou iPad), lumière du soir.' },
    { f: 'defi', t: 'nutrition', title: '30 jours sans sucre ajouté', hook: 'Jour 1/30 sans sucre ajouté. Le jour 3 est le pire, paraît-il.', how: 'Plan du dessus des repas, compteur de jours.' },
    { f: 'defi', t: 'discipline', title: '100 jours de discipline documentés', hook: 'Jour 1/100. Je documente tout. Même les mauvais jours.', how: 'Une vidéo de 10 s par jour, même format : la série crée l’habitude chez les abonnés.' },

    { f: 'carrousel', t: 'discipline', title: '5 règles de discipline que je ne casse jamais', hook: '5 règles que je ne casse jamais (même fatigué).', how: '6 slides fond noir, texte blanc, une règle par slide.' },
    { f: 'carrousel', t: 'sport', title: 'Les 8 stations Hyrox expliquées', hook: 'Hyrox, c’est quoi ? 8 km de course, 8 stations.', how: 'Une station par slide : SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, Rameur, Farmers Carry, Sandbag Lunges, Wall Balls.' },
    { f: 'carrousel', t: 'devperso', title: 'Les livres qui m’ont changé', hook: 'Les livres qui ont changé ma façon de penser.', how: 'Photo de chaque livre posé sur une table, une phrase clé par slide.' },
    { f: 'carrousel', t: 'devperso', title: 'Discipline ou motivation ?', hook: 'Motivation vs discipline : la différence qui change tout.', how: 'Tableau 2 colonnes, une ligne par slide.' },
    { f: 'carrousel', t: 'nutrition', title: 'Mes 5 aliments de base', hook: 'Les 5 aliments que j’ai toujours dans ma cuisine.', how: 'Une photo du dessus par aliment, macros en petit.' },

    { f: 'conseil', t: 'discipline', title: 'La règle des 2 minutes', hook: 'Tu procrastines ? Essaie ça : 2 minutes, pas plus.', how: 'Voix off + plans des mains qui commencent une tâche.' },
    { f: 'conseil', t: 'devperso', title: 'Comment je planifie ma semaine en 10 minutes', hook: '10 minutes le dimanche, et ma semaine est réglée.', how: 'Mains sur carnet ou iPad, vue du dessus.' },
    { f: 'conseil', t: 'sport', title: '3 erreurs que je faisais au SkiErg', hook: 'J’ai perdu du temps au SkiErg à cause de ces 3 erreurs.', how: 'Filmé de côté, au niveau des bras, sans le visage.' },
    { f: 'conseil', t: 'nutrition', title: 'Préparer ses repas de la semaine', hook: '1 heure le dimanche = 5 jours sans réfléchir.', how: 'Plan du dessus, accéléré, boîtes alignées à la fin.' },
    { f: 'conseil', t: 'devperso', title: 'Ce que je fais quand je n’ai pas envie', hook: 'Pas envie ? Voilà ma méthode en 3 étapes.', how: 'Voix off sur des plans de trajet vers la salle.' },

    { f: 'recette', t: 'nutrition', title: 'Mon repas post-entraînement en 5 minutes', hook: 'Mon repas post-séance en 5 minutes, [X] g de protéines.', how: 'Plan du dessus, une étape par plan, macros à l’écran.' },
    { f: 'recette', t: 'nutrition', title: 'Mon petit-déjeuner avant l’Hyrox', hook: 'Ce que je mange 2 h avant une course.', how: 'Plan du dessus, lumière du matin.' },
  ],

  templates: {
    citation: `🎯 ACCROCHE (texte à l'écran, 0–2 s)
→ La citation elle-même, en gros, lisible en 2 secondes.

🖼️ VISUEL
→ Photo ou vidéo d'ambiance (salle vide, aube, chaussures, route).
→ Sans visage : de dos, mains, silhouette, objets.

🎵 SON
→ Un son tendance calme ou épique.

✍️ LÉGENDE
→ Une phrase perso qui prolonge la citation + une question.
Ex. : « Tu fais quoi quand t'as zéro motivation ? »

#️⃣ 3 à 5 hashtags : #discipline #motivation …`,
    pov: `🎯 ACCROCHE (0–2 s)
→ « POV : … » ou une heure (« 5 h 30. »)

🎥 PLANS (caméra au torse, mains, de dos)
1.
2.
3.
4.

🎙️ VOIX OFF ou TEXTE
→ Une phrase courte par plan.

🏁 FIN
→ Phrase forte ou question : « Et toi, tu commences quand ? »`,
    entrainement: `🎯 ACCROCHE (0–2 s)
→ Le défi ou le chiffre : « Mon 1 km en semaine 1 : 4:32. »

🏋️ SÉANCE
→ Exercices :
→ Chronos / charges :

🎥 PLANS
→ Gros plans (mains, chaussures, chrono), plans larges de dos.

📈 PROGRESSION
→ Comparaison avec la dernière fois :

🏁 FIN
→ « Rendez-vous la semaine prochaine pour voir si je bats ce chrono. »`,
    comique: `🎯 SITUATION (0–2 s)
→ « Moi quand… » / « Les 5 types de… »

😂 DÉROULÉ
→ La mise en place :
→ La chute :

🎥 SANS VISAGE
→ Texte à l'écran, objets, mains, voix off qui joue les personnages.

🎵 SON
→ Un son comique tendance colle souvent mieux qu'une voix.`,
    storytelling: `🎯 ACCROCHE (0–3 s)
→ Le moment fort en premier : « Il y a 2 ans, j'étais… »

📖 HISTOIRE
1. Avant (situation, problème) :
2. Le déclic :
3. Ce que j'ai fait :
4. Aujourd'hui :

🎙️ VOIX OFF
→ Parle comme à un pote. Phrases courtes.

🎥 PLANS
→ De dos, en marchant, à la salle, paysages, mains.

🏁 FIN
→ La leçon en une phrase + « Abonne-toi pour la suite. »`,
    defi: `🎯 ACCROCHE
→ « Jour X/30 : … »

📋 RÈGLE DU DÉFI
→

🎥 MÊME PLAN CHAQUE JOUR
→ Même angle, même lieu : la répétition crée la série.

📈 LE CHIFFRE DU JOUR
→

🏁 FIN
→ « Jour X+1 demain. »`,
    carrousel: `🖼️ SLIDE 1 (accroche)
→ Le titre qui donne envie de faire défiler.

🖼️ SLIDES 2 À 6
→ Une idée par slide, 1 à 2 phrases maximum.
2.
3.
4.
5.
6.

🖼️ DERNIÈRE SLIDE
→ « Enregistre pour plus tard » ou une question.

🎨 STYLE
→ Fond sombre, texte blanc, du vert pour les mots clés.`,
    conseil: `🎯 ACCROCHE (0–2 s)
→ Le problème : « Tu procrastines ? »

💡 CONSEILS
→ 1 :
→ 2 :
→ 3 :

🎥 PLANS
→ Illustrer chaque conseil (mains, objets, écran).

🏁 FIN
→ « Teste demain et dis-moi. »`,
    recette: `🎯 ACCROCHE
→ « Mon repas post-séance en 5 min. »

🍽️ INGRÉDIENTS / MACROS
→

🎥 PLANS DU DESSUS
→ Chaque étape en un plan court.

🏁 FIN
→ Le plat final + les macros à l'écran.`,
    autre: `🎯 ACCROCHE (0–2 s)
→

📌 CONTENU
→

🏁 FIN
→`,
  },

  // Guide : contenu HTML simple (affiché tel quel).
  guide: [
    {
      icon: '🌱', title: 'La vérité sur les débuts',
      html: `<p>15 vidéos en 2 semaines, c'est <strong>le tout début</strong>. Presque tous les créateurs ont connu les vidéos à 20 ou 30 vues.</p>
<ul>
<li>Chaque vidéo est d'abord montrée à un petit groupe. Si ce groupe regarde jusqu'au bout, partage ou enregistre, elle est montrée à plus de monde.</li>
<li>23 vues ne veut pas dire « nul ». Ça veut dire que la vidéo n'a pas passé le premier test. On ajuste et on recommence.</li>
<li>Ta citation à <strong>1 000 vues et 100 j'aime</strong>, c'est un signal clair : 10 % de j'aime, c'est très bon. Il faut creuser ce format.</li>
<li>Juge sur des moyennes de 5 à 10 vidéos, jamais sur une seule.</li>
</ul>`,
    },
    {
      icon: '⚡', title: 'Les 2 premières secondes',
      html: `<p>C'est là que tout se joue : la personne décide si elle reste ou si elle passe à la suite.</p>
<ul>
<li><strong>Texte à l'écran dès la première image.</strong> Beaucoup regardent sans le son.</li>
<li>Commence par le moment fort, pas par « Salut, aujourd'hui… ».</li>
<li>Pose une question, crée une tension ou donne un chiffre précis.</li>
<li>Pioche dans la banque d'accroches (Contenus → Citations → Accroches).</li>
</ul>`,
    },
    {
      icon: '🙈', title: 'Créer sans montrer son visage',
      html: `<p>Plein de comptes motivation et sport marchent très bien sans visage. Ce qui compte, c'est l'ambiance et le message.</p>
<ul>
<li><strong>Vue subjective (POV)</strong> : iPhone fixé au torse (support pince ou harnais), ou tenu en bas.</li>
<li><strong>De dos</strong>, en silhouette à contre-jour, ou ton ombre au sol.</li>
<li><strong>Gros plans</strong> : mains, chaussures, barre, chrono, montre.</li>
<li><strong>Plans d'ambiance</strong> : salle vide, aube, route, pluie sur la vitre.</li>
<li><strong>Ta voix off</strong> crée le lien : les gens s'attachent à une voix.</li>
<li>Garde une <strong>signature visuelle</strong> (même police, même vert, même type de son) pour qu'on te reconnaisse.</li>
</ul>`,
    },
    {
      icon: '📱', title: 'Une vidéo, trois plateformes',
      html: `<p>Une même vidéo verticale peut être publiée sur TikTok, Instagram Reels et YouTube Shorts. C'est trois chances au lieu d'une, sans travail en plus.</p>
<ul>
<li><strong>Exporte depuis CapCut</strong>, pas depuis TikTok, pour éviter le logo TikTok (Instagram et YouTube montrent moins les vidéos avec un logo concurrent).</li>
<li><strong>TikTok</strong> : sons tendance, textes à l'écran, réponses aux commentaires en vidéo.</li>
<li><strong>Instagram</strong> : Reels pour être découvert, carrousels pour être enregistré, stories pour créer du lien.</li>
<li><strong>YouTube Shorts</strong> : le titre compte (il est utilisé dans la recherche). Les Shorts continuent souvent d'être vus des semaines après.</li>
<li>Note la plateforme dans chaque vidéo pour voir où ton contenu marche le mieux.</li>
</ul>`,
    },
    {
      icon: '🧪', title: 'La méthode des phases de test',
      html: `<ol>
<li>Choisis <strong>un format</strong> (ex. : citations).</li>
<li>Publie <strong>5 à 7 vidéos</strong> de ce format, à ton rythme.</li>
<li>Note juste les vues (et les j'aime si tu as le temps).</li>
<li>Termine la phase et écris ce que tu as appris.</li>
<li>Passe au format suivant, puis compare dans <strong>Tests → Analyse</strong>.</li>
</ol>
<p>Quand un format marche, fais des variantes en changeant <strong>une seule chose</strong> à la fois : le son, l'accroche, le fond, la durée.</p>`,
    },
    {
      icon: '📊', title: 'Lire ses stats sans se faire du mal',
      html: `<ul>
<li>Regarde les <strong>moyennes par format</strong>, pas une vidéo seule.</li>
<li>Les <strong>partages et enregistrements</strong> comptent plus que les j'aime : ça veut dire que la vidéo a aidé quelqu'un.</li>
<li>Note tes vues <strong>2 ou 3 jours</strong> après la publication, pas au bout d'une heure.</li>
<li>Dans TikTok, regarde aussi le <strong>temps de visionnage moyen</strong> : si les gens partent avant 3 secondes, c'est l'accroche à revoir.</li>
<li>Compare-toi à <strong>ton toi d'il y a un mois</strong>, pas aux autres créateurs.</li>
</ul>`,
    },
    {
      icon: '💰', title: 'Gagner de l’argent (plus tard)',
      html: `<p>L'argent vient de la <strong>confiance</strong>, et la confiance vient de la régularité. Les pistes classiques dans ta thématique :</p>
<ul>
<li><strong>Partenariats</strong> avec des marques (nutrition, équipement, vêtements de sport). Même un petit compte engagé peut intéresser une marque.</li>
<li><strong>Affiliation</strong> : un lien ou un code promo sur les produits que tu utilises vraiment.</li>
<li><strong>Coaching / programmes</strong> : un programme de discipline sur 30 jours, un plan Hyrox débutant.</li>
<li><strong>Rémunération des plateformes</strong> : les conditions (nombre d'abonnés, durée des vidéos) changent souvent, vérifie-les directement dans chaque appli.</li>
</ul>
<p>Pour l'instant, l'objectif est simple : trouver le format qui marche, et être régulier.</p>`,
    },
  ],
};
