import { useEffect, useRef } from 'react';
import { Property } from './PropertyCard';

interface PropertyMapProps {
  properties: Property[];
}

/** Paleta manual Viterra: venta = rojo primario, alquiler = navy */
const MAP_COLOR_VENTA = "#C8102E";
const MAP_COLOR_ALQUILER = "#141c2e";

// Función para obtener el icono según el tipo de propiedad
const getPropertyIcon = (type: string, status: string) => {
  const color = status === "venta" ? MAP_COLOR_VENTA : MAP_COLOR_ALQUILER;
  
  const icons: Record<string, string> = {
    'Casa': `
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="${color}" stroke="white" stroke-width="3"/>
        <path d="M24 15L16 21V30H20V26H28V30H32V21L24 15Z" fill="white"/>
        <rect x="20" y="26" width="8" height="4" fill="white"/>
      </svg>
    `,
    'Apartamento': `
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="${color}" stroke="white" stroke-width="3"/>
        <rect x="17" y="16" width="14" height="16" rx="1" fill="white"/>
        <rect x="19" y="18" width="3" height="3" fill="${color}"/>
        <rect x="23" y="18" width="3" height="3" fill="${color}"/>
        <rect x="27" y="18" width="3" height="3" fill="${color}"/>
        <rect x="19" y="22" width="3" height="3" fill="${color}"/>
        <rect x="23" y="22" width="3" height="3" fill="${color}"/>
        <rect x="27" y="22" width="3" height="3" fill="${color}"/>
        <rect x="23" y="27" width="3" height="5" fill="${color}"/>
      </svg>
    `,
    'Penthouse': `
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="${color}" stroke="white" stroke-width="3"/>
        <path d="M24 14L16 20V31H32V20L24 14Z" fill="white"/>
        <rect x="19" y="22" width="3" height="3" fill="${color}"/>
        <rect x="26" y="22" width="3" height="3" fill="${color}"/>
        <rect x="22" y="26" width="4" height="5" fill="${color}"/>
        <path d="M16 20L24 14L32 20" stroke="white" stroke-width="2"/>
      </svg>
    `,
    'Villa': `
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="${color}" stroke="white" stroke-width="3"/>
        <path d="M24 14L15 21V31H33V21L24 14Z" fill="white"/>
        <rect x="21" y="26" width="6" height="5" fill="${color}"/>
        <rect x="17" y="22" width="3" height="3" fill="${color}"/>
        <rect x="28" y="22" width="3" height="3" fill="${color}"/>
      </svg>
    `
  };

  return icons[type] || icons['Casa'];
};

