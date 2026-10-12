import type { DocsText } from "./en";

export const de: DocsText = {
  common: {
    docs: "Doku",
    breadcrumb: "Pfadnavigation",
    pages: {
      overview: "Überblick",
      "get-started": "Erste Schritte",
      "wall-display": "Wanddisplay",
      customize: "Anpassen",
      apps: "Apps",
      numbers: "Zahlen",
      security: "Sicherheit",
      "self-hosting": "Self-Hosting",
    },
    githubDocs: "Doku auf GitHub",
    onThisPage: "Auf dieser Seite",
    previous: "Zurück",
    next: "Weiter",
    github: {
      title: "Mehr Details auf GitHub",
      text: "Die vollständigen Anleitungen, mit jeder Option, jedem Befehl und jedem Limit.",
    },
    cta: {
      title: "Sieh deine eigenen Zahlen noch heute live",
      text: "Kostenlos in der öffentlichen Beta. Verbinde Stripe mit einem Nur-Lese-Schlüssel, und dein Bildschirm ist in etwa zwei Minuten bereit.",
      primary: "Kostenlos loslegen",
      secondary: "Live-Demo öffnen",
    },
  },
  overview: {
    meta: {
      title: "Doku: dein Stripe-MRR auf dem TV, in zwei Minuten",
      description:
        "Kurze Anleitungen zu SaaS Monitor: Stripe mit Nur-Lese-Schlüssel verbinden, deinen MRR auf den TV bringen, anpassen, Apps nutzen oder selbst hosten.",
    },
    title: "In zwei Minuten startklar",
    lead: "Kurze Anleitungen, jede in ein, zwei Minuten gelesen: SaaS Monitor einrichten, nach deinem Geschmack gestalten und sehen, warum du ihm vertrauen kannst. Alle technischen Details findest du auf GitHub.",
    start: "Hier beginnen",
    read: "Anleitung lesen",
    github: {
      title: "Lieber die technischen Anleitungen?",
      text: "Die Doku auf GitHub deckt jede Option, jeden Befehl und jedes Limit ab, für Entwickler und alle, die selbst hosten.",
      links: {
        stripe: "Stripe verbinden",
        wall: "Einen Bildschirm an die Wand bringen",
        selfHosting: "Self-Hosting",
      },
    },
  },
  getStarted: {
    summary:
      "Registrieren, Stripe mit einem Nur-Lese-Schlüssel verbinden, einen Link auf dem Fernseher öffnen. Etwa zwei Minuten.",
    meta: {
      title: "Erste Schritte: Stripe-MRR in zwei Minuten auf dem TV",
      description:
        "Gratis-Konto anlegen, Stripe mit eingeschränktem Nur-Lese-Schlüssel verbinden, Bildschirm-Link auf jedem TV öffnen. Vier Schritte, rund zwei Minuten.",
    },
    title: "In zwei Minuten startklar",
    lead: "Von der Registrierung bis zu deinem MRR auf dem Fernseher im Büro, in vier Schritten. Nichts zu installieren, nichts zu programmieren.",
    facts: ["Etwa zwei Minuten", "Nur Lesezugriff auf Stripe", "Kostenlos in der Beta"],
    steps: {
      title: "Vier Schritte",
      account: {
        title: "Erstelle dein kostenloses Konto",
        text: "Registriere dich auf saas-monitor.com: In der öffentlichen Beta ist es kostenlos. Du bekommst einen Workspace, in den du später dein Team einladen kannst.",
      },
      connect: {
        title: "Verbinde Stripe mit einem Nur-Lese-Schlüssel",
        text: "Klicke auf **Create a restricted key on Stripe**: Das Stripe-Dashboard öffnet sich mit dem Formular für den Schlüssel, die richtigen Berechtigungen sind schon ausgewählt. Prüfe sie, gib dem Schlüssel einen Namen, erstelle ihn und füge ihn dann in SaaS Monitor ein.",
        note: "Der Schlüssel wird schon beim Einfügen geprüft: Fehlt eine Berechtigung, sagt dir SaaS Monitor, welche.",
      },
      import: {
        title: "Lass deinen Verlauf importieren",
        text: "SaaS Monitor importiert deine Abos, die Zahlungen der letzten 12 Monate und die Kunden der letzten 7 Tage. Bei kleinen Konten dauert das ein paar Sekunden, bei großen ein paar Minuten, und das Dashboard zeigt den Fortschritt.",
      },
      tv: {
        title: "Öffne deinen Bildschirm auf dem Fernseher",
        text: "Dein erster Bildschirm wird angelegt, sobald Stripe verbunden ist. Kopiere seinen Link, öffne ihn im Browser des Fernsehers, auf einem Raspberry Pi oder einem ungenutzten Laptop, und klicke einmal, um den Ton einzuschalten.",
        note: "Um es zu hören, klicke in den Einstellungen des Bildschirms auf **Send a test celebration**: Überall, wo der Bildschirm geöffnet ist, läuft ein Beispielverkauf.",
      },
    },
    permissions: {
      title: "Welche Berechtigungen, und warum",
      lead: "Sieben Berechtigungen zum Lesen und eine optionale zum Schreiben. Alles andere bleibt auf „Keine“.",
      columns: { permission: "Berechtigung", access: "Zugriff", why: "Warum" },
      access: { read: "Lesen", write: "Schreiben" },
      optional: "Optional",
      why: {
        subscriptions: "MRR, Upgrades und Kündigungen",
        customers: "Neue Kunden, ihre Namen und Länder",
        charges: "Umsatz und eine Feier für jede Zahlung",
        events: "Was sich seit der letzten Prüfung geändert hat",
        products: "Namen der Tarife",
        prices: "Beträge von Staffelpreisen",
        coupons: "Rabatte, die den MRR senken",
        webhooks: "Sofortige Updates: SaaS Monitor fügt seinen eigenen Webhook hinzu",
      },
      callout: {
        title: "Bewusst nur lesend",
        text: "Abgesehen von seinem eigenen Webhook, falls du es erlaubst, kann der Schlüssel nur lesen: keine Abbuchungen, keine Rückerstattungen, keine Änderungen an deinen Kunden. Er wird verschlüsselt gespeichert, nie wieder angezeigt, und du kannst ihn jederzeit in Stripe widerrufen.",
      },
      webhook:
        "Mit der optionalen Berechtigung **Webhook Endpoints** erreicht jeder Verkauf die Wand innerhalb von Sekunden. [So funktionieren Updates](doc-numbers)",
    },
    test: {
      title: "Mit Testdaten ausprobieren",
      text: "Noch nicht bereit, dein Live-Konto zu verbinden? Erstelle stattdessen einen Schlüssel im Testmodus (`rk_test_…`) in einer Stripe-Sandbox. Test- und Live-Modus desselben Kontos lassen sich nebeneinander verbinden.",
    },
    next: {
      title: "Wie geht’s weiter?",
      text: "Dein Bildschirm funktioniert so, wie er ist. Wenn du eine Minute Zeit hast:",
    },
  },
  wallDisplay: {
    summary:
      "Jeder Browser, ein Smart-TV oder ein Raspberry Pi: was der Bildschirm zeigt und wie er monatelang von allein läuft.",
    meta: {
      title: "Dein Stripe-Dashboard auf dem TV oder Raspberry Pi",
      description:
        "Öffne deinen Bildschirm-Link in jedem Browser, auf einem Smart-TV oder Raspberry-Pi-Kiosk. Er bleibt wach, erholt sich selbst und feiert jeden Verkauf.",
    },
    title: "Ab an die Wand",
    lead: "Ein Bildschirm ist eine Webseite, die dafür gemacht ist, monatelang unbeaufsichtigt im Vollbild zu laufen. Jedes Gerät mit einem modernen Browser kann ihn zeigen: keine App zu installieren, keine Anmeldung.",
    devices: {
      title: "Wähle ein Gerät",
      lead: "Der Bildschirm passt sich jeder Größe an, vom 720p-Monitor bis zum 4K-Fernseher, im Quer- oder Hochformat.",
      recommended: "Empfohlen",
      raspberryPi: {
        title: "Raspberry Pi",
        text: "Ein Raspberry Pi 4 oder 5 hinter dem Fernseher, einmal eingerichtet mit einem einzigen Block an Befehlen. Er öffnet den Bildschirm bei jedem Start im Vollbild, mit Ton: keine Tastatur, keine Maus, kein Klick.",
      },
      smartTv: {
        title: "Smart-TV",
        text: "Öffne den Link im Browser des Fernsehers und klicke einmal mit der Fernbedienung für den Ton. Manche TV-Browser sind langsam: Ein Raspberry Pi läuft flüssiger.",
      },
      computer: {
        title: "Laptop, Mini-PC oder Mac",
        text: "Öffne den Link in Chrome, drücke **F** für Vollbild und klicke einmal für den Ton. Schalte den Ruhezustand in den Systemeinstellungen aus.",
      },
      tablet: {
        title: "Tablet",
        text: "Füge den Link zum Home-Bildschirm hinzu und halte ihn dann im Vordergrund, mit „Geführter Zugriff“ auf dem iPad oder der Bildschirmfixierung auf Android.",
      },
      phone: {
        title: "Dein Smartphone",
        text: "Dreh dein Smartphone in der App SaaS Monitor quer, und du bist im TV-Modus: der ganze Bildschirm, wie an der Wand. [Apps ansehen](doc-apps)",
      },
      raspberryPiNote:
        "Im Dashboard findest du unter **Set up a TV or Raspberry Pi** den Befehl für den Raspberry Pi, mit deinem Link bereits eingesetzt.",
    },
    link: {
      title: "Der Link deines Bildschirms",
      text: "Jeder Bildschirm hat seinen eigenen Link, der nicht zu erraten ist: Du findest ihn unter **Screen link** in den Einstellungen des Bildschirms. Er öffnet sich ohne Anmeldung, behandle ihn also wie ein Passwort. **Regenerate link** widerruft den alten mit einem Klick.",
      password: {
        title: "Ein Passwort hinzufügen",
        text: "Für mehr Sicherheit nutze **Set a password**: Jedes Gerät fragt einmal danach und merkt es sich dann. Änderst du es, ist jedes Gerät wieder ausgesperrt. Angemeldete Mitglieder deines Workspace brauchen es nie.",
      },
      phone: {
        title: "Auf dem Smartphone öffnen",
        text: "Scanne unter **Open on your phone** den QR-Code mit der App SaaS Monitor, um dem Bildschirm auf deinem Smartphone zu folgen, mit seinen Widgets und Benachrichtigungen.",
      },
    },
    shows: {
      title: "Was der Bildschirm zeigt",
      items: [
        "Dein MRR oder ARR in großer Schrift, mit seinem Wachstum über 30 Tage",
        "Der Weg zu deinem nächsten Meilenstein oder deinem eigenen Ziel, und der Tag, an dem du es bei deinem aktuellen Tempo erreichst",
        "Ein Diagramm über 30 Tage, 90 Tage, 12 Monate oder den gesamten Zeitraum",
        "Umsatz heute und diesen Monat, Kunden und Netto-Neu-MRR",
        "Ein Live-Feed mit Zahlungen, neuen Kunden, Upgrades und Kündigungen",
      ],
    },
    moments: {
      title: "Momente und Feiern",
      text: "Jeder Verkauf, jeder neue Kunde und jede Abo-Änderung bekommt eine große Karte in der Mitte des Bildschirms, mit ihrem Sound und danach, wenn du willst, einer Stimme. Kommt Geld rein, gibt es Konfetti, und jeder Meilenstein übernimmt den ganzen Bildschirm.",
      detail:
        "Karten bleiben standardmäßig 10 Sekunden. Kommen mehrere gleichzeitig, laufen sie nacheinander ab.",
      imageAlt:
        "Die Zahlung von 199 $ eines neuen Kunden auf einer Karte in der Mitte des Bildschirms, mit Konfetti",
      tip: {
        title: "Vom Schreibtisch aus testen",
        text: "Klicke in den Einstellungen des Bildschirms auf **Send a test celebration**: Überall, wo der Bildschirm geöffnet ist, läuft innerhalb weniger Sekunden ein Beispielverkauf.",
      },
    },
    unattended: {
      title: "Gemacht, um allein zu laufen",
      items: [
        "Aktualisiert sich alle paar Sekunden und erholt sich nach einem Netzwerkausfall von selbst",
        "Hält das Display wach und blendet den Mauszeiger aus",
        "Verschiebt seinen Inhalt ab und zu um ein paar Pixel, um OLED-Panels zu schonen",
        "Lädt sich nach einem Update selbst neu, damit nie eine alte Version läuft",
      ],
    },
    sound: {
      title: "Ton auf dem Fernseher",
      text: "Browser halten eine Seite stumm, bis jemand mit ihr interagiert: Klicke einmal auf den Bildschirm, und der Ton bleibt bis zum nächsten Neuladen an. Auf einem Raspberry Pi sorgt der Kiosk-Befehl dafür, dass der Ton auch ohne Klick läuft.",
    },
  },
  customize: {
    summary:
      "MRR oder ARR, dein Ziel, Farben, Sprachen, Sounds und Stimmen: Gestalte jeden Bildschirm nach deinem Geschmack.",
    meta: {
      title: "Bildschirm anpassen: Ziel, Design, Sounds und Stimmen",
      description:
        "Wähle MRR oder ARR, setz ein Ziel, bestimme Design, Farbe, Sprache, Sounds und Stimme und was jedes Stripe-Ereignis auslöst. Mit Live-Vorschau.",
    },
    title: "Ganz nach deinem Stil",
    lead: "Jeder Bildschirm hat eigene Einstellungen, mit einer Live-Vorschau direkt daneben. Jede Änderung wird sofort gespeichert.",
    editorAlt:
      "Der Bildschirm-Editor: links die Einstellungen, rechts die Live-Vorschau und der Bereich zum Teilen",
    numbers: {
      title: "Deine Zahlen",
      metric: {
        title: "MRR oder ARR",
        text: "Zeig den MRR, oder den ARR, wenn du so rechnest: Hauptzahl, Diagramm, Ziel und Meilensteine ziehen mit. Zahlungen und Umsatz bleiben, was Kunden bezahlt haben.",
      },
      goal: {
        title: "Meilensteine oder dein Ziel",
        text: "Automatische Meilensteine feiern jede runde Zahl auf dem Weg nach oben, von 100 $ über 1.000 $ und 10.000 $ bis weit darüber hinaus. Oder setz dir dein eigenes Ziel.",
      },
      chart: {
        title: "Zeitraum des Diagramms",
        text: "Die letzten 30 Tage, 90 Tage, 12 Monate oder der gesamte Zeitraum.",
      },
      currency: {
        title: "Währung und Zeitzone",
        text: "Jeder Betrag wird in die Währung des Bildschirms umgerechnet. Seine Zeitzone bestimmt, wann „heute“ und „diesen Monat“ beginnen.",
      },
    },
    look: {
      title: "Design und Farbe",
      text: "Dunkel, oder hell für helle Räume. Wähle eine von fünf Akzentfarben oder füge deine Markenfarbe als Hex-Wert ein: Der Bildschirm passt sie bei Bedarf an, damit sie lesbar bleibt.",
      custom: "Deine Farbe",
      imageAlt: "Ein heller Bildschirm auf Deutsch, in einem eigenen Orange",
    },
    language: {
      title: "Sieben Sprachen",
      text: "Ein Bildschirm spricht Englisch, Französisch, Deutsch, Spanisch, Italienisch, Portugiesisch oder Niederländisch und schreibt Zahlen und Datumsangaben im landesüblichen Format. Das Dashboard selbst bleibt auf Englisch.",
    },
    sound: {
      title: "Sounds und Stimmen",
      packs:
        "Drei Soundpakete, direkt im Browser synthetisiert, mit je fünf Sounds, von der Zahlung bis zum Meilenstein. [Alle anhören](sounds)",
      voice:
        "Nach dem Sound kann eine Stimme sagen, was passiert ist: zwei Stimmen pro Sprache, auf Englisch, Französisch, Deutsch, Spanisch und Portugiesisch. Sound und Stimme haben jeweils einen eigenen Schalter und eine eigene Lautstärke.",
      own: "**Eigene Sätze**: Mit einem Gradium-API-Schlüssel auf dem Server sagt die Stimme, was du schreibst, mit dem Namen des Kunden, dem Betrag oder dem Tarif.",
    },
    events: {
      title: "Was jedes Ereignis auslöst",
      text: "Für jede Art von Ereignis gibt es fünf Schalter: Eintrag im Feed, Karte, Sound, Ansage und Benachrichtigung auf den Smartphones, die dem Bildschirm folgen.",
      event: "Ereignis",
      columns: { feed: "Feed", moment: "Karte", sound: "Sound", voice: "Stimme", push: "Handy" },
      names: {
        payment: "Zahlung",
        connectPayment: "Zahlung für ein Connect-Konto",
        subscription: "Neuer Abonnent",
        upgrade: "Upgrade",
        reactivation: "Reaktivierung",
        downgrade: "Downgrade",
        cancellation: "Kündigung",
        unpaid: "Fehlgeschlagene Zahlung",
        customer: "Neuer Kunde",
        milestone: "Meilenstein",
      },
      on: "An",
      off: "Aus",
      caption:
        "Die Standardwerte. Verluste werden nicht laut angesagt, und Smartphones erfahren nur die guten Nachrichten. Stimmen sprechen erst, wenn du sie einschaltest.",
    },
    accounts: {
      title: "Mehrere Stripe-Konten",
      text: "Ein Bildschirm kann mehrere Stripe-Konten zeigen, umgerechnet in seine Währung, auf eine von zwei Arten.",
      added: {
        title: "Zusammengezählt",
        text: "Eine Summe für alle Konten. Der Feed nennt bei jedem Eintrag das Konto.",
      },
      rotation: {
        title: "Im Wechsel",
        text: "Jedes Konto ist mit seinen eigenen Zahlen an der Reihe, auf Wunsch auch ihre Summe. Passiert etwas, zeigt der Bildschirm sofort das betreffende Konto.",
      },
      imageAlt:
        "Zwei Produkte auf einem Bildschirm: ein neuer Abonnent von Acme Analytics; das Produkt steht auf der Karte und oben im Wechsel der Konten",
      more: "Oder leg einen Bildschirm pro Produkt an, und einen ruhigen ohne Ton für den Meetingraum: so viele, wie du willst, jeder mit eigenem Link und eigenen Einstellungen.",
    },
    names: {
      title: "Kundennamen",
      text: "Standardmäßig verborgen: Sonst sähe jeder, der den Bildschirm sieht, wer dich bezahlt. Blende sie ein, wenn du willst. Kunden, die Stripe nur über ihre E-Mail-Adresse kennt, können dann per E-Mail-Adresse genannt werden, maskiert (`j•••@gmail.com`) oder vollständig, oder gar nicht. Stimmen lesen nie E-Mail-Adressen vor.",
    },
  },
  apps: {
    summary:
      "Deine Bildschirme auf iPhone, iPad, Apple Watch, Android und Wear OS, mit einer Benachrichtigung für jeden Verkauf.",
    meta: {
      title: "App: dein Stripe-MRR auf iPhone, Android und Apple Watch",
      description:
        "Folge jedem Bildschirm auf iPhone, iPad, Apple Watch, Android und Wear OS: eine Benachrichtigung pro Verkauf, Widgets, Komplikationen, Zahlen zum Teilen.",
    },
    title: "Dein MRR in der Hosentasche",
    lead: "Die App SaaS Monitor öffnet jeden Bildschirm über seinen Link oder QR-Code, auf saas-monitor.com oder auf deinem eigenen Server. Kein Konto, kein Tracking.",
    add: {
      title: "Einen Bildschirm hinzufügen",
      steps: [
        "Suche in den Einstellungen des Bildschirms nach **Open on your phone**.",
        "Scanne den QR-Code dort mit der App oder füge den Link des Bildschirms ein.",
        "Hat der Bildschirm ein Passwort, gib es auf jedem Smartphone einmal ein.",
      ],
    },
    notifications: {
      title: "Eine Benachrichtigung für jeden Verkauf",
      text: "Zahlungen, neue Abonnenten, Upgrades, Reaktivierungen, neue Kunden und Meilensteine, in der Sprache und Währung des Bildschirms. Viel Aktivität auf einmal kommt als eine einzige Benachrichtigung, die alles zusammenfasst.",
      choose:
        "Welche Ereignisse benachrichtigen, legst du in den **Events** des Bildschirms unter **Phone** fest. Auf jedem Smartphone kannst du die Benachrichtigungen eines Bildschirms ausschalten oder einzelne seiner Ereignisse stummschalten.",
      sound:
        "Auf dem iPhone kann eine Benachrichtigung mit dem Sound und der Stimme des Bildschirms klingeln, selbst wenn das iPhone gesperrt ist: Aktiviere dafür **Play sounds and voices** in den Einstellungen der App.",
      speed:
        "Benachrichtigungen gehen raus, sobald SaaS Monitor von Stripe hört: innerhalb von Sekunden mit [sofortigen Updates](doc-numbers).",
      now: "jetzt",
    },
    widgets: {
      title: "Widgets und Uhren",
      text: "Auf dem iPhone Widgets für Home-Bildschirm, Sperrbildschirm und StandBy, auch in CarPlay. Auf Android Widgets für den Startbildschirm. Apps für Apple Watch und Wear OS halten deinen MRR mit Komplikationen auf dem Zifferblatt.",
      wearAlt:
        "Die Wear-OS-App: der MRR mit seinem Wachstum über 30 Tage, Diagramm und Fortschritt zum Ziel",
    },
    tv: {
      title: "TV-Modus",
      text: "Dreh dein Smartphone auf einem Bildschirm quer für den TV-Modus: alles auf einmal, wie an der Wand, und das Smartphone bleibt wach. Ist **Play sounds and voices** aktiviert, spielt es auch Sound und Stimme jedes Moments ab.",
    },
    share: {
      title: "Jede Zahl teilen",
      text: "Halte eine Zahl gedrückt, um sie als sauberes Bild zu teilen, signiert mit „Powered by SaaS Monitor“. Wie gemacht für deinen nächsten Meilenstein-Post.",
      imageAlt: "Eine Zahlung von 79 $, als Bild geteilt, signiert mit Powered by SaaS Monitor",
    },
    privacy: {
      title: "Kein Konto, kein Tracking",
      text: "Der Link eines Bildschirms ist alles, was die App braucht. Sie enthält keine Analyse-, Werbe- oder Tracking-Tools, bewahrt deine Bildschirme im sicheren Speicher des Geräts auf und kommuniziert nur mit dem Server jedes Bildschirms und mit den Diensten, die Benachrichtigungen zustellen. Kunden werden nur auf Bildschirmen genannt, die Namen anzeigen. [Datenschutzerklärung](privacy)",
    },
  },
  numbers: {
    summary:
      "MRR so, wie Stripe ihn definiert, damit die Wand zu deinem Stripe-Dashboard passt. ARR, Umsatz, Währungen und Updates.",
    meta: {
      title: "So werden MRR, ARR und Umsatz aus Stripe berechnet",
      description:
        "MRR nach Stripes Definition: Die Zahl an der Wand passt zum Stripe-Dashboard. So funktionieren ARR, Umsatz, Währungen, sofortige Updates und Verlauf.",
    },
    title: "Zahlen, denen du vertrauen kannst",
    lead: "SaaS Monitor berechnet den MRR so, wie Stripe ihn definiert, damit die Zahl an der Wand nah an der in deinem Stripe-Dashboard bleibt. So funktioniert es im Detail.",
    mrr: {
      title: "MRR, wie Stripe ihn definiert",
      items: [
        "Nur aktive und überfällige Abos zählen: Testphasen sowie gekündigte, unbezahlte, pausierte oder unvollständige Abos nicht.",
        "Jeder Preis wird auf einen Monat umgerechnet: Ein Jahrespreis zählt zu einem Zwölftel.",
        "Mengen, Staffeln und Volumenpreise zählen so, wie Stripe sie in Rechnung stellt.",
        "Rabatte werden abgezogen, dauerhafte ebenso wie befristete bis zu ihrem Ende. Einmalige Rabatte nicht.",
        "Ein Abo, das zum Ende seines Abrechnungszeitraums gekündigt wird, zählt nicht mehr, sobald die Kündigung beantragt ist.",
        "Nutzungsbasierte und einmalige Preise bleiben außen vor, und Steuern werden nicht hinzugerechnet.",
      ],
    },
    movements: {
      title: "Jede Änderung, erfasst",
      text: "Jede MRR-Änderung wird erfasst, sobald sie passiert, und der Netto-Neu-MRR summiert die Änderungen des Monats. Ein verlorenes Abo nennt den Grund: gekündigt, wird nicht verlängert, Zahlung fehlgeschlagen oder pausiert.",
      kinds: {
        new: { name: "Neu", text: "beginnt zu zahlen" },
        expansion: { name: "Expansion", text: "zahlt mehr" },
        contraction: { name: "Kontraktion", text: "zahlt weniger" },
        churn: { name: "Churn", text: "zählt nicht mehr" },
        reactivation: { name: "Reaktivierung", text: "zahlt wieder" },
      },
    },
    arr: {
      title: "ARR",
      text: "ARR ist das Zwölffache des MRR. Ein Bildschirm kann ihn als Hauptkennzahl zeigen: Hauptzahl, Diagramm, Ziel und Meilensteine sind dann in ARR, während Zahlungen und Umsatz bleiben, was Kunden bezahlt haben.",
    },
    revenue: {
      title: "Umsatz heute und diesen Monat",
      text: "Umsatz ist, was Kunden bezahlt haben, abzüglich Rückerstattungen: heute, diesen Monat und zum Vergleich dieselben Tage des Vormonats. Tage und Monate folgen der Zeitzone des Bildschirms.",
      connect:
        "Auf einer Stripe-Connect-Plattform erscheinen Zahlungen für verbundene Konten im Feed, und nur die Gebühr, die du einbehältst, zählt als dein Umsatz.",
    },
    currencies: {
      title: "Mehrere Währungen",
      text: "Jeder Betrag wird zum aktuellen Kurs der Europäischen Zentralbank in die Währung des Bildschirms umgerechnet, alle 12 Stunden aktualisiert. Auch vergangene Werte: Das Diagramm zeigt, wie dein Geschäft wächst, nicht wie Wechselkurse schwanken.",
    },
    updates: {
      title: "Sofortige Updates",
      text: "Mit einem Webhook meldet sich Stripe bei SaaS Monitor, sobald etwas passiert. Ohne Webhook fragt SaaS Monitor Stripe in einem Takt ab, der Stripes Lesekontingent respektiert.",
      webhook: { label: "Mit Webhook", value: "Innerhalb von Sekunden" },
      polling: {
        label: "Ohne Webhook",
        value: "Etwa alle 17 Minuten bei kleinen Konten, bis zu einmal pro Minute bei sehr aktiven",
      },
      daily:
        "Eine tägliche Prüfung gleicht außerdem jedes Abo mit Stripe ab, für die wenigen Änderungen, die Stripe ohne Ereignis vornimmt, etwa einen auslaufenden Gutschein.",
    },
    history: {
      title: "Dein Verlauf",
      text: "Beim Verbinden importiert SaaS Monitor deine Abos, die Zahlungen der letzten 12 Monate und die Kunden der letzten 7 Tage. Stripe speichert keinen Verlauf früherer Abo-Änderungen, daher wird das Diagramm vor diesem Tag aus Beginn, Ende und aktuellem Betrag jedes Abos rekonstruiert. Ab dann wird jede Änderung erfasst, sobald sie passiert.",
    },
    limits: {
      title: "Bekannte Abweichungen",
      text: "Die wenigen Fälle, in denen Wand und Stripe voneinander abweichen können, sind dokumentiert:",
      items: [
        "Preise inklusive Steuern zählen mit ihrer Steuer.",
        "Ein Gutschein, der vor deinem ersten Import gelöscht wurde, gilt für das ganze Abo.",
        "Upgrades und Downgrades vor deinem ersten Import erscheinen nicht im Diagramm.",
      ],
    },
  },
  security: {
    summary:
      "Ein Schlüssel mit reinem Lesezugriff, verschlüsselt gespeichert. Namen standardmäßig verborgen. Open Source, damit jeder es prüfen kann.",
    meta: {
      title: "Sicherheit: Nur-Lese-Schlüssel für Stripe, verschlüsselt",
      description:
        "Eingeschränkter Nur-Lese-Schlüssel für Stripe, verschlüsselt mit AES-256-GCM. Keine Werbung, kein Tracking, Namen standardmäßig verborgen, Open Source.",
    },
    title: "Bedenkenlos verbinden",
    lead: "SaaS Monitor liest nur, was deine Bildschirme brauchen, speichert deinen Schlüssel verschlüsselt und zeigt nichts, was du nicht ausgewählt hast. Es ist Open Source, du musst uns also nicht blind vertrauen.",
    facts: [
      { value: "Nur lesend", label: "eingeschränkter Stripe-Schlüssel" },
      { value: "AES-256-GCM", label: "verschlüsselt gespeichert" },
      { value: "MIT", label: "Open Source, für alle prüfbar" },
    ],
    key: {
      title: "Ein Schlüssel, der nur lesen kann",
      text: "Du verbindest Stripe mit einem eingeschränkten Schlüssel, den du in deinem Stripe-Dashboard nur mit den Berechtigungen erstellst, die SaaS Monitor braucht: Nach deinem geheimen Schlüssel fragt es nie. Die einzige Schreibberechtigung ist optional: Mit ihr fügt es einen eigenen Webhook hinzu, für sofortige Updates. Widerrufe den Schlüssel jederzeit in Stripe. [Alle Berechtigungen ansehen](permissions)",
    },
    encryption: {
      title: "Verschlüsselt und nie wieder angezeigt",
      text: "Schlüssel werden mit AES-256-GCM verschlüsselt gespeichert und verlassen nie den Server: Das Dashboard zeigt nur einen maskierten Hinweis. Webhooks von Stripe werden mit ihrem Signaturgeheimnis geprüft.",
    },
    data: {
      title: "Was gespeichert wird",
      text: "Dein Stripe-Schlüssel, verschlüsselt, und eine Kopie dessen, was deine Bildschirme brauchen: Abos und ihre MRR-Änderungen, Zahlungen und neue Kunden, mit ihren Namen, E-Mail-Adressen und Ländern. Keine Karten- oder Bankdaten.",
      delete:
        "Trennst du ein Stripe-Konto, wird alles, was daraus importiert wurde, sofort gelöscht.",
    },
    screens: {
      title: "Bildschirme zeigen nur, was du auswählst",
      items: [
        "Namen und E-Mail-Adressen von Kunden erscheinen weder auf deinen Bildschirmen noch in deren Benachrichtigungen, solange du sie nicht einschaltest.",
        "Der Link eines Bildschirms ist nicht zu erraten, und **Regenerate link** widerruft den alten.",
        "Füge ein Passwort hinzu, und jedes Gerät muss es einmal eingeben.",
      ],
    },
    tracking: {
      title: "Keine Werbung, kein Tracking",
      text: "Die Website nutzt keine Webanalyse und lädt keine Skripte von Drittanbietern. Keine Werbe- oder Tracking-Cookies, und deine Daten werden nie verkauft. Auch die App kommt ohne Konto und ohne Tracking aus. [Datenschutzerklärung](privacy)",
    },
    others: {
      title: "Wer sonst was sieht",
      text: "Nur, was du einschaltest: Eigene Sprachansagen gehen zur Sprachausgabe an Gradium, und Benachrichtigungen ans Smartphone laufen über die Push-Dienste, die sie zustellen.",
    },
    openSource: {
      title: "Open Source, damit jeder es prüfen kann",
      text: "Jede Zeile von SaaS Monitor liegt auf GitHub, unter der MIT-Lizenz: Lies nach, wie dein Schlüssel gespeichert wird, oder betreib es auf deinem eigenen Server, wo deine Stripe-Daten bleiben.",
      report: "Eine Sicherheitslücke gefunden? Melde sie vertraulich",
    },
  },
  selfHosting: {
    summary:
      "Zwei Befehle mit Docker, auf jedem Server oder einem Raspberry Pi. Für immer kostenlos, unter der MIT-Lizenz.",
    meta: {
      title: "SaaS Monitor mit Docker selbst hosten, in zwei Befehlen",
      description:
        "Betreib SaaS Monitor mit Docker Compose auf deinem Server oder Raspberry Pi: zwei Befehle, für immer kostenlos (MIT-Lizenz). HTTPS, Updates, Backups.",
    },
    title: "Betreib es auf deinem eigenen Server",
    lead: "SaaS Monitor besteht aus einem Next.js-Server und einer MySQL-Datenbank. Mit Docker läuft es auf jedem Server, einem ungenutzten Computer oder einem Raspberry Pi, mit allen Funktionen und für immer kostenlos.",
    install: {
      title: "Installation in zwei Befehlen",
      requirements:
        "Du brauchst Docker mit Compose, auf einem Server, einem ungenutzten Computer oder einem Raspberry Pi mit 64-Bit-Betriebssystem.",
      script:
        "Das [Skript](install-script) legt einen Ordner `saas-monitor` mit einer Compose-Datei und einer `.env` mit neu erzeugten Secrets an und beendet sich dann: Es braucht keine Root-Rechte, startet nichts und verändert sonst nichts.",
      then: "Öffne `http://localhost:3000`, erstelle dein Konto und verbinde Stripe. Die Datenbankmigrationen laufen von selbst.",
    },
    tv: {
      title: "Vom Fernseher aus öffnen",
      text: "Setze `APP_URL` in der `.env` auf die Adresse, die der Fernseher verwenden wird, etwa `http://192.168.1.20:3000`, und führe `docker compose up -d` erneut aus: Die Links der Bildschirme werden daraus gebildet.",
      callout: {
        title: "ENCRYPTION_KEY sicher aufbewahren",
        text: "Er verschlüsselt die Stripe-Schlüssel in deiner Datenbank. Ändere ihn nie: Ohne ihn muss jedes Stripe-Konto neu verbunden werden.",
      },
    },
    https: {
      title: "HTTPS für sofortige Updates",
      text: "Für einen Fernseher im selben Büro reicht ein lokales Netzwerk. Stell SaaS Monitor mit einer Domain hinter HTTPS, um Bildschirme von überall zu öffnen und sofortige Updates zu bekommen: Stripe sendet Webhooks nur an eine öffentliche HTTPS-Adresse. Jeder Reverse Proxy funktioniert, etwa Caddy.",
      without:
        "Ohne HTTPS fragt SaaS Monitor Stripe in gleichmäßigem Takt ab, etwa alle 17 Minuten bei kleinen Konten.",
    },
    updates: {
      title: "Updates",
      text: "Lade das neue Image herunter und starte neu: Geöffnete Bildschirme bemerken die neue Version und laden sich selbst neu. Willst du selbst bestimmen, wann du aktualisierst, leg mit `SAAS_MONITOR_VERSION` ein Release fest.",
    },
    data: {
      title: "Was auf deinem Server bleibt",
      text: "Alles: Dein Stripe-Schlüssel, deine Daten und deine Einstellungen liegen in deiner eigenen MySQL-Datenbank, und ein Befehl sichert sie. Zwei optionale Funktionen gehen nach außen: Eigene Sprachansagen gehen zur Sprachausgabe an Gradium, und Benachrichtigungen ans Smartphone laufen über den Push-Dienst von Expo.",
      signups:
        "Sobald sich dein Team registriert hat, setze `DISABLE_SIGNUPS=true`: Niemand sonst kann ein Konto erstellen, und Einladungen funktionieren weiterhin.",
    },
    cta: {
      title: "Zwei Befehle, und es gehört dir",
      text: "Alle Funktionen, für immer kostenlos. Die vollständige Anleitung behandelt Konfiguration, HTTPS, Updates, Backups und das Bauen aus dem Quellcode.",
      guide: "Vollständige Self-Hosting-Anleitung auf GitHub",
    },
  },
};
