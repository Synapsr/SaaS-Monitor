import type { SiteText } from "./en";

export const nl: SiteText = {
  meta: {
    title: "SaaS Monitor · Open-source Stripe MRR-dashboard voor de kantoor-tv",
    description:
      "Je MRR, ARR en elke betaling uit Stripe live op de kantoor-tv, je telefoon en je horloge. Open source: gratis tijdens de bèta, of op je eigen server.",
    imageAlt: "SaaS Monitor: zie je SaaS groeien, live",
    imageGrowth: (percent) => `${percent} in 30 dagen`,
  },
  nav: {
    skip: "Naar de inhoud",
    home: "SaaS Monitor, startpagina",
    main: "Hoofdmenu",
    demo: "Live-demo",
    features: "Functies",
    apps: "Apps",
    pricing: "Prijzen",
    docs: "Docs",
    github: "GitHub",
    signIn: "Inloggen",
    getStarted: "Aan de slag",
    menu: "Menu",
    language: "Taal",
  },
  languageHint: {
    text: "Deze pagina is ook in het Nederlands.",
    action: "Lees in het Nederlands",
    dismiss: "Sluiten",
  },
  hero: {
    badge: "Open source · Gratis tijdens de openbare bèta",
    title: { start: "Zie je SaaS groeien, ", highlight: "live", end: "." },
    lead: "SaaS Monitor maakt van je Stripe-account live cijfers: MRR of ARR, de omzet van vandaag en elke betaling, met een geluid bij elke verkoop. Op de kantoor-tv, op je telefoon en om je pols.",
    primary: "Gratis beginnen",
    secondary: "Open de live-demo",
    points: [
      "Gratis tijdens de bèta",
      "Altijd gratis als je zelf host",
      "Alleen leesrechten in Stripe",
    ],
  },
  demo: {
    title: "Live-demo van een SaaS Monitor-scherm",
    caption:
      "De live-demo, met een fictieve SaaS. Ongeveer elke 20 seconden komt er een verkoop binnen.",
    captionOn:
      "Geluid aan: bij elke verkoop klinkt een signaal, waarna een stem zegt wat er gebeurde.",
    captionBlocked:
      "Je browser hield het geluid uit. Klik op “Luisteren” om het opnieuw te proberen.",
    hear: "Luisteren",
    mute: "Dempen",
    posterAlt:
      "Een SaaS Monitor-scherm: de MRR in grote cijfers met de groei, het doel, de MRR-grafiek, omzettegels en de laatste betalingen",
    open: "Open de live-demo",
  },
  proof: {
    label: "SaaS Monitor in het kort",
    stars: (count) => `${count} op GitHub`,
    star: "Geef een ster op GitHub",
    license: "MIT-licentie",
    selfHost: "Docker of Raspberry Pi",
    languages: "7 talen",
    privacy: "Geen advertenties, geen tracking",
  },
  features: {
    eyebrow: "Aan de muur",
    title: "Gemaakt om je op stoom te houden",
    lead: "Een SaaS bouwen vraagt een lange adem. Zien hoe die groeit, verkoop na verkoop, is wat een team aan het bouwen houdt.",
    mrr: {
      title: "Het getal dat telt, in het groot",
      text: "De MRR centraal, met de groei over 30 dagen, de ARR en de weg naar je volgende mijlpaal. Leesbaar van de andere kant van de ruimte.",
      growth: (amount, percent) => `${amount} · ${percent} in 30 dagen`,
      toGoal: (amount, goal) => `nog ${amount} tot ${goal}`,
      pace: "in dit tempo: morgen",
    },
    moment: {
      title: "Elke verkoop is een moment",
      text: "Een geluid, een kaart met het bedrag en het abonnement, confetti in jouw kleur. Het hele kantoor weet het.",
      kind: "Nieuwe klant",
      plan: "Team",
    },
    milestone: {
      title: "Mijlpalen om te vieren",
      text: "$1K, $10K, $100K MRR, of je eigen doel, met de dag waarop je het in je huidige tempo haalt. Passeer je er een, dan vult dat het hele scherm.",
      reached: "Doel bereikt",
      next: (amount) => `Volgende halte: ${amount}. Ga zo door.`,
    },
    wall: {
      title: "Gemaakt voor de muur",
      text: "Donker of licht, in je merkkleur en in zeven talen. Van een 720p-monitor tot een 4K-tv: het scherm slaapt nooit en herstelt zichzelf.",
    },
    accounts: {
      all: "Alle accounts",
      title: "Al je producten, één scherm",
      text: "Tel meerdere Stripe-accounts op in één valuta, of laat elk product om de beurt zien. Elk moment vermeldt waar het vandaan komt.",
    },
    honest: {
      title: "Eerlijk en privé",
      text: "MRR zoals Stripe die definieert, gelezen met een beperkte sleutel die versleuteld wordt opgeslagen. Namen van klanten blijven verborgen, tenzij je ze toont.",
      points: [
        "Beperkte sleutel, alleen lezen",
        "Versleuteld met AES-256-GCM",
        "Namen standaard verborgen",
      ],
    },
  },
  sounds: {
    eyebrow: "Geluid",
    title: "Hoor hoe een verkoop klinkt",
    lead: "Drie geluidspakketten, gesynthetiseerd in de browser: niets te installeren. Daarna zegt een stem wat er gebeurde, in de taal van het scherm. Kies ze per scherm, of houd de vergaderruimte stil.",
    packs: {
      register: {
        name: "Kassa",
        description: "De klassieke ka-ching: een kassalade en een belletje.",
      },
      chime: { name: "Klokkenspel", description: "Zachte klokjes voor een rustig kantoor." },
      arcade: { name: "Arcade", description: "8-bit munten en power-ups." },
    },
    events: {
      payment: "Betaling",
      customer: "Nieuwe klant",
      mrrUp: "MRR omhoog",
      mrrDown: "MRR omlaag",
      milestone: "Mijlpaal",
    },
    play: (sound, pack) => `Speel het geluid “${sound}” uit het pakket “${pack}” af`,
    download: (sound, pack) =>
      `Download het geluid “${sound}” uit het pakket “${pack}” als WAV-bestand`,
    voices: {
      title: "Stemmen",
      text: "Na het geluid zegt een stem wat er gebeurde, in de taal van het scherm. Twee stemmen per taal.",
      choose: "Zin die de stemmen uitspreken",
      phrases: {
        payment: "Betaling",
        subscription: "Nieuwe abonnee",
        customer: "Nieuwe klant",
        upgrade: "Upgrade",
        goal: "Doel bereikt",
      },
      play: (voice, language, words) =>
        `Laat ${voice}, een stem in het ${language}, “${words}” zeggen`,
    },
    files: "Download alle geluiden als WAV-bestanden",
  },
  apps: {
    eyebrow: "Apps",
    title: "Je MRR ook op zak",
    lead: "De SaaS Monitor-app opent elk scherm met de link of QR-code, gehost of zelf gehost. Kantel je telefoon en hij wordt een muurscherm. Geen account, geen tracking.",
    platforms: "iPhone · iPad · Apple Watch · Android · Wear OS",
    features: [
      {
        title: "Elke verkoop, op het moment zelf",
        text: "Een melding bij elke betaling, nieuwe abonnee, upgrade en mijlpaal, in de taal van het scherm. Op iPhone kan die klinken met het eigen geluid en de eigen stem van het scherm.",
      },
      {
        title: "Overal widgets",
        text: "Op iPhone widgets voor het beginscherm, het toegangsscherm en Stand-by, ook in CarPlay. Op Android widgets voor het startscherm.",
      },
      {
        title: "Om je pols",
        text: "Apps voor Apple Watch en Wear OS, met complicaties, zodat je MRR op je wijzerplaat staat.",
      },
      {
        title: "Deel elk getal",
        text: "Houd een getal ingedrukt om het te delen als nette afbeelding, ondertekend met “Powered by SaaS Monitor”.",
      },
    ],
    stores: {
      soon: "Binnenkort",
      appStore: {
        soon: "Binnenkort in de App Store",
        live: "Download in de App Store",
        liveLine: "Download in de",
      },
      googlePlay: {
        soon: "Binnenkort op Google Play",
        live: "Ontdek het op Google Play",
        liveLine: "Ontdek het op",
      },
    },
    pending: "Beide apps worden nog beoordeeld. Op de dag dat ze verschijnen, staan ze hier.",
    images: {
      iphone:
        "De SaaS Monitor-app op iPhone: de MRR vlak bij het doel van $15K, de MRR-grafiek en de omzet van vandaag",
      watch: "De Apple Watch-app: de MRR met de groei over 30 dagen en de grafiek",
      android:
        "De Android-app deelt de MRR als afbeelding, ondertekend met Powered by SaaS Monitor",
    },
  },
  steps: {
    eyebrow: "Instellen",
    title: "In twee minuten aan de muur",
    guide: "Lees de stap-voor-stap-handleiding",
    items: [
      {
        title: "Koppel Stripe",
        text: "Maak met één klik een beperkte sleutel met alleen leesrechten aan en plak die. Je geschiedenis is in ongeveer een minuut geïmporteerd.",
      },
      {
        title: "Maak het je eigen",
        text: "Kies de geluiden, de kleuren en je doel met een live voorbeeld. Elke wijziging wordt meteen opgeslagen.",
      },
      {
        title: "Hang het aan de muur",
        text: "Open de link van het scherm op elke tv, monitor of Raspberry Pi. Zonder inloggen, zonder installatie.",
      },
    ],
  },
  pricing: {
    eyebrow: "Prijzen",
    title: "Gratis tijdens de bèta. Voor altijd gratis op je eigen server.",
    lead: "SaaS Monitor is in openbare bèta: zolang die duurt, is de gehoste versie gratis. Zelf gehost blijft het voorgoed gratis.",
    hosted: {
      name: "Door ons gehost",
      badge: "Openbare bèta",
      price: "Gratis",
      term: "tijdens de openbare bèta",
      points: [
        "Alle functies, niets te installeren of bij te werken",
        "Directe updates via Stripe-webhooks",
        "Zoveel schermen en teamleden als je wilt",
      ],
      cta: "Aan de slag",
    },
    selfHosted: {
      name: "Op je eigen server",
      badge: "Open source",
      price: "Gratis",
      term: "voor altijd, onder de MIT-licentie",
      points: [
        "Alle functies, zonder limieten",
        "Docker in twee commando’s, op elke server of een Raspberry Pi",
        "Je Stripe-gegevens blijven op je server",
      ],
      cta: "Handleiding zelf hosten",
    },
  },
  openSource: {
    eyebrow: "Open source",
    title: "Zelf draaien, lezen en aanpassen",
    lead: "SaaS Monitor is open source onder de MIT-licentie. Draai het met Docker op je eigen server of een Raspberry Pi in twee commando’s, zonder iets te clonen of te bouwen. Je Stripe-sleutel verlaat je server nooit.",
    star: "Geef een ster op GitHub",
    guide: "Handleiding zelf hosten",
    facts: [
      { value: "MIT", label: "licentie, voorgoed" },
      { value: "2", label: "commando’s om te installeren" },
      { value: "arm64", label: "en amd64-images" },
    ],
    terminal: "Terminal",
    copy: "Kopiëren",
    copied: "Gekopieerd",
    copyFailed: "Selecteer de commando’s om ze te kopiëren",
    script:
      "Het [script](install-script) schrijft een Compose-bestand en nieuwe secrets, en stopt dan. Open localhost:3000 en koppel Stripe.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Vragen van founders",
    items: [
      {
        question: "Is mijn Stripe-sleutel veilig?",
        answer: [
          "Je koppelt Stripe met een beperkte sleutel, die je in je Stripe Dashboard aanmaakt met alleen de rechten die SaaS Monitor nodig heeft: het leest abonnementen, klanten, betalingen en de producten, prijzen en coupons die ze gebruiken. Eén recht is optioneel: daarmee registreert SaaS Monitor een eigen webhook-endpoint, voor directe updates.",
          "De sleutel wordt versleuteld opgeslagen met AES-256-GCM, verlaat de server nooit en wordt nooit meer getoond. Je kunt hem op elk moment intrekken in Stripe. [Bekijk alle rechten](permissions)",
        ],
      },
      {
        question: "Komt het getal overeen met mijn Stripe Dashboard?",
        answer: [
          "Ja, in de meeste gevallen: SaaS Monitor volgt de definitie van MRR die Stripe zelf hanteert. Alleen actieve en achterstallige abonnementen tellen mee, een jaarprijs telt voor een twaalfde en kortingen worden afgetrokken, behalve eenmalige.",
          "Een paar beperkingen zijn gedocumenteerd: prijzen inclusief belasting tellen mee met de belasting, een coupon die vóór je eerste import is verwijderd telt op het hele abonnement, en de grafiek van vóór die import wordt opgebouwd uit het huidige bedrag van elk abonnement. [Hoe de MRR wordt berekend](mrr)",
        ],
      },
      {
        question: "Wat slaan jullie op?",
        answer: [
          "Je Stripe-sleutel, versleuteld, en een kopie van wat je schermen nodig hebben: abonnementen en hun MRR-wijzigingen, betalingen en nieuwe klanten, met de namen, e-mailadressen en landen van klanten. Geen kaart- of bankgegevens. Als je een account loskoppelt, worden de gegevens ervan verwijderd. Zelf gehost blijft alles op je server, op twee dingen na: eigen zinnen voor de stem, als je die aanzet, gaan naar Gradium, en meldingen aan de telefoons die een scherm volgen gaan via de pushdienst van Expo.",
        ],
      },
      {
        question: "Welke tv’s werken?",
        answer: [
          "Elk scherm met een moderne browser. Een Raspberry Pi 4 of 5 achter de tv geeft het soepelste resultaat: eenmaal ingesteld opent hij bij elke start het scherm schermvullend, met geluid. De browser van een smart-tv, een laptop die nog over is of een tablet werkt ook. Het scherm houdt zichzelf wakker, herstelt na netwerkstoringen en laadt opnieuw na updates. [Hang een scherm aan de muur](wall)",
        ],
      },
      {
        question: "Is er een mobiele app?",
        answer: [
          "De SaaS Monitor-app, voor iPhone, iPad, Apple Watch, Android en Wear OS, opent elk scherm met de link of QR-code, gehost of zelf gehost, en geeft je een melding bij elke betaling, nieuwe abonnee en mijlpaal. Geen account, geen tracking. [Bekijk de app](apps)",
        ],
      },
      {
        question: "Welke talen spreekt een scherm?",
        answer: [
          "Engels, Frans, Duits, Spaans, Italiaans, Portugees en Nederlands, met getallen en datums in de lokale notatie. De stem spreekt Engels, Frans, Duits, Spaans en Portugees.",
        ],
      },
      {
        question: "Paddle, Lemon Squeezy of Polar?",
        answer: [
          "Nog niet: SaaS Monitor leest voorlopig alleen Stripe. Gebruik je een ander platform, [laat het weten op GitHub](issues).",
        ],
      },
      {
        question: "Wat kost het?",
        answer: [
          "De gehoste versie is gratis tijdens de openbare bèta. Op je eigen server is het voorgoed gratis: SaaS Monitor is open source onder de MIT-licentie.",
        ],
      },
      {
        question: "Kan ik het zelf hosten?",
        answer: [
          "Ja. SaaS Monitor draait met Docker Compose, naast de eigen MySQL-database, op elke server of een Raspberry Pi met een 64-bits besturingssysteem. Je Stripe-gegevens blijven daar; alleen de optionele eigen zinnen voor de stem gaan naar Gradium om uitgesproken te worden, en meldingen op telefoons gaan via de pushdienst van Expo. [Handleiding zelf hosten](self-hosting)",
        ],
      },
    ],
    maker: {
      title: "Wie erachter zit",
      text: (director: string) =>
        `SaaS Monitor wordt gebouwd door ${director} bij [Synapsr](synapsr).`,
      also: "We maken ook [Louez](louez), open-source software voor verhuurbedrijven, en [Hovod](hovod), een open-source videoplatform dat je zelf host.",
    },
  },
  closing: {
    title: "Ga zo door. Je volgende mijlpaal is dichterbij dan je denkt.",
    primary: "Aan de slag",
    secondary: "Geef een ster op GitHub",
  },
  support: {
    label: "Vragen?",
    action: "Stuur ons een bericht",
  },
  footer: {
    license: "Open source onder de MIT-licentie.",
    madeBy: "Gemaakt door [Synapsr](synapsr).",
    help: "Vragen? Mail ons op [support@saas-monitor.com](support).",
    trademark:
      "Stripe is een handelsmerk van Stripe, Inc. SaaS Monitor is niet verbonden aan of goedgekeurd door Stripe.",
    columns: { product: "Product", openSource: "Open source", legal: "Juridisch" },
    links: {
      demo: "Live-demo",
      sounds: "Stripe-meldingsgeluiden",
      alternatives: "Alternatieven",
      changelog: "Wijzigingen",
      docs: "Docs",
      support: "Support",
      githubDocs: "Docs op GitHub",
      github: "GitHub",
      selfHosting: "Zelf hosten",
      privacy: "Privacy",
      terms: "Voorwaarden",
      legalNotice: "Colofon",
    },
    inEnglish: "in het Engels",
    languages: "Talen",
  },
  notFound: {
    title: "Pagina niet gevonden",
    heading: "Deze muur is leeg",
    text: "Deze pagina bestaat niet of is verplaatst. De live-demo draait wel gewoon door.",
    home: "Terug naar de startpagina",
    demo: "Open de live-demo",
  },
  soundPage: {
    meta: {
      title: "Stripe-meldingsgeluid wijzigen: zo doe je het",
      description:
        "Stripe documenteert geen geluidsinstelling: je telefoon kiest het geluid. Zo wijzig je het op iPhone en Android, plus gratis ka-ching-geluiden bij elke verkoop.",
    },
    eyebrow: "Stripe-meldingsgeluid",
    title: "Zo wijzig je het meldingsgeluid van Stripe",
    intro:
      "Kort antwoord: in de instellingen van je telefoon, niet in Stripe. De app Stripe Dashboard meldt nieuwe betalingen, nieuwe klanten, betwiste betalingen, gestorte overboekingen en een dagelijks overzicht. Met de instellingen die Stripe documenteert zet je ze aan of uit; hoe ze klinken, bepaalt je telefoon.",
    change: {
      title: "Wijzig het op je telefoon",
      lead: "Sta eerst meldingen van Stripe toe op je telefoon, zoals Stripe vraagt. Daarna:",
      source: "Bron:",
      iphone: {
        title: "Op iPhone",
        steps: [
          "Open **Instellingen** en dan **Berichtgeving**.",
          "Tik op **Stripe**, onder Berichtstijl.",
          "Tik op **Geluiden** en kies een geluid.",
        ],
        note: "Apple geeft aan dat de laatste stap alleen werkt als de app dit ondersteunt.",
        sources: { apple: "Apple Support" },
      },
      android: {
        title: "Op Android",
        steps: [
          "Open **Instellingen** en dan **Meldingen** › **App-meldingen**.",
          "Tik op **Stripe** en dan op een categorie van de meldingen.",
          "Kies het geluid van die categorie.",
        ],
        note: "Op Android kun je het geluid van elke meldingscategorie van een app wijzigen. De menu’s verschillen per telefoonmerk.",
        sources: { android: "Android Help", developers: "Android Developers" },
      },
      stripe: {
        title: "In de Stripe-app",
        steps: [
          "Tik op het pictogram van je account, linksboven in elk scherm.",
          "Open **Global settings** › **Notification settings**.",
          "Zet meldingen aan of uit voor elk van je accounts.",
        ],
        note: "Stripe documenteert deze schakelaars, maar geen keuze van geluid.",
        sources: { support: "Stripe Support", app: "Mobiele app Stripe Dashboard" },
      },
    },
    library: {
      title: "Of geef elke verkoop een geluid dat de hele ruimte hoort",
      lead: "Een ping op je telefoon mis je snel, en alleen jij hoort hem. SaaS Monitor zet je Stripe-omzet op een scherm op kantoor en speelt een geluid bij elke betaling, nieuwe klant en verandering van MRR, uit een van de drie pakketten. Beluister ze hier, of download ze als WAV-bestanden, vrij te gebruiken onder de MIT-licentie, die vraagt om de licentievermelding erbij te houden.",
    },
    voices: {
      title: "En een stem die zegt wat er gebeurde",
      lead: "Na het geluid kan een scherm het moment hardop uitspreken, in het Engels, Frans, Duits, Spaans of Portugees. Tien stemmen, twee per taal, met opgenomen zinnen; met een Gradium-API-sleutel op de server kunnen schermen ook de naam van de klant, het bedrag of het abonnement uitspreken.",
    },
    questions: {
      title: "Vragen",
      items: [
        {
          question: "Kan ik het geluid in de Stripe-app zelf wijzigen?",
          answer: [
            "De documentatie van Stripe over de Dashboard-app beschrijft schakelaars om meldingen per account aan of uit te zetten, en geen keuze van geluid. Het geluid komt uit de meldingsinstellingen van je telefoon.",
          ],
        },
        {
          question: "Welke Stripe-gebeurtenissen spelen een geluid af in SaaS Monitor?",
          answer: [
            "Betalingen, nieuwe klanten, MRR die stijgt (nieuwe abonnementen, upgrades, heractiveringen) of daalt (downgrades, opzeggingen, onbetaald gebleven abonnementen), en mijlpalen: vijf geluiden per pakket. Per soort gebeurtenis kiest een scherm of het het geluid afspeelt, het hardop uitspreekt, een kaart toont of het in de feed zet.",
          ],
        },
        {
          question: "Vervangt SaaS Monitor de Stripe-app?",
          answer: [
            "Nee. Het leest je Stripe-account met een beperkte sleutel (één optioneel recht voegt een eigen webhook toe) om je omzet op een scherm te tonen. Houd de Stripe-app voor terugbetalingen, uitbetalingen en al het andere.",
          ],
        },
        {
          question: "Moet ik iets installeren om de geluiden te horen?",
          answer: [
            "Nee. Schermen synthetiseren hun geluiden in de browser: open de link van een scherm op een tv, een Raspberry Pi of een laptop, en klik één keer om geluid toe te staan.",
          ],
        },
        {
          question: "Mag ik de WAV-bestanden elders gebruiken?",
          answer: [
            "Ja. Ze worden gegenereerd uit de open-source code van SaaS Monitor, onder de MIT-licentie, die vraagt om de licentievermelding erbij te houden. Gebruik ze in je eigen meldingen, bots of video’s.",
          ],
        },
      ],
    },
    closing: {
      title: "Hoor het aan de muur",
      text: "De live-demo draait een fictieve SaaS waarin ongeveer elke 20 seconden een verkoop binnenkomt. Klik één keer op het scherm om het geluid aan te zetten.",
      register: "Open de demo met de kassa",
      arcade: "Of met de arcade",
    },
  },
};
