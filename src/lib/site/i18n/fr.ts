import type { SiteText } from "./en";

// French typography: a narrow no-break space before ; : ! ? and inside « ».
const NNBSP = " ";

export const fr: SiteText = {
  meta: {
    title: "SaaS Monitor · Tableau de bord MRR Stripe open source pour la TV du bureau",
    description: `Votre MRR, votre ARR et chaque paiement Stripe en direct sur la TV du bureau, votre téléphone et votre montre. Open source${NNBSP}: gratuit en bêta, ou auto-hébergé.`,
    imageAlt: `SaaS Monitor${NNBSP}: regardez votre SaaS grandir, en direct`,
    imageGrowth: (percent: string) => `${percent} en 30 jours`,
  },
  nav: {
    skip: "Aller au contenu",
    home: "SaaS Monitor, accueil",
    main: "Principale",
    demo: "Démo en direct",
    features: "Fonctionnalités",
    apps: "Apps",
    pricing: "Tarifs",
    docs: "Docs",
    github: "GitHub",
    signIn: "Se connecter",
    getStarted: "Commencer",
    menu: "Menu",
    language: "Langue",
  },
  languageHint: {
    text: "Cette page existe aussi en français.",
    action: "Lire en français",
    dismiss: "Fermer",
  },
  hero: {
    badge: "Open source · Gratuit pendant la bêta publique",
    title: { start: "Regardez votre SaaS grandir, ", highlight: "en direct", end: "." },
    lead: `SaaS Monitor transforme votre compte Stripe en chiffres en direct${NNBSP}: MRR ou ARR, revenus du jour et chaque paiement, avec un son à chaque vente. Sur la TV du bureau, sur votre téléphone et à votre poignet.`,
    primary: "Commencer, c’est gratuit",
    secondary: "Ouvrir la démo en direct",
    points: [
      "Gratuit pendant la bêta",
      "Gratuit pour toujours en auto-hébergé",
      "Clé Stripe en lecture seule",
    ],
  },
  demo: {
    title: "Démo en direct d’un écran SaaS Monitor",
    caption:
      "La démo en direct, avec un SaaS fictif. Une vente tombe toutes les 20 secondes environ.",
    captionOn: `Son activé${NNBSP}: chaque vente sonne, puis une voix annonce ce qui s’est passé.`,
    captionBlocked: `Votre navigateur a gardé le son coupé. Cliquez sur «${NNBSP}Écouter${NNBSP}» pour réessayer.`,
    hear: "Écouter",
    mute: "Couper le son",
    posterAlt: `Un écran SaaS Monitor${NNBSP}: le MRR en grand avec sa croissance, l’objectif, la courbe du MRR, les tuiles de revenus et les derniers paiements`,
    open: "Ouvrir la démo en direct",
  },
  proof: {
    label: "SaaS Monitor en bref",
    stars: (count: string) => `${count} sur GitHub`,
    star: "Mettre une étoile sur GitHub",
    license: "Licence MIT",
    selfHost: "Docker ou Raspberry Pi",
    languages: "7 langues",
    privacy: "Sans pub ni pistage",
  },
  features: {
    eyebrow: "Au mur",
    title: "De quoi tenir la distance",
    lead: "Construire un SaaS, c’est une course de fond. Le voir grandir, vente après vente, c’est ce qui fait avancer une équipe.",
    mrr: {
      title: "Le chiffre qui compte, en grand",
      text: "Le MRR au premier plan, avec sa croissance sur 30 jours, l’ARR et le chemin jusqu’à votre prochain palier. Lisible depuis l’autre bout de la pièce.",
      growth: (amount: string, percent: string) => `${amount} · ${percent} en 30 jours`,
      toGoal: (amount: string, goal: string) => `Plus que ${amount} avant ${goal}`,
      pace: `à ce rythme${NNBSP}: demain`,
    },
    moment: {
      title: "Chaque vente est un moment",
      text: "Un son, une carte avec le montant et la formule, des confettis à vos couleurs. Tout le bureau le sait.",
      kind: "Nouveau client",
      plan: "Team",
    },
    milestone: {
      title: "Des paliers qui se fêtent",
      text: `1${NNBSP}k$, 10${NNBSP}k$, 100${NNBSP}k$ de MRR, ou votre propre objectif, avec le jour où vous l’atteindrez à votre rythme actuel. Chaque palier franchi envahit l’écran.`,
      reached: "Objectif atteint",
      next: (amount: string) => `Prochaine étape${NNBSP}: ${amount}. Continuez comme ça.`,
    },
    wall: {
      title: "Pensé pour le mur",
      text: "Sombre ou clair, aux couleurs de votre marque et en sept langues. D’un moniteur 720p à une TV 4K, l’écran ne se met jamais en veille et se rétablit tout seul.",
    },
    accounts: {
      all: "Tous les comptes",
      title: "Tous vos produits, un seul écran",
      text: "Additionnez plusieurs comptes Stripe dans une seule devise, ou affichez chaque produit à tour de rôle. Chaque moment indique d’où il vient.",
    },
    honest: {
      title: "Fiable et confidentiel",
      text: "Le MRR tel que Stripe le définit, lu avec une clé restreinte chiffrée au repos. Les noms des clients restent masqués, sauf si vous choisissez de les afficher.",
      points: [
        "Clé restreinte en lecture seule",
        "Chiffrement AES-256-GCM",
        "Noms masqués par défaut",
      ],
    },
  },
  sounds: {
    eyebrow: "Son",
    title: "Écoutez le son d’une vente",
    lead: `Trois packs de sons, synthétisés dans le navigateur${NNBSP}: rien à installer. Puis une voix annonce ce qui s’est passé, dans la langue de l’écran. Choisissez-les écran par écran, ou laissez la salle de réunion au calme.`,
    packs: {
      register: {
        name: "Caisse enregistreuse",
        description: `Le ka-ching classique${NNBSP}: le tiroir et la sonnette de la caisse.`,
      },
      chime: { name: "Carillon", description: "Des clochettes douces pour un bureau calme." },
      arcade: { name: "Arcade", description: "Des pièces et des bonus en 8 bits." },
    },
    events: {
      payment: "Paiement",
      customer: "Nouveau client",
      mrrUp: "MRR en hausse",
      mrrDown: "MRR en baisse",
      milestone: "Palier",
    },
    play: (sound: string, pack: string) =>
      `Écouter le son «${NNBSP}${sound}${NNBSP}» du pack ${pack}`,
    download: (sound: string, pack: string) =>
      `Télécharger le son «${NNBSP}${sound}${NNBSP}» du pack ${pack}, au format WAV`,
    voices: {
      title: "Voix",
      text: "Après le son, une voix annonce ce qui s’est passé, dans la langue de l’écran. Deux voix par langue.",
      choose: "Phrase prononcée par les voix",
      phrases: {
        payment: "Paiement",
        subscription: "Nouvel abonné",
        customer: "Nouveau client",
        upgrade: "Montée en gamme",
        goal: "Objectif atteint",
      },
      play: (voice: string, language: string, words: string) =>
        `Écouter ${voice}, une voix en ${language}, dire «${NNBSP}${words}${NNBSP}»`,
    },
    files: "Télécharger tous les sons au format WAV",
  },
  apps: {
    eyebrow: "Apps",
    title: "Votre MRR aussi dans votre poche",
    lead: `L’app SaaS Monitor ouvre n’importe quel écran avec son lien ou son QR code, hébergé ou auto-hébergé. Tournez votre téléphone à l’horizontale${NNBSP}: il devient un écran mural. Aucun compte, aucun pistage.`,
    platforms: "iPhone · iPad · Apple Watch · Android · Wear OS",
    features: [
      {
        title: "Chaque vente, en temps réel",
        text: "Une notification pour chaque paiement, nouvel abonné, montée en gamme et palier, dans la langue de l’écran. Sur iPhone, elle peut sonner avec le son et la voix de l’écran.",
      },
      {
        title: "Des widgets partout",
        text: "Sur iPhone, des widgets pour l’écran d’accueil, l’écran verrouillé et le mode En veille (StandBy), et aussi dans CarPlay. Sur Android, des widgets pour l’écran d’accueil.",
      },
      {
        title: "À votre poignet",
        text: "Des apps Apple Watch et Wear OS, avec complications, pour garder votre MRR sur votre cadran.",
      },
      {
        title: "Partagez n’importe quel chiffre",
        text: `Maintenez le doigt sur un chiffre pour le partager sous forme d’image soignée, signée «${NNBSP}Powered by SaaS Monitor${NNBSP}».`,
      },
    ],
    stores: {
      soon: "Bientôt disponible",
      appStore: {
        soon: "Bientôt sur l’App Store",
        live: "Télécharger dans l’App Store",
        liveLine: "Disponible sur",
      },
      googlePlay: {
        soon: "Bientôt sur Google Play",
        live: "Disponible sur Google Play",
        liveLine: "Disponible sur",
      },
    },
    pending:
      "Les deux apps sont en cours de validation. Elles apparaîtront ici le jour de leur sortie.",
    images: {
      iphone: `L’app SaaS Monitor sur iPhone${NNBSP}: le MRR presque à son objectif de 15${NNBSP}k$, la courbe du MRR et le revenu du jour`,
      watch: `L’app Apple Watch${NNBSP}: le MRR avec sa croissance sur 30 jours et sa courbe`,
      android: "L’app Android partageant le MRR sous forme d’image, signée Powered by SaaS Monitor",
    },
  },
  steps: {
    eyebrow: "Mise en place",
    title: "Au mur en deux minutes",
    guide: "Lire le guide pas à pas",
    items: [
      {
        title: "Connectez Stripe",
        text: "Créez une clé restreinte en lecture seule en un clic et collez-la. Votre historique est importé en une minute environ.",
      },
      {
        title: "À votre image",
        text: "Choisissez les sons, les couleurs et votre objectif avec un aperçu en direct. Chaque modification est enregistrée au fur et à mesure.",
      },
      {
        title: "Affichez-le au mur",
        text: "Ouvrez le lien de l’écran sur une TV, un moniteur ou un Raspberry Pi. Pas besoin de se connecter, rien à installer.",
      },
    ],
  },
  pricing: {
    eyebrow: "Tarifs",
    title: "Gratuit pendant la bêta. Gratuit pour toujours sur votre serveur.",
    lead: `SaaS Monitor est en bêta publique${NNBSP}: la version hébergée est gratuite tant que la bêta dure. Auto-hébergé, il reste gratuit pour de bon.`,
    hosted: {
      name: "Hébergé pour vous",
      badge: "Bêta publique",
      price: "Gratuit",
      term: "pendant la bêta publique",
      points: [
        "Toutes les fonctionnalités, rien à installer ni à mettre à jour",
        "Chiffres actualisés instantanément par les webhooks Stripe",
        "Autant d’écrans et de coéquipiers que vous voulez",
      ],
      cta: "Commencer",
    },
    selfHosted: {
      name: "Sur votre propre serveur",
      badge: "Open source",
      price: "Gratuit",
      term: "pour toujours, sous licence MIT",
      points: [
        "Toutes les fonctionnalités, sans aucune limite",
        "Docker en deux commandes, sur n’importe quel serveur ou un Raspberry Pi",
        "Vos données Stripe restent sur votre serveur",
      ],
      cta: "Guide d’auto-hébergement",
    },
  },
  openSource: {
    eyebrow: "Open source",
    title: "Libre à vous de le lancer, le lire et le modifier",
    lead: "SaaS Monitor est open source sous licence MIT. Lancez-le avec Docker sur votre propre serveur ou un Raspberry Pi en deux commandes, sans rien cloner ni compiler. Votre clé Stripe ne quitte jamais votre serveur.",
    star: "Mettre une étoile sur GitHub",
    guide: "Guide d’auto-hébergement",
    facts: [
      { value: "MIT", label: "licence, pour toujours" },
      { value: "2", label: "commandes pour l’installer" },
      { value: "arm64", label: "et amd64, en images Docker" },
    ],
    terminal: "Terminal",
    copy: "Copier",
    copied: "Copié",
    copyFailed: "Sélectionnez les commandes pour les copier",
    script:
      "Le [script](install-script) écrit un fichier Compose, génère des secrets, puis s’arrête. Ouvrez localhost:3000 et connectez Stripe.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Les questions des fondateurs",
    items: [
      {
        question: `Ma clé Stripe est-elle en sécurité${NNBSP}?`,
        answer: [
          `Vous connectez Stripe avec une clé restreinte, créée dans votre Dashboard Stripe avec uniquement les autorisations dont SaaS Monitor a besoin${NNBSP}: elle lit les abonnements, les clients, les paiements, ainsi que les produits, tarifs et coupons qu’ils utilisent. Une autorisation est facultative${NNBSP}: elle permet à SaaS Monitor d’enregistrer son propre endpoint de webhook, pour des mises à jour instantanées.`,
          "La clé est chiffrée au repos en AES-256-GCM, ne quitte jamais le serveur et n’est plus jamais affichée. Vous pouvez la révoquer dans Stripe à tout moment. [Voir toutes les autorisations](permissions)",
        ],
      },
      {
        question: `Le chiffre correspond-il à mon Dashboard Stripe${NNBSP}?`,
        answer: [
          `Oui, dans la plupart des cas${NNBSP}: SaaS Monitor suit la définition du MRR de Stripe. Seuls les abonnements actifs et en retard de paiement comptent, un prix annuel compte pour un douzième, et les remises sont déduites, sauf celles qui ne s’appliquent qu’une fois.`,
          `Quelques limites sont documentées${NNBSP}: les prix TTC comptent avec leurs taxes, un coupon supprimé avant votre premier import compte sur tout l’abonnement, et la courbe antérieure à cet import est reconstruite à partir du montant actuel de chaque abonnement. [Comment le MRR est calculé](mrr)`,
        ],
      },
      {
        question: `Que stockez-vous${NNBSP}?`,
        answer: [
          `Votre clé Stripe, chiffrée, et une copie de ce dont vos écrans ont besoin${NNBSP}: les abonnements et les variations de leur MRR, les paiements et les nouveaux clients, avec le nom, l’e-mail et le pays des clients. Aucune donnée de carte ni coordonnée bancaire. Déconnecter un compte supprime ses données. En auto-hébergé, tout reste sur votre serveur, à l’exception des phrases vocales personnalisées, si vous les activez, qui sont envoyées à Gradium, et des notifications vers les téléphones qui suivent un écran, qui passent par le service push d’Expo.`,
        ],
      },
      {
        question: `Quelles TV sont compatibles${NNBSP}?`,
        answer: [
          `N’importe quel écran doté d’un navigateur récent. Un Raspberry Pi 4 ou 5 derrière la TV donne le rendu le plus fluide${NNBSP}: configuré une fois, il lance l’affichage en plein écran, avec le son, à chaque démarrage. Le navigateur d’une smart TV, un ordinateur portable inutilisé ou une tablette font aussi l’affaire. L’écran ne se met pas en veille, se rétablit après une coupure réseau et se recharge après les mises à jour. [Installer un écran au mur](wall)`,
        ],
      },
      {
        question: `Y a-t-il une app mobile${NNBSP}?`,
        answer: [
          "L’app SaaS Monitor, pour iPhone, iPad, Apple Watch, Android et Wear OS, ouvre n’importe quel écran avec son lien ou son QR code, hébergé ou auto-hébergé, et vous prévient à chaque paiement, nouvel abonné et palier. Aucun compte, aucun pistage. [Voir l’app](apps)",
        ],
      },
      {
        question: `Quelles langues parle un écran${NNBSP}?`,
        answer: [
          "Anglais, français, allemand, espagnol, italien, portugais et néerlandais, avec les nombres et les dates au format local. Sa voix parle anglais, français, allemand, espagnol et portugais.",
        ],
      },
      {
        question: `Paddle, Lemon Squeezy ou Polar${NNBSP}?`,
        answer: [
          `Pas encore${NNBSP}: pour l’instant, SaaS Monitor ne lit que Stripe. Si vous utilisez une autre plateforme, [dites-le sur GitHub](issues).`,
        ],
      },
      {
        question: `Combien ça coûte${NNBSP}?`,
        answer: [
          `La version hébergée est gratuite pendant la bêta publique. Sur votre propre serveur, c’est gratuit pour de bon${NNBSP}: SaaS Monitor est open source sous licence MIT.`,
        ],
      },
      {
        question: `Puis-je l’auto-héberger${NNBSP}?`,
        answer: [
          `Oui. SaaS Monitor tourne avec Docker Compose, à côté de sa base de données MySQL, sur n’importe quel serveur ou un Raspberry Pi avec un OS 64 bits. Vos données Stripe y restent${NNBSP}; seules les phrases vocales personnalisées, facultatives, sont envoyées à Gradium pour être prononcées, et les notifications des téléphones passent par le service push d’Expo. [Guide d’auto-hébergement](self-hosting)`,
        ],
      },
    ],
    maker: {
      title: "Qui est derrière",
      text: (director: string) =>
        `SaaS Monitor est développé par ${director} chez [Synapsr](synapsr).`,
      also: "Nous développons aussi [Louez](louez), un logiciel open source pour les entreprises de location, et [Hovod](hovod), une plateforme vidéo open source que vous hébergez vous-même.",
    },
  },
  closing: {
    title: "Continuez. Votre prochain palier est plus proche que vous ne le pensez.",
    primary: "Commencer",
    secondary: "Mettre une étoile sur GitHub",
  },
  support: {
    label: `Une question${NNBSP}?`,
    action: "Écrivez-nous",
  },
  footer: {
    license: "Open source sous licence MIT.",
    madeBy: "Conçu par [Synapsr](synapsr).",
    help: `Une question${NNBSP}? Écrivez-nous à [support@saas-monitor.com](support).`,
    trademark:
      "Stripe est une marque de Stripe, Inc. SaaS Monitor n’est ni affilié à Stripe, ni approuvé par Stripe.",
    columns: { product: "Produit", openSource: "Open source", legal: "Légal" },
    links: {
      demo: "Démo en direct",
      sounds: "Sons des notifications Stripe",
      alternatives: "Alternatives",
      changelog: "Nouveautés",
      docs: "Documentation",
      githubDocs: "Docs sur GitHub",
      github: "GitHub",
      selfHosting: "Auto-hébergement",
      privacy: "Confidentialité",
      terms: "Conditions d’utilisation",
      legalNotice: "Mentions légales",
    },
    inEnglish: "en anglais",
    languages: "Langues",
  },
  notFound: {
    title: "Page introuvable",
    heading: "Rien sur ce mur",
    text: "Cette page n’existe pas, ou elle a déménagé. La démo en direct, elle, ne s’arrête jamais.",
    home: "Retour à l’accueil",
    demo: "Ouvrir la démo en direct",
  },
  soundPage: {
    meta: {
      title: `Son de notification Stripe${NNBSP}: comment le changer`,
      description: `Stripe ne documente aucun réglage de son dans son app${NNBSP}: votre téléphone le choisit. Comment le changer sur iPhone et Android, et des sons ka-ching gratuits.`,
    },
    eyebrow: "Son de notification Stripe",
    title: "Comment changer le son des notifications Stripe",
    intro: `En bref${NNBSP}: dans les réglages de votre téléphone, pas dans Stripe. L’app Stripe Dashboard vous notifie des nouveaux paiements, des nouveaux clients, des paiements contestés, des virements effectués et d’un récapitulatif quotidien. Les réglages documentés par Stripe les activent ou les désactivent${NNBSP}; leur son dépend de votre téléphone.`,
    change: {
      title: "Changez-le sur votre téléphone",
      lead: `Autorisez d’abord les notifications de Stripe sur votre téléphone, comme Stripe le demande. Ensuite${NNBSP}:`,
      source: `Source${NNBSP}:`,
      iphone: {
        title: "Sur iPhone",
        steps: [
          "Ouvrez **Réglages**, puis **Notifications**.",
          "Touchez **Stripe**, sous Style de notification.",
          "Touchez **Sons**, puis choisissez un son.",
        ],
        note: "Apple précise que la dernière étape ne fonctionne que si l’app la prend en charge.",
        sources: { apple: "Assistance Apple" },
      },
      android: {
        title: "Sur Android",
        steps: [
          "Ouvrez **Paramètres**, puis **Notifications** › **Notifications des applis**.",
          "Touchez **Stripe**, puis une catégorie de ses notifications.",
          "Choisissez le son de cette catégorie.",
        ],
        note: "Android permet de changer le son de chaque catégorie de notifications d’une app. Les menus varient d’un fabricant de téléphone à l’autre.",
        sources: { android: "Aide Android", developers: "Android Developers" },
      },
      stripe: {
        title: "Dans l’app Stripe",
        steps: [
          "Touchez l’icône de votre compte, en haut à gauche de n’importe quel écran.",
          "Ouvrez **Global settings** › **Notification settings** (réglages généraux, puis réglages des notifications).",
          "Activez ou désactivez les notifications pour chacun de vos comptes.",
        ],
        note: "Stripe documente ces interrupteurs, mais aucun choix de son.",
        sources: { support: "Assistance Stripe", app: "App mobile Stripe Dashboard" },
      },
    },
    library: {
      title: "Ou donnez à chaque vente un son que toute la pièce entend",
      lead: "Une notification sur votre téléphone passe facilement inaperçue, et vous seul l’entendez. SaaS Monitor affiche vos revenus Stripe sur un écran au bureau et joue un son à chaque paiement, nouveau client et variation du MRR, au choix parmi trois packs. Écoutez-les ici, ou téléchargez-les en WAV, libres d’utilisation sous licence MIT, qui vous demande de conserver sa mention de licence avec eux.",
    },
    voices: {
      title: "Et une voix qui annonce ce qui s’est passé",
      lead: `Après le son, un écran peut annoncer le moment à voix haute, en anglais, français, allemand, espagnol ou portugais. Dix voix, deux par langue, avec des phrases enregistrées${NNBSP}; avec une clé API Gradium sur le serveur, les écrans peuvent aussi dire le nom du client, le montant ou la formule.`,
    },
    questions: {
      title: "Questions",
      items: [
        {
          question: `Puis-je changer le son dans l’app Stripe${NNBSP}?`,
          answer: [
            "La documentation de Stripe sur son app Dashboard décrit des interrupteurs pour activer ou désactiver les notifications de chaque compte, mais aucun choix de son. Le son vient des réglages de notification de votre téléphone.",
          ],
        },
        {
          question: `Quels événements Stripe déclenchent un son sur SaaS Monitor${NNBSP}?`,
          answer: [
            `Les paiements, les nouveaux clients, le MRR qui monte (nouveaux abonnements, montées en gamme, réactivations) ou qui baisse (descentes en gamme, résiliations, abonnements restés impayés), et les paliers${NNBSP}: cinq sons par pack. Pour chaque type d’événement, un écran choisit s’il joue son son, l’annonce à voix haute, affiche une carte ou l’ajoute au fil d’activité.`,
          ],
        },
        {
          question: `SaaS Monitor remplace-t-il l’app Stripe${NNBSP}?`,
          answer: [
            "Non. Il lit votre compte Stripe avec une clé restreinte (une autorisation facultative ajoute son propre webhook) pour afficher vos revenus sur un écran. Gardez l’app Stripe pour les remboursements, les virements et tout le reste.",
          ],
        },
        {
          question: `Faut-il installer quelque chose pour entendre les sons${NNBSP}?`,
          answer: [
            `Non. Les écrans synthétisent leurs sons dans le navigateur${NNBSP}: ouvrez le lien d’un écran sur une TV, un Raspberry Pi ou un ordinateur portable, et cliquez une fois pour autoriser le son.`,
          ],
        },
        {
          question: `Puis-je utiliser les fichiers WAV ailleurs${NNBSP}?`,
          answer: [
            "Oui. Ils sont générés à partir du code open source de SaaS Monitor, sous licence MIT, qui vous demande de conserver sa mention de licence avec eux. Utilisez-les dans vos propres alertes, bots ou vidéos.",
          ],
        },
      ],
    },
    closing: {
      title: "Écoutez-les au mur",
      text: "La démo en direct fait tourner un SaaS fictif où une vente tombe toutes les 20 secondes environ. Cliquez une fois sur l’écran pour activer le son.",
      register: "Ouvrir la démo avec la caisse enregistreuse",
      arcade: "Ou avec l’arcade",
    },
  },
};
