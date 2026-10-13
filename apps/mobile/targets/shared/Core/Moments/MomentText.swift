import Foundation

/// The words of moments, the wall's (`text.moments` in `src/lib/display/i18n`): keep them in step.
struct MomentText: Sendable {
  let payment: String
  let customer: String
  let new: String
  let expansion: String
  let reactivation: String
  let contraction: String
  let churn: String
  let scheduled: String
  let unpaid: String
  let paused: String
  let endsOn: @Sendable (String) -> String
  let unpaidDetails: String
  let connectPayment: String
  let connectFee: @Sendable (String) -> String
  /// A new customer whose name is hidden and country unknown.
  let someoneNew: String
  let customersToday: @Sendable (Int) -> String
  let catchingUp: String
  let payments: @Sendable (Int) -> String
  let changes: @Sendable (Int) -> String
  let customers: @Sendable (Int) -> String
  let test: String
  let testDetails: String
  let goalReached: String
  let milestoneReached: String
}

extension Language {
  var momentText: MomentText {
    switch self {
    case .en: .en
    case .fr: .fr
    case .de: .de
    case .es: .es
    case .it: .it
    case .pt: .pt
    case .nl: .nl
    }
  }
}

private let nbsp = "\u{00A0}"
private let nnbsp = "\u{202F}"

extension MomentText {
  static let en = MomentText(
    payment: "Payment received", customer: "New customer", new: "New subscriber", expansion: "Upgrade",
    reactivation: "Welcome back", contraction: "Downgrade", churn: "Subscription canceled",
    scheduled: "Won’t renew", unpaid: "Payment failed", paused: "Subscription paused",
    endsOn: { "Ends \($0)" },
    unpaidDetails: "Unpaid after Stripe’s retries",
    connectPayment: "Payment for a connected account",
    connectFee: { "Your fee: \($0)" },
    someoneNew: "Someone new",
    customersToday: { $0 == 1 ? "First new customer today" : "\($0) new customers today" },
    catchingUp: "Catching up",
    payments: { $0 == 1 ? "1 new payment" : "\($0) new payments" },
    changes: { $0 == 1 ? "1 subscription change" : "\($0) subscription changes" },
    customers: { $0 == 1 ? "1 new customer" : "\($0) new customers" },
    test: "Test celebration",
    testDetails: "This is how your next payment will look and sound",
    goalReached: "Goal reached",
    milestoneReached: "Milestone reached"
  )

  static let fr = MomentText(
    payment: "Paiement reçu", customer: "Nouveau client", new: "Nouvel abonné", expansion: "Montée en gamme",
    reactivation: "Bon retour\(nnbsp)!", contraction: "Descente en gamme", churn: "Abonnement résilié",
    scheduled: "Ne sera pas renouvelé", unpaid: "Paiement échoué", paused: "Abonnement en pause",
    endsOn: { "Prend fin le \($0)" },
    unpaidDetails: "Impayé malgré les relances de Stripe",
    connectPayment: "Paiement pour un compte connecté",
    connectFee: { "Votre commission\(nbsp): \($0)" },
    someoneNew: "Quelqu’un de nouveau",
    customersToday: { $0 == 1 ? "Premier nouveau client aujourd’hui" : "\($0) nouveaux clients aujourd’hui" },
    catchingUp: "Entre-temps",
    payments: { $0 == 1 ? "1 nouveau paiement" : "\($0) nouveaux paiements" },
    changes: { $0 == 1 ? "1 changement d’abonnement" : "\($0) changements d’abonnement" },
    customers: { $0 == 1 ? "1 nouveau client" : "\($0) nouveaux clients" },
    test: "Célébration de test",
    testDetails: "Voici à quoi ressemblera votre prochain paiement, à l’écran et au son",
    goalReached: "Objectif atteint",
    milestoneReached: "Palier atteint"
  )

  static let de = MomentText(
    payment: "Zahlung erhalten", customer: "Neuer Kunde", new: "Neuer Abonnent", expansion: "Upgrade",
    reactivation: "Willkommen zurück", contraction: "Downgrade", churn: "Abo gekündigt",
    scheduled: "Wird nicht verlängert", unpaid: "Zahlung fehlgeschlagen", paused: "Abo pausiert",
    endsOn: { "Endet am \($0)" },
    unpaidDetails: "Unbezahlt nach allen Zahlungsversuchen von Stripe",
    connectPayment: "Zahlung für ein verbundenes Konto",
    connectFee: { "Deine Gebühr: \($0)" },
    someoneNew: "Jemand Neues",
    customersToday: { $0 == 1 ? "Erster neuer Kunde heute" : "\($0) neue Kunden heute" },
    catchingUp: "In der Zwischenzeit",
    payments: { $0 == 1 ? "1 neue Zahlung" : "\($0) neue Zahlungen" },
    changes: { $0 == 1 ? "1 Abo-Änderung" : "\($0) Abo-Änderungen" },
    customers: { $0 == 1 ? "1 neuer Kunde" : "\($0) neue Kunden" },
    test: "Test-Feier",
    testDetails: "So sieht und klingt deine nächste Zahlung",
    goalReached: "Ziel erreicht",
    milestoneReached: "Meilenstein erreicht"
  )

