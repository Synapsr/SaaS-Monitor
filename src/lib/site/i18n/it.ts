import type { SiteText } from "./en";

export const it: SiteText = {
  meta: {
    title: "SaaS Monitor · Dashboard MRR Stripe open source per la TV dell’ufficio",
    description:
      "Il tuo MRR, l’ARR e ogni pagamento Stripe in diretta sulla TV dell’ufficio, sul telefono e sull’orologio. Open source: gratis in beta, o sul tuo server.",
    imageAlt: "SaaS Monitor: guarda il tuo SaaS crescere, in diretta",
    imageGrowth: (percent: string) => `${percent} in 30 giorni`,
  },
  nav: {
    skip: "Vai al contenuto",
    home: "SaaS Monitor, pagina iniziale",
    main: "Principale",
    demo: "Demo in diretta",
    features: "Funzionalità",
    apps: "App",
    pricing: "Prezzi",
    docs: "Documentazione",
    github: "GitHub",
    signIn: "Accedi",
    getStarted: "Inizia",
    menu: "Menu",
    language: "Lingua",
  },
  languageHint: {
    text: "Questa pagina è disponibile anche in italiano.",
    action: "Leggi in italiano",
    dismiss: "Chiudi",
  },
  hero: {
    badge: "Open source · Gratis durante la beta pubblica",
    title: { start: "Guarda il tuo SaaS crescere, ", highlight: "in diretta", end: "." },
    lead: "SaaS Monitor trasforma il tuo account Stripe in numeri in diretta: MRR o ARR, gli incassi del giorno e ogni pagamento, con un suono per ogni vendita. Sulla TV dell’ufficio, sul tuo telefono e al tuo polso.",
    primary: "Inizia, è gratis",
    secondary: "Apri la demo in diretta",
    points: [
      "Gratis durante la beta",
      "Gratis per sempre sul tuo server",
      "Chiave Stripe in sola lettura",
    ],
  },
  demo: {
    title: "Demo in diretta di uno schermo SaaS Monitor",
    caption:
      "La demo in diretta, con un SaaS immaginario. Arriva una vendita ogni 20 secondi circa.",
    captionOn: "Audio attivo: ogni vendita suona, poi una voce dice cosa è successo.",
    captionBlocked:
      "Il tuo browser ha lasciato l’audio disattivato. Fai clic su «Ascolta» per riprovare.",
    hear: "Ascolta",
    mute: "Disattiva audio",
    posterAlt:
      "Uno schermo SaaS Monitor: l’MRR a caratteri grandi con la sua crescita, l’obiettivo, il grafico dell’MRR, i riquadri dei ricavi e gli ultimi pagamenti",
    open: "Apri la demo in diretta",
  },
  proof: {
    label: "SaaS Monitor in breve",
    stars: (count: string) => `${count} su GitHub`,
    star: "Lascia una stella su GitHub",
    license: "Licenza MIT",
    selfHost: "Docker o Raspberry Pi",
    languages: "7 lingue",
    privacy: "Niente pubblicità, niente tracciamento",
  },
  features: {
    eyebrow: "Sulla parete",
    title: "Pensato per darti la carica",
    lead: "Costruire un SaaS è una maratona. Vederlo crescere, vendita dopo vendita, è ciò che dà a un team la voglia di continuare a rilasciare.",
    mrr: {
      title: "Il numero che conta, in grande",
      text: "L’MRR in primo piano, con la crescita a 30 giorni, l’ARR e la strada verso il prossimo traguardo. Leggibile da un capo all’altro della stanza.",
      growth: (amount: string, percent: string) => `${amount} · ${percent} in 30 giorni`,
      toGoal: (amount: string, goal: string) => `mancano ${amount} a ${goal}`,
      pace: "a questo ritmo: domani",
    },
    moment: {
      title: "Ogni vendita è un evento",
      text: "Un suono, una scheda con l’importo e il piano, coriandoli del tuo colore. Tutto l’ufficio se ne accorge.",
      kind: "Nuovo cliente",
      plan: "Team",
    },
    milestone: {
      title: "Traguardi da festeggiare",
      text: "1.000 $, 10.000 $, 100.000 $ di MRR, o un obiettivo tutto tuo, con il giorno in cui lo raggiungerai al ritmo attuale. Quando ne tagli uno, la festa occupa tutto lo schermo.",
      reached: "Obiettivo raggiunto",
      next: (amount: string) => `Prossima tappa: ${amount}. Continua così.`,
    },
    wall: {
      title: "Fatto per la parete",
      text: "Scuro o chiaro, nel colore del tuo brand e in sette lingue. Da un monitor 720p a una TV 4K, resta sempre acceso e si ripristina da solo.",
    },
    accounts: {
      all: "Tutti gli account",
      title: "Tutti i tuoi prodotti, un solo schermo",
      text: "Somma più account Stripe in un’unica valuta, oppure lascia che ogni prodotto abbia il suo turno. Ogni evento mostra da dove arriva.",
    },
    honest: {
      title: "Onesto e riservato",
      text: "L’MRR come lo definisce Stripe, letto con una chiave con restrizioni cifrata a riposo. I nomi dei clienti restano nascosti, a meno che tu non scelga di mostrarli.",
      points: [
        "Chiave con restrizioni in sola lettura",
        "Cifrata con AES-256-GCM",
        "Nomi nascosti di default",
      ],
    },
  },
  sounds: {
    eyebrow: "Suono",
    title: "Ascolta il suono di una vendita",
    lead: "Tre pacchetti di suoni, sintetizzati nel browser: niente da installare. Poi una voce dice cosa è successo, nella lingua dello schermo. Sceglili schermo per schermo, o lascia la sala riunioni in silenzio.",
    packs: {
      register: {
        name: "Registratore di cassa",
        description: "Il classico ka-ching: un cassetto e il campanello della cassa.",
      },
      chime: { name: "Carillon", description: "Campanelli delicati per un ufficio tranquillo." },
      arcade: { name: "Arcade", description: "Monete e power-up a 8 bit." },
    },
    events: {
      payment: "Pagamento",
      customer: "Nuovo cliente",
      mrrUp: "MRR in crescita",
      mrrDown: "MRR in calo",
      milestone: "Traguardo",
    },
    play: (sound: string, pack: string) => `Ascolta il suono «${sound}» del pacchetto «${pack}»`,
    download: (sound: string, pack: string) =>
      `Scarica il suono «${sound}» del pacchetto «${pack}», in formato WAV`,
    voices: {
      title: "Voci",
      text: "Dopo il suono, una voce dice cosa è successo, nella lingua dello schermo. Due voci per lingua.",
      choose: "Frase pronunciata dalle voci",
      phrases: {
        payment: "Pagamento",
        subscription: "Nuovo abbonato",
        customer: "Nuovo cliente",
        upgrade: "Upgrade",
        goal: "Obiettivo raggiunto",
      },
      play: (voice: string, language: string, words: string) =>
        `Ascolta ${voice}, una voce in ${language}, che dice «${words}»`,
    },
    files: "Scarica tutti i suoni in formato WAV",
  },
  apps: {
    eyebrow: "App",
    title: "Il tuo MRR anche in tasca",
    lead: "L’app SaaS Monitor apre qualsiasi schermo con il suo link o il suo codice QR, in hosting o sul tuo server. Gira il telefono in orizzontale e diventa uno schermo da parete. Nessun account, nessun tracciamento.",
    platforms: "iPhone · iPad · Apple Watch · Android · Wear OS",
    features: [
      {
        title: "Ogni vendita, in tempo reale",
        text: "Una notifica per ogni pagamento, nuovo abbonato, upgrade e traguardo, nella lingua dello schermo. Su iPhone può suonare con il suono e la voce dello schermo stesso.",
      },
      {
        title: "Widget ovunque",
        text: "Su iPhone, widget per la schermata Home, la schermata di blocco e StandBy, anche in CarPlay. Su Android, widget per la schermata Home.",
      },
      {
        title: "Al polso",
        text: "App per Apple Watch e Wear OS, con complicazioni, per avere il tuo MRR sul quadrante dell’orologio.",
      },
      {
        title: "Condividi qualsiasi numero",
        text: "Tieni premuto un numero per condividerlo come un’immagine pulita, firmata «Powered by SaaS Monitor».",
      },
    ],
    stores: {
      soon: "Prossimamente",
      appStore: {
        soon: "Presto disponibile su App Store",
        live: "Scarica su App Store",
        liveLine: "Scarica su",
      },
      googlePlay: {
        soon: "Presto disponibile su Google Play",
        live: "Disponibile su Google Play",
        liveLine: "Disponibile su",
      },
    },
    pending:
      "Entrambe le app sono in fase di revisione. Le troverai qui il giorno in cui usciranno.",
    images: {
      iphone:
        "L’app SaaS Monitor su iPhone: l’MRR quasi all’obiettivo di 15.000 $, il grafico dell’MRR e i ricavi di oggi",
      watch: "L’app per Apple Watch: l’MRR con la crescita a 30 giorni e il grafico",
      android: "L’app Android che condivide l’MRR come immagine, firmata Powered by SaaS Monitor",
    },
  },
  steps: {
    eyebrow: "Configurazione",
    title: "Sulla parete in due minuti",
    guide: "Leggi la guida passo passo",
    items: [
      {
        title: "Collega Stripe",
        text: "Crea con un clic una chiave con restrizioni in sola lettura e incollala. Il tuo storico viene importato in circa un minuto.",
      },
      {
        title: "Personalizzalo",
        text: "Scegli i suoni, i colori e il tuo obiettivo con un’anteprima in diretta. Ogni modifica viene salvata man mano.",
      },
      {
        title: "Appendilo alla parete",
        text: "Apri il link dello schermo su qualsiasi TV, monitor o Raspberry Pi. Nessun accesso, niente da installare.",
      },
    ],
  },
  pricing: {
    eyebrow: "Prezzi",
    title: "Gratis durante la beta. Gratis per sempre sul tuo server.",
    lead: "SaaS Monitor è in beta pubblica: la versione in hosting è gratuita finché dura. Sul tuo server resta gratis per sempre.",
    hosted: {
      name: "Ospitato da noi",
      badge: "Beta pubblica",
      price: "Gratis",
      term: "durante la beta pubblica",
      points: [
        "Tutte le funzionalità, niente da installare o aggiornare",
        "Aggiornamenti istantanei tramite i webhook di Stripe",
        "Tutti gli schermi e i collaboratori che vuoi",
      ],
      cta: "Inizia",
    },
    selfHosted: {
      name: "Sul tuo server",
      badge: "Open source",
      price: "Gratis",
      term: "per sempre, con licenza MIT",
      points: [
        "Tutte le funzionalità, senza limiti",
        "Docker in due comandi, su qualsiasi server o su un Raspberry Pi",
        "I tuoi dati Stripe restano sul tuo server",
      ],
      cta: "Guida al self-hosting",
    },
  },
  openSource: {
    eyebrow: "Open source",
    title: "Tuo da eseguire, leggere e modificare",
    lead: "SaaS Monitor è open source con licenza MIT. Avvialo con Docker sul tuo server o su un Raspberry Pi in due comandi, senza niente da clonare o compilare. La tua chiave Stripe non lascia mai il tuo server.",
    star: "Lascia una stella su GitHub",
    guide: "Guida al self-hosting",
    facts: [
      { value: "MIT", label: "licenza, per sempre" },
      { value: "2", label: "comandi per installarlo" },
      { value: "arm64", label: "e amd64 supportati" },
    ],
    terminal: "Terminale",
    copy: "Copia",
    copied: "Copiato",
    copyFailed: "Seleziona i comandi per copiarli",
    script:
      "Lo [script](install-script) scrive un file Compose e nuovi segreti, poi si ferma. Apri localhost:3000 e collega Stripe.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Le domande dei founder",
    items: [
      {
        question: "La mia chiave Stripe è al sicuro?",
        answer: [
          "Colleghi Stripe con una chiave con restrizioni, creata nella tua Stripe Dashboard con i soli permessi di cui SaaS Monitor ha bisogno: legge abbonamenti, clienti, pagamenti e i prodotti, i prezzi e i coupon che usano. Un permesso è facoltativo: consente a SaaS Monitor di registrare un proprio endpoint webhook, per aggiornamenti istantanei.",
          "La chiave è cifrata a riposo con AES-256-GCM, non lascia mai il server e non viene mai più mostrata. Puoi revocarla in Stripe in qualsiasi momento. [Vedi tutti i permessi](permissions)",
        ],
      },
      {
        question: "Il numero è lo stesso della mia Stripe Dashboard?",
        answer: [
          "Sì, nella maggior parte dei casi: SaaS Monitor segue la definizione di MRR di Stripe. Contano solo gli abbonamenti attivi e quelli con pagamento in ritardo, un prezzo annuale conta per un dodicesimo e gli sconti vengono sottratti, tranne quelli una tantum.",
          "Alcuni limiti sono documentati: i prezzi con imposte incluse contano al lordo delle imposte, un coupon eliminato prima della tua prima importazione conta sull’intero abbonamento, e il grafico precedente a quell’importazione viene ricostruito dall’importo attuale di ogni abbonamento. [Come si calcola l’MRR](mrr)",
        ],
      },
      {
        question: "Quali dati conservate?",
        answer: [
          "La tua chiave Stripe, cifrata, e una copia di ciò che serve ai tuoi schermi: gli abbonamenti e le variazioni del loro MRR, i pagamenti e i nuovi clienti, con nome, email e paese dei clienti. Nessun dato di carte o conti bancari. Scollegare un account ne elimina i dati. Sul tuo server tutto resta lì, tranne le frasi vocali personalizzate, se le attivi, che vanno a Gradium, e le notifiche ai telefoni che seguono uno schermo, che passano dal servizio push di Expo.",
        ],
      },
      {
        question: "Con quali TV funziona?",
        answer: [
          "Qualsiasi schermo con un browser moderno. Un Raspberry Pi 4 o 5 dietro la TV dà il risultato più fluido: configurato una volta, a ogni avvio apre il tuo schermo SaaS Monitor a schermo intero, con l’audio. Vanno bene anche il browser di una smart TV, un portatile di riserva o un tablet. Lo schermo non va mai in standby, si riprende dalle interruzioni di rete e si ricarica dopo gli aggiornamenti. [Appendi uno schermo alla parete](wall)",
        ],
      },
      {
        question: "C’è un’app per smartphone?",
        answer: [
          "L’app SaaS Monitor, per iPhone, iPad, Apple Watch, Android e Wear OS, apre qualsiasi schermo con il suo link o codice QR, in hosting o sul tuo server, e ti avvisa di ogni pagamento, nuovo abbonato e traguardo. Nessun account, nessun tracciamento. [Scopri l’app](apps)",
        ],
      },
      {
        question: "In quali lingue parla uno schermo?",
        answer: [
          "Inglese, francese, tedesco, spagnolo, italiano, portoghese e olandese, con numeri e date scritti secondo le convenzioni locali. La sua voce parla inglese, francese, tedesco, spagnolo e portoghese.",
        ],
      },
      {
        question: "Paddle, Lemon Squeezy o Polar?",
        answer: [
          "Non ancora: per ora SaaS Monitor legge solo Stripe. Se usi un’altra piattaforma, [diccelo su GitHub](issues).",
        ],
      },
      {
        question: "Quanto costa?",
        answer: [
          "La versione in hosting è gratuita durante la beta pubblica. Sul tuo server è gratis per sempre: SaaS Monitor è open source con licenza MIT.",
        ],
      },
      {
        question: "Posso ospitarlo sul mio server?",
        answer: [
          "Sì. SaaS Monitor funziona con Docker Compose, accanto al suo database MySQL, su qualsiasi server o su un Raspberry Pi con un sistema operativo a 64 bit. I tuoi dati Stripe restano lì; solo le frasi vocali personalizzate, facoltative, vengono inviate a Gradium per essere pronunciate, e le notifiche ai telefoni passano dal servizio push di Expo. [Guida al self-hosting](self-hosting)",
        ],
      },
    ],
    maker: {
      title: "Chi lo realizza",
      text: (director: string) =>
        `SaaS Monitor è sviluppato da ${director} presso [Synapsr](synapsr).`,
      also: "Realizziamo anche [Louez](louez), un software open source per le attività di noleggio, e [Hovod](hovod), una piattaforma video open source da ospitare sul tuo server.",
    },
  },
  closing: {
    title: "Non fermarti. Il tuo prossimo traguardo è più vicino di quanto pensi.",
    primary: "Inizia",
    secondary: "Lascia una stella su GitHub",
  },
  support: {
    label: "Domande?",
    action: "Scrivici",
  },
  footer: {
    license: "Open source con licenza MIT.",
    madeBy: "Realizzato da [Synapsr](synapsr).",
    help: "Domande? Scrivici a [support@saas-monitor.com](support).",
    trademark:
      "Stripe è un marchio di Stripe, Inc. SaaS Monitor non è affiliato a Stripe, né approvato da Stripe.",
    columns: { product: "Prodotto", openSource: "Open source", legal: "Legale" },
    links: {
      demo: "Demo in diretta",
      sounds: "Suoni di notifica Stripe",
      alternatives: "Alternative",
      changelog: "Changelog",
      docs: "Documentazione",
      githubDocs: "Documentazione su GitHub",
      github: "GitHub",
      selfHosting: "Self-hosting",
      privacy: "Privacy",
      terms: "Termini",
      legalNotice: "Note legali",
    },
    inEnglish: "in inglese",
    languages: "Lingue",
  },
  notFound: {
    title: "Pagina non trovata",
    heading: "Niente su questa parete",
    text: "Questa pagina non esiste o è stata spostata. La demo in diretta, invece, non si ferma mai.",
    home: "Torna alla home",
    demo: "Apri la demo in diretta",
  },
  soundPage: {
    meta: {
      title: "Suono notifica Stripe: come cambiarlo",
      description:
        "L’app Stripe non documenta impostazioni del suono: lo sceglie il telefono. Come cambiarlo su iPhone e Android, e suoni cha-ching (o ka-ching) gratis per ogni vendita.",
    },
    eyebrow: "Suono di notifica Stripe",
    title: "Come cambiare il suono delle notifiche di Stripe",
    intro:
      "In breve: nelle impostazioni del telefono, non in Stripe. L’app Stripe Dashboard ti avvisa di nuovi pagamenti, nuovi clienti, pagamenti contestati e bonifici accreditati, e ti invia un riepilogo giornaliero. Le impostazioni documentate da Stripe attivano o disattivano queste notifiche; il suono dipende dal tuo telefono.",
    change: {
      title: "Cambialo sul telefono",
      lead: "Prima consenti le notifiche di Stripe sul telefono, come chiede Stripe. Poi:",
      source: "Fonte:",
      iphone: {
        title: "Su iPhone",
        steps: [
          "Apri **Impostazioni**, poi **Notifiche**.",
          "Tocca **Stripe**, sotto Stile notifiche.",
          "Tocca **Suoni**, poi scegli un suono.",
        ],
        note: "Apple precisa che l’ultimo passaggio funziona solo se l’app lo supporta.",
        sources: { apple: "Supporto Apple" },
      },
      android: {
        title: "Su Android",
        steps: [
          "Apri **Impostazioni**, poi **Notifiche** › **Notifiche app**.",
          "Tocca **Stripe**, poi una categoria delle sue notifiche.",
          "Scegli il suono di quella categoria.",
        ],
        note: "Android ti permette di cambiare il suono di ogni categoria di notifiche di un’app. I menu variano da un produttore di telefoni all’altro.",
        sources: { android: "Guida di Android", developers: "Android Developers" },
      },
      stripe: {
        title: "Nell’app Stripe",
        steps: [
          "Tocca l’icona del tuo account, in alto a sinistra in qualsiasi schermata.",
          "Apri **Global settings** › **Notification settings**.",
          "Attiva o disattiva le notifiche per ciascuno dei tuoi account.",
        ],
        note: "Stripe documenta questi interruttori, ma nessuna scelta del suono.",
        sources: { support: "Supporto Stripe", app: "App mobile Stripe Dashboard" },
      },
    },
    library: {
      title: "Oppure dai a ogni vendita un suono che sente tutta la stanza",
      lead: "La notifica di un telefono passa facilmente inosservata, e la senti solo tu. SaaS Monitor mostra i tuoi ricavi Stripe su uno schermo in ufficio e riproduce un suono per ogni pagamento, nuovo cliente e variazione di MRR, scelto tra tre pacchetti. Ascoltali qui o scaricali come file WAV, da usare liberamente con licenza MIT, che ti chiede di conservare l’avviso di licenza insieme ai file.",
    },
    voices: {
      title: "E una voce che dice cosa è successo",
      lead: "Dopo il suono, uno schermo può annunciare il momento ad alta voce, in inglese, francese, tedesco, spagnolo o portoghese. Dieci voci, due per lingua, con frasi registrate; con una chiave API Gradium sul server, gli schermi possono dire anche il nome del cliente, l’importo o il piano.",
    },
    questions: {
      title: "Domande",
      items: [
        {
          question: "Posso cambiare il suono dentro l’app Stripe?",
          answer: [
            "La documentazione di Stripe sulla sua app Dashboard descrive interruttori per attivare o disattivare le notifiche di ogni account, ma nessuna scelta del suono. Il suono dipende dalle impostazioni di notifica del telefono.",
          ],
        },
        {
          question: "Quali eventi Stripe riproducono un suono su SaaS Monitor?",
          answer: [
            "Pagamenti, nuovi clienti, MRR in crescita (nuovi abbonamenti, upgrade, riattivazioni) o in calo (downgrade, disdette, abbonamenti rimasti non pagati) e traguardi: cinque suoni per pacchetto. Per ogni tipo di evento, uno schermo sceglie se riprodurne il suono, annunciarlo ad alta voce, mostrare una scheda o elencarlo nel feed delle attività.",
          ],
        },
        {
          question: "SaaS Monitor sostituisce l’app Stripe?",
          answer: [
            "No. Legge il tuo account Stripe con una chiave con restrizioni (un permesso facoltativo aggiunge un suo webhook) per mostrare i tuoi ricavi su uno schermo. Tieni l’app Stripe per rimborsi, bonifici e tutto il resto.",
          ],
        },
        {
          question: "Devo installare qualcosa per sentire i suoni?",
          answer: [
            "No. Gli schermi sintetizzano i loro suoni nel browser: apri il link di uno schermo su una TV, un Raspberry Pi o un portatile, e fai clic una volta per attivare l’audio.",
          ],
        },
        {
          question: "Posso usare i file WAV altrove?",
          answer: [
            "Sì. Sono generati dal codice open source di SaaS Monitor, con licenza MIT, che ti chiede di conservare l’avviso di licenza insieme ai file. Usali nelle tue notifiche, nei tuoi bot o nei tuoi video.",
          ],
        },
      ],
    },
    closing: {
      title: "Ascoltalo su una parete",
      text: "La demo in diretta simula un SaaS immaginario in cui arriva una vendita ogni 20 secondi circa. Fai clic una volta sullo schermo per attivare l’audio.",
      register: "Apri la demo con il registratore di cassa",
      arcade: "Oppure con l’arcade",
    },
  },
};
