import type { DocsText } from "./en";

export const pt: DocsText = {
  common: {
    docs: "Docs",
    breadcrumb: "Trilha de navegação",
    pages: {
      overview: "Visão geral",
      "get-started": "Primeiros passos",
      "wall-display": "Tela na parede",
      customize: "Personalizar",
      apps: "Apps",
      numbers: "Números",
      security: "Segurança",
      "self-hosting": "Auto-hospedagem",
    },
    githubDocs: "Docs no GitHub",
    onThisPage: "Nesta página",
    previous: "Anterior",
    next: "Próximo",
    github: {
      title: "Mais detalhes no GitHub",
      text: "Os guias completos, com cada opção, comando e limite.",
    },
    cta: {
      title: "Veja o seu MRR na parede ainda hoje",
      text: "Grátis durante o beta público. Conecte o Stripe com uma chave somente leitura, e sua tela fica pronta em cerca de dois minutos.",
      primary: "Comece grátis",
      secondary: "Abrir a demo ao vivo",
    },
  },
  overview: {
    meta: {
      title: "Docs: seu MRR do Stripe na TV em dois minutos",
      description:
        "Guias curtos do SaaS Monitor: conecte o Stripe com uma chave somente leitura, coloque seu MRR na TV, personalize, baixe os apps ou hospede você mesmo.",
    },
    title: "Seu MRR na parede, em dois minutos",
    lead: "Guias curtos, que se leem em um ou dois minutos cada: configure o SaaS Monitor, deixe-o com a sua cara e veja por que você pode confiar nele. Todos os detalhes técnicos estão no GitHub.",
    start: "Comece por aqui",
    read: "Ler o guia",
    github: {
      title: "Prefere os guias técnicos?",
      text: "A documentação no GitHub cobre cada opção, comando e limite, para desenvolvedores e para quem hospeda por conta própria.",
      links: {
        stripe: "Conectar o Stripe",
        wall: "Colocar uma tela na parede",
        selfHosting: "Auto-hospedagem",
      },
    },
  },
  getStarted: {
    summary:
      "Crie sua conta, conecte o Stripe com uma chave somente leitura e abra um link na TV. Cerca de dois minutos.",
    meta: {
      title: "Primeiros passos: seu MRR do Stripe na TV em dois minutos",
      description:
        "Crie sua conta grátis, conecte o Stripe com uma chave restrita somente leitura e abra o link da tela em qualquer TV. Quatro passos, uns dois minutos.",
    },
    title: "Comece em dois minutos",
    lead: "Do cadastro ao seu MRR na TV do escritório, em quatro passos. Nada para instalar, nada para programar.",
    facts: ["Cerca de dois minutos", "Chave do Stripe somente leitura", "Grátis durante o beta"],
    steps: {
      title: "Quatro passos",
      account: {
        title: "Crie sua conta grátis",
        text: "Cadastre-se em saas-monitor.com: é grátis durante o beta público. Você ganha um espaço de trabalho, para onde pode convidar sua equipe mais tarde.",
      },
      connect: {
        title: "Conecte o Stripe com uma chave somente leitura",
        text: "Clique em **Create a restricted key on Stripe**: o Stripe Dashboard se abre no formulário da chave, com as permissões certas já selecionadas. Confira as permissões, dê um nome à chave e crie-a; depois, cole-a no SaaS Monitor.",
        note: "A chave é verificada assim que você a cola: se faltar alguma permissão, o SaaS Monitor diz qual.",
      },
      import: {
        title: "Deixe o SaaS Monitor importar seu histórico",
        text: "O SaaS Monitor importa suas assinaturas, os pagamentos dos últimos 12 meses e os clientes dos últimos 7 dias. Contas pequenas levam alguns segundos; as grandes, alguns minutos, e o painel mostra o andamento.",
      },
      tv: {
        title: "Abra sua tela na TV",
        text: "Sua primeira tela é criada assim que o Stripe é conectado. Copie o link dela, abra-o no navegador da TV, em um Raspberry Pi ou em um notebook parado, e clique uma vez para ativar o som.",
        note: "Para ouvir, clique em **Send a test celebration** nas configurações da tela: todas as cópias abertas da tela tocam uma venda de exemplo.",
      },
    },
    permissions: {
      title: "Quais permissões, e por quê",
      lead: "Sete permissões de leitura e uma permissão opcional de gravação. Todo o resto fica em Nenhum.",
      columns: { permission: "Permissão", access: "Acesso", why: "Por quê" },
      access: { read: "Leitura", write: "Gravação" },
      optional: "Opcional",
      why: {
        subscriptions: "MRR, upgrades e cancelamentos",
        customers: "Novos clientes, com nome e país",
        charges: "Receita, e uma comemoração a cada pagamento",
        events: "O que mudou desde a última verificação",
        products: "Nomes dos planos",
        prices: "Valores dos preços escalonados",
        coupons: "Descontos, que reduzem o MRR",
        webhooks: "Atualizações instantâneas: o SaaS Monitor adiciona o próprio webhook",
      },
      callout: {
        title: "Somente leitura, de propósito",
        text: "Fora adicionar o próprio webhook, se você permitir, a chave só consegue ler: nada de cobranças, de reembolsos ou de alterações nos seus clientes. Ela é criptografada em repouso, nunca mais é exibida, e você pode revogá-la no Stripe a qualquer momento.",
      },
      webhook:
        "Com a permissão opcional **Webhook Endpoints**, cada venda chega à parede em segundos. [Como funcionam as atualizações](doc-numbers)",
    },
    test: {
      title: "Experimente com dados de teste",
      text: "Ainda não quer conectar sua conta em produção? Crie uma chave em modo de teste (`rk_test_…`) a partir de uma sandbox do Stripe. Os modos de teste e de produção da mesma conta podem ser conectados lado a lado.",
    },
    next: {
      title: "E agora?",
      text: "Sua tela já funciona como está. Quando tiver um minuto:",
    },
  },
  wallDisplay: {
    summary:
      "Qualquer navegador, uma smart TV ou um Raspberry Pi: o que a tela mostra e como ela roda sozinha por meses.",
    meta: {
      title: "Coloque seu dashboard do Stripe na TV ou num Raspberry Pi",
      description:
        "Abra o link da tela em qualquer navegador, numa smart TV ou num Raspberry Pi em modo quiosque. Ela não apaga, se recupera sozinha e comemora cada venda.",
    },
    title: "Coloque na parede",
    lead: "Uma tela é uma página web feita para rodar em tela cheia, sem ninguém por perto, durante meses. Qualquer aparelho com um navegador moderno consegue exibi-la: nenhum app para instalar, nenhum login.",
    devices: {
      title: "Escolha um aparelho",
      lead: "A tela se adapta a qualquer tamanho, de um monitor 720p a uma TV 4K, na horizontal ou na vertical.",
      recommended: "Recomendado",
      raspberryPi: {
        title: "Raspberry Pi",
        text: "Um Raspberry Pi 4 ou 5 atrás da TV, configurado uma única vez com um bloco de comandos. Ele abre a tela em tela cheia, com som, toda vez que liga: sem teclado, sem mouse, sem clique.",
      },
      smartTv: {
        title: "Smart TV",
        text: "Abra o link no navegador da TV e clique uma vez com o controle remoto para ativar o som. Alguns navegadores de TV são lentos: um Raspberry Pi é mais fluido.",
      },
      computer: {
        title: "Notebook, mini PC ou Mac",
        text: "Abra o link no Chrome, aperte **F** para entrar em tela cheia e clique uma vez para ativar o som. Desative a suspensão nas configurações do sistema.",
      },
      tablet: {
        title: "Tablet",
        text: "Adicione o link à tela de início e mantenha-o em primeiro plano com o Acesso Guiado no iPad ou com a fixação de tela no Android.",
      },
      phone: {
        title: "Seu celular",
        text: "No app SaaS Monitor, vire o celular de lado para entrar no modo TV: a tela inteira, como na parede. [Ver os apps](doc-apps)",
      },
      raspberryPiNote:
        "O painel traz o comando para o Raspberry Pi com o seu link já preenchido, em **Set up a TV or Raspberry Pi**.",
    },
    link: {
      title: "O link da sua tela",
      text: "Cada tela tem o próprio link, impossível de adivinhar: ele fica em **Screen link**, nas configurações da tela. Ele abre sem login, então trate-o como uma senha. **Regenerate link** revoga o antigo em um clique.",
      password: {
        title: "Adicione uma senha",
        text: "Para mais segurança, use **Set a password**: cada aparelho pede a senha uma vez e depois se lembra dela. Se você mudar a senha, todos os aparelhos ficam bloqueados de novo. Os membros conectados do seu espaço de trabalho nunca precisam dela.",
      },
      phone: {
        title: "Abra no seu celular",
        text: "Em **Open on your phone**, escaneie o QR code com o app SaaS Monitor para acompanhar a tela no seu celular, com os widgets e as notificações dela.",
      },
    },
    shows: {
      title: "O que a tela mostra",
      items: [
        "Seu MRR, ou ARR, em letras grandes, com o crescimento em 30 dias",
        "O caminho até o próximo marco ou até a sua própria meta, e o dia em que você vai chegar lá no ritmo atual",
        "Um gráfico de 30 dias, 90 dias, 12 meses ou desde o início",
        "A receita de hoje e do mês, os clientes e o novo MRR líquido",
        "A atividade ao vivo: pagamentos, novos clientes, upgrades e cancelamentos",
      ],
    },
    moments: {
      title: "Momentos e comemorações",
      text: "Cada venda, novo cliente ou mudança de assinatura ganha um card grande no meio da tela, com o seu som e depois, se você quiser, uma voz. Dinheiro entrando traz confete, e cada marco toma a tela inteira.",
      detail:
        "Por padrão, os cards ficam 10 segundos na tela. Quando vários chegam ao mesmo tempo, eles aparecem um depois do outro.",
      imageAlt: "O pagamento de $199 de um novo cliente em um card no meio da tela, com confete",
      tip: {
        title: "Teste direto da sua mesa",
        text: "Clique em **Send a test celebration** nas configurações da tela: todas as cópias abertas da tela tocam uma venda de exemplo em poucos segundos.",
      },
    },
    unattended: {
      title: "Feita para rodar sozinha",
      items: [
        "Atualiza a cada poucos segundos e se recupera sozinha depois de uma queda de rede",
        "Mantém o monitor acordado e esconde o cursor do mouse",
        "Desloca o conteúdo alguns pixels de vez em quando, para proteger telas OLED",
        "Recarrega sozinha depois de uma atualização, para nunca rodar uma versão antiga",
      ],
    },
    sound: {
      title: "Som na TV",
      text: "Os navegadores mantêm uma página em silêncio até alguém interagir com ela: clique uma vez na tela, e o som fica ativado até a próxima vez que a página recarregar. No Raspberry Pi, o comando do modo quiosque permite tocar som sem clique.",
    },
  },
  customize: {
    summary: "MRR ou ARR, sua meta, cores, idiomas, sons e vozes: deixe cada tela com a sua cara.",
    meta: {
      title: "Personalize sua tela: meta, tema, sons e vozes",
      description:
        "Escolha MRR ou ARR, defina uma meta, escolha tema, cor e idioma, os sons e a voz, e o que cada evento do Stripe faz. Tudo com prévia ao vivo.",
    },
    title: "Deixe com a sua cara",
    lead: "Cada tela tem as próprias configurações, com uma prévia ao vivo logo ao lado. Cada alteração é salva automaticamente.",
    editorAlt:
      "O editor de telas: as configurações à esquerda, a prévia ao vivo e o painel de compartilhamento à direita",
    numbers: {
      title: "Seus números",
      metric: {
        title: "MRR ou ARR",
        text: "Mostre o MRR, ou o ARR, se é assim que você conta: o número em destaque, o gráfico, a meta e os marcos acompanham. Pagamentos e receita continuam sendo o que os clientes pagaram.",
      },
      goal: {
        title: "Marcos ou a sua meta",
        text: "Marcos automáticos comemoram cada número redondo na subida, de $100 a $1K, $10K e além. Ou defina a sua própria meta.",
      },
      chart: {
        title: "Período do gráfico",
        text: "Os últimos 30 dias, 90 dias, 12 meses, ou desde o início.",
      },
      currency: {
        title: "Moeda e fuso horário",
        text: "Cada valor é convertido para a moeda da tela. O fuso horário dela define quando começam o “hoje” e o “este mês”.",
      },
    },
    look: {
      title: "Tema e cor",
      text: "Escuro, ou claro para salas bem iluminadas. Escolha uma de cinco cores de destaque ou cole a cor da sua marca em hexadecimal: a tela a ajusta, se necessário, para que continue legível.",
      custom: "Sua cor",
      imageAlt: "Uma tela clara em alemão, em um laranja personalizado",
    },
    language: {
      title: "Sete idiomas",
      text: "Uma tela fala inglês, francês, alemão, espanhol, italiano, português ou holandês, e escreve números e datas no formato local. O painel em si continua em inglês.",
    },
    sound: {
      title: "Sons e vozes",
      packs:
        "Três pacotes de sons, sintetizados direto no navegador, com cinco sons cada, de um pagamento a um marco. [Ouça todos](sounds)",
      voice:
        "Depois do som, uma voz pode dizer o que aconteceu: duas vozes por idioma, em inglês, francês, alemão, espanhol e português. Som e voz se ativam separadamente, cada um com o seu volume.",
      own: "**Suas próprias frases**: com uma chave de API do Gradium no servidor, a voz diz o que você escrever, com o nome do cliente, o valor ou o plano.",
    },
    events: {
      title: "O que cada evento faz",
      text: "Para cada tipo de evento, cinco opções que você liga ou desliga: aparecer na atividade recente, aparecer como card, tocar o som, ser anunciado em voz alta e notificar os celulares que seguem a tela.",
      event: "Evento",
      columns: { feed: "Atividade", moment: "Card", sound: "Som", voice: "Voz", push: "Celular" },
      names: {
        payment: "Pagamento",
        connectPayment: "Pagamento para uma conta Connect",
        subscription: "Novo assinante",
        upgrade: "Upgrade",
        reactivation: "Reativação",
        downgrade: "Downgrade",
        cancellation: "Cancelamento",
        unpaid: "Falha no pagamento",
        customer: "Novo cliente",
        milestone: "Marco",
      },
      on: "Ativado",
      off: "Desativado",
      caption:
        "Os padrões. As perdas não são ditas em voz alta, e os celulares só ficam sabendo das boas notícias. As vozes só falam depois que você as ativa.",
    },
    accounts: {
      title: "Várias contas Stripe",
      text: "Uma tela pode mostrar várias contas Stripe, convertidas para a moeda dela, de duas maneiras.",
      added: {
        title: "Somadas",
        text: "Um único total para todas as contas. A atividade recente indica a conta de cada item.",
      },
      rotation: {
        title: "Uma de cada vez",
        text: "Cada conta tem a sua vez, com os próprios números, e o total delas também, se você quiser. Quando algo acontece, a tela mostra a conta correspondente na hora.",
      },
      imageAlt:
        "Dois produtos em uma só tela: um novo assinante da Acme Analytics, identificado no momento e no rodízio logo acima",
      more: "Ou crie uma tela por produto, e uma silenciosa, sem som, para a sala de reunião: quantas você quiser, cada uma com o próprio link e as próprias configurações.",
    },
    names: {
      title: "Nomes dos clientes",
      text: "Ocultos por padrão: qualquer pessoa que visse a tela saberia quem paga você. Mostre-os se quiser. Os clientes que o Stripe só conhece pelo e-mail podem então ser identificados pelo e-mail, mascarado (`j•••@gmail.com`) ou completo, ou não ser identificados. As vozes nunca leem e-mails.",
    },
  },
  apps: {
    summary:
      "Suas telas no iPhone, iPad, Apple Watch, Android e Wear OS, com uma notificação para cada venda.",
    meta: {
      title: "O app: seu MRR do Stripe no iPhone, Android e Apple Watch",
      description:
        "Acompanhe qualquer tela no iPhone, iPad, Apple Watch, Android e Wear OS: uma notificação a cada venda, widgets, complicações e números para compartilhar.",
    },
    title: "Seu MRR no bolso",
    lead: "O app SaaS Monitor abre qualquer tela pelo link ou QR code, em saas-monitor.com ou no seu próprio servidor. Sem conta, sem rastreamento.",
    add: {
      title: "Adicione uma tela",
      steps: [
        "Nas configurações da tela, procure **Open on your phone**.",
        "Escaneie o QR code com o app ou cole o link da tela.",
        "Se a tela tiver senha, digite-a uma vez em cada celular.",
      ],
    },
    notifications: {
      title: "Uma notificação para cada venda",
      text: "Pagamentos, novos assinantes, upgrades, reativações, novos clientes e marcos, no idioma e na moeda da tela. Uma rajada de atividade chega como uma única notificação que resume tudo.",
      choose:
        "Nos **Events** da tela, escolha em **Phone** quais eventos geram notificação. Em cada celular, desative as notificações de uma tela ou silencie alguns dos eventos dela.",
      sound:
        "No iPhone, uma notificação pode tocar com o próprio som e a voz da tela, mesmo com o celular bloqueado: ative **Play sounds and voices** nas configurações do app.",
      speed:
        "As notificações saem assim que o SaaS Monitor recebe notícias do Stripe: em segundos, com as [atualizações instantâneas](doc-numbers).",
      now: "agora",
    },
    widgets: {
      title: "Widgets e relógios",
      text: "No iPhone, widgets na Tela de Início, na Tela Bloqueada e no modo Em Espera (StandBy), e também no CarPlay. No Android, widgets na tela inicial. Os apps para Apple Watch e Wear OS, com complicações, mantêm o seu MRR no mostrador do relógio.",
      wearAlt:
        "O app para Wear OS: o MRR com o crescimento em 30 dias, o gráfico e o progresso até a meta",
    },
    tv: {
      title: "Modo TV",
      text: "Em uma tela, vire o celular de lado para entrar no modo TV: tudo ao mesmo tempo, como na parede, e o celular fica acordado. Com **Play sounds and voices** ativado, ele também toca o som e a voz de cada momento.",
    },
    share: {
      title: "Compartilhe qualquer número",
      text: "Toque e segure um número para compartilhá-lo como uma imagem limpa, assinada com “Powered by SaaS Monitor”. Perfeito para o post do seu próximo marco.",
      imageAlt:
        "Um pagamento de $79 compartilhado como imagem, assinada com Powered by SaaS Monitor",
    },
    privacy: {
      title: "Sem conta, sem rastreamento",
      text: "O link de uma tela é tudo de que o app precisa. O app não tem analytics, publicidade nem rastreamento, guarda suas telas no armazenamento seguro do aparelho e só se comunica com o servidor de cada tela e com os serviços que entregam as notificações. Os clientes só aparecem pelo nome nas telas que mostram nomes. [Política de privacidade](privacy)",
    },
  },
  numbers: {
    summary:
      "O MRR como o Stripe define, para que a parede bata com o seu Stripe Dashboard. ARR, receita, moedas e atualizações.",
    meta: {
      title: "Como calculamos MRR, ARR e receita a partir do Stripe",
      description:
        "O MRR como o Stripe define, para o número na parede bater com o seu dashboard do Stripe. Como funcionam ARR, receita, moedas, atualizações e histórico.",
    },
    title: "Números em que você pode confiar",
    lead: "O SaaS Monitor calcula o MRR do jeito que o Stripe define, para que o número na parede fique próximo do que aparece no seu Stripe Dashboard. Veja exatamente como.",
    mrr: {
      title: "O MRR, como o Stripe define",
      items: [
        "Só contam as assinaturas ativas e as com pagamento em atraso: períodos de teste e assinaturas canceladas, não pagas, pausadas ou incompletas não contam.",
        "Cada preço é convertido para um mês: um preço anual entra dividido por doze.",
        "Quantidades, faixas e preços por volume contam do jeito que o Stripe os fatura.",
        "Os descontos são subtraídos: os permanentes e, até terminarem, os que se repetem por alguns meses. Os de aplicação única, não.",
        "Uma assinatura marcada para cancelar no fim do período deixa de contar assim que o cancelamento é solicitado.",
        "O uso medido e os preços de pagamento único ficam de fora, e os impostos não são somados.",
      ],
    },
    movements: {
      title: "Cada mudança, registrada",
      text: "Cada mudança de MRR é registrada no momento em que acontece, e o novo MRR líquido soma as mudanças do mês. Uma assinatura perdida diz o motivo: cancelada, não será renovada, falha no pagamento ou pausada.",
      kinds: {
        new: { name: "Novo", text: "começa a pagar" },
        expansion: { name: "Expansão", text: "paga mais" },
        contraction: { name: "Contração", text: "paga menos" },
        churn: { name: "Churn", text: "deixa de contar" },
        reactivation: { name: "Reativação", text: "volta a pagar" },
      },
    },
    arr: {
      title: "ARR",
      text: "O ARR é doze vezes o MRR. Uma tela pode mostrá-lo como métrica principal: o número em destaque, o gráfico, a meta e os marcos passam então para ARR, enquanto pagamentos e receita continuam sendo o que os clientes pagaram.",
    },
    revenue: {
      title: "Receita de hoje e do mês",
      text: "A receita é o que os clientes pagaram, descontados os reembolsos: hoje, este mês, e os mesmos dias do mês passado para comparar. Dias e meses seguem o fuso horário da tela.",
      connect:
        "Em uma plataforma Stripe Connect, os pagamentos feitos para contas conectadas aparecem na atividade recente, e só a taxa que fica com você conta como sua receita.",
    },
    currencies: {
      title: "Várias moedas",
      text: "Cada valor é convertido para a moeda da tela pela cotação do dia, do Banco Central Europeu, atualizada a cada 12 horas. Os valores passados também: o gráfico mostra o seu negócio crescendo, e não o câmbio oscilando.",
    },
    updates: {
      title: "Atualizações instantâneas",
      text: "Com um webhook, o Stripe avisa o SaaS Monitor no instante em que algo acontece. Sem webhook, o SaaS Monitor consulta o Stripe num ritmo que respeita a cota de leitura do Stripe.",
      webhook: { label: "Com webhook", value: "Em segundos" },
      polling: {
        label: "Sem webhook",
        value:
          "Mais ou menos a cada 17 minutos nas contas pequenas, até uma vez por minuto nas mais movimentadas",
      },
      daily:
        "Uma verificação diária também compara cada assinatura com o Stripe, para as poucas mudanças que o Stripe faz sem gerar um evento, como um cupom que expira.",
    },
    history: {
      title: "Seu histórico",
      text: "Quando você conecta, o SaaS Monitor importa suas assinaturas, os pagamentos dos últimos 12 meses e os clientes dos últimos 7 dias. O Stripe não guarda histórico das mudanças passadas de assinatura, então o gráfico antes desse dia é reconstruído a partir do início, do fim e do valor atual de cada assinatura. Daí em diante, cada mudança é registrada no momento em que acontece.",
    },
    limits: {
      title: "Diferenças conhecidas",
      text: "Os poucos casos em que a parede e o Stripe podem divergir estão documentados:",
      items: [
        "Preços com imposto incluído contam com o imposto.",
        "Um cupom excluído antes da sua primeira importação conta sobre a assinatura inteira.",
        "Upgrades e downgrades feitos antes da sua primeira importação não aparecem no gráfico.",
      ],
    },
  },
  security: {
    summary:
      "Uma chave somente leitura, criptografada em repouso. Nomes ocultos por padrão. Open source, para qualquer um verificar.",
    meta: {
      title: "Segurança: chave do Stripe somente leitura e criptografada",
      description:
        "Lemos o Stripe com chave restrita somente leitura, criptografada com AES-256-GCM. Sem anúncios nem rastreamento, nomes ocultos por padrão. Open source.",
    },
    title: "Seguro para conectar",
    lead: "O SaaS Monitor lê só o que as suas telas precisam, mantém sua chave criptografada e não mostra nada que você não tenha escolhido. Ele é open source, então você não precisa acreditar só na nossa palavra.",
    facts: [
      { value: "Somente leitura", label: "chave restrita do Stripe" },
      { value: "AES-256-GCM", label: "criptografia em repouso" },
      { value: "MIT", label: "open source, para qualquer um verificar" },
    ],
    key: {
      title: "Uma chave que só pode ler",
      text: "Você conecta o Stripe com uma chave restrita, criada no seu Stripe Dashboard só com as permissões de que o SaaS Monitor precisa: ele nunca pede a sua chave secreta. A única permissão de gravação, opcional, permite que ele adicione o próprio webhook, para atualizações instantâneas. Revogue a chave no Stripe a qualquer momento. [Ver todas as permissões](permissions)",
    },
    encryption: {
      title: "Criptografada, e nunca mais exibida",
      text: "As chaves são criptografadas em repouso com AES-256-GCM e nunca saem do servidor: o painel só mostra um trecho mascarado. Os webhooks do Stripe são verificados com o segredo de assinatura deles.",
    },
    data: {
      title: "O que fica armazenado",
      text: "Sua chave do Stripe, criptografada, e uma cópia do que as suas telas precisam: as assinaturas e as mudanças de MRR delas, os pagamentos e os novos clientes, com nome, e-mail e país. Nenhum dado de cartão ou bancário.",
      delete: "Desconecte uma conta Stripe, e tudo o que foi importado dela é excluído na hora.",
    },
    screens: {
      title: "As telas só mostram o que você escolher",
      items: [
        "Os nomes e e-mails dos clientes ficam fora das suas telas e das notificações delas, a menos que você os ative.",
        "O link de uma tela é impossível de adivinhar, e **Regenerate link** revoga o antigo.",
        "Adicione uma senha, e cada aparelho vai ter que digitá-la uma vez.",
      ],
    },
    tracking: {
      title: "Sem anúncios, sem rastreamento",
      text: "O site não usa analytics e não carrega nenhum script de terceiros. Nenhum cookie de publicidade ou de rastreamento, e seus dados nunca são vendidos. O app também não tem conta nem rastreamento. [Política de privacidade](privacy)",
    },
    others: {
      title: "Quem mais vê o quê",
      text: "Só o que você ativar: as frases personalizadas das vozes são enviadas ao Gradium para serem faladas, e as notificações para celulares passam pelos serviços de push que as entregam.",
    },
    openSource: {
      title: "Open source, para qualquer um verificar",
      text: "Cada linha do SaaS Monitor está no GitHub sob a licença MIT: leia como a sua chave é armazenada, ou rode tudo no seu próprio servidor, onde os seus dados do Stripe ficam.",
      report: "Encontrou uma vulnerabilidade? Relate-a em particular",
    },
  },
  selfHosting: {
    summary:
      "Dois comandos com Docker, em qualquer servidor ou Raspberry Pi. Grátis para sempre, sob a licença MIT.",
    meta: {
      title: "Hospede o SaaS Monitor com Docker em dois comandos",
      description:
        "Rode o SaaS Monitor no seu servidor ou num Raspberry Pi com Docker Compose: dois comandos, grátis para sempre, licença MIT. HTTPS, atualizações, backups.",
    },
    title: "Rode no seu próprio servidor",
    lead: "O SaaS Monitor é um servidor Next.js e um banco de dados MySQL. Com Docker, ele roda em qualquer servidor, em um computador sem uso ou em um Raspberry Pi, com todos os recursos, grátis para sempre.",
    install: {
      title: "Instale em dois comandos",
      requirements:
        "Você precisa do Docker com Compose, em um servidor, em um computador sem uso ou em um Raspberry Pi com sistema de 64 bits.",
      script:
        "O [script](install-script) cria uma pasta `saas-monitor` com um arquivo Compose e um `.env` com segredos novos, e depois termina: ele não precisa de root, não inicia nada e não mexe em mais nada.",
      then: "Abra `http://localhost:3000`, crie sua conta e conecte o Stripe. As migrações do banco de dados rodam sozinhas.",
    },
    tv: {
      title: "Abra pela TV",
      text: "Defina `APP_URL` no `.env` com o endereço que a TV vai usar, como `http://192.168.1.20:3000`, e rode `docker compose up -d` de novo: os links das telas são gerados a partir dele.",
      callout: {
        title: "Guarde bem a ENCRYPTION_KEY",
        text: "Ela criptografa as chaves do Stripe no seu banco de dados. Nunca a altere: sem ela, todas as contas Stripe precisam ser conectadas de novo.",
      },
    },
    https: {
      title: "HTTPS para atualizações instantâneas",
      text: "Uma rede local basta para uma TV no mesmo escritório. Coloque o SaaS Monitor atrás de HTTPS, com um domínio, para abrir as telas de qualquer lugar e ter atualizações instantâneas: o Stripe só envia webhooks para um endereço HTTPS público. Qualquer proxy reverso serve, como o Caddy.",
      without:
        "Sem isso, o SaaS Monitor consulta o Stripe num ritmo constante, mais ou menos a cada 17 minutos nas contas pequenas.",
    },
    updates: {
      title: "Atualizações",
      text: "Baixe a nova imagem e reinicie: as telas abertas percebem a nova versão e se recarregam sozinhas. Para atualizar quando você quiser, fixe uma versão com `SAAS_MONITOR_VERSION`.",
    },
    data: {
      title: "O que fica no seu servidor",
      text: "Tudo: sua chave do Stripe, seus dados e suas configurações ficam no seu próprio banco MySQL, e um único comando faz o backup deles. Dois recursos opcionais se conectam a serviços externos: as frases personalizadas das vozes são enviadas ao Gradium para serem faladas, e as notificações para celulares passam pelo serviço de push do Expo.",
      signups:
        "Depois que a sua equipe tiver se cadastrado, defina `DISABLE_SIGNUPS=true`: ninguém mais consegue criar uma conta, e os convites continuam funcionando.",
    },
    cta: {
      title: "Dois comandos, e é seu",
      text: "Todos os recursos, grátis para sempre. O guia completo cobre configuração, HTTPS, atualizações, backups e compilação a partir do código-fonte.",
      guide: "Guia completo de auto-hospedagem no GitHub",
    },
  },
};
