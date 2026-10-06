import Foundation

// The wall's translations (`src/lib/display/i18n`), and those of the few words it doesn't have.

extension DisplayText {
  static let fr = DisplayText(
    live: "En direct",
    inThirtyDays: "en 30 jours",
    thirtyDays: "30j",
    goal: "Objectif",
    nextMilestone: "Prochain palier",
    toGo: { "encore \($0)" },
    atThisPace: { "à ce rythme\u{00A0}: \($0)" },
    today: "aujourd’hui",
    tomorrow: "demain",
    revenueToday: "Revenu du jour",
    yesterdayAmount: { "\($0) hier" },
    thisMonth: "Ce mois-ci",
    versus: { "vs \($0)" },
    versusAmount: { "vs \($0) en \($1)" },
    latestActivity: "Activité récente",
    noActivity: "Aucune activité pour l’instant",
    kinds: Kinds(
      payment: "Paiement",
      customer: "Nouveau client",
      new: "Nouvel abonnement",
      expansion: "Montée en gamme",
      reactivation: "Réactivation",
      contraction: "Descente en gamme",
      churn: "Résiliation"
    ),
    churnReasons: ChurnReasons(scheduled: "Non renouvelé", unpaid: "Paiement échoué", paused: "En pause"),
    connectPayment: "Connect",
    justNow: "à l’instant",
    minutesAgo: { "il y a \($0) min" },
    hoursAgo: { "il y a \($0) h" },
    yesterday: "hier",
    status: Status(
      importing: "Import de votre historique Stripe…",
      failing: "Les données Stripe sont indisponibles pour le moment",
      empty: "Connectez Stripe pour donner vie à cet écran",
      gone: "Ce lien d’écran ne fonctionne plus",
      locked: "Cet écran est protégé",
      offline: "Cet écran ne peut pas être chargé pour le moment"
    )
  )

  static let de = DisplayText(
    live: "Live",
    inThirtyDays: "in 30 Tagen",
    thirtyDays: "30\u{00A0}T.",
    goal: "Ziel",
    nextMilestone: "Nächster Meilenstein",
    toGo: { "noch \($0)" },
    atThisPace: { "bei diesem Tempo: \($0)" },
    today: "heute",
    tomorrow: "morgen",
    revenueToday: "Umsatz heute",
    yesterdayAmount: { "\($0) gestern" },
    thisMonth: "Diesen Monat",
    versus: { "vs. \($0)" },
    versusAmount: { "vs. \($0) im \($1)" },
    latestActivity: "Letzte Aktivität",
    noActivity: "Noch keine Aktivität",
    kinds: Kinds(
      payment: "Zahlung",
      customer: "Neuer Kunde",
      new: "Neues Abo",
      expansion: "Upgrade",
      reactivation: "Reaktivierung",
      contraction: "Downgrade",
      churn: "Kündigung"
    ),
    churnReasons: ChurnReasons(
      scheduled: "Wird nicht verlängert",
      unpaid: "Zahlung fehlgeschlagen",
      paused: "Pausiert"
    ),
    connectPayment: "Connect",
    justNow: "gerade eben",
    minutesAgo: { "vor \($0) Min." },
    hoursAgo: { "vor \($0) Std." },
    yesterday: "gestern",
    status: Status(
      importing: "Dein Stripe-Verlauf wird importiert…",
      failing: "Stripe-Daten können gerade nicht geladen werden",
      empty: "Verbinde Stripe, um diesen Bildschirm zum Leben zu erwecken",
      gone: "Dieser Bildschirm-Link funktioniert nicht mehr",
      locked: "Dieser Bildschirm ist geschützt",
      offline: "Dieser Bildschirm kann gerade nicht geladen werden"
    )
  )

  static let es = DisplayText(
    live: "En directo",
    inThirtyDays: "en 30 días",
    thirtyDays: "30d",
    goal: "Objetivo",
    nextMilestone: "Próximo hito",
    toGo: { "faltan \($0)" },
    atThisPace: { "a este ritmo: \($0)" },
    today: "hoy",
    tomorrow: "mañana",
    revenueToday: "Ingresos de hoy",
    yesterdayAmount: { "\($0) ayer" },
    thisMonth: "Este mes",
    versus: { "vs. \($0)" },
    versusAmount: { "vs. \($0) en \($1)" },
    latestActivity: "Actividad reciente",
    noActivity: "Todavía no hay actividad",
    kinds: Kinds(
      payment: "Pago",
      customer: "Nuevo cliente",
      new: "Nueva suscripción",
      expansion: "Mejora de plan",
      reactivation: "Reactivación",
      contraction: "Bajada de plan",
      churn: "Cancelación"
    ),
    churnReasons: ChurnReasons(scheduled: "No se renovará", unpaid: "Pago fallido", paused: "En pausa"),
    connectPayment: "Connect",
    justNow: "ahora mismo",
    minutesAgo: { "hace \($0) min" },
    hoursAgo: { "hace \($0) h" },
    yesterday: "ayer",
    status: Status(
      importing: "Importando tu historial de Stripe…",
      failing: "Ahora mismo no se pueden cargar los datos de Stripe",
      empty: "Conecta Stripe para dar vida a esta pantalla",
      gone: "Este enlace de pantalla ya no funciona",
      locked: "Esta pantalla está protegida",
      offline: "Esta pantalla no se puede cargar ahora mismo"
    )
  )

