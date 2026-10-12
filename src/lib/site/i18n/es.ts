import type { SiteText } from "./en";

export const es: SiteText = {
  meta: {
    title: "SaaS Monitor · Dashboard de MRR de Stripe open source para la TV",
    description:
      "Tu MRR, tu ARR y cada pago de Stripe, en directo en la TV de la oficina, el móvil y el reloj. Código abierto: gratis durante la beta, o en tu servidor.",
    imageAlt: "SaaS Monitor: mira cómo crece tu SaaS, en directo",
    imageGrowth: (percent) => `${percent} en 30 días`,
  },
  nav: {
    skip: "Ir al contenido",
    home: "SaaS Monitor, inicio",
    main: "Principal",
    demo: "Demo en directo",
    features: "Funciones",
    apps: "Apps",
    pricing: "Precios",
    docs: "Docs",
    github: "GitHub",
    signIn: "Iniciar sesión",
    getStarted: "Empezar",
    menu: "Menú",
    language: "Idioma",
  },
  languageHint: {
    text: "Esta página también está en español.",
    action: "Leer en español",
    dismiss: "Cerrar",
  },
  hero: {
    badge: "Código abierto · Gratis durante la beta pública",
    title: { start: "Mira cómo crece tu SaaS, ", highlight: "en directo", end: "." },
    lead: "SaaS Monitor convierte tu cuenta de Stripe en cifras en directo: MRR o ARR, los ingresos del día y cada pago, con un sonido por venta. En la TV de la oficina, en tu móvil y en tu muñeca.",
    primary: "Empieza gratis",
    secondary: "Abrir la demo en directo",
    points: [
      "Gratis durante la beta",
      "Gratis para siempre en tu servidor",
      "Clave de Stripe de solo lectura",
    ],
  },
  demo: {
    title: "Demo en directo de una pantalla de SaaS Monitor",
    caption:
      "La demo en directo, con un SaaS ficticio. Entra una venta cada 20 segundos, más o menos.",
    captionOn: "Sonido activado: cada venta suena y luego una voz anuncia lo ocurrido.",
    captionBlocked:
      "Tu navegador ha dejado el sonido desactivado. Haz clic en “Escuchar” para intentarlo de nuevo.",
    hear: "Escuchar",
    mute: "Silenciar",
    posterAlt:
      "Una pantalla de SaaS Monitor: el MRR en grande con su crecimiento, el objetivo, la gráfica del MRR, los indicadores de ingresos y los últimos pagos",
    open: "Abrir la demo en directo",
  },
  proof: {
    label: "SaaS Monitor en pocas palabras",
    stars: (count) => `${count} en GitHub`,
    star: "Dale una estrella en GitHub",
    license: "Licencia MIT",
    selfHost: "Docker o Raspberry Pi",
    languages: "7 idiomas",
    privacy: "Sin anuncios ni rastreo",
  },
  features: {
    eyebrow: "En la pared",
    title: "Pensado para darte impulso",
    lead: "Crear un SaaS es una carrera de fondo. Verlo crecer, venta a venta, es lo que hace que un equipo siga construyendo.",
    mrr: {
      title: "La cifra que importa, en grande",
      text: "El MRR en primer plano, con su crecimiento a 30 días, el ARR y el camino hacia tu próximo hito. Legible desde el otro lado de la sala.",
      growth: (amount, percent) => `${amount} · ${percent} en 30 días`,
      toGoal: (amount, goal) => `faltan ${amount} para ${goal}`,
      pace: "a este ritmo: mañana",
    },
    moment: {
      title: "Cada venta es un momento",
      text: "Un sonido, una tarjeta con el importe y el plan, confeti de tu color. Toda la oficina se entera.",
      kind: "Nuevo cliente",
      plan: "Team",
    },
    milestone: {
      title: "Hitos que merecen celebrarse",
      text: "1000 $, 10.000 $, 100.000 $ de MRR o tu propio objetivo, con el día en que lo alcanzarás a tu ritmo actual. Cuando superas uno, la pantalla entera lo celebra.",
      reached: "Objetivo alcanzado",
      next: (amount) => `Próxima parada: ${amount}. Sigue así.`,
    },
    wall: {
      title: "Hecho para la pared",
      text: "Oscuro o claro, con el color de tu marca y en siete idiomas. De un monitor 720p a una TV 4K, la pantalla nunca entra en reposo y se recupera sola.",
    },
    accounts: {
      all: "Todas las cuentas",
      title: "Todos tus productos, en una pantalla",
      text: "Suma varias cuentas de Stripe en una sola moneda, o deja que cada producto tenga su turno. Cada momento indica de dónde viene.",
    },
    honest: {
      title: "Honesto y privado",
      text: "El MRR tal como lo define Stripe, leído con una clave restringida cifrada en reposo. Los nombres de los clientes quedan ocultos salvo que decidas mostrarlos.",
      points: [
        "Clave restringida de solo lectura",
        "Cifrada con AES-256-GCM",
        "Nombres ocultos por defecto",
      ],
    },
  },
  sounds: {
    eyebrow: "Sonido",
    title: "Escucha cómo suena una venta",
    lead: "Tres paquetes de sonidos, sintetizados en el navegador: nada que instalar. Después, una voz anuncia lo ocurrido en el idioma de la pantalla. Elígelos para cada pantalla, o deja en silencio la sala de reuniones.",
    packs: {
      register: {
        name: "Caja registradora",
        description: "El clásico ka-ching: el cajón y la campanilla de la caja.",
      },
      chime: { name: "Carillón", description: "Campanillas suaves para una oficina tranquila." },
      arcade: { name: "Arcade", description: "Monedas y power-ups de 8 bits." },
    },
    events: {
      payment: "Pago",
      customer: "Nuevo cliente",
      mrrUp: "MRR al alza",
      mrrDown: "MRR a la baja",
      milestone: "Hito",
    },
    play: (sound, pack) => `Reproducir el sonido “${sound}” del paquete “${pack}”`,
    download: (sound, pack) =>
      `Descargar el sonido “${sound}” del paquete “${pack}” como archivo WAV`,
    voices: {
      title: "Voces",
      text: "Después del sonido, una voz anuncia lo ocurrido en el idioma de la pantalla. Dos voces por idioma.",
      choose: "Frase que dicen las voces",
      phrases: {
        payment: "Pago",
        subscription: "Nuevo suscriptor",
        customer: "Nuevo cliente",
        upgrade: "Mejora de plan",
        goal: "Objetivo alcanzado",
      },
      play: (voice, language, words) =>
        `Escuchar a ${voice}, una voz en ${language}, decir “${words}”`,
    },
    files: "Descargar todos los sonidos en formato WAV",
  },
  apps: {
    eyebrow: "Apps",
    title: "Tu MRR, también en el bolsillo",
    lead: "La app SaaS Monitor abre cualquier pantalla con su enlace o su código QR, en la versión alojada o en tu propio servidor. Pon el teléfono en horizontal y se convierte en una pantalla de pared. Sin cuenta, sin rastreo.",
    platforms: "iPhone · iPad · Apple Watch · Android · Wear OS",
    features: [
      {
        title: "Cada venta, al momento",
        text: "Una notificación por cada pago, nuevo suscriptor, mejora de plan e hito, en el idioma de la pantalla. En iPhone, puede sonar con el sonido y la voz de la propia pantalla.",
      },
      {
        title: "Widgets en todas partes",
        text: "En iPhone, widgets para la pantalla de inicio, la pantalla bloqueada y StandBy, también en CarPlay. En Android, widgets para la pantalla de inicio.",
      },
      {
        title: "En tu muñeca",
        text: "Apps para Apple Watch y Wear OS, con complicaciones, para llevar tu MRR en la esfera del reloj.",
      },
      {
        title: "Comparte cualquier cifra",
        text: "Mantén pulsada una cifra para compartirla como una imagen limpia, firmada “Powered by SaaS Monitor”.",
      },
    ],
    stores: {
      soon: "Próximamente",
      appStore: {
        soon: "Próximamente en el App Store",
        live: "Descárgalo en el App Store",
        liveLine: "Descárgalo en el",
      },
      googlePlay: {
        soon: "Próximamente en Google Play",
        live: "Disponible en Google Play",
        liveLine: "Disponible en",
      },
    },
    pending: "Las dos apps están en revisión. Aparecerán aquí el día en que se publiquen.",
    images: {
      iphone:
        "La app SaaS Monitor en iPhone: el MRR a punto de alcanzar su objetivo de 15.000 $, la gráfica del MRR y los ingresos de hoy",
      watch: "La app de Apple Watch: el MRR con su crecimiento a 30 días y su gráfica",
      android: "La app de Android compartiendo el MRR como imagen, firmada Powered by SaaS Monitor",
    },
  },
  steps: {
    eyebrow: "Configuración",
    title: "En la pared en dos minutos",
    items: [
      {
        title: "Conecta Stripe",
        text: "Crea una clave restringida de solo lectura con un clic y pégala. Tu historial se importa en un minuto, más o menos.",
      },
      {
        title: "Hazlo tuyo",
        text: "Elige los sonidos, los colores y tu objetivo con una vista previa en directo. Cada cambio se guarda sobre la marcha.",
      },
      {
        title: "Ponlo en la pared",
        text: "Abre el enlace de la pantalla en cualquier TV, monitor o Raspberry Pi. Sin iniciar sesión, nada que instalar.",
      },
    ],
  },
  pricing: {
    eyebrow: "Precios",
    title: "Gratis durante la beta. Gratis para siempre en tu servidor.",
    lead: "SaaS Monitor está en beta pública: la versión alojada es gratis mientras dure. En tu propio servidor, seguirá siendo gratis para siempre.",
    hosted: {
      name: "Lo alojamos por ti",
      badge: "Beta pública",
      price: "Gratis",
      term: "durante la beta pública",
      points: [
        "Todas las funciones, nada que instalar ni actualizar",
        "Actualizaciones al instante con los webhooks de Stripe",
        "Tantas pantallas y compañeros de equipo como quieras",
      ],
      cta: "Empezar",
    },
    selfHosted: {
      name: "En tu propio servidor",
      badge: "Código abierto",
      price: "Gratis",
      term: "para siempre, con licencia MIT",
      points: [
        "Todas las funciones, sin límites",
        "Docker en dos comandos, en cualquier servidor o en una Raspberry Pi",
        "Tus datos de Stripe se quedan en tu servidor",
      ],
      cta: "Guía de autoalojamiento",
    },
  },
  openSource: {
    eyebrow: "Código abierto",
    title: "Tuyo para ejecutar, leer y modificar",
    lead: "SaaS Monitor es de código abierto, con licencia MIT. Ejecútalo con Docker en tu propio servidor o en una Raspberry Pi con dos comandos, sin clonar ni compilar nada. Tu clave de Stripe nunca sale de tu servidor.",
    star: "Dale una estrella en GitHub",
    guide: "Guía de autoalojamiento",
    facts: [
      { value: "MIT", label: "licencia, para siempre" },
      { value: "2", label: "comandos para instalar" },
      { value: "arm64", label: "y amd64, imágenes Docker" },
    ],
    terminal: "Terminal",
    copy: "Copiar",
    copied: "Copiado",
    copyFailed: "Selecciona los comandos para copiarlos",
    script:
      "El [script](install-script) genera un archivo Compose y secretos nuevos, y luego se detiene. Abre localhost:3000 y conecta Stripe.",
  },
  faq: {
    eyebrow: "Preguntas frecuentes",
    title: "Lo que preguntan los fundadores",
    items: [
      {
        question: "¿Mi clave de Stripe está segura?",
        answer: [
          "Conectas Stripe con una clave restringida, creada en tu Stripe Dashboard solo con los permisos que SaaS Monitor necesita: lee las suscripciones, los clientes, los pagos y los productos, precios y cupones que usan. Un permiso es opcional: permite a SaaS Monitor registrar su propio endpoint de webhook, para recibir actualizaciones al instante.",
          "La clave se cifra en reposo con AES-256-GCM, nunca sale del servidor y no vuelve a mostrarse. Puedes revocarla en Stripe en cualquier momento. [Ver todos los permisos](permissions)",
        ],
      },
      {
        question: "¿La cifra coincide con la de mi Stripe Dashboard?",
        answer: [
          "Sí, en la mayoría de los casos: SaaS Monitor sigue la definición de MRR de Stripe. Solo cuentan las suscripciones activas y las vencidas, un precio anual cuenta por una doceava parte y los descuentos se restan, salvo los que se aplican una sola vez.",
          "Hay algunos límites documentados: los precios con impuestos incluidos cuentan con sus impuestos, un cupón eliminado antes de tu primera importación cuenta sobre toda la suscripción y la gráfica anterior a esa importación se reconstruye a partir del importe actual de cada suscripción. [Cómo se calcula el MRR](mrr)",
        ],
      },
      {
        question: "¿Qué datos se guardan?",
        answer: [
          "Tu clave de Stripe, cifrada, y una copia de lo que necesitan tus pantallas: las suscripciones y sus cambios de MRR, los pagos y los nuevos clientes, con su nombre, su correo electrónico y su país. Ningún dato de tarjeta ni bancario. Al desconectar una cuenta se eliminan sus datos. En tu propio servidor, todo se queda ahí, salvo las frases de voz personalizadas, si las activas, que van a Gradium, y las notificaciones a los teléfonos que siguen una pantalla, que pasan por el servicio de notificaciones push de Expo.",
        ],
      },
      {
        question: "¿Con qué televisores funciona?",
        answer: [
          "Con cualquier pantalla que tenga un navegador moderno. Una Raspberry Pi 4 o 5 detrás de la TV da el resultado más fluido: una vez configurada, abre la pantalla ocupando toda la TV, con sonido, cada vez que arranca. También sirven el navegador de una smart TV, un portátil que no uses o una tableta. La pantalla se mantiene activa, se recupera de los cortes de red y se recarga tras las actualizaciones. [Pon una pantalla en la pared](wall)",
        ],
      },
      {
        question: "¿Hay una app móvil?",
        answer: [
          "La app SaaS Monitor, para iPhone, iPad, Apple Watch, Android y Wear OS, abre cualquier pantalla con su enlace o su código QR, en la versión alojada o en tu propio servidor, y te avisa de cada pago, nuevo suscriptor e hito. Sin cuenta, sin rastreo. [Ver la app](apps)",
        ],
      },
      {
        question: "¿Qué idiomas habla una pantalla?",
        answer: [
          "Inglés, francés, alemán, español, italiano, portugués y neerlandés, con los números y las fechas en el formato local. Su voz habla inglés, francés, alemán, español y portugués.",
        ],
      },
      {
        question: "¿Paddle, Lemon Squeezy o Polar?",
        answer: [
          "Todavía no: por ahora, SaaS Monitor solo lee Stripe. Si usas otra plataforma, [cuéntanoslo en GitHub](issues).",
        ],
      },
      {
        question: "¿Cuánto cuesta?",
        answer: [
          "La versión alojada es gratis durante la beta pública. En tu propio servidor, es gratis para siempre: SaaS Monitor es de código abierto, con licencia MIT.",
        ],
      },
      {
        question: "¿Puedo alojarlo yo mismo?",
        answer: [
          "Sí. SaaS Monitor funciona con Docker Compose, junto a su base de datos MySQL, en cualquier servidor o en una Raspberry Pi con un sistema operativo de 64 bits. Tus datos de Stripe se quedan ahí; solo las frases de voz personalizadas, que son opcionales, se envían a Gradium para pronunciarlas, y las notificaciones al teléfono pasan por el servicio de notificaciones push de Expo. [Guía de autoalojamiento](self-hosting)",
        ],
      },
    ],
    maker: {
      title: "Quién lo hace",
      text: (director: string) => `SaaS Monitor lo desarrolla ${director} en [Synapsr](synapsr).`,
      also: "También hacemos [Louez](louez), un software de código abierto para empresas de alquiler, y [Hovod](hovod), una plataforma de vídeo de código abierto que alojas tú mismo.",
    },
  },
  closing: {
    title: "Sigue adelante. Tu próximo hito está más cerca de lo que crees.",
    primary: "Empezar",
    secondary: "Dale una estrella en GitHub",
  },
  footer: {
    license: "Código abierto con licencia MIT.",
    madeBy: "Hecho por [Synapsr](synapsr).",
    trademark:
      "Stripe es una marca comercial de Stripe, Inc. SaaS Monitor no está afiliado a Stripe ni cuenta con su respaldo.",
    columns: { product: "Producto", openSource: "Código abierto", legal: "Legal" },
    links: {
      demo: "Demo en directo",
      sounds: "Sonidos de notificación de Stripe",
      alternatives: "Alternativas",
      changelog: "Novedades",
      docs: "Documentación",
      github: "GitHub",
      selfHosting: "Autoalojamiento",
      privacy: "Privacidad",
      terms: "Condiciones",
      legalNotice: "Aviso legal",
    },
    inEnglish: "en inglés",
    languages: "Idiomas",
  },
  notFound: {
    title: "Página no encontrada",
    heading: "Nada en esta pared",
    text: "Esta página no existe o se ha movido. La demo en directo, en cambio, no se detiene nunca.",
    home: "Volver al inicio",
    demo: "Abrir la demo en directo",
  },
  soundPage: {
    meta: {
      title: "Sonido de notificación de Stripe: cómo cambiarlo",
      description:
        "La app de Stripe no documenta ajustes de sonido: decide tu teléfono. Cómo cambiarlo en iPhone y Android, y sonidos cha-ching (o ka-ching) gratis por cada venta.",
    },
    eyebrow: "Sonido de notificación de Stripe",
    title: "Cómo cambiar el sonido de las notificaciones de Stripe",
    intro:
      "Respuesta corta: en los ajustes de tu teléfono, no en Stripe. La app Stripe Dashboard te envía notificaciones de nuevos pagos, nuevos clientes, pagos en disputa, transferencias depositadas y un resumen diario. Los ajustes que documenta Stripe sirven para activarlas o desactivarlas; cómo suenan depende de tu teléfono.",
    change: {
      title: "Cámbialo en tu teléfono",
      lead: "Primero, permite las notificaciones de Stripe en tu teléfono, como pide Stripe. Después:",
      source: "Fuente:",
      iphone: {
        title: "En iPhone",
        steps: [
          "Abre **Ajustes** y luego **Notificaciones**.",
          "Toca **Stripe**, debajo de Estilo de notificación.",
          "Toca **Sonidos** y elige un sonido.",
        ],
        note: "Apple indica que el último paso solo funciona si la app lo admite.",
        sources: { apple: "Soporte de Apple" },
      },
      android: {
        title: "En Android",
        steps: [
          "Abre **Ajustes** y luego **Notificaciones** › **Notificaciones de aplicaciones**.",
          "Toca **Stripe** y después una categoría de sus notificaciones.",
          "Elige el sonido de esa categoría.",
        ],
        note: "Android te permite cambiar el sonido de cada categoría de notificaciones de una app. Los menús varían de un fabricante a otro.",
        sources: { android: "Ayuda de Android", developers: "Android Developers" },
      },
      stripe: {
        title: "En la app de Stripe",
        steps: [
          "Toca el icono de tu cuenta, arriba a la izquierda de cualquier pantalla.",
          "Abre **Global settings** › **Notification settings**.",
          "Activa o desactiva las notificaciones de cada una de tus cuentas.",
        ],
        note: "Stripe documenta estos interruptores, pero ninguna opción de sonido.",
        sources: { support: "Soporte de Stripe", app: "App móvil Stripe Dashboard" },
      },
    },
    library: {
      title: "O dale a cada venta un sonido que oiga toda la sala",
      lead: "El aviso del teléfono pasa desapercibido con facilidad, y solo lo oyes tú. SaaS Monitor muestra tus ingresos de Stripe en una pantalla de la oficina y reproduce un sonido con cada pago, nuevo cliente y cambio de MRR, de uno de sus tres paquetes. Escúchalos aquí o descárgalos en formato WAV, de uso libre bajo la licencia MIT, que te pide conservar su aviso junto a ellos.",
    },
    voices: {
      title: "Y una voz que anuncia lo ocurrido",
      lead: "Después del sonido, una pantalla puede anunciar el momento en voz alta, en inglés, francés, alemán, español o portugués. Diez voces, dos por idioma, con frases grabadas; con una clave de API de Gradium en el servidor, las pantallas también pueden decir el nombre del cliente, el importe o el plan.",
    },
    questions: {
      title: "Preguntas",
      items: [
        {
          question: "¿Puedo cambiar el sonido dentro de la app de Stripe?",
          answer: [
            "La documentación de Stripe sobre su app Dashboard describe interruptores para activar o desactivar las notificaciones de cada cuenta, pero ninguna opción de sonido. El sonido viene de los ajustes de notificaciones de tu teléfono.",
          ],
        },
        {
          question: "¿Qué eventos de Stripe reproducen un sonido en SaaS Monitor?",
          answer: [
            "Los pagos, los nuevos clientes, el MRR al alza (nuevas suscripciones, mejoras de plan, reactivaciones) o a la baja (bajadas de plan, cancelaciones, suscripciones que quedan impagadas) y los hitos: cinco sonidos por paquete. Para cada tipo de evento, una pantalla elige si reproduce su sonido, lo anuncia en voz alta, muestra una tarjeta o lo añade a la actividad reciente.",
          ],
        },
        {
          question: "¿SaaS Monitor sustituye a la app de Stripe?",
          answer: [
            "No. Lee tu cuenta de Stripe con una clave restringida (un permiso opcional añade su propio webhook) para mostrar tus ingresos en una pantalla. Sigue usando la app de Stripe para los reembolsos, las transferencias y todo lo demás.",
          ],
        },
        {
          question: "¿Tengo que instalar algo para oír los sonidos?",
          answer: [
            "No. Las pantallas sintetizan sus sonidos en el navegador: abre el enlace de una pantalla en una TV, una Raspberry Pi o un portátil, y haz clic una vez para permitir el sonido.",
          ],
        },
        {
          question: "¿Puedo usar los archivos WAV en otros sitios?",
          answer: [
            "Sí. Se generan a partir del código abierto de SaaS Monitor, con licencia MIT, que te pide conservar su aviso junto a ellos. Úsalos en tus propias alertas, bots o vídeos.",
          ],
        },
      ],
    },
    closing: {
      title: "Escúchalo en una pared",
      text: "La demo en directo simula un SaaS ficticio en el que entra una venta cada 20 segundos, más o menos. Haz clic una vez en la pantalla para activar el sonido.",
      register: "Abrir la demo con la caja registradora",
      arcade: "O con el paquete Arcade",
    },
  },
};
