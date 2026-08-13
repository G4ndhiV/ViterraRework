/** Re-export para Vite / tests — la fuente vive en api/_lib (paquete de Vercel). */
export {
  type IgPost,
  mapWebProfileEdges,
  unescapeIgUrl,
  scrapePostsFromHtml,
  httpsGetText,
  fetchFreshInstagramPosts,
} from "../../api/_lib/instagramFeedFetch";
