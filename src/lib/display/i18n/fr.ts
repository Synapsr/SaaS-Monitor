import type { DisplayText } from "./en";

// French typography: a no-break space before a colon, a narrow one before "!" and inside « ».
const NBSP = " ";
const NNBSP = " ";

export const fr: DisplayText = {
  metricNames: { mrr: "Revenu mensuel récurrent", arr: "Revenu annuel récurrent" },
  topBar: {
    accounts: "Comptes Stripe",
    testData: "Données de test",
    live: "En direct",
    reconnecting: "Reconnexion…",
    enterFullScreen: "Passer en plein écran",
    exitFullScreen: "Quitter le plein écran",
    enableSound: "Cliquez n’importe où pour activer le son",
  },
  accountStatus: { ready: "importé", importing: "import en cours", error: "en échec" },
  allAccounts: "Tous les comptes",
  hero: { inThirtyDays: "en 30 jours" },
  goal: {
    goal: "Objectif",
    nextMilestone: "Prochain palier",
    toGo: (amount) => `encore ${amount}`,
    atThisPace: (when) => `à ce rythme${NBSP}: ${when}`,
    today: "aujourd’hui",
    tomorrow: "demain",
  },
  chart: {
    ranges: { "30d": "30 derniers jours", "90d": "90 derniers jours", "12m": "12 derniers mois" },
    since: (month) => `depuis ${month}`,
    allTime: "depuis le début",
    empty: "La courbe apparaît après quelques jours d’historique.",
    goal: (amount) => `Objectif ${amount}`,
    summary: (title, from, to) => `${title}${NBSP}: de ${from} à ${to}.`,
  },
  tiles: {
    revenueToday: "Revenu du jour",
    yesterday: (amount) => `${amount} hier`,
    thisMonth: "Ce mois-ci",
    versus: (month) => `vs ${month}`,
    versusAmount: (amount, month) => `vs ${amount} en ${month}`,
    customers: "Clients",
    newThisMonth: (count) => `+${count} ce mois-ci`,
    inTrial: (count) => `${count} en essai`,
    paying: "Clients payants",
    netNew: (metric) => `Nouveau ${metric} net`,
    gainedLost: (gained, lost) => `${gained} gagnés · ${lost} perdus`,
  },
  feed: {
    title: "Activité récente",
    empty: "Nouveaux clients, paiements et abonnements s’afficheront ici dès qu’ils arrivent.",
    kinds: {
      payment: "Paiement",
      customer: "Nouveau client",
      new: "Nouvel abonnement",
      expansion: "Montée en gamme",
      reactivation: "Réactivation",
      contraction: "Descente en gamme",
      churn: "Résiliation",
    },
    connectPayment: "Pour un compte connecté",
    justNow: "à l’instant",
    minutesAgo: (minutes) => `il y a ${minutes} min`,
    hoursAgo: (hours) => `il y a ${hours} h`,
    yesterday: "hier",
  },
  warnings: {
    unconvertedCurrency: (currency) =>
      `Les montants en ${currency} sont exclus${NBSP}: aucun taux de change n’est disponible pour le moment.`,
    failingAccount: (account) => `${account}${NBSP}: ce compte Stripe demande votre attention.`,
  },
  moments: {
    titles: {
      payment: "Paiement reçu",
      customer: "Nouveau client",
      new: "Nouvel abonné",
      expansion: "Montée en gamme",
      reactivation: `Bon retour${NNBSP}!`,
      contraction: "Descente en gamme",
      churn: "Abonnement résilié",
    },
    connectPayment: "Paiement pour un compte connecté",
    connectFee: (amount) => `Votre commission${NBSP}: ${amount}`,
    someoneNew: "Quelqu’un de nouveau",
    customersToday: (count) =>
      count === 1 ? "Premier nouveau client aujourd’hui" : `${count} nouveaux clients aujourd’hui`,
    catchingUp: "Entre-temps",
    payments: (count) => (count === 1 ? "1 nouveau paiement" : `${count} nouveaux paiements`),
    changes: (count) =>
      count === 1 ? "1 changement d’abonnement" : `${count} changements d’abonnement`,
    customers: (count) => (count === 1 ? "1 nouveau client" : `${count} nouveaux clients`),
    test: "Célébration de test",
    testDetails: "Voici à quoi ressemblera votre prochain paiement, à l’écran et au son",
    goalReached: "Objectif atteint",
    milestoneReached: "Palier atteint",
    newMilestone: "Nouveau palier",
    nextStop: (amount) => `Prochaine étape${NBSP}: ${amount}. Continuez comme ça.`,
  },
  status: {
    importing: "Import de votre historique Stripe…",
    importingDetails:
      "Abonnements et paiements arrivent. Cela prend une minute ou deux pour la plupart des comptes, et cet écran se met à jour tout seul.",
    failing: "Les données Stripe sont indisponibles pour le moment",
    failingDetails: `Tous les comptes de cet écran sont en échec, souvent parce qu’une clé API a été révoquée. Vérifiez les connexions Stripe dans votre tableau de bord${NBSP}: l’écran reprendra tout seul.`,
    empty: "Connectez Stripe pour donner vie à cet écran",
    emptyDetails: (screen, metric) =>
      `Ajoutez un compte Stripe à «${NNBSP}${screen}${NNBSP}» dans votre tableau de bord. Votre ${metric}, votre chiffre d’affaires et chaque nouveau paiement s’afficheront ici, en direct.`,
    gone: "Ce lien d’écran ne fonctionne plus",
    goneDetails: (app) =>
      `L’écran a peut-être été supprimé, ou son lien régénéré. Ouvrez-le de nouveau depuis votre tableau de bord ${app} pour obtenir son lien actuel.`,
  },
  lock: {
    title: "Cet écran est protégé",
    details: "Saisissez son mot de passe pour l’ouvrir. Cet appareil s’en souviendra.",
    password: "Mot de passe",
    open: "Ouvrir l’écran",
    wrongPassword: "Mot de passe incorrect. Réessayez.",
    tooManyAttempts: "Trop de tentatives. Patientez quelques minutes, puis réessayez.",
  },
};
