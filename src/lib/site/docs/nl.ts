import type { DocsText } from "./en";

export const nl: DocsText = {
  common: {
    docs: "Docs",
    breadcrumb: "Kruimelpad",
    pages: {
      overview: "Overzicht",
      "get-started": "Aan de slag",
      "wall-display": "Muurscherm",
      customize: "Aanpassen",
      apps: "Apps",
      numbers: "Cijfers",
      security: "Beveiliging",
      "self-hosting": "Zelf hosten",
    },
    githubDocs: "Docs op GitHub",
    onThisPage: "Op deze pagina",
    previous: "Vorige",
    next: "Volgende",
    github: {
      title: "Verder lezen op GitHub",
      text: "De volledige handleidingen, met elke optie, elk commando en elke limiet.",
    },
    cta: {
      title: "Zie vandaag nog je eigen cijfers live",
      text: "Gratis tijdens de openbare bèta. Koppel Stripe met een sleutel met alleen leesrechten, en je scherm staat in ongeveer twee minuten klaar.",
      primary: "Gratis beginnen",
      secondary: "Open de live-demo",
    },
  },
  overview: {
    meta: {
      title: "Docs: je Stripe-MRR op een tv in twee minuten",
      description:
        "Korte handleidingen voor SaaS Monitor: koppel Stripe met alleen leesrechten, zet je MRR op een tv, maak het je eigen, gebruik de apps of host het zelf.",
    },
    title: "In twee minuten aan de slag",
    lead: "Korte handleidingen die je elk in een minuut of twee leest: zet SaaS Monitor op, maak het je eigen en zie waarom je erop kunt vertrouwen. Alle technische details staan op GitHub.",
    start: "Begin hier",
    read: "Lees de handleiding",
    github: {
      title: "Liever de technische handleidingen?",
      text: "De docs op GitHub behandelen elke optie, elk commando en elke limiet, voor developers en wie zelf host.",
      links: {
        stripe: "Stripe koppelen",
        wall: "Een scherm aan de muur hangen",
        selfHosting: "Zelf hosten",
      },
    },
  },
  getStarted: {
    summary:
      "Meld je aan, koppel Stripe met een sleutel met alleen leesrechten, open een link op de tv. Ongeveer twee minuten.",
    meta: {
      title: "Aan de slag: je Stripe-MRR op een tv in twee minuten",
      description:
        "Maak een gratis account, koppel Stripe met een beperkte sleutel die alleen leest en open je schermlink op elke tv. Vier stappen, zo’n twee minuten.",
    },
    title: "Aan de slag in twee minuten",
    lead: "Van aanmelden tot je MRR op de kantoor-tv, in vier stappen. Niets te installeren, niets te programmeren.",
    facts: ["Ongeveer twee minuten", "Alleen leesrechten in Stripe", "Gratis tijdens de bèta"],
    steps: {
      title: "Vier stappen",
      account: {
        title: "Maak je gratis account aan",
        text: "Meld je aan op saas-monitor.com: tijdens de openbare bèta is het gratis. Je krijgt een werkruimte, waar je later je team voor kunt uitnodigen.",
      },
      connect: {
        title: "Koppel Stripe met alleen leesrechten",
        text: "Klik op **Create a restricted key on Stripe**: het Stripe Dashboard opent het formulier voor een sleutel, met de juiste rechten al geselecteerd. Controleer ze, geef de sleutel een naam en maak hem aan. Plak hem daarna in SaaS Monitor.",
        note: "De sleutel wordt gecontroleerd zodra je hem plakt: ontbreekt er een recht, dan zegt SaaS Monitor welk.",
      },
      import: {
        title: "Laat je geschiedenis importeren",
        text: "SaaS Monitor importeert je abonnementen, de betalingen van de afgelopen 12 maanden en de klanten van de afgelopen 7 dagen. Bij kleine accounts duurt dat een paar seconden, bij grote een paar minuten, en het dashboard toont de voortgang.",
      },
      tv: {
        title: "Open je scherm op de tv",
        text: "Je eerste scherm wordt aangemaakt zodra Stripe gekoppeld is. Kopieer de link, open die in de browser van de tv, op een Raspberry Pi of een laptop die nog over is, en klik één keer om het geluid aan te zetten.",
        note: "Wil je het horen? Klik in de scherminstellingen op **Send a test celebration**: overal waar het scherm openstaat, speelt het een voorbeeldverkoop af.",
      },
    },
    permissions: {
      title: "Welke rechten, en waarom",
      lead: "Zeven rechten die lezen, en één optioneel recht dat schrijft. Al het andere blijft op Geen.",
      columns: { permission: "Recht", access: "Toegang", why: "Waarom" },
      access: { read: "Lezen", write: "Schrijven" },
      optional: "Optioneel",
      why: {
        subscriptions: "MRR, upgrades en opzeggingen",
        customers: "Nieuwe klanten, hun namen en landen",
        charges: "Omzet, en een viering bij elke betaling",
        events: "Wat er sinds de vorige controle veranderde",
        products: "Namen van abonnementen",
        prices: "Bedragen van gestaffelde prijzen",
        coupons: "Kortingen, die de MRR verlagen",
        webhooks: "Directe updates: SaaS Monitor voegt een eigen webhook toe",
      },
      callout: {
        title: "Bewust alleen lezen",
        text: "Afgezien van een eigen webhook, als je dat toestaat, kan de sleutel alleen lezen: niets afschrijven, niets terugbetalen, niets aan je klanten wijzigen. Hij wordt versleuteld opgeslagen en nooit meer getoond, en je kunt hem op elk moment intrekken in Stripe.",
      },
      webhook:
        "Met het optionele recht **Webhook Endpoints** staat elke verkoop binnen enkele seconden op de muur. [Zo werken updates](doc-numbers)",
    },
    test: {
      title: "Probeer het met testgegevens",
      text: "Nog niet klaar om je live-account te koppelen? Maak dan een sleutel in testmodus (`rk_test_…`) aan vanuit een Stripe-sandbox. De test- en livemodus van hetzelfde account kun je naast elkaar koppelen.",
    },
    next: {
      title: "Wat nu?",
      text: "Je scherm werkt zo al. Als je even tijd hebt:",
    },
  },
  wallDisplay: {
    summary:
      "Elke browser, een smart-tv of een Raspberry Pi: wat het scherm toont, en hoe het maandenlang zelfstandig draait.",
    meta: {
      title: "Je Stripe-dashboard op een tv of Raspberry Pi",
      description:
        "Open de link van je scherm in elke browser, op een smart-tv of een Raspberry Pi in kioskmodus. Het blijft wakker, herstelt zichzelf en viert elke verkoop.",
    },
    title: "Hang het aan de muur",
    lead: "Een scherm is een webpagina die gemaakt is om maandenlang schermvullend en onbeheerd te draaien. Alles met een moderne browser kan het tonen: zonder app, zonder inloggen.",
    devices: {
      title: "Kies een apparaat",
      lead: "Het scherm past op elk formaat, van een 720p-monitor tot een 4K-tv, liggend of staand.",
      recommended: "Aanbevolen",
      raspberryPi: {
        title: "Raspberry Pi",
        text: "Een Raspberry Pi 4 of 5 achter de tv, één keer ingesteld met één blok commando’s. Hij opent het scherm bij elke start schermvullend, met geluid: geen toetsenbord, geen muis, geen klik.",
      },
      smartTv: {
        title: "Smart-tv",
        text: "Open de link in de browser van de tv en klik één keer met de afstandsbediening voor geluid. Sommige tv-browsers zijn traag: een Raspberry Pi loopt soepeler.",
      },
      computer: {
        title: "Laptop, mini-pc of Mac",
        text: "Open de link in Chrome, druk op **F** voor volledig scherm en klik één keer voor geluid. Zet de slaapstand uit in de systeeminstellingen.",
      },
      tablet: {
        title: "Tablet",
        text: "Zet de link op het beginscherm en houd hem op de voorgrond met Begeleide toegang op iPad of met scherm vastzetten op Android.",
      },
      phone: {
        title: "Je telefoon",
        text: "Kantel je telefoon in de SaaS Monitor-app voor de tv-modus: het hele scherm, net als aan de muur. [Bekijk de apps](doc-apps)",
      },
      raspberryPiNote:
        "Het dashboard geeft je het commando voor de Raspberry Pi, met je link al ingevuld, onder **Set up a TV or Raspberry Pi**.",
    },
    link: {
      title: "De link van je scherm",
      text: "Elk scherm heeft een eigen link die niet te raden is: je vindt hem onder **Screen link** in de scherminstellingen. Hij opent zonder inloggen, dus behandel hem als een wachtwoord. **Regenerate link** trekt de oude met één klik in.",
      password: {
        title: "Voeg een wachtwoord toe",
        text: "Voor extra veiligheid klik je op **Set a password**: elk apparaat vraagt er één keer om en onthoudt het daarna. Wijzig je het, dan is elk apparaat weer buitengesloten. Ingelogde leden van je werkruimte hebben het nooit nodig.",
      },
      phone: {
        title: "Openen op je telefoon",
        text: "Scan onder **Open on your phone** de QR-code met de SaaS Monitor-app om het scherm op je telefoon te volgen, met widgets en meldingen.",
      },
    },
    shows: {
      title: "Wat het scherm toont",
      items: [
        "Je MRR, of ARR, in grote cijfers, met de groei over 30 dagen",
        "De weg naar je volgende mijlpaal of je eigen doel, en de dag waarop je het in je huidige tempo haalt",
        "Een grafiek over 30 dagen, 90 dagen, 12 maanden of vanaf het begin",
        "De omzet van vandaag en deze maand, klanten en netto nieuwe MRR",
        "Een live feed van betalingen, nieuwe klanten, upgrades en opzeggingen",
      ],
    },
    moments: {
      title: "Momenten en vieringen",
      text: "Elke verkoop, nieuwe klant of abonnementswijziging krijgt een grote kaart midden in het scherm, met het bijbehorende geluid en daarna, als je wilt, een stem. Binnenkomend geld brengt confetti, en elke mijlpaal neemt het hele scherm over.",
      detail:
        "Kaarten blijven standaard 10 seconden staan. Komen er meerdere tegelijk binnen, dan verschijnen ze na elkaar.",
      imageAlt:
        "Een betaling van $199 van een nieuwe klant, op een kaart midden in het scherm, met confetti",
      tip: {
        title: "Test het vanaf je bureau",
        text: "Klik in de scherminstellingen op **Send a test celebration**: binnen een paar seconden speelt het scherm overal waar het openstaat een voorbeeldverkoop af.",
      },
    },
    unattended: {
      title: "Gemaakt om zelfstandig te draaien",
      items: [
        "Ververst om de paar seconden en herstelt zichzelf na een netwerkstoring",
        "Houdt het beeldscherm wakker en verbergt de muisaanwijzer",
        "Verschuift de inhoud af en toe een paar pixels, om OLED-panelen te beschermen",
        "Laadt zichzelf opnieuw na een update, zodat er nooit een oude versie draait",
      ],
    },
    sound: {
      title: "Geluid op een tv",
      text: "Browsers houden een pagina stil tot iemand er iets mee doet: klik één keer op het scherm, en het geluid blijft aan tot de pagina opnieuw laadt. Op een Raspberry Pi laat het kioskcommando het geluid zonder klik spelen.",
    },
  },
  customize: {
    summary: "MRR of ARR, je doel, kleuren, talen, geluiden en stemmen: maak elk scherm je eigen.",
    meta: {
      title: "Je scherm aanpassen: doel, thema, geluiden en stemmen",
      description:
        "Kies MRR of ARR, stel een doel in, kies thema, kleur en taal, de geluiden en de stem, en wat elke Stripe-gebeurtenis doet. Met een live voorbeeld.",
    },
    title: "Maak het je eigen",
    lead: "Elk scherm heeft eigen instellingen, met een live voorbeeld er direct naast. Elke wijziging wordt meteen opgeslagen.",
    editorAlt: "De schermeditor: instellingen links, live voorbeeld en deelpaneel rechts",
    numbers: {
      title: "Je cijfers",
      metric: {
        title: "MRR of ARR",
        text: "Toon de MRR, of de ARR als je zo rekent: het hoofdgetal, de grafiek, het doel en de mijlpalen volgen. Betalingen en omzet blijven wat klanten betaalden.",
      },
      goal: {
        title: "Mijlpalen of je eigen doel",
        text: "Automatische mijlpalen vieren elk rond getal op weg omhoog, van $100 tot $1K, $10K en verder. Of stel je eigen doel in.",
      },
      chart: {
        title: "Bereik van de grafiek",
        text: "De afgelopen 30 dagen, 90 dagen, 12 maanden, of vanaf het begin.",
      },
      currency: {
        title: "Valuta en tijdzone",
        text: "Elk bedrag wordt omgerekend naar de valuta van het scherm. De tijdzone ervan bepaalt wanneer “vandaag” en “deze maand” beginnen.",
      },
    },
    look: {
      title: "Thema en kleur",
      text: "Donker, of licht voor lichte ruimtes. Kies een van vijf accentkleuren, of plak je merkkleur als hexcode: het scherm past die zo nodig aan, zodat ze leesbaar blijft.",
      custom: "Jouw kleur",
      imageAlt: "Een licht scherm in het Duits, in een eigen oranje",
    },
    language: {
      title: "Zeven talen",
      text: "Een scherm spreekt Engels, Frans, Duits, Spaans, Italiaans, Portugees of Nederlands, en schrijft getallen en datums in de lokale notatie. Het dashboard zelf blijft Engelstalig.",
    },
    sound: {
      title: "Geluiden en stemmen",
      packs:
        "Drie geluidspakketten, gesynthetiseerd in de browser, met elk vijf geluiden, van een betaling tot een mijlpaal. [Beluister ze allemaal](sounds)",
      voice:
        "Na het geluid kan een stem zeggen wat er gebeurde: twee stemmen per taal, in het Engels, Frans, Duits, Spaans en Portugees. Geluid en stem hebben elk een eigen schakelaar en volume.",
      own: "**Je eigen zinnen**: met een Gradium-API-sleutel op de server zegt de stem wat jij schrijft, met de naam van de klant, het bedrag of het abonnement.",
    },
    events: {
      title: "Wat elke gebeurtenis doet",
      text: "Per soort gebeurtenis vijf schakelaars: vermelden in de feed, tonen als kaart, het geluid, hardop uitspreken, en een melding op de telefoons die het scherm volgen.",
      event: "Gebeurtenis",
      columns: { feed: "Feed", moment: "Kaart", sound: "Geluid", voice: "Stem", push: "Telefoon" },
      names: {
        payment: "Betaling",
        connectPayment: "Betaling voor een Connect-account",
        subscription: "Nieuwe abonnee",
        upgrade: "Upgrade",
        reactivation: "Heractivering",
        downgrade: "Downgrade",
        cancellation: "Opzegging",
        unpaid: "Mislukte betaling",
        customer: "Nieuwe klant",
        milestone: "Mijlpaal",
      },
      on: "Aan",
      off: "Uit",
      caption:
        "De standaardinstellingen. Verliezen worden niet hardop uitgesproken, en telefoons horen alleen het goede nieuws. Stemmen spreken pas als je ze aanzet.",
    },
    accounts: {
      title: "Meerdere Stripe-accounts",
      text: "Een scherm kan meerdere Stripe-accounts tonen, omgerekend naar zijn valuta, op twee manieren.",
      added: {
        title: "Opgeteld",
        text: "Eén totaal voor alle accounts. De feed vermeldt bij elk item het account.",
      },
      rotation: {
        title: "Om de beurt",
        text: "Elk account komt om de beurt in beeld met zijn eigen cijfers, en desgewenst ook hun totaal. Gebeurt er iets, dan toont het scherm meteen het bijbehorende account.",
      },
      imageAlt:
        "Twee producten op één scherm: een nieuwe abonnee van Acme Analytics, vermeld in het moment en in de rotatie erboven",
      more: "Of maak één scherm per product, en een stil scherm zonder geluid voor de vergaderruimte: zoveel als je wilt, elk met een eigen link en eigen instellingen.",
    },
    names: {
      title: "Namen van klanten",
      text: "Standaard verborgen: wie het scherm ziet, zou zien wie je betaalt. Toon ze als je wilt. Klanten die Stripe alleen via hun e-mailadres kent, kunnen dan met hun e-mailadres worden vermeld, gemaskeerd (`j•••@gmail.com`) of voluit, of helemaal niet. Stemmen lezen nooit e-mailadressen voor.",
    },
  },
  apps: {
    summary:
      "Je schermen op iPhone, iPad, Apple Watch, Android en Wear OS, met een melding bij elke verkoop.",
    meta: {
      title: "De app: je Stripe-MRR op iPhone, Android en Apple Watch",
      description:
        "Volg elk scherm op iPhone, iPad, Apple Watch, Android en Wear OS: een melding bij elke verkoop, widgets, complicaties en cijfers om te delen.",
    },
    title: "Je MRR op zak",
    lead: "De SaaS Monitor-app opent elk scherm met de link of QR-code, op saas-monitor.com of op je eigen server. Geen account, geen tracking.",
    add: {
      title: "Een scherm toevoegen",
      steps: [
        "Zoek in de scherminstellingen **Open on your phone**.",
        "Scan de QR-code met de app, of plak de link van het scherm.",
        "Heeft het scherm een wachtwoord, typ het dan één keer in op elke telefoon.",
      ],
    },
    notifications: {
      title: "Een melding bij elke verkoop",
      text: "Betalingen, nieuwe abonnees, upgrades, heractiveringen, nieuwe klanten en mijlpalen, in de taal en valuta van het scherm. Een golf van activiteit komt binnen als één melding die alles samenvat.",
      choose:
        "Kies in het onderdeel **Events** van het scherm, onder **Phone**, welke gebeurtenissen een melding geven. Op elke telefoon kun je de meldingen van een scherm uitzetten, of sommige gebeurtenissen dempen.",
      sound:
        "Op iPhone kan een melding klinken met het eigen geluid en de eigen stem van het scherm, ook als de telefoon vergrendeld is: zet **Play sounds and voices** aan in de instellingen van de app.",
      speed:
        "Meldingen gaan de deur uit zodra SaaS Monitor iets van Stripe hoort: binnen enkele seconden met [directe updates](doc-numbers).",
      now: "nu",
    },
    widgets: {
      title: "Widgets en horloges",
      text: "Op iPhone widgets voor het beginscherm, het toegangsscherm en Stand-by, ook in CarPlay. Op Android widgets voor het startscherm. Apps voor Apple Watch en Wear OS, met complicaties, houden je MRR op je wijzerplaat.",
      wearAlt:
        "De Wear OS-app: de MRR met de groei over 30 dagen, de grafiek en de voortgang naar het doel",
    },
    tv: {
      title: "Tv-modus",
      text: "Kantel je telefoon op een scherm voor de tv-modus: alles tegelijk, net als aan de muur, en de telefoon blijft wakker. Met **Play sounds and voices** aan speelt hij ook het geluid en de stem van elk moment af.",
    },
    share: {
      title: "Deel elk getal",
      text: "Houd een getal ingedrukt om het te delen als nette afbeelding, ondertekend met “Powered by SaaS Monitor”. Gemaakt voor je volgende post over een mijlpaal.",
      imageAlt:
        "Een betaling van $79 gedeeld als afbeelding, ondertekend met Powered by SaaS Monitor",
    },
    privacy: {
      title: "Geen account, geen tracking",
      text: "De link van een scherm is alles wat de app nodig heeft. Er zitten geen analytics, advertenties of tracking in, je schermen staan in de beveiligde opslag van het apparaat, en de app praat alleen met de server van elk scherm en met de diensten die meldingen bezorgen. Klanten worden alleen bij naam genoemd op schermen die namen tonen. [Privacybeleid](privacy)",
    },
  },
  numbers: {
    summary:
      "MRR zoals Stripe die definieert, zodat de muur overeenkomt met je Stripe Dashboard. ARR, omzet, valuta’s en updates.",
    meta: {
      title: "Zo worden MRR, ARR en omzet uit Stripe berekend",
      description:
        "MRR zoals Stripe die definieert: het getal aan de muur klopt met je Stripe-dashboard. Hoe ARR, omzet, valuta’s, directe updates en geschiedenis werken.",
    },
    title: "Cijfers waarop je kunt vertrouwen",
    lead: "SaaS Monitor berekent de MRR zoals Stripe die definieert, zodat het getal aan de muur dicht bij dat in je Stripe Dashboard blijft. Zo werkt het precies.",
    mrr: {
      title: "MRR, zoals Stripe die definieert",
      items: [
        "Alleen actieve en achterstallige abonnementen tellen mee: proefperiodes en opgezegde, onbetaalde, gepauzeerde of onvolledige abonnementen niet.",
        "Elke prijs wordt omgerekend naar een maand: een jaarprijs telt voor een twaalfde.",
        "Aantallen, staffels en volumeprijzen tellen zoals Stripe ze factureert.",
        "Kortingen worden afgetrokken: permanente, en terugkerende tot ze aflopen. Eenmalige kortingen niet.",
        "Een abonnement dat aan het eind van zijn periode wordt opgezegd, telt niet meer mee zodra de opzegging is aangevraagd.",
        "Gemeten gebruik en eenmalige prijzen blijven buiten beschouwing, en belasting wordt niet opgeteld.",
      ],
    },
    movements: {
      title: "Elke wijziging vastgelegd",
      text: "Elke wijziging van de MRR wordt vastgelegd op het moment dat ze gebeurt, en netto nieuwe MRR telt de wijzigingen van de maand op. Bij een verloren abonnement staat waarom: opgezegd, wordt niet verlengd, betaling mislukt of gepauzeerd.",
      kinds: {
        new: { name: "Nieuw", text: "begint te betalen" },
        expansion: { name: "Expansie", text: "betaalt meer" },
        contraction: { name: "Contractie", text: "betaalt minder" },
        churn: { name: "Churn", text: "telt niet meer mee" },
        reactivation: { name: "Heractivering", text: "betaalt weer" },
      },
    },
    arr: {
      title: "ARR",
      text: "ARR is twaalf keer de MRR. Een scherm kan ARR als hoofdmaatstaf tonen: het hoofdgetal, de grafiek, het doel en de mijlpalen staan dan in ARR, terwijl betalingen en omzet blijven wat klanten betaalden.",
    },
    revenue: {
      title: "Omzet vandaag en deze maand",
      text: "Omzet is wat klanten betaalden, na aftrek van terugbetalingen: vandaag, deze maand, en dezelfde dagen van vorige maand om te vergelijken. Dagen en maanden volgen de tijdzone van het scherm.",
      connect:
        "Op een Stripe Connect-platform verschijnen betalingen voor gekoppelde accounts in de feed, en telt alleen de commissie die jij overhoudt als jouw omzet.",
    },
    currencies: {
      title: "Meerdere valuta’s",
      text: "Elk bedrag wordt omgerekend naar de valuta van het scherm tegen de koers van vandaag, van de Europese Centrale Bank, die elke 12 uur wordt ververst. Ook eerdere waarden: de grafiek toont hoe je bedrijf groeit, niet hoe wisselkoersen schommelen.",
    },
    updates: {
      title: "Directe updates",
      text: "Met een webhook laat Stripe SaaS Monitor meteen weten wanneer er iets gebeurt. Zonder webhook controleert SaaS Monitor Stripe in een tempo dat binnen de leeslimiet van Stripe blijft.",
      webhook: { label: "Met een webhook", value: "Binnen enkele seconden" },
      polling: {
        label: "Zonder webhook",
        value: "Ongeveer elke 17 minuten voor kleine accounts, tot eens per minuut voor drukke",
      },
      daily:
        "Een dagelijkse controle vergelijkt bovendien elk abonnement met Stripe, voor de paar wijzigingen die Stripe zonder gebeurtenis doorvoert, zoals een coupon die afloopt.",
    },
    history: {
      title: "Je geschiedenis",
      text: "Bij het koppelen importeert SaaS Monitor je abonnementen, de betalingen van de afgelopen 12 maanden en de klanten van de afgelopen 7 dagen. Stripe bewaart geen geschiedenis van eerdere abonnementswijzigingen, dus de grafiek van vóór die dag wordt opgebouwd uit de start, het einde en het huidige bedrag van elk abonnement. Vanaf dan wordt elke wijziging vastgelegd op het moment dat ze gebeurt.",
    },
    limits: {
      title: "Bekende verschillen",
      text: "De paar gevallen waarin de muur en Stripe kunnen verschillen, zijn gedocumenteerd:",
      items: [
        "Prijzen inclusief belasting tellen mee met de belasting.",
        "Een coupon die vóór je eerste import is verwijderd, telt op het hele abonnement.",
        "Upgrades en downgrades van vóór je eerste import staan niet in de grafiek.",
      ],
    },
  },
  security: {
    summary:
      "Een sleutel met alleen leesrechten, versleuteld opgeslagen. Namen standaard verborgen. Open source, dus iedereen kan het controleren.",
    meta: {
      title: "Beveiliging: versleutelde Stripe-sleutel die alleen leest",
      description:
        "Een beperkte Stripe-sleutel met alleen leesrechten, versleuteld met AES-256-GCM. Geen advertenties of tracking, namen standaard verborgen, open source.",
    },
    title: "Veilig om te koppelen",
    lead: "SaaS Monitor leest alleen wat je schermen nodig hebben, bewaart je sleutel versleuteld en toont niets wat je niet zelf hebt gekozen. Het is open source, dus je hoeft ons niet op ons woord te geloven.",
    facts: [
      { value: "Alleen lezen", label: "beperkte Stripe-sleutel" },
      { value: "AES-256-GCM", label: "versleuteld opgeslagen" },
      { value: "MIT", label: "open source, voor iedereen te controleren" },
    ],
    key: {
      title: "Een sleutel die alleen kan lezen",
      text: "Je koppelt Stripe met een beperkte sleutel, die je in je Stripe Dashboard aanmaakt met alleen de rechten die SaaS Monitor nodig heeft: het vraagt nooit om je geheime sleutel. Met het enige optionele schrijfrecht voegt het een eigen webhook toe, voor directe updates. Trek de sleutel op elk moment in via Stripe. [Bekijk alle rechten](permissions)",
    },
    encryption: {
      title: "Versleuteld, en nooit meer getoond",
      text: "Sleutels worden versleuteld opgeslagen met AES-256-GCM en verlaten de server nooit: het dashboard toont alleen een gemaskeerde hint. Webhooks van Stripe worden geverifieerd met hun ondertekeningsgeheim.",
    },
    data: {
      title: "Wat er wordt opgeslagen",
      text: "Je Stripe-sleutel, versleuteld, en een kopie van wat je schermen nodig hebben: abonnementen en hun MRR-wijzigingen, betalingen en nieuwe klanten, met hun namen, e-mailadressen en landen. Geen kaart- of bankgegevens.",
      delete:
        "Koppel je een Stripe-account los, dan wordt alles wat eruit is geïmporteerd meteen verwijderd.",
    },
    screens: {
      title: "Schermen tonen alleen wat jij kiest",
      items: [
        "Namen en e-mailadressen van klanten verschijnen niet op je schermen of in hun meldingen, tenzij je ze aanzet.",
        "De link van een scherm is niet te raden, en **Regenerate link** trekt de oude in.",
        "Voeg een wachtwoord toe, en elk apparaat moet het één keer intypen.",
      ],
    },
    tracking: {
      title: "Geen advertenties, geen tracking",
      text: "De site draait geen analytics en laadt geen scripts van derden. Geen advertentie- of trackingcookies, en je gegevens worden nooit verkocht. Ook de app heeft geen account en geen tracking. [Privacybeleid](privacy)",
    },
    others: {
      title: "Wat derden te zien krijgen",
      text: "Alleen wat je aanzet: eigen zinnen voor de stem gaan naar Gradium om uitgesproken te worden, en meldingen op telefoons gaan via de pushdiensten die ze bezorgen.",
    },
    openSource: {
      title: "Open source, dus iedereen kan het controleren",
      text: "Elke regel van SaaS Monitor staat op GitHub onder de MIT-licentie: lees hoe je sleutel wordt opgeslagen, of draai het op je eigen server, waar je Stripe-gegevens blijven.",
      report: "Een kwetsbaarheid gevonden? Meld het vertrouwelijk",
    },
  },
  selfHosting: {
    summary:
      "Twee commando’s met Docker, op elke server of een Raspberry Pi. Voorgoed gratis, onder de MIT-licentie.",
    meta: {
      title: "SaaS Monitor zelf hosten met Docker in twee commando’s",
      description:
        "Draai SaaS Monitor met Docker Compose op je eigen server of een Raspberry Pi: twee commando’s, voorgoed gratis (MIT-licentie). HTTPS, updates, back-ups.",
    },
    title: "Draai het op je eigen server",
    lead: "SaaS Monitor is één Next.js-server en een MySQL-database. Met Docker draait het op elke server, een computer die nog over is of een Raspberry Pi, met alle functies, voorgoed gratis.",
    install: {
      title: "Installeren in twee commando’s",
      requirements:
        "Je hebt Docker met Compose nodig, op een server, een computer die nog over is of een Raspberry Pi met een 64-bits besturingssysteem.",
      script:
        "Het [script](install-script) maakt een map `saas-monitor` met een Compose-bestand en een `.env` met nieuwe secrets, en stopt dan: het heeft geen root nodig, start niets en raakt verder niets aan.",
      then: "Open `http://localhost:3000`, maak je account aan en koppel Stripe. Databasemigraties draaien vanzelf.",
    },
    tv: {
      title: "Open het vanaf de tv",
      text: "Zet `APP_URL` in `.env` op het adres dat de tv gebruikt, zoals `http://192.168.1.20:3000`, en voer `docker compose up -d` opnieuw uit: de links van schermen worden ermee opgebouwd.",
      callout: {
        title: "Bewaar ENCRYPTION_KEY goed",
        text: "Die versleutelt de Stripe-sleutels in je database. Wijzig hem nooit: zonder hem moet elk Stripe-account opnieuw worden gekoppeld.",
      },
    },
    https: {
      title: "HTTPS voor directe updates",
      text: "Voor een tv op hetzelfde kantoor volstaat een lokaal netwerk. Zet SaaS Monitor achter HTTPS met een domein om schermen overal te openen en directe updates te krijgen: Stripe stuurt webhooks alleen naar een openbaar HTTPS-adres. Elke reverse proxy werkt, zoals Caddy.",
      without:
        "Zonder HTTPS controleert SaaS Monitor Stripe in een vast tempo, ongeveer elke 17 minuten voor kleine accounts.",
    },
    updates: {
      title: "Updates",
      text: "Haal de nieuwe image op en herstart: open schermen merken de nieuwe versie op en laden zichzelf opnieuw. Wil je zelf bepalen wanneer je bijwerkt, zet dan een release vast met `SAAS_MONITOR_VERSION`.",
    },
    data: {
      title: "Wat er op je server blijft",
      text: "Alles: je Stripe-sleutel, je gegevens en je instellingen staan in je eigen MySQL-database, en één commando maakt er een back-up van. Twee optionele functies maken verbinding met de buitenwereld: eigen zinnen voor de stem gaan naar Gradium om uitgesproken te worden, en meldingen op telefoons gaan via de pushdienst van Expo.",
      signups:
        "Heeft je team zich aangemeld, zet dan `DISABLE_SIGNUPS=true`: niemand anders kan nog een account aanmaken, en uitnodigingen blijven werken.",
    },
    cta: {
      title: "Twee commando’s, en het is van jou",
      text: "Alle functies, voorgoed gratis. De volledige handleiding behandelt configuratie, HTTPS, updates, back-ups en bouwen vanuit de broncode.",
      guide: "Volledige handleiding zelf hosten op GitHub",
    },
  },
};
