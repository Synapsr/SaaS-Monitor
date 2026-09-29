import type { DisplayText } from "./en";

/** Brazilian Portuguese, the language of most Portuguese-speaking founders. */
export const pt: DisplayText = {
  metricNames: { mrr: "Receita recorrente mensal", arr: "Receita recorrente anual" },
  topBar: {
    accounts: "Contas Stripe",
    testData: "Dados de teste",
    live: "Ao vivo",
    reconnecting: "Reconectando…",
    enterFullScreen: "Tela cheia",
    exitFullScreen: "Sair da tela cheia",
    enableSound: "Clique em qualquer lugar para ativar o som",
  },
  accountStatus: { ready: "importada", importing: "importando", error: "com falha" },
  allAccounts: "Todas as contas",
  hero: { inThirtyDays: "em 30 dias" },
  goal: {
    goal: "Meta",
    nextMilestone: "Próximo marco",
    toGo: (amount) => `faltam ${amount}`,
    atThisPace: (when) => `neste ritmo: ${when}`,
    today: "hoje",
    tomorrow: "amanhã",
  },
  chart: {
    ranges: { "30d": "últimos 30 dias", "90d": "últimos 90 dias", "12m": "últimos 12 meses" },
    since: (month) => `desde ${month}`,
    allTime: "desde o início",
    empty: "A curva aparece depois de alguns dias de histórico.",
    goal: (amount) => `Meta ${amount}`,
    summary: (title, from, to) => `${title}: de ${from} para ${to}.`,
  },
  tiles: {
    revenueToday: "Receita de hoje",
    yesterday: (amount) => `${amount} ontem`,
    thisMonth: "Este mês",
    versus: (month) => `vs. ${month}`,
    versusAmount: (amount, month) => `vs. ${amount} em ${month}`,
    customers: "Clientes",
    newThisMonth: (count) => `+${count} este mês`,
    inTrial: (count) => `${count} em teste`,
    paying: "Clientes pagantes",
    netNew: (metric) => `Novo ${metric} líquido`,
    gainedLost: (gained, lost) => `${gained} ganhos · ${lost} perdidos`,
  },
  feed: {
    title: "Atividade recente",
    empty: "Novos clientes, pagamentos e assinaturas aparecem aqui assim que acontecem.",
    kinds: {
      payment: "Pagamento",
      customer: "Novo cliente",
      new: "Nova assinatura",
      expansion: "Upgrade",
      reactivation: "Reativação",
      contraction: "Downgrade",
      churn: "Cancelamento",
    },
    justNow: "agora mesmo",
    minutesAgo: (minutes) => `há ${minutes} min`,
    hoursAgo: (hours) => `há ${hours} h`,
    yesterday: "ontem",
  },
  warnings: {
    unconvertedCurrency: (currency) =>
      `Os valores em ${currency} ficam de fora: nenhuma taxa de câmbio está disponível no momento.`,
    failingAccount: (account) => `${account}: esta conta Stripe precisa de atenção.`,
  },
  moments: {
    titles: {
      payment: "Pagamento recebido",
      customer: "Novo cliente",
      new: "Novo assinante",
      expansion: "Upgrade",
      reactivation: "Bem-vindo de volta",
      contraction: "Downgrade",
      churn: "Assinatura cancelada",
    },
    someoneNew: "Alguém novo",
    customersToday: (count) =>
      count === 1 ? "Primeiro cliente novo hoje" : `${count} clientes novos hoje`,
    catchingUp: "Enquanto isso",
    payments: (count) => (count === 1 ? "1 pagamento novo" : `${count} pagamentos novos`),
    changes: (count) =>
      count === 1 ? "1 mudança de assinatura" : `${count} mudanças de assinatura`,
    customers: (count) => (count === 1 ? "1 cliente novo" : `${count} clientes novos`),
    test: "Comemoração de teste",
    testDetails: "É assim que seu próximo pagamento vai aparecer e soar",
    goalReached: "Meta alcançada",
    milestoneReached: "Marco alcançado",
    newMilestone: "Novo marco",
    nextStop: (amount) => `Próxima parada: ${amount}. Continue assim!`,
  },
  status: {
    importing: "Importando seu histórico do Stripe…",
    importingDetails:
      "Assinaturas e pagamentos estão a caminho. Leva um ou dois minutos na maioria das contas, e esta tela se atualiza sozinha.",
    failing: "Não é possível carregar os dados do Stripe agora",
    failingDetails:
      "Todas as contas desta tela estão falhando, geralmente porque uma chave de API foi revogada. Verifique as conexões do Stripe no seu painel: a tela vai se recuperar sozinha.",
    empty: "Conecte o Stripe para dar vida a esta tela",
    emptyDetails: (screen, metric) =>
      `Adicione uma conta Stripe a “${screen}” no seu painel. Seu ${metric}, sua receita e cada novo pagamento vão aparecer aqui, ao vivo.`,
    gone: "Este link de tela não funciona mais",
    goneDetails: (app) =>
      `A tela pode ter sido excluída ou ter tido o link gerado novamente. Abra-a de novo no seu painel do ${app} para obter o link atual.`,
  },
  lock: {
    title: "Esta tela está protegida",
    details: "Digite a senha para abri-la. Este dispositivo vai se lembrar dela.",
    password: "Senha",
    open: "Abrir a tela",
    wrongPassword: "Senha incorreta. Tente de novo.",
    tooManyAttempts: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  },
};