export function PropertyMap({ properties }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    // Importar Leaflet dinámicamente
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current || isInitializingRef.current) return;

      isInitializingRef.current = true;

      try {
        // Importar Leaflet dinámicamente
        const L = await import('leaflet');
        
        // Asignar Leaflet al window para que el plugin pueda extenderlo
        (window as any).L = L;
        
        // Importar CSS de Leaflet
        await import('leaflet/dist/leaflet.css');
        
        // Importar MarkerCluster desde el archivo dist
        await import('leaflet.markercluster/dist/leaflet.markercluster.js');
        await import('leaflet.markercluster/dist/MarkerCluster.css');
        await import('leaflet.markercluster/dist/MarkerCluster.Default.css');

        // Esperar un momento para que el plugin se cargue
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verificar de nuevo si el mapa ya fue inicializado
        if (mapInstanceRef.current) {
          isInitializingRef.current = false;
          return;
        }

        // Filtrar propiedades que tengan coordenadas
        const propertiesWithCoordinates = properties.filter(p => p.coordinates);

        if (propertiesWithCoordinates.length === 0) {
          isInitializingRef.current = false;
          return;
        }

        // Calcular el centro del mapa
        const center: [number, number] = [
          propertiesWithCoordinates.reduce((sum, p) => sum + (p.coordinates?.lat || 0), 0) / propertiesWithCoordinates.length,
          propertiesWithCoordinates.reduce((sum, p) => sum + (p.coordinates?.lng || 0), 0) / propertiesWithCoordinates.length
        ];

        // Crear el mapa
        const map = (L as any).map(mapRef.current).setView(center, 13);

        // Añadir capa de tiles con estilo moderno (CartoDB Voyager - similar a Google Maps)
        (L as any).tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        // Verificar si markerClusterGroup está disponible
        if (typeof (L as any).markerClusterGroup !== 'function') {
          console.error('MarkerClusterGroup not loaded, falling back to regular markers');
          
          // Fallback: usar marcadores regulares sin clustering
          propertiesWithCoordinates.forEach((property) => {
            if (property.coordinates) {
              const customIcon = (L as any).divIcon({
                className: 'custom-marker',
                html: `
                  <div style="position: relative; cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));">
                    ${getPropertyIcon(property.type, property.status)}
                  </div>
                `,
                iconSize: [48, 48],
                iconAnchor: [24, 24],
                popupAnchor: [0, -24]
              });

              const marker = (L as any).marker([property.coordinates.lat, property.coordinates.lng], { icon: customIcon });

              const popupContent = `
                <div style="font-family: Poppins, sans-serif; width: 280px;">
                  <a href="/propiedades/${property.id}" style="text-decoration: none; display: block;">
                    <div style="position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 16px;">
                      <img
                        src="${property.image}"
                        alt="${property.title}"
                        style="width: 100%; height: 180px; object-fit: cover; display: block;"
                      />
                      <div style="position: absolute; top: 12px; left: 12px;">
                        <span style="
                          padding: 6px 12px; 
                          border-radius: 8px; 
                          font-size: 12px; 
                          font-weight: 600;
                          background: rgba(255, 255, 255, 0.95);
                          color: #0F172A;
                          backdrop-filter: blur(8px);
                        ">
                          ${property.type}
                        </span>
                      </div>
                    </div>
                    <h3 style="font-weight: 600; font-size: 18px; color: #0F172A; margin: 0 0 8px 0; line-height: 1.4;">
                      ${property.title}
                    </h3>
                    <p style="font-size: 14px; color: #64748B; margin: 0 0 16px 0;">
                      ${property.location}
                    </p>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                      <p style="font-weight: 700; font-size: 24px; color: #0F172A; margin: 0;">
                        $${property.price.toLocaleString()}
                      </p>
                      <span style="
                        padding: 6px 12px; 
                        border-radius: 8px; 
                        font-size: 12px; 
                        font-weight: 600;
                        ${property.status === "venta" 
                          ? `background-color: ${MAP_COLOR_VENTA}; color: white;` 
                          : `background-color: ${MAP_COLOR_ALQUILER}; color: white;`
                        }
                      ">
                        ${property.status === "venta" ? "Venta" : "Alquiler"}
                      </span>
                    </div>
                  </a>
                </div>
              `;

              marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup',
                closeButton: true
              });

              marker.addTo(map);
            }
          });
          
          mapInstanceRef.current = map;
          isInitializingRef.current = false;
          return;
        }

        // Crear grupo de clusters
        const markers = (L as any).markerClusterGroup({
          maxClusterRadius: 60,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          iconCreateFunction: function(cluster: any) {
            const count = cluster.getChildCount();
            return (L as any).divIcon({
              html: `
                <div style="
                  background: linear-gradient(135deg, ${MAP_COLOR_VENTA} 0%, #7f1d1d 100%);
                  width: 50px;
                  height: 50px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(200, 16, 46, 0.45);
                  font-weight: 700;
                  font-size: 16px;
                  color: white;
                  font-family: Poppins, sans-serif;
                ">
                  ${count}
                </div>
              `,
              className: 'custom-cluster-icon',
              iconSize: (L as any).point(50, 50)
            });
          }
        });

        // Añadir marcadores
        propertiesWithCoordinates.forEach((property) => {
          if (property.coordinates) {
            // Crear icono personalizado según el tipo
            const customIcon = (L as any).divIcon({
              className: 'custom-marker',
              html: `
                <div style="position: relative; cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));">
                  ${getPropertyIcon(property.type, property.status)}
                </div>
              `,
              iconSize: [48, 48],
              iconAnchor: [24, 24],
              popupAnchor: [0, -24]
            });

            const marker = (L as any).marker([property.coordinates.lat, property.coordinates.lng], { icon: customIcon });

            // Crear popup HTML mejorado
            const popupContent = `
              <div style="font-family: Poppins, sans-serif; width: 280px;">
                <a href="/propiedades/${property.id}" style="text-decoration: none; display: block;">
                  <div style="position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 16px;">
                    <img
                      src="${property.image}"
                      alt="${property.title}"
                      style="width: 100%; height: 180px; object-fit: cover; display: block;"
                    />
                    <div style="position: absolute; top: 12px; left: 12px;">
                      <span style="
                        padding: 6px 12px; 
                        border-radius: 8px; 
                        font-size: 12px; 
                        font-weight: 600;
                        background: rgba(255, 255, 255, 0.95);
                        color: #0F172A;
                        backdrop-filter: blur(8px);
                      ">
                        ${property.type}
                      </span>
                    </div>
                  </div>
                  <h3 style="font-weight: 600; font-size: 18px; color: #0F172A; margin: 0 0 8px 0; line-height: 1.4;">
                    ${property.title}
                  </h3>
                  <p style="font-size: 14px; color: #64748B; margin: 0 0 16px 0;">
                    ${property.location}
                  </p>
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <p style="font-weight: 700; font-size: 24px; color: #0F172A; margin: 0;">
                      $${property.price.toLocaleString()}
                    </p>
                    <span style="
                      padding: 6px 12px; 
                      border-radius: 8px; 
                      font-size: 12px; 
                      font-weight: 600;
                      ${property.status === "venta" 
                        ? `background-color: ${MAP_COLOR_VENTA}; color: white;` 
                        : `background-color: ${MAP_COLOR_ALQUILER}; color: white;`
                      }
                    ">
                      ${property.status === "venta" ? "Venta" : "Alquiler"}
                    </span>
                  </div>
                </a>
              </div>
            `;

            // Popup con estilo personalizado
            marker.bindPopup(popupContent, {
              maxWidth: 300,
              className: 'custom-popup',
              closeButton: true
            });

            markers.addLayer(marker);
          }
        });

        // Añadir el grupo de clusters al mapa
        map.addLayer(markers);

        mapInstanceRef.current = map;
        isInitializingRef.current = false;
      } catch (error) {
        console.error('Error initializing map:', error);
        isInitializingRef.current = false;
      }
    };

    initMap();

    // Cleanup al desmontar
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        mapInstanceRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, [properties]);

  // Filtrar propiedades que tengan coordenadas
  const propertiesWithCoordinates = properties.filter(p => p.coordinates);

  // Si no hay propiedades con coordenadas, no mostrar el mapa
  if (propertiesWithCoordinates.length === 0) {
    return null;
  }

  return (
    <div>
      <style>{`
        .custom-marker {
          background: none;
          border: none;
        }
        
        .custom-cluster-icon {
          background: none !important;
          border: none !important;
        }
        
        .marker-cluster {
          background: none !important;
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #E2E8F0;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: 280px !important;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #E2E8F0;
          border-top: none;
          border-left: none;
        }
        
        .custom-popup .leaflet-popup-close-button {
          color: #64748B;
          font-size: 24px;
          font-weight: 600;
          padding: 8px 12px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .custom-popup .leaflet-popup-close-button:hover {
          color: #0F172A;
          background: #F1F5F9;
        }
        
        .custom-popup a:hover h3 {
          color: #334155;
        }
        
        .custom-marker:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
      `}</style>
      <div 
        ref={mapRef} 
        className="h-[500px] w-full rounded-lg overflow-hidden border border-slate-200 shadow-lg" 
        
      />
    </div>
  );
}