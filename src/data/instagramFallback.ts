export type InstagramPost = {
  shortcode: string;
  type: "reel" | "p";
  videoUrl: string | null;
  thumbnail: string | null;
  caption: string;
};

/**
 * Dataset de respaldo con publicaciones reales de @viterrainmobiliaria.
 * Se utiliza cuando el servidor/API de Instagram o las proxies CORS están inaccesibles.
 */
export const FALLBACK_INSTAGRAM_POSTS: InstagramPost[] = [
  {
    shortcode: "Db866gDlPOA",
    type: "p",
    videoUrl: null,
    thumbnail: null,
    caption: "Conoce nuestras propiedades exclusivas y encuentra el espacio ideal para tu estilo de vida con Viterra Inmobiliaria.",
  },
  {
    shortcode: "Db8mNrED-j1",
    type: "p",
    videoUrl: null,
    thumbnail: null,
    caption: "Descubre los mejores desarrollos residenciales y oportunidades de inversión inmobiliaria.",
  },
  {
    shortcode: "Db4Fw-mjhjI",
    type: "reel",
    videoUrl: null,
    thumbnail: null,
    caption: "Recorrido virtual por nuestros desarrollos más destacados. ¡Contáctanos para agendar una visita!",
  },
];
