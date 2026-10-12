import type { SiteText } from "./en";

export const de: SiteText = {
  meta: {
    title: "SaaS Monitor · Open-Source Stripe-MRR-Dashboard für den Büro-TV",
    description:
      "Dein Stripe-MRR, ARR und jede Zahlung live auf dem Fernseher im Büro, dem Handy und der Uhr. Open Source: in der Beta gratis gehostet oder selbst gehostet.",
    imageAlt: "SaaS Monitor: Sieh dein SaaS wachsen – live",
    imageGrowth: (percent) => `${percent} in 30 Tagen`,
  },
  nav: {
    skip: "Zum Inhalt springen",
    home: "SaaS Monitor, Startseite",
    main: "Hauptnavigation",
    demo: "Live-Demo",
    features: "Funktionen",
    apps: "Apps",
    pricing: "Preise",
    docs: "Doku",
    github: "GitHub",
    signIn: "Anmelden",
    getStarted: "Loslegen",
    menu: "Menü",
    language: "Sprache",
  },
  languageHint: {
    text: "Diese Seite gibt es auch auf Deutsch.",
    action: "Auf Deutsch lesen",
    dismiss: "Schließen",
  },
  hero: {
    badge: "Open Source · Kostenlos in der öffentlichen Beta",
    title: { start: "Sieh dein SaaS wachsen – ", highlight: "live", end: "." },
    lead: "SaaS Monitor macht aus deinem Stripe-Konto Live-Zahlen: MRR oder ARR, den Umsatz des Tages und jede Zahlung, mit einem Sound für jeden Verkauf. Auf dem Fernseher im Büro, auf deinem Handy und an deinem Handgelenk.",
    primary: "Kostenlos loslegen",
    secondary: "Live-Demo öffnen",
    points: [
      "Kostenlos in der Beta",
      "Selbst gehostet für immer gratis",
      "Nur Lesezugriff auf Stripe",
    ],
  },
  demo: {
    title: "Live-Demo eines Bildschirms von SaaS Monitor",
    caption:
      "Die Live-Demo, mit einem fiktiven SaaS. Etwa alle 20 Sekunden kommt ein Verkauf rein.",
    captionOn: "Ton an: Jeder Verkauf klingelt, dann sagt eine Stimme, was passiert ist.",
    captionBlocked:
      "Dein Browser hat den Ton nicht zugelassen. Klicke auf „Anhören“, um es noch einmal zu versuchen.",
    hear: "Anhören",
    mute: "Ton aus",
    posterAlt:
      "Ein Bildschirm von SaaS Monitor: der MRR in großer Schrift mit seinem Wachstum, das Ziel, das MRR-Diagramm, Umsatzkacheln und die letzten Zahlungen",
    open: "Live-Demo öffnen",
  },
  proof: {
    label: "SaaS Monitor in Kürze",
    stars: (count) => `${count} auf GitHub`,
    star: "Auf GitHub einen Stern geben",
    license: "MIT-Lizenz",
    selfHost: "Docker oder Raspberry Pi",
    languages: "7 Sprachen",
    privacy: "Keine Werbung, kein Tracking",
  },
  features: {
    eyebrow: "An der Wand",
    title: "Gebaut, damit du dranbleibst",
    lead: "Ein SaaS aufzubauen ist ein Marathon. Zu sehen, wie es Verkauf für Verkauf wächst, hält ein Team am Ball.",
    mrr: {
      title: "Die Zahl, die zählt, ganz groß",
      text: "Der MRR im Mittelpunkt, mit seinem Wachstum über 30 Tage, dem ARR und dem Weg zu deinem nächsten Meilenstein. Auch vom anderen Ende des Raums lesbar.",
      growth: (amount, percent) => `${amount} · ${percent} in 30 Tagen`,
      toGoal: (amount, goal) => `noch ${amount} bis ${goal}`,
      pace: "bei diesem Tempo: morgen",
    },
    moment: {
      title: "Jeder Verkauf ist ein Moment",
      text: "Ein Sound, eine Karte mit Betrag und Tarif, Konfetti in deiner Farbe. Das ganze Büro weiß Bescheid.",
      kind: "Neuer Kunde",
      plan: "Team",
    },
    milestone: {
      title: "Meilensteine zum Feiern",
      text: "1.000, 10.000, 100.000\u00a0$ MRR oder dein eigenes Ziel, mit dem Tag, an dem du es bei deinem aktuellen Tempo erreichst. Ist eine Marke geknackt, gehört ihr der ganze Bildschirm.",
      reached: "Ziel erreicht",
      next: (amount) => `Nächster Halt: ${amount}. Weiter so.`,
    },
    wall: {
      title: "Gemacht für die Wand",
      text: "Dunkel oder hell, in deiner Markenfarbe und in sieben Sprachen. Vom 720p-Monitor bis zum 4K-Fernseher: Der Bildschirm schläft nie ein und erholt sich von selbst.",
    },
    accounts: {
      all: "Alle Konten",
      title: "Alle deine Produkte, ein Bildschirm",
      text: "Fasse mehrere Stripe-Konten in einer Währung zusammen oder zeig jedes Produkt im Wechsel. Jeder Moment zeigt, woher er kommt.",
    },
    honest: {
      title: "Ehrlich und diskret",
      text: "MRR so, wie Stripe ihn definiert, gelesen mit einem eingeschränkten Schlüssel, der verschlüsselt gespeichert wird. Kundennamen bleiben verborgen, solange du sie nicht einblendest.",
      points: [
        "Eingeschränkter Schlüssel, nur lesend",
        "Verschlüsselt mit AES-256-GCM",
        "Namen standardmäßig verborgen",
      ],
    },
  },
  sounds: {
    eyebrow: "Sound",
    title: "Hör, wie ein Verkauf klingt",
    lead: "Drei Soundpakete, direkt im Browser synthetisiert: nichts zu installieren. Danach sagt eine Stimme, was passiert ist, in der Sprache des Bildschirms. Wähle sie pro Bildschirm oder lass es im Meetingraum ganz still.",
    packs: {
      register: {
        name: "Registrierkasse",
        description: "Das klassische Ka-Ching: eine Schublade und eine Kassenglocke.",
      },
      chime: { name: "Glockenspiel", description: "Sanfte Glocken für ein ruhiges Büro." },
      arcade: { name: "Arcade", description: "8-Bit-Münzen und Power-ups." },
    },
    events: {
      payment: "Zahlung",
      customer: "Neuer Kunde",
      mrrUp: "MRR steigt",
      mrrDown: "MRR sinkt",
      milestone: "Meilenstein",
    },
    play: (sound, pack) => `Sound „${sound}“ aus dem Paket „${pack}“ abspielen`,
    download: (sound, pack) =>
      `Sound „${sound}“ aus dem Paket „${pack}“ als WAV-Datei herunterladen`,
    voices: {
      title: "Stimmen",
      text: "Nach dem Sound sagt eine Stimme, was passiert ist, in der Sprache des Bildschirms. Zwei Stimmen pro Sprache.",
      choose: "Satz, den die Stimmen sprechen",
      phrases: {
        payment: "Zahlung",
        subscription: "Neuer Abonnent",
        customer: "Neuer Kunde",
        upgrade: "Upgrade",
        goal: "Ziel erreicht",
      },
      play: (voice, language, words) =>
        `${voice} abspielen, eine Stimme auf ${language}, die „${words}“ sagt`,
    },
    files: "Alle Sounds als WAV-Dateien herunterladen",
  },
  apps: {
    eyebrow: "Apps",
    title: "Dein MRR auch in der Hosentasche",
    lead: "Die App SaaS Monitor öffnet jeden Bildschirm über seinen Link oder QR-Code, gehostet oder selbst gehostet. Dreh dein Smartphone quer, und es wird zum Wanddisplay. Kein Konto, kein Tracking.",
    platforms: "iPhone · iPad · Apple Watch · Android · Wear OS",
    features: [
      {
        title: "Jeder Verkauf, in Echtzeit",
        text: "Eine Benachrichtigung für jede Zahlung, jeden neuen Abonnenten, jedes Upgrade und jeden Meilenstein, in der Sprache des Bildschirms. Auf dem iPhone kann sie mit dem Sound und der Stimme des Bildschirms klingeln.",
      },
      {
        title: "Widgets überall",
        text: "Auf dem iPhone Widgets für Home-Bildschirm, Sperrbildschirm und StandBy, auch in CarPlay. Auf Android Widgets für den Startbildschirm.",
      },
      {
        title: "Am Handgelenk",
        text: "Apps für Apple Watch und Wear OS, mit Komplikationen, damit dein MRR auf dem Zifferblatt bleibt.",
      },
      {
        title: "Jede Zahl teilen",
        text: "Halte eine Zahl gedrückt, um sie als sauberes Bild zu teilen, signiert mit „Powered by SaaS Monitor“.",
      },
    ],
    stores: {
      soon: "Bald verfügbar",
      appStore: {
        soon: "Bald im App Store",
        live: "Laden im App Store",
        liveLine: "Laden im",
      },
      googlePlay: {
        soon: "Bald bei Google Play",
        live: "Jetzt bei Google Play",
        liveLine: "Jetzt bei",
      },
    },
    pending: "Beide Apps werden gerade geprüft. Sobald sie erscheinen, findest du sie hier.",
    images: {
      iphone:
        "Die App SaaS Monitor auf dem iPhone: der MRR kurz vor seinem Ziel von 15.000 $, das MRR-Diagramm und der heutige Umsatz",
      watch: "Die App für die Apple Watch: der MRR mit seinem Wachstum über 30 Tage und Diagramm",
      android: "Die Android-App teilt den MRR als Bild, signiert mit Powered by SaaS Monitor",
    },
  },
  steps: {
    eyebrow: "Einrichtung",
    title: "In zwei Minuten an der Wand",
    guide: "Zur Schritt-für-Schritt-Anleitung",
    items: [
      {
        title: "Stripe verbinden",
        text: "Erstelle mit einem Klick einen eingeschränkten Schlüssel mit reinem Lesezugriff und füge ihn ein. Dein Verlauf ist in etwa einer Minute importiert.",
      },
      {
        title: "Ganz nach deinem Stil",
        text: "Wähle Sounds, Farben und dein Ziel mit Live-Vorschau. Jede Änderung wird sofort gespeichert.",
      },
      {
        title: "Ab an die Wand",
        text: "Öffne den Link des Bildschirms auf einem beliebigen Fernseher, Monitor oder Raspberry Pi. Keine Anmeldung, nichts zu installieren.",
      },
    ],
  },
  pricing: {
    eyebrow: "Preise",
    title: "Kostenlos in der Beta. Für immer kostenlos auf deinem Server.",
    lead: "SaaS Monitor ist in der öffentlichen Beta: Solange sie läuft, ist die gehostete Version kostenlos. Selbst gehostet bleibt es dauerhaft kostenlos.",
    hosted: {
      name: "Für dich gehostet",
      badge: "Öffentliche Beta",
      price: "Kostenlos",
      term: "während der öffentlichen Beta",
      points: [
        "Alle Funktionen, nichts zu installieren oder zu aktualisieren",
        "Sofortige Updates über Stripe-Webhooks",
        "So viele Bildschirme und Teammitglieder, wie du willst",
      ],
      cta: "Loslegen",
    },
    selfHosted: {
      name: "Auf deinem eigenen Server",
      badge: "Open Source",
      price: "Kostenlos",
      term: "für immer, unter der MIT-Lizenz",
      points: [
        "Alle Funktionen, ohne Limits",
        "Docker mit zwei Befehlen, auf jedem Server oder einem Raspberry Pi",
        "Deine Stripe-Daten bleiben auf deinem Server",
      ],
      cta: "Self-Hosting-Anleitung",
    },
  },
  openSource: {
    eyebrow: "Open Source",
    title: "Frei zum Betreiben, Lesen und Ändern",
    lead: "SaaS Monitor ist Open Source unter der MIT-Lizenz. Betreib es mit Docker auf deinem eigenen Server oder einem Raspberry Pi, mit zwei Befehlen und ohne etwas zu klonen oder zu bauen. Dein Stripe-Schlüssel verlässt nie deinen Server.",
    star: "Stern auf GitHub geben",
    guide: "Self-Hosting-Anleitung",
    facts: [
      { value: "MIT", label: "Lizenz, für immer" },
      { value: "2", label: "Befehle zur Installation" },
      { value: "arm64", label: "und amd64-Images" },
    ],
    terminal: "Terminal",
    copy: "Kopieren",
    copied: "Kopiert",
    copyFailed: "Markiere die Befehle, um sie zu kopieren",
    script:
      "Das [Skript](install-script) schreibt eine Compose-Datei und neu erzeugte Secrets und beendet sich dann. Öffne localhost:3000 und verbinde Stripe.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Was Gründer fragen",
    items: [
      {
        question: "Ist mein Stripe-Schlüssel sicher?",
        answer: [
          "Du verbindest Stripe mit einem eingeschränkten Schlüssel, den du in deinem Stripe Dashboard mit genau den Berechtigungen erstellst, die SaaS Monitor braucht: Er liest Abos, Kunden, Zahlungen sowie die Produkte, Preise und Gutscheine, die sie verwenden. Eine Berechtigung ist optional: Mit ihr registriert SaaS Monitor einen eigenen Webhook-Endpunkt, für sofortige Updates.",
          "Der Schlüssel wird mit AES-256-GCM verschlüsselt gespeichert, verlässt nie den Server und wird nie wieder angezeigt. Du kannst ihn jederzeit in Stripe widerrufen. [Alle Berechtigungen ansehen](permissions)",
        ],
      },
      {
        question: "Stimmt die Zahl mit meinem Stripe Dashboard überein?",
        answer: [
          "Ja, in den meisten Fällen: SaaS Monitor folgt Stripes eigener Definition des MRR. Nur aktive und überfällige Abos zählen, ein Jahrespreis zählt zu einem Zwölftel, und Rabatte werden abgezogen, außer einmalige.",
          "Einige Grenzen sind dokumentiert: Preise inklusive Steuern zählen mit ihrer Steuer, ein Gutschein, der vor deinem ersten Import gelöscht wurde, gilt für das ganze Abo, und das Diagramm vor diesem Import wird aus dem aktuellen Betrag jedes Abos rekonstruiert. [Wie der MRR berechnet wird](mrr)",
        ],
      },
      {
        question: "Was speichert ihr?",
        answer: [
          "Deinen Stripe-Schlüssel, verschlüsselt, und eine Kopie dessen, was deine Bildschirme brauchen: Abos und ihre MRR-Änderungen, Zahlungen und neue Kunden, mit Namen, E-Mail-Adressen und Ländern der Kunden. Keine Karten- oder Bankdaten. Trennst du ein Konto, werden seine Daten gelöscht. Selbst gehostet bleibt alles auf deinem Server. Nur eigene Sprachansagen, falls du sie aktivierst, gehen an Gradium, und Benachrichtigungen an die Smartphones, die einem Bildschirm folgen, laufen über den Push-Dienst von Expo.",
        ],
      },
      {
        question: "Welche Fernseher funktionieren?",
        answer: [
          "Jeder Bildschirm mit einem modernen Browser. Ein Raspberry Pi 4 oder 5 hinter dem Fernseher liefert das flüssigste Ergebnis: Einmal eingerichtet, öffnet er den Bildschirm bei jedem Start im Vollbild, mit Ton. Der Browser eines Smart-TVs, ein ungenutzter Laptop oder ein Tablet funktionieren auch. Der Bildschirm hält sich selbst wach, erholt sich von Netzwerkausfällen und lädt nach Updates neu. [Einen Bildschirm an die Wand bringen](wall)",
        ],
      },
      {
        question: "Gibt es eine mobile App?",
        answer: [
          "Die App SaaS Monitor für iPhone, iPad, Apple Watch, Android und Wear OS öffnet jeden Bildschirm über seinen Link oder QR-Code, gehostet oder selbst gehostet, und benachrichtigt dich bei jeder Zahlung, jedem neuen Abonnenten und jedem Meilenstein. Kein Konto, kein Tracking. [App ansehen](apps)",
        ],
      },
      {
        question: "Welche Sprachen spricht ein Bildschirm?",
        answer: [
          "Englisch, Französisch, Deutsch, Spanisch, Italienisch, Portugiesisch und Niederländisch, mit Zahlen und Datumsangaben im landesüblichen Format. Seine Stimme spricht Englisch, Französisch, Deutsch, Spanisch und Portugiesisch.",
        ],
      },
      {
        question: "Paddle, Lemon Squeezy oder Polar?",
        answer: [
          "Noch nicht: SaaS Monitor liest vorerst nur Stripe. Wenn du einen anderen Anbieter nutzt, [sag es uns auf GitHub](issues).",
        ],
      },
      {
        question: "Was kostet es?",
        answer: [
          "Die gehostete Version ist während der öffentlichen Beta kostenlos. Auf deinem eigenen Server bleibt es für immer kostenlos: SaaS Monitor ist Open Source unter der MIT-Lizenz.",
        ],
      },
      {
        question: "Kann ich es selbst hosten?",
        answer: [
          "Ja. SaaS Monitor läuft mit Docker Compose, neben seiner MySQL-Datenbank, auf jedem Server oder einem Raspberry Pi mit 64-Bit-Betriebssystem. Deine Stripe-Daten bleiben dort; nur die optionalen eigenen Sprachansagen gehen zur Sprachausgabe an Gradium, und Benachrichtigungen ans Smartphone laufen über den Push-Dienst von Expo. [Self-Hosting-Anleitung](self-hosting)",
        ],
      },
    ],
    maker: {
      title: "Wer dahintersteht",
      text: (director: string) =>
        `SaaS Monitor wird von ${director} bei [Synapsr](synapsr) entwickelt.`,
      also: "Wir entwickeln auch [Louez](louez), Open-Source-Software für Vermietbetriebe, und [Hovod](hovod), eine Open-Source-Videoplattform, die du selbst hostest.",
    },
  },
  closing: {
    title: "Bleib dran. Dein nächster Meilenstein ist näher, als du denkst.",
    primary: "Loslegen",
    secondary: "Stern auf GitHub geben",
  },
  footer: {
    license: "Open Source unter der MIT-Lizenz.",
    madeBy: "Entwickelt von [Synapsr](synapsr).",
    trademark:
      "Stripe ist eine Marke von Stripe, Inc. SaaS Monitor steht in keiner Verbindung zu Stripe und wird nicht von Stripe unterstützt.",
    columns: { product: "Produkt", openSource: "Open Source", legal: "Rechtliches" },
    links: {
      demo: "Live-Demo",
      sounds: "Stripe-Benachrichtigungstöne",
      alternatives: "Alternativen",
      changelog: "Changelog",
      docs: "Doku",
      githubDocs: "Doku auf GitHub",
      github: "GitHub",
      selfHosting: "Self-Hosting",
      privacy: "Datenschutz",
      terms: "Nutzungsbedingungen",
      legalNotice: "Impressum",
    },
    inEnglish: "auf Englisch",
    languages: "Sprachen",
  },
  notFound: {
    title: "Seite nicht gefunden",
    heading: "Nichts an dieser Wand",
    text: "Diese Seite gibt es nicht, oder sie ist umgezogen. Die Live-Demo dagegen läuft ohne Pause.",
    home: "Zur Startseite",
    demo: "Live-Demo öffnen",
  },
  soundPage: {
    meta: {
      title: "Stripe-Benachrichtigungston ändern: So geht’s",
      description:
        "Stripe dokumentiert keine Toneinstellung: Dein Handy wählt den Ton. So änderst du ihn auf iPhone und Android, plus gratis Ka-Ching-Sounds für jeden Verkauf.",
    },
    eyebrow: "Stripe-Benachrichtigungston",
    title: "So änderst du den Stripe-Benachrichtigungston",
    intro:
      "Kurz gesagt: in den Einstellungen deines Smartphones, nicht in Stripe. Die App Stripe Dashboard benachrichtigt dich über neue Zahlungen, neue Kunden, angefochtene Zahlungen, gutgeschriebene Überweisungen und eine tägliche Zusammenfassung. Die von Stripe dokumentierten Einstellungen schalten sie ein oder aus; wie sie klingen, entscheidet dein Smartphone.",
    change: {
      title: "Auf dem Smartphone ändern",
      lead: "Erlaube zuerst Benachrichtigungen von Stripe auf deinem Smartphone, wie Stripe es verlangt. Dann:",
      source: "Quelle:",
      iphone: {
        title: "Auf dem iPhone",
        steps: [
          "Öffne **Einstellungen** und dann **Mitteilungen**.",
          "Tippe unter Mitteilungsstil auf **Stripe**.",
          "Tippe auf **Töne** und wähle einen Ton.",
        ],
        note: "Laut Apple funktioniert der letzte Schritt nur, wenn die App ihn unterstützt.",
        sources: { apple: "Apple Support" },
      },
      android: {
        title: "Auf Android",
        steps: [
          "Öffne **Einstellungen** und dann **Benachrichtigungen** › **App-Benachrichtigungen**.",
          "Tippe auf **Stripe** und dann auf eine Benachrichtigungskategorie.",
          "Wähle den Ton dieser Kategorie.",
        ],
        note: "Unter Android kannst du den Ton jeder Benachrichtigungskategorie einer App ändern. Die Menüs unterscheiden sich je nach Hersteller.",
        sources: { android: "Android-Hilfe", developers: "Android Developers" },
      },
      stripe: {
        title: "In der Stripe-App",
        steps: [
          "Tippe oben links in einer beliebigen Ansicht auf das Symbol deines Kontos.",
          "Öffne **Global settings** › **Notification settings**.",
          "Schalte Benachrichtigungen für jedes deiner Konten ein oder aus.",
        ],
        note: "Stripe dokumentiert diese Schalter, eine Auswahl des Tons dagegen nicht.",
        sources: { support: "Stripe-Support", app: "Stripe Dashboard App" },
      },
    },
    library: {
      title: "Oder gib jedem Verkauf einen Sound, den der ganze Raum hört",
      lead: "Ein Ping auf dem Smartphone geht leicht unter, und nur du hörst ihn. SaaS Monitor bringt deinen Stripe-Umsatz auf einen Bildschirm im Büro und spielt einen Sound bei jeder Zahlung, jedem neuen Kunden und jeder MRR-Änderung, aus einem von drei Paketen. Spiel sie hier ab oder lade sie als WAV-Dateien herunter, frei nutzbar unter der MIT-Lizenz, die verlangt, dass ihr Lizenzhinweis mitgeliefert wird.",
    },
    voices: {
      title: "Und eine Stimme, die sagt, was passiert ist",
      lead: "Nach dem Sound kann ein Bildschirm den Moment laut ansagen, auf Englisch, Französisch, Deutsch, Spanisch oder Portugiesisch. Zehn Stimmen, zwei pro Sprache, mit aufgenommenen Sätzen; mit einem Gradium-API-Schlüssel auf dem Server können Bildschirme auch den Namen des Kunden, den Betrag oder den Tarif nennen.",
    },
    questions: {
      title: "Fragen",
      items: [
        {
          question: "Kann ich den Ton in der Stripe-App selbst ändern?",
          answer: [
            "Stripes Dokumentation zur Dashboard-App beschreibt Schalter, um Benachrichtigungen für jedes Konto ein- oder auszuschalten, aber keine Auswahl des Tons. Der Ton kommt aus den Benachrichtigungseinstellungen deines Smartphones.",
          ],
        },
        {
          question: "Bei welchen Stripe-Ereignissen spielt SaaS Monitor einen Sound?",
          answer: [
            "Zahlungen, neue Kunden, steigender MRR (neue Abos, Upgrades, Reaktivierungen) oder sinkender MRR (Downgrades, Kündigungen, unbezahlt gebliebene Abos) und Meilensteine: fünf Sounds pro Paket. Für jede Art von Ereignis legt ein Bildschirm fest, ob er seinen Sound spielt, es laut ansagt, eine Karte zeigt oder es im Feed auflistet.",
          ],
        },
        {
          question: "Ersetzt SaaS Monitor die Stripe-App?",
          answer: [
            "Nein. Es liest dein Stripe-Konto mit einem eingeschränkten Schlüssel (eine optionale Berechtigung fügt einen eigenen Webhook hinzu), um deinen Umsatz auf einem Bildschirm zu zeigen. Behalte die Stripe-App für Rückerstattungen, Auszahlungen und alles andere.",
          ],
        },
        {
          question: "Muss ich etwas installieren, um die Sounds zu hören?",
          answer: [
            "Nein. Bildschirme synthetisieren ihre Sounds im Browser: Öffne den Link eines Bildschirms auf einem Fernseher, einem Raspberry Pi oder einem Laptop und klicke einmal, um den Ton zu erlauben.",
          ],
        },
        {
          question: "Darf ich die WAV-Dateien anderswo verwenden?",
          answer: [
            "Ja. Sie werden aus dem Open-Source-Code von SaaS Monitor erzeugt, unter der MIT-Lizenz, die verlangt, dass ihr Lizenzhinweis mitgeliefert wird. Nutze sie für eigene Benachrichtigungen, Bots oder Videos.",
          ],
        },
      ],
    },
    closing: {
      title: "Hör es an der Wand",
      text: "Die Live-Demo zeigt ein fiktives SaaS, bei dem etwa alle 20 Sekunden ein Verkauf reinkommt. Klicke einmal auf den Bildschirm, um den Ton einzuschalten.",
      register: "Demo mit der Registrierkasse öffnen",
      arcade: "Oder mit dem Arcade-Paket",
    },
  },
};
