package com.saasmonitor.core.display

import java.util.Locale

/** Languages a screen speaks (`settings.language`); numbers and dates follow their conventions. */
enum class Language(val code: String, localeTag: String) {
  EN("en", "en-US"),
  FR("fr", "fr-FR"),
  DE("de", "de-DE"),
  ES("es", "es-ES"),
  IT("it", "it-IT"),
  PT("pt", "pt-BR"),
  NL("nl", "nl-NL");

  /** The locale of the screen's numbers and dates, as the web display's `Intl` uses it. */
  val locale: Locale = Locale.forLanguageTag(localeTag)

  val text: DisplayText
    get() = DisplayTexts.of(this)
}

/**
 * The words of a screen that widgets and watches use: a subset of the web display's
 * (`src/lib/display/i18n` of the web app), in every language it speaks. Templates take
 * `{placeholders}`.
 */
class DisplayText(
  val mrrName: String,
  val arrName: String,
  val inThirtyDays: String,
  val goal: String,
  val nextMilestone: String,
  private val toGo: String,
  private val atThisPace: String,
  val today: String,
  val tomorrow: String,
  val revenueToday: String,
  val feedTitle: String,
  val feedEmpty: String,
  val payment: String,
  val customer: String,
  val newSubscription: String,
  val expansion: String,
  val reactivation: String,
  val contraction: String,
  val churn: String,
  val wontRenew: String,
  val paymentFailed: String,
  val paused: String,
  val connectPayment: String,
  val justNow: String,
  private val minutesAgo: String,
  private val hoursAgo: String,
  val yesterday: String,
  val importing: String,
  val failing: String,
  val empty: String,
  val gone: String,
  val locked: String,
) {
  /** "$2,520 to go". */
  fun toGo(amount: String) = toGo.replace("{amount}", amount)

  /** "at this pace: Feb 2027". */
  fun atThisPace(time: String) = atThisPace.replace("{when}", time)

  fun minutesAgo(minutes: Int) = minutesAgo.replace("{minutes}", minutes.toString())

  fun hoursAgo(hours: Int) = hoursAgo.replace("{hours}", hours.toString())
}

/** Generated from the web app's `src/lib/display/i18n` files: update both together. */
internal object DisplayTexts {
  fun of(language: Language): DisplayText =
    when (language) {
      Language.EN -> en
      Language.FR -> fr
      Language.DE -> de
      Language.ES -> es
      Language.IT -> it
      Language.PT -> pt
      Language.NL -> nl
    }

  private val en =
    DisplayText(
      mrrName = "Monthly recurring revenue",
      arrName = "Annual recurring revenue",
      inThirtyDays = "in 30 days",
      goal = "Goal",
      nextMilestone = "Next milestone",
      toGo = "{amount} to go",
      atThisPace = "at this pace: {when}",
      today = "today",
      tomorrow = "tomorrow",
      revenueToday = "Revenue today",
      feedTitle = "Latest activity",
      feedEmpty =
        "New customers, payments and subscriptions will appear here the moment they happen.",
      payment = "Payment",
      customer = "New customer",
      newSubscription = "New subscription",
      expansion = "Upgrade",
      reactivation = "Reactivation",
      contraction = "Downgrade",
      churn = "Cancellation",
      wontRenew = "Won’t renew",
      paymentFailed = "Payment failed",
      paused = "Paused",
      connectPayment = "Connect",
      justNow = "just now",
      minutesAgo = "{minutes} min ago",
      hoursAgo = "{hours} h ago",
      yesterday = "yesterday",
      importing = "Importing your Stripe history…",
      failing = "Stripe data can’t be loaded right now",
      empty = "Connect Stripe to bring this screen to life",
      gone = "This screen link no longer works",
      locked = "This screen is protected",
    )