  static let it = DisplayText(
    live: "In diretta",
    inThirtyDays: "in 30 giorni",
    thirtyDays: "30gg",
    goal: "Obiettivo",
    nextMilestone: "Prossimo traguardo",
    toGo: { "mancano \($0)" },
    atThisPace: { "a questo ritmo: \($0)" },
    today: "oggi",
    tomorrow: "domani",
    revenueToday: "Ricavi di oggi",
    yesterdayAmount: { "\($0) ieri" },
    thisMonth: "Questo mese",
    versus: { "vs \($0)" },
    versusAmount: { "vs \($0) a \($1)" },
    latestActivity: "Attività recenti",
    noActivity: "Ancora nessuna attività",
    kinds: Kinds(
      payment: "Pagamento",
      customer: "Nuovo cliente",
      new: "Nuovo abbonamento",
      expansion: "Upgrade",
      reactivation: "Riattivazione",
      contraction: "Downgrade",
      churn: "Disdetta"
    ),
    churnReasons: ChurnReasons(
      scheduled: "Non si rinnova",
      unpaid: "Pagamento non riuscito",
      paused: "In pausa"
    ),
    connectPayment: "Connect",
    justNow: "proprio ora",
    minutesAgo: { "\($0) min fa" },
    hoursAgo: { "\($0) h fa" },
    yesterday: "ieri",
    status: Status(
      importing: "Importazione del tuo storico Stripe…",
      failing: "Al momento non è possibile caricare i dati di Stripe",
      empty: "Collega Stripe per dare vita a questo schermo",
      gone: "Questo link allo schermo non funziona più",
      locked: "Questo schermo è protetto",
      offline: "Al momento questo schermo non può essere caricato"
    )
  )

  static let pt = DisplayText(
    live: "Ao vivo",
    inThirtyDays: "em 30 dias",
    thirtyDays: "30d",
    goal: "Meta",
    nextMilestone: "Próximo marco",
    toGo: { "faltam \($0)" },
    atThisPace: { "neste ritmo: \($0)" },
    today: "hoje",
    tomorrow: "amanhã",
    revenueToday: "Receita de hoje",
    yesterdayAmount: { "\($0) ontem" },
    thisMonth: "Este mês",
    versus: { "vs. \($0)" },
    versusAmount: { "vs. \($0) em \($1)" },
    latestActivity: "Atividade recente",
    noActivity: "Nenhuma atividade ainda",
    kinds: Kinds(
      payment: "Pagamento",
      customer: "Novo cliente",
      new: "Nova assinatura",
      expansion: "Upgrade",
      reactivation: "Reativação",
      contraction: "Downgrade",
      churn: "Cancelamento"
    ),
    churnReasons: ChurnReasons(
      scheduled: "Não será renovada",
      unpaid: "Falha no pagamento",
      paused: "Pausada"
    ),
    connectPayment: "Connect",
    justNow: "agora mesmo",
    minutesAgo: { "há \($0) min" },
    hoursAgo: { "há \($0) h" },
    yesterday: "ontem",
    status: Status(
      importing: "Importando seu histórico do Stripe…",
      failing: "Não é possível carregar os dados do Stripe agora",
      empty: "Conecte o Stripe para dar vida a esta tela",
      gone: "Este link de tela não funciona mais",
      locked: "Esta tela está protegida",
      offline: "Esta tela não pode ser carregada agora"
    )
  )

  static let nl = DisplayText(
    live: "Live",
    inThirtyDays: "in 30 dagen",
    thirtyDays: "30d",
    goal: "Doel",
    nextMilestone: "Volgende mijlpaal",
    toGo: { "nog \($0)" },
    atThisPace: { "in dit tempo: \($0)" },
    today: "vandaag",
    tomorrow: "morgen",
    revenueToday: "Omzet vandaag",
    yesterdayAmount: { "\($0) gisteren" },
    thisMonth: "Deze maand",
    versus: { "vs. \($0)" },
    versusAmount: { "vs. \($0) in \($1)" },
    latestActivity: "Recente activiteit",
    noActivity: "Nog geen activiteit",
    kinds: Kinds(
      payment: "Betaling",
      customer: "Nieuwe klant",
      new: "Nieuw abonnement",
      expansion: "Upgrade",
      reactivation: "Heractivering",
      contraction: "Downgrade",
      churn: "Opzegging"
    ),
    churnReasons: ChurnReasons(
      scheduled: "Wordt niet verlengd",
      unpaid: "Betaling mislukt",
      paused: "Gepauzeerd"
    ),
    connectPayment: "Connect",
    justNow: "zojuist",
    minutesAgo: { "\($0) min geleden" },
    hoursAgo: { "\($0) uur geleden" },
    yesterday: "gisteren",
    status: Status(
      importing: "Je Stripe-geschiedenis wordt geïmporteerd…",
      failing: "Stripe-gegevens kunnen nu niet worden geladen",
      empty: "Koppel Stripe om dit scherm tot leven te brengen",
      gone: "Deze schermlink werkt niet meer",
      locked: "Dit scherm is beveiligd",
      offline: "Dit scherm kan nu niet worden geladen"
    )
  )
}
