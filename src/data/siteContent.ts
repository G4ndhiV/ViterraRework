/**
 * Contenido editable del sitio (excepto listados Renta/Compra que siguen en sus rutas).
 * Persistencia: localStorage bajo SITE_CONTENT_KEY.
 */

export const SITE_CONTENT_KEY = "viterra_site_content";

export type ServiceCardLink = "/renta" | "/venta" | "/desarrollos" | "/contacto" | "";

export interface ServiceCardContent {
  title: string;
  description: string;
  bullets: [string, string, string];
  linkLabel: string;
  /** Rutas fijas; vacío = sin enlace */
  linkTo: ServiceCardLink;
}

export interface SiteContent {
  home: {
    heroImage: string;
    heroKicker: string;
    heroTitle: string;
    heroSubtitle: string;
    heroLinkDevLabel: string;
    heroLinkAboutLabel: string;
    heroCtaPrimary: string;
    heroCtaSecondary: string;
    searchImage: string;
    searchKicker: string;
    searchTitle: string;
    searchSubtitle: string;
    selectionImage: string;
    selectionKicker: string;
    selectionTitle: string;
    selectionSubtitle: string;
    selectionCatalogLink: string;
    selectionRentLabel: string;
    selectionSaleLabel: string;
    experienceImage: string;
    experienceKicker: string;
    experienceTitle: string;
    experienceLead: string;
    experienceBody: string;
    experienceCta: string;
    closingKicker: string;
    closingTitle: string;
    closingSubtitle: string;
    closingBtnPrimary: string;
    closingBtnSecondary: string;
  };
  contact: {
    heroTitle: string;
    heroSubtitle: string;
    infoTitle: string;
    addressTitle: string;
    addressLines: string;
    phoneTitle: string;
    phoneLines: string;
    emailTitle: string;
    emailLines: string;
    hoursTitle: string;
    hoursLines: string;
    quickTitle: string;
    quickSubtitle: string;
    quickWhatsappLabel: string;
    quickWhatsappHref: string;
    formTitle: string;
    successTitle: string;
    successSubtitle: string;
    mapLat: number;
    mapLng: number;
    mapPopupTitle: string;
    mapPopupAddress: string;
    mapSectionKicker: string;
    mapSectionTitle: string;
  };
  services: {
    heroImage: string;
    heroTitle: string;
    heroSubtitle: string;
    cards: ServiceCardContent[];
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
  };
  about: {
    heroTitle: string;
    heroSubtitle: string;
    storyKicker: string;
    storyTitle: string;
    storyP1: string;
    storyP2: string;
    storyP3: string;
    storyImage: string;
    missionTitle: string;
    missionText: string;
    visionTitle: string;
    visionText: string;
    valuesKicker: string;
    valuesTitle: string;
    valuesIntro: string;
    values: { title: string; text: string }[];
    stats: { value: string; label: string }[];
    statsSectionTitle: string;
    timelineKicker: string;
    timelineTitle: string;
    timelineIntro: string;
    milestones: { year: string; title: string; description: string }[];
    teamKicker: string;
    teamTitle: string;
    teamIntro: string;
    team: { name: string; role: string; initials: string }[];
  };
  developments: {
    heroImage: string;
    heroTitle: string;
    heroSubtitle: string;
    featuredKicker: string;
    featuredTitle: string;
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  home: {
    heroImage:
      "https://images.unsplash.com/photo-1774685110718-c5b4fe026144?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtb2Rlcm4lMjBob21lJTIwZXh0ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc2MDk1NzU3fDA&ixlib=rb-4.1.0&q=80&w=1920",
    heroKicker: "Inmuebles y residencias de lujo",
    heroTitle: "¿A dónde quiere ir?",
    heroSubtitle: "Somos líderes en propiedades de lujo.",
    heroLinkDevLabel: "Nuevo desarrollo",
    heroLinkAboutLabel: "El mundo de Viterra",
    heroCtaPrimary: "Comience su búsqueda",
    heroCtaSecondary: "Ver nuestras exclusivas",
    searchImage:
      "https://images.unsplash.com/photo-1758448511322-8bfc73daf606?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBwZW50aG91c2UlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzc2MDk1NzU3fDA&ixlib=rb-4.1.0&q=80&w=1920",
    searchKicker: "Búsqueda",
    searchTitle: "Encuentre su próxima propiedad",
    searchSubtitle: "Indique criterios o explore el catálogo completo.",
    selectionImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920",
    selectionKicker: "Selección",
    selectionTitle: "Lo último en propiedades de lujo",
    selectionSubtitle: "Estilo de vida y ubicaciones excepcionales, elegidas para usted.",
    selectionCatalogLink: "Ver catálogo",
    selectionRentLabel: "Propiedades en renta",
    selectionSaleLabel: "Propiedades en venta",
    experienceImage:
      "https://images.unsplash.com/photo-1758448511322-8bfc73daf606?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBwZW50aG91c2UlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzc2MDk1NzU3fDA&ixlib=rb-4.1.0&q=80&w=1600",
    experienceKicker: "Experiencia",
    experienceTitle: "Un estándar distinto en corretaje residencial",
    experienceLead: "Asesoría discreta y rigor en cada etapa.",
    experienceBody:
      "Acceso a cartera off-market y acompañamiento integral, con la exigencia que merece el segmento premium.",
    experienceCta: "Conozca Viterra",
    closingKicker: "Contacto",
    closingTitle: "¿Hablamos de su próximo hogar?",
    closingSubtitle: "Un asesor puede orientarle en venta, renta o inversión en desarrollo.",
    closingBtnPrimary: "Contacto",
    closingBtnSecondary: "Ver listados",
  },
  contact: {
    heroTitle: "Contáctanos",
    heroSubtitle: "Estamos aquí para ayudarte a encontrar tu hogar ideal",
    infoTitle: "Información de Contacto",
    addressTitle: "Dirección",
    addressLines: "Av. Principal 123\nGuadalajara, Jalisco",
    phoneTitle: "Teléfono",
    phoneLines: "(123) 456-7890\n(098) 765-4321",
    emailTitle: "Email",
    emailLines: "info@viterra.com\nventas@viterra.com",
    hoursTitle: "Horario",
    hoursLines: "Lunes - Viernes: 9:00 - 18:00\nSábados: 10:00 - 14:00\nDomingos: Cerrado",
    quickTitle: "¿Necesitas ayuda inmediata?",
    quickSubtitle: "Nuestro equipo está disponible para atenderte por WhatsApp",
    quickWhatsappLabel: "Chatear por WhatsApp",
    quickWhatsappHref: "https://wa.me/1234567890",
    formTitle: "Envíanos un Mensaje",
    successTitle: "¡Mensaje enviado con éxito!",
    successSubtitle: "Nos pondremos en contacto contigo pronto.",
    mapLat: 20.676208,
    mapLng: -103.34721,
    mapPopupTitle: "Viterra Inmobiliaria",
    mapPopupAddress: "Av. Principal 123<br/>Guadalajara, Jalisco",
    mapSectionKicker: "Visítanos",
    mapSectionTitle: "Nuestra Ubicación",
  },
  services: {
    heroImage:
      "https://wallpapers.com/images/hd/4k-office-background-silapjkl0bkxakj4.jpg",
    heroTitle: "Nuestros servicios",
    heroSubtitle: "Soluciones integrales para todas tus necesidades inmobiliarias",
    cards: [
      {
        title: "Renta de Propiedades",
        description:
          "Encuentra el hogar perfecto para ti. Contamos con una amplia selección de propiedades en renta en las mejores zonas de Guadalajara.",
        bullets: ["Propiedades verificadas y de calidad", "Asesoría personalizada", "Proceso rápido y seguro"],
        linkLabel: "Ver propiedades en renta",
        linkTo: "/renta",
      },
      {
        title: "Venta de Propiedades",
        description:
          "Invierte en tu patrimonio con las mejores opciones del mercado. Te ayudamos a encontrar la propiedad ideal.",
        bullets: ["Análisis de inversión", "Financiamiento disponible", "Trámites legales incluidos"],
        linkLabel: "Ver propiedades en venta",
        linkTo: "/venta",
      },
      {
        title: "Desarrollos Inmobiliarios",
        description:
          "Proyectos exclusivos en preventa y construcción. Asegura tu inversión con las mejores plusvalías.",
        bullets: ["Precios de preventa", "Seguimiento de obra", "Garantía de desarrolladora"],
        linkLabel: "Ver desarrollos",
        linkTo: "/desarrollos",
      },
      {
        title: "Asesoría Legal",
        description:
          "Acompañamiento legal completo en todas tus transacciones inmobiliarias para garantizar tu seguridad.",
        bullets: ["Revisión de contratos", "Trámites notariales", "Escrituración segura"],
        linkLabel: "",
        linkTo: "",
      },
      {
        title: "Avalúos y Valuación",
        description: "Conoce el valor real de tu propiedad con nuestros avalúos profesionales certificados.",
        bullets: ["Avalúos certificados", "Análisis de mercado", "Reporte detallado"],
        linkLabel: "",
        linkTo: "",
      },
      {
        title: "Administración de Propiedades",
        description: "Despreocúpate y deja la gestión de tu propiedad en manos de expertos profesionales.",
        bullets: ["Cobranza de rentas", "Mantenimiento preventivo", "Atención a inquilinos"],
        linkLabel: "",
        linkTo: "",
      },
    ],
    ctaTitle: "¿Necesitas ayuda con tu proyecto inmobiliario?",
    ctaSubtitle: "Nuestro equipo de expertos está listo para asesorarte",
    ctaButton: "Contactar Ahora",
  },
  about: {
    heroTitle: "Sobre nosotros",
    heroSubtitle: "Conoce nuestra trayectoria y compromiso con la excelencia inmobiliaria",
    storyKicker: "Nuestra Trayectoria",
    storyTitle: "Una Historia de Excelencia",
    storyP1:
      "Viterra Inmobiliaria nació en 2009 con una visión clara: revolucionar la forma en que las personas buscan y encuentran propiedades. Fundada por un equipo de expertos en bienes raíces, comenzamos con un pequeño equipo apasionado por hacer la diferencia.",
    storyP2:
      "A lo largo de los años, hemos crecido hasta convertirnos en una de las inmobiliarias más confiables y respetadas del país. Nuestro compromiso con la excelencia, la transparencia y el servicio personalizado nos ha permitido ayudar a más de 1,200 familias a encontrar su hogar ideal.",
    storyP3:
      "Hoy, con más de 50 asesores expertos y una cartera de más de 500 propiedades, continuamos innovando y mejorando nuestros servicios para ofrecer la mejor experiencia en bienes raíces.",
    storyImage:
      "https://images.unsplash.com/photo-1774192620890-f61475279725?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsdXh1cnklMjBvZmZpY2UlMjBidWlsZGluZyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ0MDE1MTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    missionTitle: "Nuestra Misión",
    missionText:
      "Proporcionar servicios inmobiliarios excepcionales que superen las expectativas de nuestros clientes, facilitando transacciones seguras y transparentes mientras construimos relaciones de confianza a largo plazo. Nos comprometemos a ofrecer asesoramiento experto y soluciones personalizadas para cada necesidad.",
    visionTitle: "Nuestra Visión",
    visionText:
      "Ser la inmobiliaria líder y más confiable del país, reconocida por nuestra innovación, integridad y excelencia en el servicio al cliente. Aspiramos a transformar la industria inmobiliaria mediante tecnología de vanguardia y un enfoque centrado en las personas.",
    valuesKicker: "Principios",
    valuesTitle: "Nuestros Valores",
    valuesIntro: "Los principios que guían cada decisión y acción en Viterra Inmobiliaria",
    values: [
      { title: "Excelencia", text: "Nos esforzamos por la perfección en cada detalle de nuestro servicio." },
      { title: "Integridad", text: "Actuamos con honestidad y transparencia en todas nuestras relaciones." },
      { title: "Compromiso", text: "Dedicados al éxito y satisfacción de cada uno de nuestros clientes." },
      { title: "Innovación", text: "Constantemente mejorando y adoptando nuevas tecnologías y métodos." },
    ],
    stats: [
      { value: "15+", label: "Años de Experiencia" },
      { value: "1,200+", label: "Clientes Satisfechos" },
      { value: "500+", label: "Propiedades" },
      { value: "50+", label: "Asesores Expertos" },
    ],
    statsSectionTitle: "",
    timelineKicker: "Trayectoria",
    timelineTitle: "Hitos Importantes",
    timelineIntro: "Los momentos clave que han marcado nuestra historia",
    milestones: [
      { year: "2009", title: "Fundación de Viterra", description: "Iniciamos operaciones con un equipo apasionado de 5 personas y la visión de transformar el mercado inmobiliario." },
      { year: "2012", title: "Expansión Regional", description: "Abrimos nuestra segunda oficina y alcanzamos las 100 propiedades en cartera." },
      { year: "2015", title: "Certificación ISO 9001", description: "Obtuvimos la certificación de calidad internacional, respaldando nuestros procesos y compromiso con la excelencia." },
      { year: "2018", title: "Plataforma Digital", description: "Lanzamos nuestra plataforma web moderna, facilitando la búsqueda de propiedades para miles de clientes." },
      { year: "2021", title: "1000+ Familias", description: "Alcanzamos el hito de ayudar a más de mil familias a encontrar su hogar ideal." },
      { year: "2024", title: "Líder del Mercado", description: "Nos consolidamos como una de las inmobiliarias más confiables con 500+ propiedades activas y 50 asesores expertos." },
    ],
    teamKicker: "Equipo",
    teamTitle: "Nuestro Equipo",
    teamIntro: "Profesionales dedicados con años de experiencia en el mercado inmobiliario",
    team: [
      { name: "María González", role: "CEO & Fundadora", initials: "MG" },
      { name: "Carlos Rodríguez", role: "Director de Ventas", initials: "CR" },
      { name: "Ana Martínez", role: "Gerente de Operaciones", initials: "AM" },
    ],
  },
  developments: {
    heroImage:
      "https://images.adsttc.com/media/images/5ef2/f7ce/b357/6589/8c00/019a/large_jpg/847A0737.jpg?1592981436",
    heroTitle: "Proyectos Excepcionales",
    heroSubtitle:
      "Descubre nuestros desarrollos inmobiliarios exclusivos con arquitectura vanguardista y amenidades de clase mundial.",
    featuredKicker: "Destacados",
    featuredTitle: "Proyectos Exclusivos",
  },
};
