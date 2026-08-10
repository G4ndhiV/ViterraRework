/**
 * Configuración centralizada de capas de mapa (basemaps) para Leaflet.
 * Estilo CARTO Positron: calles blancas sobre terreno gris (mayor contraste que Voyager,
 * cuyo relleno de terreno es un crema casi idéntico al de las calles). El contraste final
 * lo aporta el filtro CSS en `img.viterra-street-tiles` (src/styles/index.css) — se aplica
 * solo a los tiles de calle (vía `className`) para no afectar la capa satelital, que
 * comparte el mismo `.leaflet-tile-pane` cuando ambas capas coexisten en el mismo mapa.
 */
export const MAP_STREET_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const MAP_STREET_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
export const MAP_STREET_TILE_SUBDOMAINS = "abcd";
export const MAP_STREET_TILE_MAX_ZOOM = 20;
export const MAP_STREET_TILE_CLASS_NAME = "viterra-street-tiles";

/**
 * Retorna la capa de mapa estilo CARTO Positron (calles blancas / terreno gris)
 */
export function getViterraStreetTileLayer(L: any) {
  return L.tileLayer(MAP_STREET_TILE_URL, {
    attribution: MAP_STREET_TILE_ATTRIBUTION,
    subdomains: MAP_STREET_TILE_SUBDOMAINS,
    maxZoom: MAP_STREET_TILE_MAX_ZOOM,
    className: MAP_STREET_TILE_CLASS_NAME,
  });
}
