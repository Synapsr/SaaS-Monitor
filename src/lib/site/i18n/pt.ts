import type { SiteText } from "./en";

export const pt: SiteText = {
  meta: {
    title: "SaaS Monitor · Dashboard open source de MRR do Stripe na TV do escritório",
    description:
      "Seu MRR, ARR e cada pagamento do Stripe ao vivo na TV do escritório, no celular e no relógio. Open source: grátis durante o beta ou no seu servidor.",
    imageAlt: "SaaS Monitor: veja seu SaaS crescer, ao vivo",
    imageGrowth: (percent: string) => `${percent} em 30 dias`,
  },
  nav: {
    skip: "Pular para o conteúdo",
    home: "SaaS Monitor, início",
    main: "Principal",
    demo: "Demo ao vivo",
    features: "Recursos",
    apps: "Apps",
    pricing: "Preços",
    docs: "Docs",
    github: "GitHub",
    signIn: "Entrar",
    getStarted: "Começar",
    menu: "Menu",
    language: "Idioma",
  },
  languageHint: {
    text: "Esta página também está em português.",
    action: "Ler em português",
    dismiss: "Fechar",
  },
  hero: {
    badge: "Open source · Grátis durante o beta público",
    title: { start: "Veja seu SaaS crescer, ", highlight: "ao vivo", end: "." },
    lead: "O SaaS Monitor transforma sua conta Stripe em números ao vivo: MRR ou ARR, a receita do dia e cada pagamento, com um som a cada venda. Na TV do escritório, no seu celular e no seu pulso.",
    primary: "Comece grátis",
    secondary: "Abrir a demo ao vivo",
    points: [
      "Grátis durante o beta",
      "Grátis para sempre no seu servidor",
      "Chave do Stripe somente leitura",
    ],
  },
  demo: {
    title: "Demo ao vivo de uma tela do SaaS Monitor",
    caption:
      "A demo ao vivo, com um SaaS fictício. Uma venda chega a cada 20 segundos, mais ou menos.",
    captionOn: "Som ligado: cada venda toca um som, e depois uma voz diz o que aconteceu.",
    captionBlocked: "Seu navegador manteve o som desligado. Clique em “Ouvir” para tentar de novo.",
    hear: "Ouvir",
    mute: "Silenciar",
    posterAlt:
      "Uma tela do SaaS Monitor: o MRR em letras grandes com o seu crescimento, a meta, o gráfico de MRR, os blocos de receita e os últimos pagamentos",
    open: "Abrir a demo ao vivo",
  },
  proof: {
    label: "SaaS Monitor em resumo",
    stars: (count: string) => `${count} no GitHub`,
    star: "Dê uma estrela no GitHub",
    license: "Licença MIT",
    selfHost: "Docker ou Raspberry Pi",
    languages: "7 idiomas",
    privacy: "Sem anúncios, sem rastreamento",
  },
  features: {
    eyebrow: "Na parede",
    title: "Feito para você seguir em frente",
    lead: "Construir um SaaS é uma maratona. Ver o negócio crescer, venda após venda, é o que mantém a equipe entregando.",
    mrr: {
      title: "O número que importa, bem grande",
      text: "O MRR em destaque, com o crescimento em 30 dias, o ARR e o caminho até o próximo marco. Legível do outro lado da sala.",
      growth: (amount: string, percent: string) => `${amount} · ${percent} em 30 dias`,
      toGoal: (amount: string, goal: string) => `faltam ${amount} para ${goal}`,
      pace: "neste ritmo: amanhã",
    },
    moment: {
      title: "Cada venda é um momento",
      text: "Um som, um card com o valor e o plano, confete na sua cor. O escritório inteiro fica sabendo.",
      kind: "Novo cliente",
      plan: "Team",
    },
    milestone: {
      title: "Marcos que merecem comemoração",
      text: "MRR de $1K, $10K, $100K ou a sua própria meta, com o dia em que você vai chegar lá no ritmo atual. Quando você cruza um marco, ele toma a tela inteira.",
      reached: "Meta alcançada",
      next: (amount: string) => `Próxima parada: ${amount}. Continue assim.`,
    },
    wall: {
      title: "Feito para a parede",
      text: "Escuro ou claro, na cor da sua marca e em sete idiomas. De um monitor 720p a uma TV 4K, a tela nunca apaga e se recupera sozinha.",
    },
    accounts: {
      all: "Todas as contas",
      title: "Todos os seus produtos, uma só tela",
      text: "Some várias contas Stripe em uma só moeda, ou deixe cada produto ter a sua vez. Cada momento diz de onde vem.",
    },
    honest: {
      title: "Honesto e privado",
      text: "O MRR como o Stripe define, lido com uma chave restrita criptografada em repouso. Os nomes dos clientes ficam ocultos, a menos que você os mostre.",
      points: [
        "Chave restrita somente leitura",
        "Criptografada com AES-256-GCM",
        "Nomes ocultos por padrão",
      ],
    },
  },
  sounds: {
    eyebrow: "Som",
    title: "Ouça como soa uma venda",
    lead: "Três pacotes de sons, sintetizados no navegador: nada para instalar. Depois, uma voz diz o que aconteceu, no idioma da tela. Escolha os sons de cada tela, ou deixe a sala de reunião em silêncio.",
    packs: {
      register: {
        name: "Caixa registradora",
        description: "O clássico ka-ching: a gaveta e o sino do caixa.",
      },
      chime: { name: "Sinos", description: "Toques suaves para um escritório tranquilo." },
      arcade: { name: "Fliperama", description: "Moedas e power-ups em 8 bits." },
    },
    events: {
      payment: "Pagamento",
      customer: "Novo cliente",
      mrrUp: "MRR em alta",
      mrrDown: "MRR em queda",
      milestone: "Marco",
    },
    play: (sound: string, pack: string) => `Ouvir o som “${sound}” do pacote ${pack}`,
    download: (sound: string, pack: string) =>
      `Baixar o som “${sound}” do pacote ${pack}, em arquivo WAV`,
    voices: {
      title: "Vozes",
      text: "Depois do som, uma voz diz o que aconteceu, no idioma da tela. Duas vozes por idioma.",
      choose: "Frase que as vozes dizem",
      phrases: {
        payment: "Pagamento",
        subscription: "Novo assinante",
        customer: "Novo cliente",
        upgrade: "Upgrade",
        goal: "Meta alcançada",
      },
      play: (voice: string, language: string, words: string) =>
        `Ouvir ${voice}, uma voz em ${language}, dizendo “${words}”`,
    },
    files: "Baixar todos os sons em arquivos WAV",
  },
  apps: {
    eyebrow: "Apps",
    title: "Seu MRR também no bolso",
    lead: "O app SaaS Monitor abre qualquer tela pelo link ou QR code, hospedada por nós ou por você. Vire o celular de lado e ele se transforma em uma tela de parede. Sem cadastro, sem rastreamento.",
    platforms: "iPhone · iPad · Apple Watch · Android · Wear OS",
    features: [
      {
        title: "Cada venda, na hora",
        text: "Uma notificação para cada pagamento, novo assinante, upgrade e marco, no idioma da tela. No iPhone, ela pode tocar com o próprio som e a voz da tela.",
      },
      {
        title: "Widgets em todo lugar",
        text: "No iPhone, widgets na Tela de Início, na Tela Bloqueada e no modo Em Espera (StandBy), e também no CarPlay. No Android, widgets na tela inicial.",
      },
      {
        title: "No seu pulso",
        text: "Apps para Apple Watch e Wear OS, com complicações, para manter o seu MRR no mostrador do relógio.",
      },
      {
        title: "Compartilhe qualquer número",
        text: "Toque e segure um número para compartilhá-lo como uma imagem limpa, assinada com “Powered by SaaS Monitor”.",
      },
    ],
    stores: {
      soon: "Em breve",
      appStore: {
        soon: "Em breve na App Store",
        live: "Baixar na App Store",
        liveLine: "Baixar na",
      },
      googlePlay: {
        soon: "Em breve no Google Play",
        live: "Disponível no Google Play",
        liveLine: "Disponível no",
      },
    },
    pending: "Os dois apps estão em análise. Eles vão aparecer aqui no dia em que forem lançados.",
    images: {
      iphone:
        "O app SaaS Monitor no iPhone: o MRR quase na meta de $15K, o gráfico de MRR e a receita de hoje",
      watch: "O app para Apple Watch: o MRR com o crescimento em 30 dias e o gráfico",
      android:
        "O app para Android compartilhando o MRR como imagem, assinada com Powered by SaaS Monitor",
    },
  },
  steps: {
    eyebrow: "Configuração",
    title: "Na parede em dois minutos",
    items: [
      {
        title: "Conecte o Stripe",
        text: "Crie uma chave restrita somente leitura em um clique e cole-a. Seu histórico é importado em cerca de um minuto.",
      },
      {
        title: "Deixe com a sua cara",
        text: "Escolha os sons, as cores e a sua meta com uma prévia ao vivo. Cada alteração é salva automaticamente.",
      },
      {
        title: "Coloque na parede",
        text: "Abra o link da tela em qualquer TV, monitor ou Raspberry Pi. Sem login, nada para instalar.",
      },
    ],
  },
  pricing: {
    eyebrow: "Preços",
    title: "Grátis durante o beta. Grátis para sempre no seu servidor.",
    lead: "O SaaS Monitor está em beta público: a versão hospedada é gratuita enquanto o beta durar. No seu próprio servidor, continua gratuito para sempre.",
    hosted: {
      name: "Hospedado para você",
      badge: "Beta público",
      price: "Grátis",
      term: "durante o beta público",
      points: [
        "Todos os recursos, nada para instalar ou atualizar",
        "Atualizações instantâneas via webhooks do Stripe",
        "Quantas telas e colegas você quiser",
      ],
      cta: "Começar",
    },
    selfHosted: {
      name: "No seu próprio servidor",
      badge: "Open source",
      price: "Grátis",
      term: "para sempre, sob a licença MIT",
      points: [
        "Todos os recursos, sem limites",
        "Docker em dois comandos, em qualquer servidor ou Raspberry Pi",
        "Seus dados do Stripe ficam no seu servidor",
      ],
      cta: "Guia de auto-hospedagem",
    },
  },
  openSource: {
    eyebrow: "Open source",
    title: "Para você rodar, ler e modificar",
    lead: "O SaaS Monitor é open source sob a licença MIT. Rode com Docker no seu próprio servidor ou em um Raspberry Pi em dois comandos, sem nada para clonar ou compilar. Sua chave do Stripe nunca sai do seu servidor.",
    star: "Dê uma estrela no GitHub",
    guide: "Guia de auto-hospedagem",
    facts: [
      { value: "MIT", label: "licença, para sempre" },
      { value: "2", label: "comandos para instalar" },
      { value: "arm64", label: "e amd64, em imagens Docker" },
    ],
    terminal: "Terminal",
    copy: "Copiar",
    copied: "Copiado",
    copyFailed: "Selecione os comandos para copiá-los",
    script:
      "O [script](install-script) gera um arquivo Compose e segredos novos, e depois termina. Abra localhost:3000 e conecte o Stripe.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "O que os fundadores perguntam",
    items: [
      {
        question: "Minha chave do Stripe está segura?",
        answer: [
          "Você conecta o Stripe com uma chave restrita, criada no seu Stripe Dashboard só com as permissões de que o SaaS Monitor precisa: ele lê assinaturas, clientes, pagamentos e os produtos, preços e cupons que eles usam. Uma permissão é opcional: ela permite que o SaaS Monitor registre o próprio endpoint de webhook, para atualizações instantâneas.",
          "A chave é criptografada em repouso com AES-256-GCM, nunca sai do servidor e nunca mais é exibida. Você pode revogá-la no Stripe a qualquer momento. [Ver todas as permissões](permissions)",
        ],
      },
      {
        question: "O número bate com o meu Stripe Dashboard?",
        answer: [
          "Sim, na maioria dos casos: o SaaS Monitor segue a própria definição de MRR do Stripe. Só contam as assinaturas ativas e as com pagamento em atraso, um preço anual entra dividido por doze, e os descontos são subtraídos, exceto os de aplicação única.",
          "Alguns limites estão documentados: preços com imposto incluído contam com o imposto, um cupom excluído antes da sua primeira importação conta sobre a assinatura inteira, e o gráfico anterior a essa importação é reconstruído a partir do valor atual de cada assinatura. [Como o MRR é calculado](mrr)",
        ],
      },
      {
        question: "O que vocês armazenam?",
        answer: [
          "Sua chave do Stripe, criptografada, e uma cópia do que as suas telas precisam: as assinaturas e as mudanças de MRR delas, os pagamentos e os novos clientes, com nome, e-mail e país dos clientes. Nenhum dado de cartão ou bancário. Desconectar uma conta exclui os dados dela. Se você hospedar no seu servidor, tudo fica lá, exceto as frases personalizadas das vozes, se você as ativar, que vão para o Gradium, e as notificações para os celulares que seguem uma tela, que passam pelo serviço de push do Expo.",
        ],
      },
      {
        question: "Quais TVs funcionam?",
        answer: [
          "Qualquer tela com um navegador moderno. Um Raspberry Pi 4 ou 5 atrás da TV dá o resultado mais fluido: configurado uma vez, ele abre a tela em modo de tela cheia, com som, toda vez que liga. O navegador de uma smart TV, um notebook parado ou um tablet também funcionam. A tela se mantém acordada, se recupera de quedas de rede e recarrega depois das atualizações. [Coloque uma tela na parede](wall)",
        ],
      },
      {
        question: "Tem app para celular?",
        answer: [
          "O app SaaS Monitor, para iPhone, iPad, Apple Watch, Android e Wear OS, abre qualquer tela pelo link ou QR code, hospedada por nós ou por você, e avisa você de cada pagamento, novo assinante e marco. Sem cadastro, sem rastreamento. [Ver o app](apps)",
        ],
      },
      {
        question: "Quais idiomas uma tela fala?",
        answer: [
          "Inglês, francês, alemão, espanhol, italiano, português e holandês, com números e datas no formato local. A voz fala inglês, francês, alemão, espanhol e português.",
        ],
      },
      {
        question: "Paddle, Lemon Squeezy ou Polar?",
        answer: [
          "Ainda não: por enquanto, o SaaS Monitor lê apenas o Stripe. Se você usa outra plataforma, [conte para a gente no GitHub](issues).",
        ],
      },
      {
        question: "Quanto custa?",
        answer: [
          "A versão hospedada é gratuita durante o beta público. No seu próprio servidor, é gratuita para sempre: o SaaS Monitor é open source sob a licença MIT.",
        ],
      },
      {
        question: "Posso hospedar no meu servidor?",
        answer: [
          "Sim. O SaaS Monitor roda com Docker Compose, ao lado do seu banco MySQL, em qualquer servidor ou Raspberry Pi com sistema de 64 bits. Seus dados do Stripe ficam nele; só as frases personalizadas das vozes, opcionais, são enviadas ao Gradium para serem faladas, e as notificações para celulares passam pelo serviço de push do Expo. [Guia de auto-hospedagem](self-hosting)",
        ],
      },
    ],
    maker: {
      title: "Quem faz",
      text: (director: string) =>
        `O SaaS Monitor é desenvolvido por ${director} na [Synapsr](synapsr).`,
      also: "Também fazemos o [Louez](louez), um software open source para empresas de locação, e o [Hovod](hovod), uma plataforma de vídeo open source que você hospeda por conta própria.",
    },
  },
  closing: {
    title: "Continue. Seu próximo marco está mais perto do que você imagina.",
    primary: "Começar",
    secondary: "Dê uma estrela no GitHub",
  },
  footer: {
    license: "Open source sob a licença MIT.",
    madeBy: "Feito pela [Synapsr](synapsr).",
    trademark:
      "Stripe é uma marca comercial da Stripe, Inc. O SaaS Monitor não tem afiliação com a Stripe nem é endossado por ela.",
    columns: { product: "Produto", openSource: "Open source", legal: "Jurídico" },
    links: {
      demo: "Demo ao vivo",
      sounds: "Sons de notificação do Stripe",
      alternatives: "Alternativas",
      changelog: "Changelog",
      docs: "Documentação",
      github: "GitHub",
      selfHosting: "Auto-hospedagem",
      privacy: "Privacidade",
      terms: "Termos",
      legalNotice: "Aviso legal",
    },
    inEnglish: "em inglês",
    languages: "Idiomas",
  },
  notFound: {
    title: "Página não encontrada",
    heading: "Nada nesta parede",
    text: "Esta página não existe, ou mudou de lugar. A demo ao vivo, por outro lado, nunca para.",
    home: "Voltar ao início",
    demo: "Abrir a demo ao vivo",
  },
  soundPage: {
    meta: {
      title: "Som de notificação do Stripe: como mudar",
      description:
        "O app do Stripe não documenta ajuste de som: quem escolhe é o celular. Como mudar no iPhone e Android, e sons de cha-ching (ou ka-ching) grátis para cada venda.",
    },
    eyebrow: "Som de notificação do Stripe",
    title: "Como mudar o som de notificação do Stripe",
    intro:
      "Resposta curta: nas configurações do seu celular, não no Stripe. O app Stripe Dashboard avisa você sobre novos pagamentos, novos clientes, pagamentos contestados, transferências depositadas e um resumo diário. As configurações que o Stripe documenta ativam ou desativam essas notificações; o som delas fica por conta do celular.",
    change: {
      title: "Mude no seu celular",
      lead: "Primeiro, permita as notificações do Stripe no celular, como o Stripe pede. Depois:",
      source: "Fonte:",
      iphone: {
        title: "No iPhone",
        steps: [
          "Abra **Ajustes** e depois **Notificações**.",
          "Toque em **Stripe**, abaixo de Estilo de Notificação.",
          "Toque em **Sons** e escolha um som.",
        ],
        note: "A Apple observa que a última etapa só funciona se o app for compatível.",
        sources: { apple: "Suporte da Apple" },
      },
      android: {
        title: "No Android",
        steps: [
          "Abra **Configurações** e depois **Notificações** › **Notificações de apps**.",
          "Toque em **Stripe** e depois em uma categoria das notificações dele.",
          "Escolha o som dessa categoria.",
        ],
        note: "O Android permite mudar o som de cada categoria de notificações de um app. Os menus variam de um fabricante para outro.",
        sources: { android: "Ajuda do Android", developers: "Android Developers" },
      },
      stripe: {
        title: "No app do Stripe",
        steps: [
          "Toque no ícone da sua conta, no canto superior esquerdo de qualquer tela.",
          "Abra **Global settings** › **Notification settings**.",
          "Ative ou desative as notificações de cada uma das suas contas.",
        ],
        note: "O Stripe documenta essas opções, mas nenhuma escolha de som.",
        sources: { support: "Suporte do Stripe", app: "App móvel do Stripe Dashboard" },
      },
    },
    library: {
      title: "Ou dê a cada venda um som que a sala inteira ouve",
      lead: "O alerta do celular passa despercebido com facilidade, e só você ouve. O SaaS Monitor coloca a sua receita do Stripe em uma tela no escritório e toca um som a cada pagamento, novo cliente e mudança de MRR, com um de três pacotes. Ouça aqui ou baixe em arquivos WAV, de uso livre sob a licença MIT, que pede que você mantenha o aviso dela junto com eles.",
    },
    voices: {
      title: "E uma voz que diz o que aconteceu",
      lead: "Depois do som, uma tela pode anunciar o momento em voz alta, em inglês, francês, alemão, espanhol ou português. Dez vozes, duas por idioma, com frases gravadas; com uma chave de API do Gradium no servidor, as telas também podem dizer o nome do cliente, o valor ou o plano.",
    },
    questions: {
      title: "Perguntas",
      items: [
        {
          question: "Dá para mudar o som dentro do app do Stripe?",
          answer: [
            "A documentação do Stripe sobre o app Dashboard descreve opções para ativar ou desativar as notificações de cada conta, e nenhuma escolha de som. O som vem das configurações de notificação do seu celular.",
          ],
        },
        {
          question: "Quais eventos do Stripe tocam um som no SaaS Monitor?",
          answer: [
            "Pagamentos, novos clientes, MRR em alta (novas assinaturas, upgrades, reativações) ou em queda (downgrades, cancelamentos, assinaturas não pagas) e marcos: cinco sons por pacote. Para cada tipo de evento, cada tela define se toca o som, se anuncia em voz alta, se mostra um card ou se lista o evento na atividade recente.",
          ],
        },
        {
          question: "O SaaS Monitor substitui o app do Stripe?",
          answer: [
            "Não. Ele lê a sua conta Stripe com uma chave restrita (uma permissão opcional adiciona o próprio webhook) para mostrar a sua receita em uma tela. Continue usando o app do Stripe para reembolsos, repasses e todo o resto.",
          ],
        },
        {
          question: "Preciso instalar alguma coisa para ouvir os sons?",
          answer: [
            "Não. As telas sintetizam os sons no navegador: abra o link de uma tela em uma TV, um Raspberry Pi ou um notebook, e clique uma vez para permitir o som.",
          ],
        },
        {
          question: "Posso usar os arquivos WAV em outros lugares?",
          answer: [
            "Sim. Eles são gerados a partir do código open source do SaaS Monitor, sob a licença MIT, que pede que você mantenha o aviso dela junto com eles. Use-os nos seus próprios alertas, bots ou vídeos.",
          ],
        },
      ],
    },
    closing: {
      title: "Ouça numa parede",
      text: "A demo ao vivo roda um SaaS fictício em que uma venda chega a cada 20 segundos, mais ou menos. Clique uma vez na tela para ligar o som.",
      register: "Abrir a demo com a caixa registradora",
      arcade: "Ou com o fliperama",
    },
  },
};