  private val fr =
    DisplayText(
      mrrName = "Revenu mensuel récurrent",
      arrName = "Revenu annuel récurrent",
      inThirtyDays = "en 30 jours",
      goal = "Objectif",
      nextMilestone = "Prochain palier",
      toGo = "encore {amount}",
      atThisPace = "à ce rythme\u00a0: {when}",
      today = "aujourd’hui",
      tomorrow = "demain",
      revenueToday = "Revenu du jour",
      feedTitle = "Activité récente",
      feedEmpty =
        "Nouveaux clients, paiements et abonnements s’afficheront ici dès qu’ils arrivent.",
      payment = "Paiement",
      customer = "Nouveau client",
      newSubscription = "Nouvel abonnement",
      expansion = "Montée en gamme",
      reactivation = "Réactivation",
      contraction = "Descente en gamme",
      churn = "Résiliation",
      wontRenew = "Non renouvelé",
      paymentFailed = "Paiement échoué",
      paused = "En pause",
      connectPayment = "Connect",
      justNow = "à l’instant",
      minutesAgo = "il y a {minutes} min",
      hoursAgo = "il y a {hours} h",
      yesterday = "hier",
      importing = "Import de votre historique Stripe…",
      failing = "Les données Stripe sont indisponibles pour le moment",
      empty = "Connectez Stripe pour donner vie à cet écran",
      gone = "Ce lien d’écran ne fonctionne plus",
      locked = "Cet écran est protégé",
    )

  private val de =
    DisplayText(
      mrrName = "Monatlich wiederkehrender Umsatz",
      arrName = "Jährlich wiederkehrender Umsatz",
      inThirtyDays = "in 30 Tagen",
      goal = "Ziel",
      nextMilestone = "Nächster Meilenstein",
      toGo = "noch {amount}",
      atThisPace = "bei diesem Tempo: {when}",
      today = "heute",
      tomorrow = "morgen",
      revenueToday = "Umsatz heute",
      feedTitle = "Letzte Aktivität",
      feedEmpty = "Neue Kunden, Zahlungen und Abos erscheinen hier, sobald sie passieren.",
      payment = "Zahlung",
      customer = "Neuer Kunde",
      newSubscription = "Neues Abo",
      expansion = "Upgrade",
      reactivation = "Reaktivierung",
      contraction = "Downgrade",
      churn = "Kündigung",
      wontRenew = "Wird nicht verlängert",
      paymentFailed = "Zahlung fehlgeschlagen",
      paused = "Pausiert",
      connectPayment = "Connect",
      justNow = "gerade eben",
      minutesAgo = "vor {minutes} Min.",
      hoursAgo = "vor {hours} Std.",
      yesterday = "gestern",
      importing = "Dein Stripe-Verlauf wird importiert…",
      failing = "Stripe-Daten können gerade nicht geladen werden",
      empty = "Verbinde Stripe, um diesen Bildschirm zum Leben zu erwecken",
      gone = "Dieser Bildschirm-Link funktioniert nicht mehr",
      locked = "Dieser Bildschirm ist geschützt",
    )

  private val es =
    DisplayText(
      mrrName = "Ingresos recurrentes mensuales",
      arrName = "Ingresos recurrentes anuales",
      inThirtyDays = "en 30 días",
      goal = "Objetivo",
      nextMilestone = "Próximo hito",
      toGo = "faltan {amount}",
      atThisPace = "a este ritmo: {when}",
      today = "hoy",
      tomorrow = "mañana",
      revenueToday = "Ingresos de hoy",
      feedTitle = "Actividad reciente",
      feedEmpty = "Los nuevos clientes, pagos y suscripciones aparecerán aquí en cuanto ocurran.",
      payment = "Pago",
      customer = "Nuevo cliente",
      newSubscription = "Nueva suscripción",
      expansion = "Mejora de plan",
      reactivation = "Reactivación",
      contraction = "Bajada de plan",
      churn = "Cancelación",
      wontRenew = "No se renovará",
      paymentFailed = "Pago fallido",
      paused = "En pausa",
      connectPayment = "Connect",
      justNow = "ahora mismo",
      minutesAgo = "hace {minutes} min",
      hoursAgo = "hace {hours} h",
      yesterday = "ayer",
      importing = "Importando tu historial de Stripe…",
      failing = "Ahora mismo no se pueden cargar los datos de Stripe",
      empty = "Conecta Stripe para dar vida a esta pantalla",
      gone = "Este enlace de pantalla ya no funciona",
      locked = "Esta pantalla está protegida",
    )