  static let es = MomentText(
    payment: "Pago recibido", customer: "Nuevo cliente", new: "Nuevo suscriptor", expansion: "Mejora de plan",
    reactivation: "¡Bienvenido de nuevo!", contraction: "Bajada de plan", churn: "Suscripción cancelada",
    scheduled: "No se renovará", unpaid: "Pago fallido", paused: "Suscripción en pausa",
    endsOn: { "Termina el \($0)" },
    unpaidDetails: "Impagada tras los reintentos de Stripe",
    connectPayment: "Pago para una cuenta conectada",
    connectFee: { "Tu comisión: \($0)" },
    someoneNew: "Alguien nuevo",
    customersToday: { $0 == 1 ? "Primer cliente nuevo de hoy" : "\($0) clientes nuevos hoy" },
    catchingUp: "Mientras tanto",
    payments: { $0 == 1 ? "1 pago nuevo" : "\($0) pagos nuevos" },
    changes: { $0 == 1 ? "1 cambio de suscripción" : "\($0) cambios de suscripción" },
    customers: { $0 == 1 ? "1 cliente nuevo" : "\($0) clientes nuevos" },
    test: "Celebración de prueba",
    testDetails: "Así se verá y sonará tu próximo pago",
    goalReached: "Objetivo alcanzado",
    milestoneReached: "Hito alcanzado"
  )

  static let it = MomentText(
    payment: "Pagamento ricevuto", customer: "Nuovo cliente", new: "Nuovo abbonato", expansion: "Upgrade",
    reactivation: "Bentornato!", contraction: "Downgrade", churn: "Abbonamento annullato",
    scheduled: "Non si rinnoverà", unpaid: "Pagamento non riuscito", paused: "Abbonamento in pausa",
    endsOn: { "Termina il \($0)" },
    unpaidDetails: "Non pagato dopo i tentativi di Stripe",
    connectPayment: "Pagamento per un account collegato",
    connectFee: { "La tua commissione: \($0)" },
    someoneNew: "Qualcuno di nuovo",
    customersToday: { $0 == 1 ? "Primo nuovo cliente di oggi" : "\($0) nuovi clienti oggi" },
    catchingUp: "Nel frattempo",
    payments: { $0 == 1 ? "1 nuovo pagamento" : "\($0) nuovi pagamenti" },
    changes: { $0 == 1 ? "1 modifica di abbonamento" : "\($0) modifiche di abbonamento" },
    customers: { $0 == 1 ? "1 nuovo cliente" : "\($0) nuovi clienti" },
    test: "Celebrazione di prova",
    testDetails: "Ecco come apparirà e suonerà il tuo prossimo pagamento",
    goalReached: "Obiettivo raggiunto",
    milestoneReached: "Traguardo raggiunto"
  )

  static let pt = MomentText(
    payment: "Pagamento recebido", customer: "Novo cliente", new: "Novo assinante", expansion: "Upgrade",
    reactivation: "Bem-vindo de volta", contraction: "Downgrade", churn: "Assinatura cancelada",
    scheduled: "Não será renovada", unpaid: "Falha no pagamento", paused: "Assinatura pausada",
    endsOn: { "Termina em \($0)" },
    unpaidDetails: "Não paga após as novas tentativas do Stripe",
    connectPayment: "Pagamento para uma conta conectada",
    connectFee: { "Sua taxa: \($0)" },
    someoneNew: "Alguém novo",
    customersToday: { $0 == 1 ? "Primeiro cliente novo hoje" : "\($0) clientes novos hoje" },
    catchingUp: "Enquanto isso",
    payments: { $0 == 1 ? "1 pagamento novo" : "\($0) pagamentos novos" },
    changes: { $0 == 1 ? "1 mudança de assinatura" : "\($0) mudanças de assinatura" },
    customers: { $0 == 1 ? "1 cliente novo" : "\($0) clientes novos" },
    test: "Comemoração de teste",
    testDetails: "É assim que seu próximo pagamento vai aparecer e soar",
    goalReached: "Meta alcançada",
    milestoneReached: "Marco alcançado"
  )

  static let nl = MomentText(
    payment: "Betaling ontvangen", customer: "Nieuwe klant", new: "Nieuwe abonnee", expansion: "Upgrade",
    reactivation: "Welkom terug", contraction: "Downgrade", churn: "Abonnement opgezegd",
    scheduled: "Wordt niet verlengd", unpaid: "Betaling mislukt", paused: "Abonnement gepauzeerd",
    endsOn: { "Eindigt op \($0)" },
    unpaidDetails: "Onbetaald na de nieuwe pogingen van Stripe",
    connectPayment: "Betaling voor een gekoppeld account",
    connectFee: { "Jouw commissie: \($0)" },
    someoneNew: "Iemand nieuw",
    customersToday: { $0 == 1 ? "Eerste nieuwe klant vandaag" : "\($0) nieuwe klanten vandaag" },
    catchingUp: "Ondertussen",
    payments: { $0 == 1 ? "1 nieuwe betaling" : "\($0) nieuwe betalingen" },
    changes: { $0 == 1 ? "1 abonnementswijziging" : "\($0) abonnementswijzigingen" },
    customers: { $0 == 1 ? "1 nieuwe klant" : "\($0) nieuwe klanten" },
    test: "Testviering",
    testDetails: "Zo ziet en klinkt je volgende betaling",
    goalReached: "Doel bereikt",
    milestoneReached: "Mijlpaal bereikt"
  )
}
