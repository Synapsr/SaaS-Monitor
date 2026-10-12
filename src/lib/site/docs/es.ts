import type { DocsText } from "./en";

export const es: DocsText = {
  common: {
    docs: "Docs",
    breadcrumb: "Ruta de navegación",
    pages: {
      overview: "Introducción",
      "get-started": "Primeros pasos",
      "wall-display": "Pantalla de pared",
      customize: "Personalizar",
      apps: "Apps",
      numbers: "Cifras",
      security: "Seguridad",
      "self-hosting": "Autoalojamiento",
    },
    githubDocs: "Documentación en GitHub",
    onThisPage: "En esta página",
    previous: "Anterior",
    next: "Siguiente",
    github: {
      title: "Profundiza en GitHub",
      text: "Las guías completas, con cada opción, comando y límite.",
    },
    cta: {
      title: "Mira tus propias cifras en directo hoy mismo",
      text: "Gratis durante la beta pública. Conecta Stripe con una clave de solo lectura y tu pantalla estará lista en unos dos minutos.",
      primary: "Empieza gratis",
      secondary: "Abrir la demo en directo",
    },
  },
  overview: {
    meta: {
      title: "Documentación: tu MRR de Stripe en la TV en dos minutos",
      description:
        "Guías breves de SaaS Monitor: conecta Stripe con una clave de solo lectura, pon tu MRR en una TV, hazlo tuyo, descarga las apps o alójalo tú mismo.",
    },
    title: "En marcha en dos minutos",
    lead: "Guías breves que se leen en uno o dos minutos: configura SaaS Monitor, hazlo tuyo y descubre por qué puedes confiar en él. Todos los detalles técnicos están en GitHub.",
    start: "Empieza aquí",
    read: "Leer la guía",
    github: {
      title: "¿Prefieres las guías técnicas?",
      text: "La documentación de GitHub cubre cada opción, comando y límite, para desarrolladores y para quienes lo alojan en su propio servidor.",
      links: {
        stripe: "Conectar Stripe",
        wall: "Poner una pantalla en la pared",
        selfHosting: "Autoalojamiento",
      },
    },
  },
  getStarted: {
    summary:
      "Regístrate, conecta Stripe con una clave de solo lectura y abre un enlace en la TV. Unos dos minutos.",
    meta: {
      title: "Primeros pasos: tu MRR de Stripe en la TV en dos minutos",
      description:
        "Crea una cuenta gratis, conecta Stripe con una clave restringida de solo lectura y abre tu pantalla en cualquier TV. Cuatro pasos, unos dos minutos.",
    },
    title: "Empieza en dos minutos",
    lead: "Del registro a tu MRR en la TV de la oficina, en cuatro pasos. Nada que instalar, nada que programar.",
    facts: ["Unos dos minutos", "Clave de Stripe de solo lectura", "Gratis durante la beta"],
    steps: {
      title: "Cuatro pasos",
      account: {
        title: "Crea tu cuenta gratis",
        text: "Regístrate en saas-monitor.com: es gratis durante la beta pública. Tendrás un espacio de trabajo, al que más adelante podrás invitar a tu equipo.",
      },
      connect: {
        title: "Conecta Stripe con una clave de solo lectura",
        text: "Haz clic en **Create a restricted key on Stripe**: el Stripe Dashboard se abre en su formulario de claves, con los permisos correctos ya seleccionados. Revísalos, ponle un nombre a la clave y créala; después, pégala en SaaS Monitor.",
        note: "La clave se comprueba en cuanto la pegas: si falta algún permiso, SaaS Monitor te dice cuál.",
      },
      import: {
        title: "Deja que importe tu historial",
        text: "SaaS Monitor importa tus suscripciones, los pagos de los últimos 12 meses y los clientes de los últimos 7 días. En las cuentas pequeñas tarda unos segundos, en las grandes unos minutos, y el panel muestra el progreso.",
      },
      tv: {
        title: "Abre tu pantalla en la TV",
        text: "Tu primera pantalla se crea en cuanto conectas Stripe. Copia su enlace, ábrelo en el navegador de la TV, en una Raspberry Pi o en un portátil que no uses, y haz clic una vez para activar el sonido.",
        note: "Para escucharla, haz clic en **Send a test celebration** en los ajustes de la pantalla: todas las copias abiertas de la pantalla reproducen una venta de ejemplo.",
      },
    },
    permissions: {
      title: "Qué permisos y por qué",
      lead: "Siete permisos de lectura y uno opcional de escritura. Todos los demás se quedan en Ninguno.",
      columns: { permission: "Permiso", access: "Acceso", why: "Para qué" },
      access: { read: "Lectura", write: "Escritura" },
      optional: "Opcional",
      why: {
        subscriptions: "MRR, mejoras de plan y cancelaciones",
        customers: "Nuevos clientes, con su nombre y su país",
        charges: "Ingresos, y una celebración por cada pago",
        events: "Lo que ha cambiado desde la última comprobación",
        products: "Nombres de los planes",
        prices: "Importes de los precios escalonados",
        coupons: "Descuentos, que reducen el MRR",
        webhooks: "Actualizaciones al instante: SaaS Monitor añade su propio webhook",
      },
      callout: {
        title: "De solo lectura, por diseño",
        text: "Aparte de añadir su propio webhook, si lo permites, la clave solo puede leer: ni cobros, ni reembolsos, ni cambios en tus clientes. Se cifra en reposo, no vuelve a mostrarse nunca y puedes revocarla en Stripe en cualquier momento.",
      },
      webhook:
        "Con el permiso opcional **Webhook Endpoints**, cada venta llega a la pared en cuestión de segundos. [Cómo funcionan las actualizaciones](doc-numbers)",
    },
    test: {
      title: "Empieza con datos de prueba",
      text: "¿Todavía no quieres conectar tu cuenta real? Crea en su lugar una clave del modo de prueba (`rk_test_…`) desde un entorno de prueba de Stripe. Puedes conectar a la vez el modo de prueba y el modo activo de una misma cuenta.",
    },
    next: {
      title: "¿Y ahora qué?",
      text: "Tu pantalla ya funciona tal cual. Cuando tengas un minuto:",
    },
  },
  wallDisplay: {
    summary:
      "Cualquier navegador, una smart TV o una Raspberry Pi: qué muestra la pantalla y cómo funciona sola durante meses.",
    meta: {
      title: "Pon tu dashboard de Stripe en una TV o una Raspberry Pi",
      description:
        "Abre el enlace de tu pantalla en cualquier navegador, smart TV o Raspberry Pi en modo quiosco. Siempre activa, se recupera sola y celebra cada venta.",
    },
    title: "Ponlo en la pared",
    lead: "Una pantalla es una página web pensada para funcionar a pantalla completa, sin supervisión, durante meses. Cualquier dispositivo con un navegador moderno puede mostrarla: sin apps que instalar y sin iniciar sesión.",
    devices: {
      title: "Elige un dispositivo",
      lead: "La pantalla se adapta a cualquier tamaño, de un monitor 720p a una TV 4K, en horizontal o en vertical.",
      recommended: "Recomendado",
      raspberryPi: {
        title: "Raspberry Pi",
        text: "Una Raspberry Pi 4 o 5 detrás de la TV, configurada una sola vez con un bloque de comandos. Abre la pantalla ocupando toda la TV, con sonido, cada vez que arranca: sin teclado, sin ratón y sin un solo clic.",
      },
      smartTv: {
        title: "Smart TV",
        text: "Abre el enlace en el navegador de la TV y haz clic una vez con el mando para activar el sonido. Algunos navegadores de TV son lentos: con una Raspberry Pi todo va más fluido.",
      },
      computer: {
        title: "Portátil, mini PC o Mac",
        text: "Abre el enlace en Chrome, pulsa **F** para ponerlo a pantalla completa y haz clic una vez para activar el sonido. Desactiva el reposo en los ajustes del sistema.",
      },
      tablet: {
        title: "Tableta",
        text: "Añade el enlace a la pantalla de inicio y mantenlo en primer plano con Acceso Guiado en iPad o con la fijación de pantalla en Android.",
      },
      phone: {
        title: "Tu teléfono",
        text: "En la app SaaS Monitor, pon el teléfono en horizontal para pasar al modo TV: la pantalla entera, como en la pared. [Ver las apps](doc-apps)",
      },
      raspberryPiNote:
        "El panel te da el comando para la Raspberry Pi con tu enlace ya incluido, en **Set up a TV or Raspberry Pi**.",
    },
    link: {
      title: "El enlace de tu pantalla",
      text: "Cada pantalla tiene su propio enlace, imposible de adivinar: lo encontrarás en **Screen link**, en los ajustes de la pantalla. Se abre sin iniciar sesión, así que trátalo como una contraseña. **Regenerate link** revoca el anterior con un clic.",
      password: {
        title: "Añade una contraseña",
        text: "Para más seguridad, usa **Set a password**: cada dispositivo la pide una vez y luego la recuerda. Si la cambias, todos los dispositivos vuelven a quedar bloqueados. Los miembros de tu espacio de trabajo con la sesión iniciada nunca la necesitan.",
      },
      phone: {
        title: "Ábrela en tu teléfono",
        text: "En **Open on your phone**, escanea el código QR con la app SaaS Monitor para seguir la pantalla en tu teléfono, con sus widgets y sus notificaciones.",
      },
    },
    shows: {
      title: "Qué muestra la pantalla",
      items: [
        "Tu MRR, o tu ARR, en grande, con su crecimiento a 30 días",
        "El camino hacia tu próximo hito o tu propio objetivo, y el día en que lo alcanzarás a tu ritmo actual",
        "Una gráfica de los últimos 30 días, 90 días o 12 meses, o desde el inicio",
        "Los ingresos de hoy y de este mes, los clientes y el MRR neto nuevo",
        "La actividad en directo: pagos, nuevos clientes, mejoras de plan y cancelaciones",
      ],
    },
    moments: {
      title: "Momentos y celebraciones",
      text: "Cada venta, nuevo cliente o cambio de suscripción aparece en una gran tarjeta en el centro de la pantalla, con su sonido y, si quieres, después una voz. El dinero que entra trae confeti, y cada hito ocupa la pantalla entera.",
      detail:
        "Por defecto, las tarjetas se quedan 10 segundos. Si llegan varias a la vez, se suceden una tras otra.",
      imageAlt:
        "El pago de 199 $ de un nuevo cliente, en una tarjeta en el centro de la pantalla, con confeti",
      tip: {
        title: "Pruébalo desde tu mesa",
        text: "Haz clic en **Send a test celebration** en los ajustes de la pantalla: en pocos segundos, todas las copias abiertas de la pantalla reproducen una venta de ejemplo.",
      },
    },
    unattended: {
      title: "Hecha para funcionar sola",
      items: [
        "Se actualiza cada pocos segundos y se recupera sola tras un corte de red",
        "Evita que la pantalla entre en reposo y oculta el cursor del ratón",
        "De vez en cuando desplaza su contenido unos píxeles, para proteger los paneles OLED",
        "Se recarga sola tras una actualización, así que nunca ejecuta una versión antigua",
      ],
    },
    sound: {
      title: "El sonido en una TV",
      text: "Los navegadores mantienen una página en silencio hasta que alguien interactúa con ella: haz clic una vez en la pantalla y el sonido seguirá activado hasta la próxima recarga. En una Raspberry Pi, el comando del modo quiosco le permite sonar sin ningún clic.",
    },
  },
  customize: {
    summary: "MRR o ARR, tu objetivo, colores, idiomas, sonidos y voces: haz tuya cada pantalla.",
    meta: {
      title: "Personaliza tu pantalla: objetivo, tema, sonidos y voces",
      description:
        "Elige MRR o ARR, fija un objetivo, el tema, el color y el idioma, los sonidos y la voz, y qué hace cada evento de Stripe. Con vista previa en directo.",
    },
    title: "Hazlo tuyo",
    lead: "Cada pantalla tiene sus propios ajustes, con una vista previa en directo justo al lado. Cada cambio se guarda sobre la marcha.",
    editorAlt:
      "El editor de pantallas: los ajustes a la izquierda; la vista previa en directo y el panel para compartir, a la derecha",
    numbers: {
      title: "Tus cifras",
      metric: {
        title: "MRR o ARR",
        text: "Muestra el MRR, o el ARR si es así como cuentas: la cifra principal, la gráfica, el objetivo y los hitos se adaptan. Los pagos y los ingresos siguen siendo lo que pagaron los clientes.",
      },
      goal: {
        title: "Hitos o tu objetivo",
        text: "Los hitos automáticos celebran cada cifra redonda a medida que creces, de 100 $ a 1000 $, 10.000 $ y más allá. O fija tu propio objetivo.",
      },
      chart: {
        title: "Periodo de la gráfica",
        text: "Los últimos 30 días, 90 días o 12 meses, o desde el inicio.",
      },
      currency: {
        title: "Moneda y zona horaria",
        text: "Todos los importes se convierten a la moneda de la pantalla. Su zona horaria decide cuándo empiezan “hoy” y “este mes”.",
      },
    },
    look: {
      title: "Tema y color",
      text: "Oscuro, o claro para salas luminosas. Elige uno de los cinco colores de acento o pega el color de tu marca en hexadecimal: la pantalla lo ajusta si hace falta, para que siga siendo legible.",
      custom: "Tu color",
      imageAlt: "Una pantalla clara en alemán, en un naranja personalizado",
    },
    language: {
      title: "Siete idiomas",
      text: "Una pantalla habla inglés, francés, alemán, español, italiano, portugués o neerlandés, y escribe los números y las fechas en el formato local. El panel, en cambio, sigue en inglés.",
    },
    sound: {
      title: "Sonidos y voces",
      packs:
        "Tres paquetes de sonidos, sintetizados en el propio navegador, con cinco sonidos cada uno, de un pago a un hito. [Escúchalos todos](sounds)",
      voice:
        "Después del sonido, una voz puede anunciar lo ocurrido: dos voces por idioma, en inglés, francés, alemán, español y portugués. El sonido y la voz tienen cada uno su propio interruptor y su propio volumen.",
      own: "**Tus propias frases**: con una clave de API de Gradium en el servidor, la voz dice lo que escribas, con el nombre del cliente, el importe o el plan.",
    },
    events: {
      title: "Qué hace cada evento",
      text: "Para cada tipo de evento, cinco interruptores: aparecer en la actividad reciente, mostrarse en una tarjeta, su sonido, anunciarse en voz alta y una notificación en los teléfonos que siguen la pantalla.",
      event: "Evento",
      columns: {
        feed: "Actividad",
        moment: "Tarjeta",
        sound: "Sonido",
        voice: "Voz",
        push: "Teléfono",
      },
      names: {
        payment: "Pago",
        connectPayment: "Pago para una cuenta conectada",
        subscription: "Nuevo suscriptor",
        upgrade: "Mejora de plan",
        reactivation: "Reactivación",
        downgrade: "Bajada de plan",
        cancellation: "Cancelación",
        unpaid: "Pago fallido",
        customer: "Nuevo cliente",
        milestone: "Hito",
      },
      on: "Sí",
      off: "No",
      caption:
        "Los valores por defecto. Las pérdidas no se anuncian en voz alta, y a los teléfonos solo les llegan las buenas noticias. Las voces hablan en cuanto las activas.",
    },
    accounts: {
      title: "Varias cuentas de Stripe",
      text: "Una pantalla puede mostrar varias cuentas de Stripe, convertidas a su moneda, de dos maneras.",
      added: {
        title: "Sumadas",
        text: "Un único total para todas las cuentas. La actividad reciente indica la cuenta de cada elemento.",
      },
      rotation: {
        title: "De una en una",
        text: "Cada cuenta tiene su turno con sus propias cifras, y también el total de todas, si quieres. Cuando ocurre algo, la pantalla muestra al instante la cuenta correspondiente.",
      },
      imageAlt:
        "Dos productos en una pantalla: un nuevo suscriptor de Acme Analytics, indicado en el momento y en la rotación de arriba",
      more: "O crea una pantalla por producto, y otra tranquila sin sonido para la sala de reuniones: tantas como quieras, cada una con su propio enlace y sus propios ajustes.",
    },
    names: {
      title: "Nombres de los clientes",
      text: "Ocultos por defecto: cualquiera que vea la pantalla sabría quién te paga. Muéstralos si quieres. Los clientes que Stripe solo conoce por su correo electrónico pueden entonces aparecer con su correo, enmascarado (`j•••@gmail.com`) o completo, o no aparecer en absoluto. Las voces nunca leen correos electrónicos.",
    },
  },
  apps: {
    summary:
      "Tus pantallas en iPhone, iPad, Apple Watch, Android y Wear OS, con una notificación por cada venta.",
    meta: {
      title: "La app: tu MRR de Stripe en iPhone, Android y Apple Watch",
      description:
        "Sigue cualquier pantalla en iPhone, iPad, Apple Watch, Android y Wear OS: un aviso por cada venta, widgets, complicaciones y cifras para compartir.",
    },
    title: "Tu MRR en el bolsillo",
    lead: "La app SaaS Monitor abre cualquier pantalla con su enlace o su código QR, en saas-monitor.com o en tu propio servidor. Sin cuenta, sin rastreo.",
    add: {
      title: "Añade una pantalla",
      steps: [
        "En los ajustes de la pantalla, busca **Open on your phone**.",
        "Escanea su código QR con la app o pega el enlace de la pantalla.",
        "Si la pantalla tiene contraseña, escríbela una vez en cada teléfono.",
      ],
    },
    notifications: {
      title: "Una notificación por cada venta",
      text: "Pagos, nuevos suscriptores, mejoras de plan, reactivaciones, nuevos clientes e hitos, en el idioma y la moneda de la pantalla. Una ráfaga de actividad llega como una sola notificación que la resume.",
      choose:
        "Elige qué eventos envían una notificación en la sección **Events** de la pantalla, en **Phone**. En cada teléfono, desactiva las notificaciones de una pantalla o silencia algunos de sus eventos.",
      sound:
        "En iPhone, una notificación puede sonar con el sonido y la voz de la propia pantalla, incluso con el teléfono bloqueado: activa **Play sounds and voices** en los ajustes de la app.",
      speed:
        "Las notificaciones salen en cuanto SaaS Monitor recibe noticias de Stripe: en cuestión de segundos con las [actualizaciones al instante](doc-numbers).",
      now: "ahora",
    },
    widgets: {
      title: "Widgets y relojes",
      text: "En iPhone, widgets para la pantalla de inicio, la pantalla bloqueada y StandBy, también en CarPlay. En Android, widgets para la pantalla de inicio. Las apps para Apple Watch y Wear OS, con complicaciones, llevan tu MRR a la esfera del reloj.",
      wearAlt:
        "La app de Wear OS: el MRR con su crecimiento a 30 días, la gráfica y el progreso hacia el objetivo",
    },
    tv: {
      title: "Modo TV",
      text: "Con una pantalla abierta, pon el teléfono en horizontal para pasar al modo TV: todo a la vez, como en la pared, y el teléfono no entra en reposo. Con **Play sounds and voices** activado, también reproduce el sonido y la voz de cada momento.",
    },
    share: {
      title: "Comparte cualquier cifra",
      text: "Mantén pulsada una cifra para compartirla como una imagen limpia, firmada “Powered by SaaS Monitor”. Ideal para anunciar tu próximo hito.",
      imageAlt: "Un pago de 79 $ compartido como imagen, firmada Powered by SaaS Monitor",
    },
    privacy: {
      title: "Sin cuenta, sin rastreo",
      text: "El enlace de una pantalla es todo lo que la app necesita. No incluye analíticas, publicidad ni rastreo, guarda tus pantallas en el almacenamiento seguro del dispositivo y solo se comunica con el servidor de cada pantalla y con los servicios que entregan las notificaciones. Los clientes solo aparecen con su nombre en las pantallas que muestran nombres. [Política de privacidad](privacy)",
    },
  },
  numbers: {
    summary:
      "El MRR tal como lo define Stripe, para que la pared coincida con tu Stripe Dashboard. ARR, ingresos, monedas y actualizaciones.",
    meta: {
      title: "Cómo se calculan el MRR, el ARR y los ingresos de Stripe",
      description:
        "El MRR según Stripe, para que la cifra de la pared coincida con tu Stripe Dashboard. ARR, ingresos, monedas, actualizaciones al instante e historial.",
    },
    title: "Cifras en las que puedes confiar",
    lead: "SaaS Monitor calcula el MRR tal como lo define Stripe, para que la cifra de la pared se mantenga cerca de la de tu Stripe Dashboard. Así es exactamente como lo hace.",
    mrr: {
      title: "El MRR, tal como lo define Stripe",
      items: [
        "Solo cuentan las suscripciones activas y las vencidas: los periodos de prueba y las suscripciones canceladas, impagadas, en pausa o incompletas, no.",
        "Cada precio se convierte a mensual: un precio anual cuenta por una doceava parte.",
        "Las cantidades, los niveles y los precios por volumen cuentan tal como los factura Stripe.",
        "Los descuentos se restan: los permanentes, y los de varios meses hasta que terminan. Los de una sola vez, no.",
        "Una suscripción programada para cancelarse al final de su periodo deja de contar en cuanto se solicita la cancelación.",
        "El uso medido y los precios de pago único quedan fuera, y no se añaden impuestos.",
      ],
    },
    movements: {
      title: "Cada cambio, registrado",
      text: "Cada cambio de MRR se registra en el momento, y el MRR neto nuevo suma los cambios del mes. Una suscripción perdida indica el motivo: cancelada, no se renovará, pago fallido o en pausa.",
      kinds: {
        new: { name: "Nuevo", text: "empieza a pagar" },
        expansion: { name: "Expansión", text: "paga más" },
        contraction: { name: "Contracción", text: "paga menos" },
        churn: { name: "Cancelación", text: "deja de contar" },
        reactivation: { name: "Reactivación", text: "vuelve a pagar" },
      },
    },
    arr: {
      title: "ARR",
      text: "El ARR es doce veces el MRR. Una pantalla puede mostrarlo como su métrica principal: la cifra principal, la gráfica, el objetivo y los hitos pasan entonces a ARR, mientras que los pagos y los ingresos siguen siendo lo que pagaron los clientes.",
    },
    revenue: {
      title: "Ingresos de hoy y de este mes",
      text: "Los ingresos son lo que pagaron los clientes, descontados los reembolsos: hoy, este mes y, para comparar, los mismos días del mes pasado. Los días y los meses siguen la zona horaria de la pantalla.",
      connect:
        "En una plataforma Stripe Connect, los pagos hechos para cuentas conectadas aparecen en la actividad reciente, y solo la comisión que te quedas cuenta como ingresos tuyos.",
    },
    currencies: {
      title: "Varias monedas",
      text: "Todos los importes se convierten a la moneda de la pantalla al tipo de cambio del día, del Banco Central Europeo, actualizado cada 12 horas. También los valores pasados: la gráfica muestra cómo crece tu negocio, no cómo se mueven los tipos de cambio.",
    },
    updates: {
      title: "Actualizaciones al instante",
      text: "Con un webhook, Stripe avisa a SaaS Monitor en cuanto ocurre algo. Sin él, SaaS Monitor consulta Stripe a un ritmo que respeta el límite de lecturas de Stripe.",
      webhook: { label: "Con un webhook", value: "En cuestión de segundos" },
      polling: {
        label: "Sin webhook",
        value:
          "Cada 17 minutos, más o menos, en las cuentas pequeñas; hasta una vez por minuto en las más activas",
      },
      daily:
        "Además, una comprobación diaria compara cada suscripción con Stripe, por los pocos cambios que Stripe hace sin generar un evento, como un cupón que caduca.",
    },
    history: {
      title: "Tu historial",
      text: "Al conectarte, SaaS Monitor importa tus suscripciones, los pagos de los últimos 12 meses y los clientes de los últimos 7 días. Stripe no guarda ningún historial de los cambios de suscripción pasados, así que la gráfica anterior a ese día se reconstruye a partir del inicio, el final y el importe actual de cada suscripción. A partir de entonces, cada cambio se registra en el momento.",
    },
    limits: {
      title: "Diferencias conocidas",
      text: "Los pocos casos en los que la pared y Stripe pueden no coincidir están documentados:",
      items: [
        "Los precios con impuestos incluidos cuentan con sus impuestos.",
        "Un cupón eliminado antes de tu primera importación cuenta sobre toda la suscripción.",
        "Las mejoras y bajadas de plan anteriores a tu primera importación no aparecen en la gráfica.",
      ],
    },
  },
  security: {
    summary:
      "Una clave de solo lectura, cifrada en reposo. Nombres ocultos por defecto. Código abierto, para que cualquiera pueda comprobarlo.",
    meta: {
      title: "Seguridad: clave de Stripe de solo lectura cifrada en reposo",
      description:
        "Conecta Stripe con una clave restringida de solo lectura, cifrada con AES-256-GCM. Sin anuncios ni rastreo, nombres ocultos por defecto y código abierto.",
    },
    title: "Conéctalo con tranquilidad",
    lead: "SaaS Monitor solo lee lo que tus pantallas necesitan, guarda tu clave cifrada y no muestra nada que no hayas elegido. Es de código abierto, así que no tienes por qué fiarte solo de nuestra palabra.",
    facts: [
      { value: "Solo lectura", label: "clave restringida de Stripe" },
      { value: "AES-256-GCM", label: "cifrado en reposo" },
      { value: "MIT", label: "código abierto, para que cualquiera lo compruebe" },
    ],
    key: {
      title: "Una clave que solo puede leer",
      text: "Conectas Stripe con una clave restringida, creada en tu Stripe Dashboard solo con los permisos que SaaS Monitor necesita: nunca te pide tu clave secreta. El único permiso de escritura, que es opcional, le permite añadir su propio webhook para recibir actualizaciones al instante. Revoca la clave en Stripe cuando quieras. [Ver todos los permisos](permissions)",
    },
    encryption: {
      title: "Cifrada, y nunca vuelve a mostrarse",
      text: "Las claves se cifran en reposo con AES-256-GCM y nunca salen del servidor: el panel solo muestra una versión enmascarada. Los webhooks de Stripe se verifican con su secreto de firma.",
    },
    data: {
      title: "Qué se guarda",
      text: "Tu clave de Stripe, cifrada, y una copia de lo que necesitan tus pantallas: las suscripciones y sus cambios de MRR, los pagos y los nuevos clientes, con su nombre, su correo electrónico y su país. Ningún dato de tarjeta ni bancario.",
      delete:
        "Si desconectas una cuenta de Stripe, todo lo que se importó de ella se elimina al instante.",
    },
    screens: {
      title: "Las pantallas solo muestran lo que eliges",
      items: [
        "Los nombres y los correos electrónicos de los clientes no aparecen en tus pantallas ni en sus notificaciones, salvo que los actives.",
        "El enlace de una pantalla es imposible de adivinar, y **Regenerate link** revoca el anterior.",
        "Añade una contraseña y cada dispositivo tendrá que escribirla una vez.",
      ],
    },
    tracking: {
      title: "Sin anuncios ni rastreo",
      text: "El sitio no usa analíticas ni carga scripts de terceros. Sin cookies publicitarias ni de rastreo, y tus datos nunca se venden. La app tampoco tiene cuenta ni rastreo. [Política de privacidad](privacy)",
    },
    others: {
      title: "Quién más ve qué",
      text: "Solo lo que tú activas: las frases de voz personalizadas se envían a Gradium para pronunciarlas, y las notificaciones al teléfono pasan por los servicios push que las entregan.",
    },
    openSource: {
      title: "Código abierto, para que cualquiera pueda comprobarlo",
      text: "Cada línea de SaaS Monitor está en GitHub, con licencia MIT: lee cómo se guarda tu clave o ejecútalo en tu propio servidor, donde se quedan tus datos de Stripe.",
      report: "¿Has encontrado una vulnerabilidad? Avísanos en privado",
    },
  },
  selfHosting: {
    summary:
      "Dos comandos con Docker, en cualquier servidor o en una Raspberry Pi. Gratis para siempre, con licencia MIT.",
    meta: {
      title: "Autoalojamiento: SaaS Monitor con Docker en dos comandos",
      description:
        "Aloja SaaS Monitor en tu servidor o Raspberry Pi con Docker Compose: dos comandos, gratis para siempre (MIT). HTTPS, actualizaciones, copias de seguridad.",
    },
    title: "Ejecútalo en tu propio servidor",
    lead: "SaaS Monitor es un servidor Next.js y una base de datos MySQL. Con Docker, funciona en cualquier servidor, en un ordenador que no uses o en una Raspberry Pi, con todas las funciones y gratis para siempre.",
    install: {
      title: "Instálalo con dos comandos",
      requirements:
        "Necesitas Docker con Compose, en un servidor, un ordenador que no uses o una Raspberry Pi con un sistema operativo de 64 bits.",
      script:
        "El [script](install-script) crea una carpeta `saas-monitor` con un archivo Compose y un `.env` con secretos nuevos, y luego se detiene: no necesita root, no arranca nada y no toca nada más.",
      then: "Abre `http://localhost:3000`, crea tu cuenta y conecta Stripe. Las migraciones de la base de datos se ejecutan solas.",
    },
    tv: {
      title: "Ábrelo desde la TV",
      text: "En `.env`, pon en `APP_URL` la dirección que usará la TV, como `http://192.168.1.20:3000`, y vuelve a ejecutar `docker compose up -d`: los enlaces de las pantallas se construyen a partir de ella.",
      callout: {
        title: "Guarda bien ENCRYPTION_KEY",
        text: "Cifra las claves de Stripe de tu base de datos. No la cambies nunca: sin ella, habría que volver a conectar todas las cuentas de Stripe.",
      },
    },
    https: {
      title: "HTTPS para actualizaciones al instante",
      text: "Una red local basta para una TV en la misma oficina. Pon SaaS Monitor detrás de HTTPS con un dominio para abrir las pantallas desde cualquier lugar y recibir actualizaciones al instante: Stripe solo envía webhooks a una dirección HTTPS pública. Sirve cualquier proxy inverso, como Caddy.",
      without:
        "Sin HTTPS, SaaS Monitor consulta Stripe a un ritmo constante, cada 17 minutos más o menos en las cuentas pequeñas.",
    },
    updates: {
      title: "Actualizaciones",
      text: "Descarga la nueva imagen y reinicia: las pantallas abiertas detectan la nueva versión y se recargan solas. Para actualizar cuando tú decidas, fija una versión con `SAAS_MONITOR_VERSION`.",
    },
    data: {
      title: "Qué se queda en tu servidor",
      text: "Todo: tu clave de Stripe, tus datos y tus ajustes viven en tu propia base de datos MySQL, y un solo comando hace la copia de seguridad. Dos funciones opcionales se comunican con el exterior: las frases de voz personalizadas se envían a Gradium para pronunciarlas, y las notificaciones al teléfono pasan por el servicio de notificaciones push de Expo.",
      signups:
        "Cuando tu equipo se haya registrado, pon `DISABLE_SIGNUPS=true`: nadie más podrá crear una cuenta, y las invitaciones seguirán funcionando.",
    },
    cta: {
      title: "Dos comandos y es tuyo",
      text: "Todas las funciones, gratis para siempre. La guía completa cubre la configuración, HTTPS, las actualizaciones, las copias de seguridad y la compilación desde el código fuente.",
      guide: "Guía completa de autoalojamiento en GitHub",
    },
  },
};
