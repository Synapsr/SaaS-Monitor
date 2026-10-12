import type { DocsText } from "./en";

export const it: DocsText = {
  common: {
    docs: "Documentazione",
    breadcrumb: "Percorso di navigazione",
    pages: {
      overview: "Panoramica",
      "get-started": "Primi passi",
      "wall-display": "Schermo a parete",
      customize: "Personalizzazione",
      apps: "App",
      numbers: "Numeri",
      security: "Sicurezza",
      "self-hosting": "Self-hosting",
    },
    githubDocs: "Documentazione su GitHub",
    onThisPage: "In questa pagina",
    previous: "Precedente",
    next: "Successivo",
    github: {
      title: "Approfondisci su GitHub",
      text: "Le guide complete, con ogni opzione, comando e limite.",
    },
    cta: {
      title: "Guarda i tuoi numeri in diretta, già oggi",
      text: "Gratis durante la beta pubblica. Collega Stripe con una chiave in sola lettura e il tuo schermo è pronto in circa due minuti.",
      primary: "Inizia gratis",
      secondary: "Apri la demo in diretta",
    },
  },
  overview: {
    meta: {
      title: "Documentazione: il tuo MRR Stripe su una TV in due minuti",
      description:
        "Guide brevi a SaaS Monitor, la dashboard Stripe per la TV: chiave in sola lettura, MRR sulla parete, personalizzazione, app e self-hosting.",
    },
    title: "Pronto in due minuti",
    lead: "Guide brevi, ognuna si legge in un minuto o due: configura SaaS Monitor, rendilo tuo e scopri perché puoi fidarti. Ogni dettaglio tecnico è su GitHub.",
    start: "Inizia da qui",
    read: "Leggi la guida",
    github: {
      title: "Preferisci le guide tecniche?",
      text: "La documentazione su GitHub copre ogni opzione, comando e limite, per sviluppatori e per chi lo ospita sul proprio server.",
      links: {
        stripe: "Collega Stripe",
        wall: "Appendi uno schermo alla parete",
        selfHosting: "Self-hosting",
      },
    },
  },
  getStarted: {
    summary:
      "Registrati, collega Stripe con una chiave in sola lettura, apri un link sulla TV. Circa due minuti.",
    meta: {
      title: "Primi passi: il tuo MRR Stripe su una TV in due minuti",
      description:
        "Account gratuito, chiave Stripe con restrizioni in sola lettura e il link dello schermo aperto su qualsiasi TV. Quattro passaggi, circa due minuti.",
    },
    title: "Inizia in due minuti",
    lead: "Dalla registrazione al tuo MRR sulla TV dell’ufficio, in quattro passaggi. Niente da installare, niente da programmare.",
    facts: ["Circa due minuti", "Chiave Stripe in sola lettura", "Gratis durante la beta"],
    steps: {
      title: "Quattro passaggi",
      account: {
        title: "Crea il tuo account gratuito",
        text: "Registrati su saas-monitor.com con Google, GitHub o la tua email: è gratis durante la beta pubblica. Ottieni uno spazio di lavoro, dove più avanti potrai invitare il tuo team.",
      },
      connect: {
        title: "Collega Stripe con una chiave in sola lettura",
        text: "Fai clic su **Create a restricted key on Stripe**: la Stripe Dashboard si apre sul modulo di creazione della chiave, con i permessi giusti già selezionati. Controllali, dai un nome alla chiave e creala, poi incollala in SaaS Monitor.",
        note: "La chiave viene verificata mentre la incolli: se manca un permesso, SaaS Monitor ti dice quale.",
      },
      import: {
        title: "Lascia che importi il tuo storico",
        text: "SaaS Monitor importa i tuoi abbonamenti, i pagamenti degli ultimi 12 mesi e i clienti degli ultimi 7 giorni. Per gli account piccoli bastano pochi secondi, per quelli grandi qualche minuto, e la dashboard mostra l’avanzamento.",
      },
      tv: {
        title: "Apri il tuo schermo sulla TV",
        text: "Il tuo primo schermo viene creato non appena Stripe è collegato. Copia il suo link, aprilo nel browser della TV, su un Raspberry Pi o su un portatile di riserva, e fai clic una volta per attivare l’audio.",
        note: "Per sentirlo, fai clic su **Send a test celebration** nelle impostazioni dello schermo: ogni copia aperta dello schermo riproduce una vendita di prova.",
      },
    },
    permissions: {
      title: "Quali permessi, e perché",
      lead: "Sette permessi in lettura e un permesso facoltativo in scrittura. Tutto il resto resta su Nessuno.",
      columns: { permission: "Permesso", access: "Accesso", why: "Perché" },
      access: { read: "Lettura", write: "Scrittura" },
      optional: "Facoltativo",
      why: {
        subscriptions: "MRR, upgrade e disdette",
        customers: "Nuovi clienti, con nome e paese",
        charges: "Ricavi, e un festeggiamento per ogni pagamento",
        events: "Cosa è cambiato dall’ultimo controllo",
        products: "Nomi dei piani",
        prices: "Importi dei prezzi a scaglioni",
        coupons: "Sconti, che riducono l’MRR",
        webhooks: "Aggiornamenti istantanei: SaaS Monitor aggiunge un proprio webhook",
      },
      callout: {
        title: "In sola lettura, per scelta",
        text: "A parte aggiungere un proprio webhook, se lo consenti, la chiave può solo leggere: niente addebiti, niente rimborsi, nessuna modifica ai tuoi clienti. È cifrata a riposo, non viene mai più mostrata e puoi revocarla in Stripe in qualsiasi momento.",
      },
      webhook:
        "Con il permesso facoltativo **Webhook Endpoints**, ogni vendita arriva sulla parete in pochi secondi. [Come funzionano gli aggiornamenti](doc-numbers)",
    },
    test: {
      title: "Provalo con dati di test",
      text: "Non sei pronto a collegare il tuo account live? Crea invece una chiave in modalità di test (`rk_test_…`) da una sandbox di Stripe. La modalità di test e la modalità live dello stesso account possono essere collegate fianco a fianco.",
    },
    next: {
      title: "E adesso?",
      text: "Il tuo schermo funziona così com’è. Quando hai un minuto:",
    },
  },
  wallDisplay: {
    summary:
      "Qualsiasi browser, una smart TV o un Raspberry Pi: cosa mostra lo schermo e come funziona da solo per mesi.",
    meta: {
      title: "La tua dashboard Stripe su una TV o un Raspberry Pi",
      description:
        "Apri il link dello schermo in qualsiasi browser, su smart TV o Raspberry Pi in modalità kiosk. Resta acceso, si riprende da solo, festeggia ogni vendita.",
    },
    title: "Appendilo alla parete",
    lead: "Uno schermo è una pagina web fatta per restare a schermo intero, senza supervisione, per mesi. Qualsiasi dispositivo con un browser moderno può mostrarlo: nessuna app da installare, nessun accesso.",
    devices: {
      title: "Scegli un dispositivo",
      lead: "Lo schermo si adatta a qualsiasi dimensione, da un monitor 720p a una TV 4K, in orizzontale o in verticale.",
      recommended: "Consigliato",
      raspberryPi: {
        title: "Raspberry Pi",
        text: "Un Raspberry Pi 4 o 5 dietro la TV, configurato una volta sola con un unico blocco di comandi. A ogni avvio apre il tuo schermo SaaS Monitor a schermo intero, con l’audio: niente tastiera, niente mouse, nessun clic.",
      },
      smartTv: {
        title: "Smart TV",
        text: "Apri il link nel browser della TV e fai clic una volta con il telecomando per l’audio. Alcuni browser delle TV sono lenti: con un Raspberry Pi è tutto più fluido.",
      },
      computer: {
        title: "Portatile, mini PC o Mac",
        text: "Apri il link in Chrome, premi **F** per lo schermo intero e fai clic una volta per l’audio. Disattiva la sospensione nelle impostazioni di sistema.",
      },
      tablet: {
        title: "Tablet",
        text: "Aggiungi il link alla schermata Home, poi tienilo in primo piano con Accesso Guidato su iPad o con il blocco app sullo schermo su Android.",
      },
      phone: {
        title: "Il tuo telefono",
        text: "Nell’app SaaS Monitor, gira il telefono in orizzontale per la modalità TV: tutto lo schermo, come sulla parete. [Scopri le app](doc-apps)",
      },
      raspberryPiNote:
        "La dashboard ti fornisce il comando per Raspberry Pi con il tuo link già inserito, sotto **Set up a TV or Raspberry Pi**.",
    },
    link: {
      title: "Il link del tuo schermo",
      text: "Ogni schermo ha un proprio link impossibile da indovinare: lo trovi sotto **Screen link** nelle impostazioni dello schermo. Si apre senza accesso, quindi trattalo come una password. **Regenerate link** revoca quello vecchio con un clic.",
      password: {
        title: "Aggiungi una password",
        text: "Per maggiore sicurezza, usa **Set a password**: ogni dispositivo la chiede una volta, poi la ricorda. Se la cambi, tutti i dispositivi perdono di nuovo l’accesso. I membri del tuo spazio di lavoro che hanno effettuato l’accesso non ne hanno mai bisogno.",
      },
      phone: {
        title: "Aprilo sul telefono",
        text: "Sotto **Open on your phone**, scansiona il codice QR con l’app SaaS Monitor per seguire lo schermo sul telefono, con i suoi widget e le sue notifiche.",
      },
    },
    shows: {
      title: "Cosa mostra lo schermo",
      items: [
        "Il tuo MRR, o l’ARR, a caratteri grandi, con la crescita a 30 giorni",
        "La strada verso il prossimo traguardo o il tuo obiettivo, e il giorno in cui lo raggiungerai al ritmo attuale",
        "Un grafico su 30 giorni, 90 giorni, 12 mesi o dall’inizio",
        "I ricavi di oggi e del mese, i clienti e il nuovo MRR netto",
        "Un feed in diretta di pagamenti, nuovi clienti, upgrade e disdette",
      ],
    },
    moments: {
      title: "Momenti e festeggiamenti",
      text: "Ogni vendita, nuovo cliente o modifica di abbonamento ha diritto a una grande scheda al centro dello schermo, con il suo suono e poi, se vuoi, una voce. Quando entrano soldi partono i coriandoli, e ogni traguardo occupa tutto lo schermo.",
      detail:
        "Di default le schede restano 10 secondi. Quando ne arrivano diverse insieme, si susseguono una dopo l’altra.",
      imageAlt:
        "Il pagamento di 199 $ di un nuovo cliente in una scheda al centro dello schermo, con i coriandoli",
      tip: {
        title: "Provalo dalla tua scrivania",
        text: "Fai clic su **Send a test celebration** nelle impostazioni dello schermo: ogni copia aperta dello schermo riproduce una vendita di prova entro pochi secondi.",
      },
    },
    unattended: {
      title: "Fatto per funzionare da solo",
      items: [
        "Si aggiorna ogni pochi secondi e si ripristina da solo dopo un’interruzione di rete",
        "Tiene acceso lo schermo e nasconde il cursore del mouse",
        "Sposta di tanto in tanto il contenuto di qualche pixel, per proteggere i pannelli OLED",
        "Si ricarica da solo dopo un aggiornamento, così non esegue mai una versione vecchia",
      ],
    },
    sound: {
      title: "L’audio su una TV",
      text: "I browser tengono una pagina in silenzio finché qualcuno non interagisce con essa: fai clic una volta sullo schermo e l’audio resta attivo fino al prossimo ricaricamento. Su un Raspberry Pi, il comando kiosk gli permette di suonare senza clic.",
    },
  },
  customize: {
    summary: "MRR o ARR, il tuo obiettivo, colori, lingue, suoni e voci: rendi tuo ogni schermo.",
    meta: {
      title: "Personalizza lo schermo: obiettivo, tema, suoni e voci",
      description:
        "Scegli MRR o ARR, imposta un obiettivo, scegli tema, colore e lingua, i suoni e la voce, e cosa fa ogni evento Stripe. Con un’anteprima in diretta.",
    },
    title: "Rendilo tuo",
    lead: "Ogni schermo ha le sue impostazioni, con un’anteprima in diretta proprio accanto. Ogni modifica viene salvata man mano.",
    editorAlt:
      "L’editor dello schermo: le impostazioni a sinistra, l’anteprima in diretta e il pannello di condivisione a destra",
    numbers: {
      title: "I tuoi numeri",
      metric: {
        title: "MRR o ARR",
        text: "Mostra l’MRR, o l’ARR se è così che conti: il numero principale, il grafico, l’obiettivo e i traguardi si adeguano. Pagamenti e ricavi restano quello che i clienti hanno pagato.",
      },
      goal: {
        title: "Traguardi o il tuo obiettivo",
        text: "I traguardi automatici festeggiano ogni cifra tonda lungo la salita, da 100 $ a 1.000 $, 10.000 $ e oltre. Oppure imposta un obiettivo tutto tuo.",
      },
      chart: {
        title: "Periodo del grafico",
        text: "Gli ultimi 30 giorni, 90 giorni, 12 mesi, o dall’inizio.",
      },
      currency: {
        title: "Valuta e fuso orario",
        text: "Ogni importo viene convertito nella valuta dello schermo. Il suo fuso orario decide quando iniziano «oggi» e «questo mese».",
      },
    },
    look: {
      title: "Tema e colore",
      text: "Scuro, o chiaro per le stanze luminose. Scegli uno dei cinque colori d’accento, o incolla il colore del tuo brand in esadecimale: se serve, lo schermo lo adatta perché resti leggibile.",
      custom: "Il tuo colore",
      imageAlt: "Uno schermo chiaro in tedesco, in un arancione personalizzato",
    },
    language: {
      title: "Sette lingue",
      text: "Uno schermo parla inglese, francese, tedesco, spagnolo, italiano, portoghese o olandese, e scrive numeri e date secondo le convenzioni locali. La dashboard invece resta in inglese.",
    },
    sound: {
      title: "Suoni e voci",
      packs:
        "Tre pacchetti di suoni, sintetizzati direttamente nel browser, con cinque suoni ciascuno, da un pagamento a un traguardo. [Ascoltali tutti](sounds)",
      voice:
        "Dopo il suono, una voce può dire cosa è successo: due voci per lingua, in inglese, francese, tedesco, spagnolo e portoghese. Suono e voce hanno ciascuno il proprio interruttore e il proprio volume.",
      own: "**Le tue frasi**: con una chiave API Gradium sul server, la voce dice quello che scrivi tu, con il nome del cliente, l’importo o il piano.",
    },
    events: {
      title: "Cosa fa ogni evento",
      text: "Per ogni tipo di evento, cinque interruttori: elencarlo nel feed, mostrarlo in una scheda, riprodurne il suono, annunciarlo ad alta voce e inviare una notifica ai telefoni che seguono lo schermo.",
      event: "Evento",
      columns: { feed: "Feed", moment: "Scheda", sound: "Suono", voice: "Voce", push: "Telefono" },
      names: {
        payment: "Pagamento",
        connectPayment: "Pagamento per un account Connect",
        subscription: "Nuovo abbonato",
        upgrade: "Upgrade",
        reactivation: "Riattivazione",
        downgrade: "Downgrade",
        cancellation: "Disdetta",
        unpaid: "Pagamento non riuscito",
        customer: "Nuovo cliente",
        milestone: "Traguardo",
      },
      on: "Sì",
      off: "No",
      caption:
        "Le impostazioni predefinite. Le perdite non vengono annunciate ad alta voce e i telefoni ricevono solo le buone notizie. Le voci parlano solo dopo che le hai attivate.",
    },
    accounts: {
      title: "Più account Stripe",
      text: "Uno schermo può mostrare più account Stripe, convertiti nella sua valuta, in due modi.",
      added: {
        title: "Sommati",
        text: "Un unico totale per tutti gli account. Il feed indica l’account di ogni elemento.",
      },
      rotation: {
        title: "Uno alla volta",
        text: "Ogni account ha il suo turno con i propri numeri, e anche il loro totale se vuoi. Quando succede qualcosa, lo schermo mostra subito il suo account.",
      },
      imageAlt:
        "Due prodotti su un unico schermo: un nuovo abbonato di Acme Analytics, indicato nel momento e nella rotazione in alto",
      more: "Oppure crea uno schermo per ogni prodotto, e uno silenzioso, senza audio, per la sala riunioni: tutti quelli che vuoi, ognuno con il proprio link e le proprie impostazioni.",
    },
    names: {
      title: "Nomi dei clienti",
      text: "Nascosti di default: chiunque veda lo schermo vedrebbe chi ti paga. Mostrali, se vuoi. I clienti che Stripe conosce solo per email possono allora essere indicati con la loro email, mascherata (`j•••@gmail.com`) o per intero, oppure non essere indicati affatto. Le voci non leggono mai le email.",
    },
  },
  apps: {
    summary:
      "I tuoi schermi su iPhone, iPad, Apple Watch, Android e Wear OS, con una notifica per ogni vendita.",
    meta: {
      title: "L’app: il tuo MRR Stripe su iPhone, Android e Apple Watch",
      description:
        "Segui qualsiasi schermo su iPhone, iPad, Apple Watch, Android e Wear OS: una notifica per ogni vendita, widget, complicazioni, numeri da condividere.",
    },
    title: "Il tuo MRR in tasca",
    lead: "L’app SaaS Monitor apre qualsiasi schermo con il suo link o il suo codice QR, su saas-monitor.com o sul tuo server. Nessun account, nessun tracciamento.",
    add: {
      title: "Aggiungi uno schermo",
      steps: [
        "Nelle impostazioni dello schermo, trova **Open on your phone**.",
        "Scansiona il suo codice QR con l’app, o incolla il link dello schermo.",
        "Se lo schermo ha una password, digitala una volta su ogni telefono.",
      ],
    },
    notifications: {
      title: "Una notifica per ogni vendita",
      text: "Pagamenti, nuovi abbonati, upgrade, riattivazioni, nuovi clienti e traguardi, nella lingua e nella valuta dello schermo. Un’ondata di attività arriva come un’unica notifica che la riassume.",
      choose:
        "Scegli quali eventi inviano una notifica nella sezione **Events** dello schermo, sotto **Phone**. Su ogni telefono puoi disattivare le notifiche di uno schermo o silenziare alcuni dei suoi eventi.",
      sound:
        "Su iPhone, una notifica può suonare con il suono e la voce dello schermo stesso, anche a telefono bloccato: attiva **Play sounds and voices** nelle impostazioni dell’app.",
      speed:
        "Le notifiche partono non appena SaaS Monitor riceve notizie da Stripe: in pochi secondi con gli [aggiornamenti istantanei](doc-numbers).",
      now: "ora",
    },
    widgets: {
      title: "Widget e orologi",
      text: "Su iPhone, widget per la schermata Home, la schermata di blocco e StandBy, anche in CarPlay. Su Android, widget per la schermata Home. Le app per Apple Watch e Wear OS, con complicazioni, tengono il tuo MRR sul quadrante dell’orologio.",
      wearAlt:
        "L’app per Wear OS: l’MRR con la crescita a 30 giorni, il grafico e l’avanzamento verso l’obiettivo",
    },
    tv: {
      title: "Modalità TV",
      text: "Gira il telefono in orizzontale su uno schermo per la modalità TV: tutto in una volta, come sulla parete, e il telefono resta acceso. Con **Play sounds and voices** attivo, riproduce anche il suono e la voce di ogni momento.",
    },
    share: {
      title: "Condividi qualsiasi numero",
      text: "Tieni premuto un numero per condividerlo come un’immagine pulita, firmata «Powered by SaaS Monitor». Perfetta per il post sul tuo prossimo traguardo.",
      imageAlt: "Un pagamento di 79 $ condiviso come immagine, firmata Powered by SaaS Monitor",
    },
    privacy: {
      title: "Nessun account, nessun tracciamento",
      text: "Il link di uno schermo è tutto ciò che serve all’app. Non contiene analytics, pubblicità né tracciamento, conserva i tuoi schermi nell’archivio sicuro del dispositivo e comunica solo con il server di ogni schermo e con i servizi che recapitano le notifiche. I clienti vengono nominati solo sugli schermi che mostrano i nomi. [Informativa sulla privacy](privacy)",
    },
  },
  numbers: {
    summary:
      "L’MRR come lo definisce Stripe, così la parete corrisponde alla tua Stripe Dashboard. ARR, ricavi, valute e aggiornamenti.",
    meta: {
      title: "Come si calcolano MRR, ARR e ricavi da Stripe",
      description:
        "L’MRR come lo definisce Stripe: la parete coincide con la tua dashboard Stripe. Come funzionano ARR, ricavi, valute, aggiornamenti istantanei e storico.",
    },
    title: "Numeri di cui fidarti",
    lead: "SaaS Monitor calcola l’MRR come lo definisce Stripe, così il numero sulla parete resta vicino a quello della tua Stripe Dashboard. Ecco come, nel dettaglio.",
    mrr: {
      title: "L’MRR, come lo definisce Stripe",
      items: [
        "Contano solo gli abbonamenti attivi e quelli con pagamento in ritardo: i periodi di prova e gli abbonamenti annullati, non pagati, in pausa o incompleti no.",
        "Ogni prezzo viene riportato al mese: un prezzo annuale conta per un dodicesimo.",
        "Quantità, scaglioni e prezzi a volume contano come li fattura Stripe.",
        "Gli sconti vengono sottratti: quelli permanenti, e quelli ricorrenti finché non scadono. Quelli una tantum no.",
        "Un abbonamento impostato per annullarsi alla fine del periodo smette di contare non appena viene richiesta la disdetta.",
        "L’utilizzo a consumo e i prezzi una tantum sono esclusi, e le imposte non vengono aggiunte.",
      ],
    },
    movements: {
      title: "Ogni variazione, registrata",
      text: "Ogni variazione dell’MRR viene registrata nel momento in cui avviene, e il nuovo MRR netto somma le variazioni del mese. Un abbonamento perso dice perché: annullato, non si rinnova, pagamento non riuscito o in pausa.",
      kinds: {
        new: { name: "Nuovo", text: "inizia a pagare" },
        expansion: { name: "Espansione", text: "paga di più" },
        contraction: { name: "Contrazione", text: "paga di meno" },
        churn: { name: "Churn", text: "smette di contare" },
        reactivation: { name: "Riattivazione", text: "torna a pagare" },
      },
    },
    arr: {
      title: "ARR",
      text: "L’ARR è dodici volte l’MRR. Uno schermo può mostrarlo come metrica principale: il numero principale, il grafico, l’obiettivo e i traguardi sono allora in ARR, mentre pagamenti e ricavi restano quello che i clienti hanno pagato.",
    },
    revenue: {
      title: "Ricavi di oggi e del mese",
      text: "I ricavi sono ciò che i clienti hanno pagato, al netto dei rimborsi: oggi, questo mese e, per confronto, gli stessi giorni del mese scorso. Giorni e mesi seguono il fuso orario dello schermo.",
      connect:
        "Su una piattaforma Stripe Connect, i pagamenti effettuati per gli account collegati compaiono nel feed, e solo la commissione che trattieni conta come tuo ricavo.",
    },
    currencies: {
      title: "Più valute",
      text: "Ogni importo viene convertito nella valuta dello schermo al tasso del giorno della Banca centrale europea, aggiornato ogni 12 ore. Anche i valori passati: il grafico mostra la crescita della tua attività, non l’andamento dei tassi di cambio.",
    },
    updates: {
      title: "Aggiornamenti istantanei",
      text: "Con un webhook, Stripe avvisa SaaS Monitor nel momento in cui succede qualcosa. Senza, SaaS Monitor controlla Stripe a un ritmo che rispetta la quota di letture concessa da Stripe.",
      webhook: { label: "Con un webhook", value: "In pochi secondi" },
      polling: {
        label: "Senza webhook",
        value:
          "Circa ogni 17 minuti per gli account piccoli, fino a una volta al minuto per quelli molto attivi",
      },
      daily:
        "Un controllo giornaliero confronta inoltre ogni abbonamento con Stripe, per le poche modifiche che Stripe fa senza un evento, come un coupon che scade.",
    },
    history: {
      title: "Il tuo storico",
      text: "Quando ti colleghi, SaaS Monitor importa i tuoi abbonamenti, i pagamenti degli ultimi 12 mesi e i clienti degli ultimi 7 giorni. Stripe non conserva lo storico delle modifiche passate agli abbonamenti, quindi il grafico prima di quel giorno viene ricostruito a partire dall’inizio, dalla fine e dall’importo attuale di ogni abbonamento. Da lì in poi, ogni variazione viene registrata nel momento in cui avviene.",
    },
    limits: {
      title: "Differenze note",
      text: "I pochi casi in cui la parete e Stripe possono differire sono documentati:",
      items: [
        "I prezzi con imposte incluse contano al lordo delle imposte.",
        "Un coupon eliminato prima della tua prima importazione conta sull’intero abbonamento.",
        "Gli upgrade e i downgrade fatti prima della tua prima importazione non compaiono nel grafico.",
      ],
    },
  },
  security: {
    summary:
      "Una chiave in sola lettura, cifrata a riposo. Nomi nascosti di default. Open source, così chiunque può verificare.",
    meta: {
      title: "Sicurezza: chiave Stripe in sola lettura, cifrata a riposo",
      description:
        "Chiave Stripe con restrizioni in sola lettura, cifrata con AES-256-GCM. Niente pubblicità né tracciamento, nomi nascosti di default, open source.",
    },
    title: "Sicuro da collegare",
    lead: "SaaS Monitor legge solo ciò che serve ai tuoi schermi, tiene cifrata la tua chiave e non mostra nulla che tu non abbia scelto. È open source, quindi non devi crederci sulla parola.",
    facts: [
      { value: "Sola lettura", label: "chiave Stripe con restrizioni" },
      { value: "AES-256-GCM", label: "cifratura a riposo" },
      { value: "MIT", label: "open source, verificabile da chiunque" },
    ],
    key: {
      title: "Una chiave che può solo leggere",
      text: "Colleghi Stripe con una chiave con restrizioni, creata nella tua Stripe Dashboard con i soli permessi di cui SaaS Monitor ha bisogno: non ti chiede mai la tua chiave segreta. L’unico permesso facoltativo in scrittura gli consente di aggiungere un proprio webhook, per gli aggiornamenti istantanei. Puoi revocare la chiave in Stripe in qualsiasi momento. [Vedi tutti i permessi](permissions)",
    },
    encryption: {
      title: "Cifrata, e mai più mostrata",
      text: "Le chiavi sono cifrate a riposo con AES-256-GCM e non lasciano mai il server: la dashboard ne mostra solo un’anteprima mascherata. I webhook di Stripe vengono verificati con il loro segreto di firma.",
    },
    data: {
      title: "Cosa viene conservato",
      text: "La tua chiave Stripe, cifrata, e una copia di ciò che serve ai tuoi schermi: gli abbonamenti e le variazioni del loro MRR, i pagamenti e i nuovi clienti, con nome, email e paese. Nessun dato di carte o conti bancari.",
      delete:
        "Scollega un account Stripe e tutto ciò che è stato importato da quell’account viene eliminato subito.",
    },
    screens: {
      title: "Gli schermi mostrano solo ciò che scegli tu",
      items: [
        "I nomi e le email dei clienti restano fuori dai tuoi schermi, e dalle loro notifiche, a meno che tu non li attivi.",
        "Il link di uno schermo è impossibile da indovinare, e **Regenerate link** revoca quello vecchio.",
        "Aggiungi una password, e ogni dispositivo dovrà digitarla una volta.",
      ],
    },
    tracking: {
      title: "Niente pubblicità, niente tracciamento",
      text: "Il sito non usa analytics e non carica script di terze parti finché non apri l’aiuto. Nessun cookie pubblicitario o di tracciamento, e i tuoi dati non vengono mai venduti. Anche l’app non ha account né tracciamento. [Informativa sulla privacy](privacy)",
    },
    others: {
      title: "Chi altro vede cosa",
      text: "Solo ciò che attivi: le frasi vocali personalizzate vengono inviate a Gradium per essere pronunciate, e le notifiche ai telefoni passano dai servizi push che le recapitano.",
    },
    openSource: {
      title: "Open source, così chiunque può verificare",
      text: "Ogni riga di SaaS Monitor è su GitHub con licenza MIT: leggi come viene conservata la tua chiave, o eseguilo sul tuo server, dove restano i tuoi dati Stripe.",
      report: "Hai trovato una vulnerabilità? Segnalala in privato",
    },
  },
  selfHosting: {
    summary:
      "Due comandi con Docker, su qualsiasi server o su un Raspberry Pi. Gratis per sempre, con licenza MIT.",
    meta: {
      title: "Self-hosting di SaaS Monitor con Docker in due comandi",
      description:
        "Esegui SaaS Monitor sul tuo server o su un Raspberry Pi con Docker Compose: due comandi, gratis per sempre con licenza MIT. HTTPS, aggiornamenti, backup.",
    },
    title: "Eseguilo sul tuo server",
    lead: "SaaS Monitor è un server Next.js con un database MySQL. Con Docker funziona su qualsiasi server, un computer di riserva o un Raspberry Pi, con tutte le funzionalità, gratis per sempre.",
    install: {
      title: "Installalo in due comandi",
      requirements:
        "Ti serve Docker con Compose, su un server, un computer di riserva o un Raspberry Pi con un sistema operativo a 64 bit.",
      script:
        "Lo [script](install-script) crea una cartella `saas-monitor` con un file Compose e un `.env` con segreti nuovi, poi si ferma: non richiede root, non avvia nulla e non tocca nient’altro.",
      then: "Apri `http://localhost:3000`, crea il tuo account e collega Stripe. Le migrazioni del database partono da sole.",
    },
    tv: {
      title: "Aprilo dalla TV",
      text: "In `.env`, imposta `APP_URL` sull’indirizzo che userà la TV, ad esempio `http://192.168.1.20:3000`, ed esegui di nuovo `docker compose up -d`: i link degli schermi vengono costruiti a partire da lì.",
      callout: {
        title: "Custodisci ENCRYPTION_KEY",
        text: "Cifra le chiavi Stripe nel tuo database. Non cambiarla mai: senza di essa, ogni account Stripe va collegato di nuovo.",
      },
    },
    https: {
      title: "HTTPS per gli aggiornamenti istantanei",
      text: "Una rete locale basta per una TV nello stesso ufficio. Metti SaaS Monitor dietro HTTPS con un dominio per aprire gli schermi da ovunque e ricevere aggiornamenti istantanei: Stripe invia i webhook solo a un indirizzo HTTPS pubblico. Va bene qualsiasi reverse proxy, come Caddy.",
      without:
        "Senza, SaaS Monitor controlla Stripe a ritmo costante, circa ogni 17 minuti per gli account piccoli.",
    },
    updates: {
      title: "Aggiornamenti",
      text: "Scarica la nuova immagine e riavvia: gli schermi aperti si accorgono della nuova versione e si ricaricano da soli. Per aggiornare quando decidi tu, fissa una release con `SAAS_MONITOR_VERSION`.",
    },
    data: {
      title: "Cosa resta sul tuo server",
      text: "Tutto: la tua chiave Stripe, i tuoi dati e le tue impostazioni stanno nel tuo database MySQL, e basta un comando per farne il backup. Due funzionalità facoltative comunicano con l’esterno: le frasi vocali personalizzate vengono inviate a Gradium per essere pronunciate, e le notifiche ai telefoni passano dal servizio push di Expo.",
      signups:
        "Quando il tuo team si è registrato, imposta `DISABLE_SIGNUPS=true`: nessun altro può creare un account, e gli inviti continuano a funzionare.",
    },
    cta: {
      title: "Due comandi, ed è tuo",
      text: "Tutte le funzionalità, gratis per sempre. La guida completa copre configurazione, HTTPS, aggiornamenti, backup e compilazione dal sorgente.",
      guide: "Guida completa al self-hosting su GitHub",
    },
  },
};