  private val it =
    DisplayText(
      mrrName = "Ricavi ricorrenti mensili",
      arrName = "Ricavi ricorrenti annuali",
      inThirtyDays = "in 30 giorni",
      goal = "Obiettivo",
      nextMilestone = "Prossimo traguardo",
      toGo = "mancano {amount}",
      atThisPace = "a questo ritmo: {when}",
      today = "oggi",
      tomorrow = "domani",
      revenueToday = "Ricavi di oggi",
      feedTitle = "Attività recenti",
      feedEmpty = "Nuovi clienti, pagamenti e abbonamenti appariranno qui non appena arrivano.",
      payment = "Pagamento",
      customer = "Nuovo cliente",
      newSubscription = "Nuovo abbonamento",
      expansion = "Upgrade",
      reactivation = "Riattivazione",
      contraction = "Downgrade",
      churn = "Disdetta",
      wontRenew = "Non si rinnova",
      paymentFailed = "Pagamento non riuscito",
      paused = "In pausa",
      connectPayment = "Connect",
      justNow = "proprio ora",
      minutesAgo = "{minutes} min fa",
      hoursAgo = "{hours} h fa",
      yesterday = "ieri",
      importing = "Importazione del tuo storico Stripe…",
      failing = "Al momento non è possibile caricare i dati di Stripe",
      empty = "Collega Stripe per dare vita a questo schermo",
      gone = "Questo link allo schermo non funziona più",
      locked = "Questo schermo è protetto",
    )

  private val pt =
    DisplayText(
      mrrName = "Receita recorrente mensal",
      arrName = "Receita recorrente anual",
      inThirtyDays = "em 30 dias",
      goal = "Meta",
      nextMilestone = "Próximo marco",
      toGo = "faltam {amount}",
      atThisPace = "neste ritmo: {when}",
      today = "hoje",
      tomorrow = "amanhã",
      revenueToday = "Receita de hoje",
      feedTitle = "Atividade recente",
      feedEmpty = "Novos clientes, pagamentos e assinaturas aparecem aqui assim que acontecem.",
      payment = "Pagamento",
      customer = "Novo cliente",
      newSubscription = "Nova assinatura",
      expansion = "Upgrade",
      reactivation = "Reativação",
      contraction = "Downgrade",
      churn = "Cancelamento",
      wontRenew = "Não será renovada",
      paymentFailed = "Falha no pagamento",
      paused = "Pausada",
      connectPayment = "Connect",
      justNow = "agora mesmo",
      minutesAgo = "há {minutes} min",
      hoursAgo = "há {hours} h",
      yesterday = "ontem",
      importing = "Importando seu histórico do Stripe…",
      failing = "Não é possível carregar os dados do Stripe agora",
      empty = "Conecte o Stripe para dar vida a esta tela",
      gone = "Este link de tela não funciona mais",
      locked = "Esta tela está protegida",
    )

  private val nl =
    DisplayText(
      mrrName = "Maandelijks terugkerende omzet",
      arrName = "Jaarlijks terugkerende omzet",
      inThirtyDays = "in 30 dagen",
      goal = "Doel",
      nextMilestone = "Volgende mijlpaal",
      toGo = "nog {amount}",
      atThisPace = "in dit tempo: {when}",
      today = "vandaag",
      tomorrow = "morgen",
      revenueToday = "Omzet vandaag",
      feedTitle = "Recente activiteit",
      feedEmpty =
        "Nieuwe klanten, betalingen en abonnementen verschijnen hier zodra ze binnenkomen.",
      payment = "Betaling",
      customer = "Nieuwe klant",
      newSubscription = "Nieuw abonnement",
      expansion = "Upgrade",
      reactivation = "Heractivering",
      contraction = "Downgrade",
      churn = "Opzegging",
      wontRenew = "Wordt niet verlengd",
      paymentFailed = "Betaling mislukt",
      paused = "Gepauzeerd",
      connectPayment = "Connect",
      justNow = "zojuist",
      minutesAgo = "{minutes} min geleden",
      hoursAgo = "{hours} uur geleden",
      yesterday = "gisteren",
      importing = "Je Stripe-geschiedenis wordt geïmporteerd…",
      failing = "Stripe-gegevens kunnen nu niet worden geladen",
      empty = "Koppel Stripe om dit scherm tot leven te brengen",
      gone = "Deze schermlink werkt niet meer",
      locked = "Dit scherm is beveiligd",
    )
}
