/**
 * Configuración centralizada de capas de mapa (basemaps) para Leaflet.
 * Estilo CARTO Voyager nativo de alta resolución: nitidez 100%, nombres de calles legibles y tipografía clara.
 */
export const MAP_STREET_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const MAP_STREET_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
export const MAP_STREET_TILE_SUBDOMAINS = "abcd";
export const MAP_STREET_TILE_MAX_ZOOM = 20;

/**
 * Retorna la capa de mapa estilo CARTO Voyager nativa sin filtros
 */
export function getViterraStreetTileLayer(L: any) {
  return L.tileLayer(MAP_STREET_TILE_URL, {
    attribution: MAP_STREET_TILE_ATTRIBUTION,
    subdomains: MAP_STREET_TILE_SUBDOMAINS,
    maxZoom: MAP_STREET_TILE_MAX_ZOOM,
  });
}
