import type { DocsText } from "./en";

// French typography: a narrow no-break space before ; : ! ? and inside « ».
const NNBSP = " ";

export const fr: DocsText = {
  common: {
    docs: "Docs",
    breadcrumb: "Fil d’Ariane",
    pages: {
      overview: "Vue d’ensemble",
      "get-started": "Premiers pas",
      "wall-display": "Écran mural",
      customize: "Personnaliser",
      apps: "Apps",
      numbers: "Chiffres",
      security: "Sécurité",
      "self-hosting": "Auto-hébergement",
    },
    githubDocs: "Docs sur GitHub",
    onThisPage: "Sur cette page",
    previous: "Précédent",
    next: "Suivant",
    github: {
      title: "Aller plus loin sur GitHub",
      text: "Les guides complets, avec toutes les options, commandes et limites.",
    },
    cta: {
      title: "Voyez vos propres chiffres en direct dès aujourd’hui",
      text: "Gratuit pendant la bêta publique. Connectez Stripe avec une clé en lecture seule, et votre écran est prêt en deux minutes environ.",
      primary: "Commencer gratuitement",
      secondary: "Ouvrir la démo en direct",
    },
  },
  overview: {
    meta: {
      title: `Docs${NNBSP}: votre MRR Stripe sur une TV en deux minutes`,
      description: `Guides courts de SaaS Monitor${NNBSP}: connecter Stripe en lecture seule, afficher votre MRR sur une TV, le personnaliser, installer les apps ou l’auto-héberger.`,
    },
    title: "Opérationnel en deux minutes",
    lead: `Des guides courts, qui se lisent chacun en une minute ou deux${NNBSP}: installez SaaS Monitor, personnalisez-le et voyez pourquoi vous pouvez lui faire confiance. Tous les détails techniques sont sur GitHub.`,
    start: "Commencez ici",
    read: "Lire le guide",
    github: {
      title: `Vous préférez les guides techniques${NNBSP}?`,
      text: "La documentation sur GitHub couvre chaque option, commande et limite, pour les développeurs et ceux qui hébergent SaaS Monitor eux-mêmes.",
      links: {
        stripe: "Connecter Stripe",
        wall: "Installer un écran au mur",
        selfHosting: "Auto-hébergement",
      },
    },
  },
  getStarted: {
    summary:
      "Inscrivez-vous, connectez Stripe avec une clé en lecture seule, ouvrez un lien sur la TV. Deux minutes environ.",
    meta: {
      title: `Premiers pas${NNBSP}: votre MRR Stripe sur une TV en deux minutes`,
      description:
        "Créez un compte gratuit, connectez Stripe avec une clé restreinte en lecture seule, ouvrez le lien de l’écran sur toute TV. 4 étapes, 2 minutes environ.",
    },
    title: "Démarrer en deux minutes",
    lead: "De l’inscription à votre MRR sur la TV du bureau, en quatre étapes. Rien à installer, rien à coder.",
    facts: ["Deux minutes environ", "Clé Stripe en lecture seule", "Gratuit pendant la bêta"],
    steps: {
      title: "Quatre étapes",
      account: {
        title: "Créez votre compte gratuit",
        text: `Inscrivez-vous sur saas-monitor.com avec Google, GitHub ou votre e-mail${NNBSP}: c’est gratuit pendant la bêta publique. Vous obtenez un espace de travail, où vous pourrez inviter votre équipe plus tard.`,
      },
      connect: {
        title: "Connectez Stripe avec une clé en lecture seule",
        text: `Cliquez sur **Create a restricted key on Stripe**${NNBSP}: le Dashboard Stripe s’ouvre sur son formulaire de clé, avec les bonnes autorisations déjà sélectionnées. Vérifiez-les, nommez la clé et créez-la, puis collez-la dans SaaS Monitor.`,
        note: `La clé est vérifiée dès que vous la collez${NNBSP}: s’il manque une autorisation, SaaS Monitor vous dit laquelle.`,
      },
      import: {
        title: "Laissez-le importer votre historique",
        text: "SaaS Monitor importe vos abonnements, les 12 derniers mois de paiements et les clients des 7 derniers jours. Quelques secondes suffisent pour les petits comptes, quelques minutes pour les gros, et le tableau de bord affiche la progression.",
      },
      tv: {
        title: "Ouvrez votre écran sur la TV",
        text: "Votre premier écran est créé dès que Stripe est connecté. Copiez son lien, ouvrez-le dans le navigateur de la TV, sur un Raspberry Pi ou un portable qui ne sert plus, et cliquez une fois pour activer le son.",
        note: `Pour l’entendre, cliquez sur **Send a test celebration** dans les réglages de l’écran${NNBSP}: toutes les copies ouvertes de l’écran jouent une vente fictive.`,
      },
    },
    permissions: {
      title: "Quelles autorisations, et pourquoi",
      lead: "Sept autorisations en lecture, et une autorisation facultative en écriture. Toutes les autres restent sans accès.",
      columns: { permission: "Autorisation", access: "Accès", why: "Pourquoi" },
      access: { read: "Lecture", write: "Écriture" },
      optional: "Facultative",
      why: {
        subscriptions: "MRR, montées en gamme et résiliations",
        customers: "Nouveaux clients, leur nom et leur pays",
        charges: "Revenus, et une célébration à chaque paiement",
        events: "Ce qui a changé depuis la dernière vérification",
        products: "Noms des formules",
        prices: "Montants des tarifs par paliers",
        coupons: "Remises, qui réduisent le MRR",
        webhooks: `Mises à jour instantanées${NNBSP}: SaaS Monitor ajoute son propre webhook`,
      },
      callout: {
        title: "En lecture seule, par conception",
        text: `À part ajouter son propre webhook, si vous l’y autorisez, la clé ne peut que lire${NNBSP}: aucun débit, aucun remboursement, aucune modification de vos clients. Elle est chiffrée au repos, n’est plus jamais affichée, et vous pouvez la révoquer dans Stripe à tout moment.`,
      },
      webhook:
        "Avec l’autorisation facultative **Webhook Endpoints**, chaque vente arrive au mur en quelques secondes. [Comment fonctionnent les mises à jour](doc-numbers)",
    },
    test: {
      title: "Essayez avec des données de test",
      text: `Pas encore prêt à connecter votre compte en production${NNBSP}? Créez plutôt une clé en mode test (\`rk_test_…\`) depuis un environnement de test Stripe. Les modes test et production d’un même compte peuvent être connectés côte à côte.`,
    },
    next: {
      title: "Et ensuite",
      text: `Votre écran fonctionne tel quel. Quand vous aurez une minute${NNBSP}:`,
    },
  },
  wallDisplay: {
    summary: `N’importe quel navigateur, une smart TV ou un Raspberry Pi${NNBSP}: ce que montre l’écran, et comment il tourne seul pendant des mois.`,
    meta: {
      title: "Votre tableau de bord Stripe sur une TV ou un Raspberry Pi",
      description:
        "Ouvrez le lien de votre écran dans tout navigateur, sur smart TV ou Raspberry Pi en kiosque. Il reste allumé, se rétablit seul et fête chaque vente.",
    },
    title: "Affichez-le au mur",
    lead: `Un écran est une page web conçue pour tourner en plein écran, sans surveillance, pendant des mois. Tout appareil doté d’un navigateur récent peut l’afficher${NNBSP}: aucune app à installer, pas besoin de se connecter.`,
    devices: {
      title: "Choisissez un appareil",
      lead: "L’écran s’adapte à toutes les tailles, d’un moniteur 720p à une TV 4K, en paysage comme en portrait.",
      recommended: "Recommandé",
      raspberryPi: {
        title: "Raspberry Pi",
        text: `Un Raspberry Pi 4 ou 5 derrière la TV, configuré une fois pour toutes avec un seul bloc de commandes. Il ouvre l’écran en plein écran, avec le son, à chaque démarrage${NNBSP}: ni clavier, ni souris, ni clic.`,
      },
      smartTv: {
        title: "Smart TV",
        text: `Ouvrez le lien dans le navigateur de la TV et cliquez une fois avec la télécommande pour le son. Certains navigateurs de TV sont lents${NNBSP}: un Raspberry Pi est plus fluide.`,
      },
      computer: {
        title: "Ordinateur portable, mini PC ou Mac",
        text: "Ouvrez le lien dans Chrome, appuyez sur **F** pour passer en plein écran et cliquez une fois pour le son. Désactivez la mise en veille dans les réglages du système.",
      },
      tablet: {
        title: "Tablette",
        text: "Ajoutez le lien à l’écran d’accueil, puis gardez-le au premier plan avec l’Accès guidé sur iPad ou l’épinglage d’écran sur Android.",
      },
      phone: {
        title: "Votre téléphone",
        text: `Dans l’app SaaS Monitor, tournez votre téléphone à l’horizontale pour passer en mode TV${NNBSP}: tout l’écran, comme au mur. [Voir les apps](doc-apps)`,
      },
      raspberryPiNote:
        "Le tableau de bord vous donne la commande pour Raspberry Pi, avec votre lien déjà renseigné, sous **Set up a TV or Raspberry Pi**.",
    },
    link: {
      title: "Le lien de votre écran",
      text: `Chaque écran a son propre lien, impossible à deviner${NNBSP}: retrouvez-le sous **Screen link** dans les réglages de l’écran. Il s’ouvre sans connexion, alors traitez-le comme un mot de passe. **Regenerate link** révoque l’ancien en un clic.`,
      password: {
        title: "Ajoutez un mot de passe",
        text: `Pour plus de sécurité, cliquez sur **Set a password**${NNBSP}: chaque appareil le demande une fois, puis s’en souvient. Changez-le, et tous les appareils sont de nouveau bloqués. Les membres connectés de votre espace de travail n’en ont jamais besoin.`,
      },
      phone: {
        title: "Ouvrir sur votre téléphone",
        text: "Sous **Open on your phone**, scannez le QR code avec l’app SaaS Monitor pour suivre l’écran sur votre téléphone, avec ses widgets et ses notifications.",
      },
    },
    shows: {
      title: "Ce que montre l’écran",
      items: [
        "Votre MRR, ou votre ARR, en grand, avec sa croissance sur 30 jours",
        "Le chemin jusqu’à votre prochain palier ou votre propre objectif, et le jour où vous l’atteindrez à votre rythme actuel",
        "Une courbe sur 30 jours, 90 jours, 12 mois ou depuis le début",
        "Les revenus du jour et du mois, les clients et le nouveau MRR net",
        "Un fil en direct des paiements, nouveaux clients, montées en gamme et résiliations",
      ],
    },
    moments: {
      title: "Moments et célébrations",
      text: "Chaque vente, nouveau client ou changement d’abonnement a droit à une grande carte au milieu de l’écran, avec son propre son, puis une voix si vous le souhaitez. L’argent qui rentre fait pleuvoir des confettis, et chaque palier envahit tout l’écran.",
      detail:
        "Les cartes restent 10 secondes par défaut. Quand plusieurs arrivent en même temps, elles passent l’une après l’autre.",
      imageAlt: `Le paiement de 199${NNBSP}$ d’un nouveau client dans une carte au milieu de l’écran, avec des confettis`,
      tip: {
        title: "Testez depuis votre bureau",
        text: `Cliquez sur **Send a test celebration** dans les réglages de l’écran${NNBSP}: toutes les copies ouvertes de l’écran jouent une vente fictive en quelques secondes.`,
      },
    },
    unattended: {
      title: "Conçu pour tourner tout seul",
      items: [
        "Se rafraîchit à quelques secondes d’intervalle, et se rétablit tout seul après une coupure réseau",
        "Garde l’écran allumé et masque le curseur de la souris",
        "Décale son contenu de quelques pixels de temps en temps, pour protéger les dalles OLED",
        "Se recharge après une mise à jour, pour ne jamais tourner sur une ancienne version",
      ],
    },
    sound: {
      title: "Le son sur une TV",
      text: `Les navigateurs gardent une page silencieuse tant que personne n’a interagi avec elle${NNBSP}: cliquez une fois sur l’écran, et le son reste activé jusqu’au prochain rechargement. Sur un Raspberry Pi, la commande kiosque lui permet de jouer le son sans clic.`,
    },
  },
  customize: {
    summary: `MRR ou ARR, votre objectif, les couleurs, les langues, les sons et les voix${NNBSP}: chaque écran à votre image.`,
    meta: {
      title: `Personnaliser votre écran${NNBSP}: objectif, thème, sons et voix`,
      description: `MRR ou ARR, objectif, thème, couleur, langue, sons, voix et rôle de chaque événement Stripe${NNBSP}: personnalisez votre écran, avec un aperçu en direct.`,
    },
    title: "À votre image",
    lead: "Chaque écran a ses propres réglages, avec un aperçu en direct juste à côté. Chaque modification est enregistrée au fur et à mesure.",
    editorAlt: `L’éditeur d’écran${NNBSP}: les réglages à gauche, l’aperçu en direct et le panneau de partage à droite`,
    numbers: {
      title: "Vos chiffres",
      metric: {
        title: "MRR ou ARR",
        text: `Affichez le MRR, ou l’ARR si c’est ainsi que vous comptez${NNBSP}: le chiffre principal, la courbe, l’objectif et les paliers suivent. Les paiements et les revenus restent ce que les clients ont payé.`,
      },
      goal: {
        title: "Paliers ou votre objectif",
        text: `Les paliers automatiques fêtent chaque chiffre rond au fil de votre croissance, de 100${NNBSP}$ à 1${NNBSP}k$, 10${NNBSP}k$ et au-delà. Ou fixez votre propre objectif.`,
      },
      chart: {
        title: "Période de la courbe",
        text: "Les 30 ou 90 derniers jours, les 12 derniers mois, ou depuis le début.",
      },
      currency: {
        title: "Devise et fuseau horaire",
        text: `Chaque montant est converti dans la devise de l’écran. Son fuseau horaire détermine quand commencent «${NNBSP}aujourd’hui${NNBSP}» et «${NNBSP}ce mois-ci${NNBSP}».`,
      },
    },
    look: {
      title: "Thème et couleur",
      text: `Sombre, ou clair pour les pièces lumineuses. Choisissez l’une des cinq couleurs d’accent, ou collez la couleur de votre marque en hexadécimal${NNBSP}: l’écran l’ajuste si besoin, pour qu’elle reste lisible.`,
      custom: "Votre couleur",
      imageAlt: "Un écran clair en allemand, dans un orange personnalisé",
    },
    language: {
      title: "Sept langues",
      text: "Un écran parle anglais, français, allemand, espagnol, italien, portugais ou néerlandais, et écrit les nombres et les dates au format local. Le tableau de bord, lui, reste en anglais.",
    },
    sound: {
      title: "Sons et voix",
      packs:
        "Trois packs de cinq sons chacun, synthétisés directement dans le navigateur, du paiement au palier. [Écoutez-les tous](sounds)",
      voice: `Après le son, une voix peut annoncer ce qui s’est passé${NNBSP}: deux voix par langue, en anglais, français, allemand, espagnol et portugais. Le son et la voix ont chacun leur interrupteur et leur volume.`,
      own: `**Vos propres phrases**${NNBSP}: avec une clé API Gradium sur le serveur, la voix dit ce que vous écrivez, avec le nom du client, le montant ou la formule.`,
    },
    events: {
      title: "Ce que fait chaque événement",
      text: `Pour chaque type d’événement, cinq interrupteurs${NNBSP}: affichage dans le fil, carte à l’écran, son, annonce à voix haute, et notification sur les téléphones qui suivent l’écran.`,
      event: "Événement",
      columns: { feed: "Fil", moment: "Carte", sound: "Son", voice: "Voix", push: "Téléphone" },
      names: {
        payment: "Paiement",
        connectPayment: "Paiement pour un compte Connect",
        subscription: "Nouvel abonné",
        upgrade: "Montée en gamme",
        reactivation: "Réactivation",
        downgrade: "Descente en gamme",
        cancellation: "Résiliation",
        unpaid: "Paiement échoué",
        customer: "Nouveau client",
        milestone: "Palier",
      },
      on: "Activé",
      off: "Désactivé",
      caption:
        "Les réglages par défaut. Les pertes ne sont pas annoncées à voix haute, et les téléphones ne reçoivent que les bonnes nouvelles. Les voix ne parlent qu’une fois activées.",
    },
    accounts: {
      title: "Plusieurs comptes Stripe",
      text: "Un écran peut afficher plusieurs comptes Stripe, convertis dans sa devise, de deux façons.",
      added: {
        title: "Additionnés",
        text: "Un seul total pour tous les comptes. Le fil indique le compte de chaque élément.",
      },
      rotation: {
        title: "Un à la fois",
        text: "Chaque compte passe à son tour avec ses propres chiffres, et leur total aussi si vous le souhaitez. Quand il se passe quelque chose, l’écran affiche aussitôt le compte concerné.",
      },
      imageAlt: `Deux produits sur un seul écran${NNBSP}: un nouvel abonné d’Acme Analytics, indiqué dans le moment et dans la rotation au-dessus`,
      more: `Ou créez un écran par produit, et un écran discret sans son pour la salle de réunion${NNBSP}: autant que vous voulez, chacun avec son propre lien et ses propres réglages.`,
    },
    names: {
      title: "Noms des clients",
      text: `Masqués par défaut${NNBSP}: quiconque voit l’écran verrait qui vous paie. Affichez-les si vous le souhaitez. Les clients que Stripe ne connaît que par leur e-mail peuvent alors être nommés par leur e-mail, masqué (\`j•••@gmail.com\`) ou complet, ou pas du tout. Les voix ne lisent jamais les e-mails.`,
    },
  },
  apps: {
    summary:
      "Vos écrans sur iPhone, iPad, Apple Watch, Android et Wear OS, avec une notification à chaque vente.",
    meta: {
      title: `L’app${NNBSP}: votre MRR Stripe sur iPhone, Android et Apple Watch`,
      description: `Suivez vos écrans sur iPhone, iPad, Apple Watch, Android et Wear OS${NNBSP}: une notification à chaque vente, widgets, complications, chiffres à partager.`,
    },
    title: "Votre MRR dans votre poche",
    lead: "L’app SaaS Monitor ouvre n’importe quel écran avec son lien ou son QR code, sur saas-monitor.com ou sur votre propre serveur. Aucun compte, aucun pistage.",
    add: {
      title: "Ajouter un écran",
      steps: [
        "Dans les réglages de l’écran, trouvez **Open on your phone**.",
        "Scannez son QR code avec l’app, ou collez le lien de l’écran.",
        "Si l’écran a un mot de passe, saisissez-le une fois sur chaque téléphone.",
      ],
    },
    notifications: {
      title: "Une notification à chaque vente",
      text: "Paiements, nouveaux abonnés, montées en gamme, réactivations, nouveaux clients et paliers, dans la langue et la devise de l’écran. Une rafale d’activité arrive en une seule notification qui la résume.",
      choose:
        "Choisissez les événements qui envoient une notification dans les **Events** de l’écran, sous **Phone**. Sur chaque téléphone, coupez les notifications d’un écran, ou seulement certains de ses événements.",
      sound: `Sur iPhone, une notification peut sonner avec le son et la voix de l’écran, même téléphone verrouillé${NNBSP}: activez **Play sounds and voices** dans les réglages de l’app.`,
      speed: `Les notifications partent dès que SaaS Monitor a des nouvelles de Stripe${NNBSP}: en quelques secondes avec les [mises à jour instantanées](doc-numbers).`,
      now: "maintenant",
    },
    widgets: {
      title: "Widgets et montres",
      text: "Sur iPhone, des widgets pour l’écran d’accueil, l’écran verrouillé et le mode En veille (StandBy), et aussi dans CarPlay. Sur Android, des widgets pour l’écran d’accueil. Les apps Apple Watch et Wear OS, avec leurs complications, gardent votre MRR sur votre cadran.",
      wearAlt: `L’app Wear OS${NNBSP}: le MRR avec sa croissance sur 30 jours, sa courbe et la progression vers l’objectif`,
    },
    tv: {
      title: "Mode TV",
      text: `Sur un écran, tournez votre téléphone à l’horizontale pour passer en mode TV${NNBSP}: tout d’un seul coup d’œil, comme au mur, et le téléphone reste allumé. Avec **Play sounds and voices** activé, il joue aussi le son et la voix de chaque moment.`,
    },
    share: {
      title: "Partagez n’importe quel chiffre",
      text: `Maintenez le doigt sur un chiffre pour le partager sous forme d’image soignée, signée «${NNBSP}Powered by SaaS Monitor${NNBSP}». Parfait pour annoncer votre prochain palier.`,
      imageAlt: `Un paiement de 79${NNBSP}$ partagé sous forme d’image, signée Powered by SaaS Monitor`,
    },
    privacy: {
      title: "Aucun compte, aucun pistage",
      text: "Le lien d’un écran est tout ce dont l’app a besoin. Elle ne contient ni mesure d’audience, ni publicité, ni pistage, garde vos écrans dans le stockage sécurisé de l’appareil, et ne communique qu’avec le serveur de chaque écran et les services qui délivrent les notifications. Les clients ne sont nommés que sur les écrans qui affichent les noms. [Politique de confidentialité](privacy)",
    },
  },
  numbers: {
    summary:
      "Le MRR tel que Stripe le définit, pour que le mur corresponde à votre Dashboard Stripe. ARR, revenus, devises et mises à jour.",
    meta: {
      title: "Calcul du MRR, de l’ARR et des revenus à partir de Stripe",
      description:
        "Le MRR tel que Stripe le définit, pour un mur fidèle à votre tableau de bord Stripe. ARR, revenus, devises, mises à jour instantanées et historique.",
    },
    title: "Des chiffres fiables",
    lead: "SaaS Monitor calcule le MRR comme Stripe le définit, pour que le chiffre au mur reste proche de celui de votre Dashboard Stripe. Voici exactement comment.",
    mrr: {
      title: "Le MRR, tel que Stripe le définit",
      items: [
        `Seuls les abonnements actifs et en retard de paiement comptent${NNBSP}: pas les essais, ni les abonnements résiliés, impayés, en pause ou incomplets.`,
        `Chaque prix est ramené au mois${NNBSP}: un prix annuel compte pour un douzième.`,
        "Les quantités, les paliers et les tarifs au volume comptent comme Stripe les facture.",
        `Les remises sont déduites${NNBSP}: les permanentes, et celles sur plusieurs mois jusqu’à leur fin. Celles qui ne s’appliquent qu’une fois ne le sont pas.`,
        "Un abonnement dont la résiliation est prévue en fin de période cesse de compter dès que la résiliation est demandée.",
        "La facturation à l’usage et les prix ponctuels sont exclus, et les taxes ne sont pas ajoutées.",
      ],
    },
    movements: {
      title: "Chaque variation, enregistrée",
      text: `Chaque variation du MRR est enregistrée au moment où elle se produit, et le nouveau MRR net additionne les variations du mois. Un abonnement perdu indique pourquoi${NNBSP}: résilié, non renouvelé, paiement échoué ou en pause.`,
      kinds: {
        new: { name: "Nouveau", text: "commence à payer" },
        expansion: { name: "Expansion", text: "paie plus" },
        contraction: { name: "Contraction", text: "paie moins" },
        churn: { name: "Churn", text: "ne compte plus" },
        reactivation: { name: "Réactivation", text: "paie de nouveau" },
      },
    },
    arr: {
      title: "ARR",
      text: `L’ARR vaut douze fois le MRR. Un écran peut l’afficher comme indicateur principal${NNBSP}: le chiffre principal, la courbe, l’objectif et les paliers sont alors en ARR, tandis que les paiements et les revenus restent ce que les clients ont payé.`,
    },
    revenue: {
      title: "Revenus du jour et du mois",
      text: `Les revenus sont ce que les clients ont payé, remboursements déduits${NNBSP}: aujourd’hui, ce mois-ci, et les mêmes jours du mois dernier pour comparer. Les jours et les mois suivent le fuseau horaire de l’écran.`,
      connect:
        "Sur une plateforme Stripe Connect, les paiements effectués pour les comptes connectés apparaissent dans le fil, et seule la commission que vous conservez compte dans vos revenus.",
    },
    currencies: {
      title: "Plusieurs devises",
      text: `Chaque montant est converti dans la devise de l’écran au taux du jour de la Banque centrale européenne, actualisé toutes les 12 heures. Les valeurs passées aussi${NNBSP}: la courbe montre la croissance de votre activité, pas les variations des taux de change.`,
    },
    updates: {
      title: "Mises à jour instantanées",
      text: "Avec un webhook, Stripe prévient SaaS Monitor dès que quelque chose se produit. Sans webhook, SaaS Monitor interroge Stripe à un rythme qui respecte le quota de lectures de Stripe.",
      webhook: { label: "Avec un webhook", value: "En quelques secondes" },
      polling: {
        label: "Sans webhook",
        value:
          "Environ toutes les 17 minutes pour les petits comptes, jusqu’à une fois par minute pour les plus actifs",
      },
      daily:
        "Une vérification quotidienne compare aussi chaque abonnement avec Stripe, pour les rares changements que Stripe fait sans événement, comme un coupon qui arrive à expiration.",
    },
    history: {
      title: "Votre historique",
      text: `À la connexion, SaaS Monitor importe vos abonnements, les 12 derniers mois de paiements et les clients des 7 derniers jours. Stripe ne conserve aucun historique des changements d’abonnement passés${NNBSP}: la courbe antérieure à ce jour est donc reconstruite à partir du début, de la fin et du montant actuel de chaque abonnement. Ensuite, chaque changement est enregistré au moment où il se produit.`,
    },
    limits: {
      title: "Différences connues",
      text: `Les rares cas où le mur et Stripe peuvent différer sont documentés${NNBSP}:`,
      items: [
        "Les prix TTC comptent avec leurs taxes.",
        "Un coupon supprimé avant votre premier import compte sur tout l’abonnement.",
        "Les montées et descentes en gamme antérieures à votre premier import n’apparaissent pas sur la courbe.",
      ],
    },
  },
  security: {
    summary:
      "Une clé en lecture seule, chiffrée au repos. Les noms masqués par défaut. Open source, pour que chacun puisse vérifier.",
    meta: {
      title: `Sécurité${NNBSP}: clé Stripe en lecture seule, chiffrée au repos`,
      description:
        "SaaS Monitor lit Stripe avec une clé restreinte en lecture seule, chiffrée en AES-256-GCM. Sans pub ni pistage, noms masqués par défaut, et open source.",
    },
    title: "Connectez Stripe en toute confiance",
    lead: `SaaS Monitor ne lit que ce dont vos écrans ont besoin, garde votre clé chiffrée et n’affiche rien que vous n’ayez choisi. Il est open source${NNBSP}: inutile de nous croire sur parole.`,
    facts: [
      { value: "Lecture seule", label: "clé Stripe restreinte" },
      { value: "AES-256-GCM", label: "chiffrement au repos" },
      { value: "MIT", label: "open source, vérifiable par tous" },
    ],
    key: {
      title: "Une clé qui ne peut que lire",
      text: `Vous connectez Stripe avec une clé restreinte, créée dans votre Dashboard Stripe avec uniquement les autorisations dont SaaS Monitor a besoin${NNBSP}: il ne vous demande jamais votre clé secrète. La seule autorisation d’écriture, facultative, lui permet d’ajouter son propre webhook, pour des mises à jour instantanées. Révoquez la clé dans Stripe à tout moment. [Voir toutes les autorisations](permissions)`,
    },
    encryption: {
      title: "Chiffrée, et plus jamais affichée",
      text: `Les clés sont chiffrées au repos en AES-256-GCM et ne quittent jamais le serveur${NNBSP}: le tableau de bord n’en affiche qu’un aperçu masqué. Les webhooks de Stripe sont vérifiés avec leur secret de signature.`,
    },
    data: {
      title: "Ce qui est stocké",
      text: `Votre clé Stripe, chiffrée, et une copie de ce dont vos écrans ont besoin${NNBSP}: les abonnements et les variations de leur MRR, les paiements et les nouveaux clients, avec leur nom, leur e-mail et leur pays. Aucune donnée de carte ni coordonnée bancaire.`,
      delete:
        "Déconnectez un compte Stripe, et tout ce qui en a été importé est supprimé immédiatement.",
    },
    screens: {
      title: "Les écrans ne montrent que ce que vous choisissez",
      items: [
        "Les noms et e-mails des clients n’apparaissent ni sur vos écrans, ni dans leurs notifications, sauf si vous les activez.",
        "Le lien d’un écran est impossible à deviner, et **Regenerate link** révoque l’ancien.",
        "Ajoutez un mot de passe, et chaque appareil devra le saisir une fois.",
      ],
    },
    tracking: {
      title: "Sans pub ni pistage",
      text: "Le site n’utilise aucun outil de mesure d’audience et ne charge aucun script tiers. Aucun cookie publicitaire ou de pistage, et vos données ne sont jamais vendues. L’app n’a ni compte ni pistage non plus. [Politique de confidentialité](privacy)",
    },
    others: {
      title: "Qui d’autre voit quoi",
      text: `Seulement ce que vous activez${NNBSP}: les phrases vocales personnalisées sont envoyées à Gradium pour être prononcées, et les notifications des téléphones passent par les services push qui les délivrent.`,
    },
    openSource: {
      title: "Open source, pour que chacun puisse vérifier",
      text: `Chaque ligne de SaaS Monitor est sur GitHub sous licence MIT${NNBSP}: lisez comment votre clé est stockée, ou lancez-le sur votre propre serveur, où vos données Stripe restent.`,
      report: `Vous avez trouvé une faille${NNBSP}? Signalez-la en privé`,
    },
  },
  selfHosting: {
    summary:
      "Deux commandes avec Docker, sur n’importe quel serveur ou un Raspberry Pi. Gratuit pour de bon, sous licence MIT.",
    meta: {
      title: "Auto-héberger SaaS Monitor avec Docker en deux commandes",
      description: `Hébergez SaaS Monitor sur votre serveur ou un Raspberry Pi avec Docker Compose${NNBSP}: deux commandes, gratuit à vie (MIT). HTTPS, mises à jour, sauvegardes.`,
    },
    title: "Hébergez-le sur votre propre serveur",
    lead: "SaaS Monitor, c’est un serveur Next.js et une base de données MySQL. Avec Docker, il tourne sur n’importe quel serveur, un ordinateur inutilisé ou un Raspberry Pi, avec toutes les fonctionnalités, gratuitement pour de bon.",
    install: {
      title: "Installation en deux commandes",
      requirements:
        "Il vous faut Docker avec Compose, sur un serveur, un ordinateur inutilisé ou un Raspberry Pi avec un OS 64 bits.",
      script: `Le [script](install-script) crée un dossier \`saas-monitor\` avec un fichier Compose et un \`.env\` de secrets tout neufs, puis s’arrête${NNBSP}: il n’a pas besoin des droits root, ne lance rien et ne touche à rien d’autre.`,
      then: "Ouvrez `http://localhost:3000`, créez votre compte et connectez Stripe. Les migrations de la base de données s’exécutent toutes seules.",
    },
    tv: {
      title: "Ouvrez-le depuis la TV",
      text: `Dans \`.env\`, réglez \`APP_URL\` sur l’adresse qu’utilisera la TV, comme \`http://192.168.1.20:3000\`, puis relancez \`docker compose up -d\`${NNBSP}: les liens des écrans sont construits à partir d’elle.`,
      callout: {
        title: "Gardez ENCRYPTION_KEY en lieu sûr",
        text: `Elle chiffre les clés Stripe dans votre base de données. Ne la changez jamais${NNBSP}: sans elle, chaque compte Stripe doit être reconnecté.`,
      },
    },
    https: {
      title: "HTTPS pour les mises à jour instantanées",
      text: `Un réseau local suffit pour une TV dans le même bureau. Placez SaaS Monitor derrière HTTPS avec un nom de domaine pour ouvrir les écrans de n’importe où et profiter des mises à jour instantanées${NNBSP}: Stripe n’envoie de webhooks qu’à une adresse HTTPS publique. N’importe quel reverse proxy fait l’affaire, comme Caddy.`,
      without:
        "Sans cela, SaaS Monitor interroge Stripe à un rythme régulier, environ toutes les 17 minutes pour les petits comptes.",
    },
    updates: {
      title: "Mises à jour",
      text: `Récupérez la nouvelle image et redémarrez${NNBSP}: les écrans ouverts détectent la nouvelle version et se rechargent d’eux-mêmes. Pour mettre à jour à votre rythme, figez une version avec \`SAAS_MONITOR_VERSION\`.`,
    },
    data: {
      title: "Ce qui reste sur votre serveur",
      text: `Tout${NNBSP}: votre clé Stripe, vos données et vos réglages vivent dans votre propre base MySQL, et une seule commande les sauvegarde. Deux fonctionnalités facultatives communiquent avec l’extérieur${NNBSP}: les phrases vocales personnalisées sont envoyées à Gradium pour être prononcées, et les notifications des téléphones passent par le service push d’Expo.`,
      signups: `Une fois votre équipe inscrite, réglez \`DISABLE_SIGNUPS=true\`${NNBSP}: plus personne ne peut créer de compte, et les invitations continuent de fonctionner.`,
    },
    cta: {
      title: "Deux commandes, et il est à vous",
      text: "Toutes les fonctionnalités, gratuites pour de bon. Le guide complet couvre la configuration, HTTPS, les mises à jour, les sauvegardes et la compilation depuis les sources.",
      guide: "Guide complet d’auto-hébergement sur GitHub",
    },
  },
};
