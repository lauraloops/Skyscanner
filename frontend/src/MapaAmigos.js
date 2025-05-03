import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import customIcon from './customMarkerIcon';
import L from 'leaflet';

function MapaAmigos({ onSelect }) {
  const [data, setData] = useState(null); // JSON anidado completo
  const [nivel, setNivel] = useState('pais'); // 'pais' | 'ciudad'
  const [paisSel, setPaisSel] = useState(null);
  const [ciudadSel, setCiudadSel] = useState(null);
  const [ciudadOrigen, setCiudadOrigen] = useState(null); // Nueva: ciudad de origen seleccionada
  const [center, setCenter] = useState([48, 8]); // Centrado en Europa
  const [search, setSearch] = useState('');
  const mapRef = useRef();

  useEffect(() => {
    import('./paises_ciudades_aeropuertos.json').then(data => {
      setData(data.default || data);
    });
  }, []);

  // Devuelve los marcadores y datos según el nivel
  // Definir iconos personalizados para ciudades
  const cityIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  });
  const cityIconSelected = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  });

  let markers = [];
  if (!data) {
    markers = [];
  } else if (nivel === 'pais') {
    markers = Object.entries(data).map(([pais, pinfo]) => ({
      key: pais,
      nombre: pais,
      lat: pinfo.lat,
      lon: pinfo.lon,
      ciudades: pinfo.ciudades
    }));
  } else if (nivel === 'ciudad' && paisSel) {
    const ciudades = data[paisSel]?.ciudades || {};
    markers = Object.entries(ciudades).map(([ciudad, cinfo]) => ({
      key: ciudad,
      nombre: ciudad,
      lat: cinfo.lat,
      lon: cinfo.lon,
      icon: ciudad === ciudadSel ? cityIconSelected : cityIcon
    }));
  }

  // Componente para ajustar el mapa a los marcadores
  function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
      if (markers.length > 0) {
        const bounds = markers.map(m => [m.lat, m.lon]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }, [markers, map]);
    // Guardar referencia al mapa para búsqueda
    useEffect(() => {
      if (map && !mapRef.current) {
        mapRef.current = map;
      }
    }, [map]);
    return null;
  }
  // Buscar y hacer zoom al resultado
  // Controla si ya se ha hecho zoom a un resultado concreto
  const lastZoomRef = useRef(null);
  function handleSearchChange(e) {
    const value = e.target.value;
    setSearch(value);
    if (!data) return;

    lastZoomRef.current = null;
    if (!value) return;

    // Normaliza para comparación exacta (ignora tildes, espacios y mayúsculas)
    const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase();
    const valueNorm = normalize(value);



    // Buscar ciudad exacta
    for (const [nombrePais, pinfo] of Object.entries(data)) {
      const ciudad = Object.entries(pinfo.ciudades).find(([nombreCiudad]) => normalize(nombreCiudad) === valueNorm);
      if (ciudad) {
        const [nombreCiudad, cinfo] = ciudad;
        if (cinfo.lat && cinfo.lon && mapRef.current) {
          mapRef.current.setView([cinfo.lat, cinfo.lon], 7, { animate: true });
          lastZoomRef.current = `ciudad-${nombreCiudad}-${nombrePais}`;
        }
        if (nivel !== 'ciudad' || paisSel !== nombrePais) {
          setPaisSel(nombrePais);
          setNivel('ciudad');
        }
        return;
      }
    }

    // Buscar país exacto
    const pais = Object.entries(data).find(([nombre]) => normalize(nombre) === valueNorm);
    if (pais) {
      const [nombre, pinfo] = pais;
      if (pinfo.lat && pinfo.lon && mapRef.current) {
        mapRef.current.setView([pinfo.lat, pinfo.lon], 5, { animate: true });
        lastZoomRef.current = `pais-${nombre}`;
      }
      if (nivel !== 'pais') {
        setNivel('pais');
      }
      return;
    }

    // Si no hay coincidencia exacta, volver a la sección de países
    if (nivel !== 'pais') {
      setNivel('pais');
      setPaisSel(null);
      setCiudadSel(null);
    }
  }

  // Render de popups y lógica de navegación
  function handleClick(marker) {
    if (nivel === 'pais') {
      setPaisSel(marker.nombre);
      setNivel('ciudad');
      // Hacer fit a todas las ciudades del país seleccionado
      setTimeout(() => {
        if (data && data[marker.nombre] && mapRef.current) {
          const ciudades = data[marker.nombre].ciudades || {};
          const bounds = Object.values(ciudades)
            .filter(c => c.lat && c.lon)
            .map(c => [c.lat, c.lon]);
          if (bounds.length > 0) {
            // Ajustar el zoom para que todas las ciudades sean visibles
            mapRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 7 });
          }
        }
      }, 0);
    } else if (nivel === 'ciudad') {
      setCiudadOrigen(marker.nombre);
      setCiudadSel(marker.nombre);
      // Si hay callback, avisar al padre y no dejar seleccionar más
      if (onSelect) {
        setTimeout(() => onSelect(marker.nombre), 1200); // Espera 1.2s antes de cambiar de pantalla
      }
      // No avanzar a nivel de aeropuerto
    }
  }

  function handleBack() {
    if (nivel === 'ciudad') {
      setNivel('pais');
      setPaisSel(null);
    }
  }

  // Título dinámico
  let titulo = 'Países';
  if (nivel === 'ciudad' && paisSel) {
    titulo = `Ciudades de ${paisSel}`;
  } else if (ciudadOrigen) {
    titulo = `Ciudad de origen seleccionada: ${ciudadOrigen}`;
  } else {
    titulo = 'Países';
  }

  return (
    <div style={{
      width: '1200px',
      maxWidth: '98vw',
      height: '600px',
      borderRadius: '22px',
      overflow: 'hidden',
      marginLeft: '-150px',
      boxShadow: '0 8px 40px rgba(60,60,120,0.15)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div
        style={{
          padding: '0',
          background: 'linear-gradient(90deg, #f1f5ff 0%, #e0e7ff 100%)',
          borderBottom: '1.5px solid #d1d5db',
          minHeight: 74,
          height: 74,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 2px 12px rgba(60,60,120,0.06)',
          zIndex: 2,
        }}
      >
        {/* Botón atrás */}
        <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
          {(nivel === 'ciudad' || nivel === 'aeropuerto') && (
            <button
              onClick={handleBack}
              style={{
                fontSize: 22,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #c7d2fe 0%, #818cf8 100%)',
                border: 'none',
                borderRadius: '50%',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(99,102,241,0.13)',
                transition: 'background 0.2s, box-shadow 0.2s',
                outline: 'none',
              }}
              title="Volver"
              onMouseOver={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.18)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #c7d2fe 0%, #818cf8 100%)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(99,102,241,0.13)';
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.5 18L8.5 12L14.5 6" stroke="#3730a3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
        {/* Título centrado */}
        <div style={{ flex: 1, textAlign: 'center', pointerEvents: 'none', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <span
              style={{
                color: '#312e81',
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 0.2,
                fontFamily: 'Segoe UI, Inter, Arial, sans-serif',
                textShadow: '0 1px 0 #fff, 0 2px 8px #c7d2fe',
                userSelect: 'none',
                lineHeight: 1.2,
                display: 'inline-block',
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {titulo}
            </span>
            {/* Origen Seleccionado debajo del título */}
            {nivel === 'ciudad' && ciudadOrigen && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 2 }}>
                <span style={{
                  color: 'green',
                  fontWeight: 600,
                  fontSize: 17,
                  textShadow: '0 1px 4px #fff',
                  display: 'block',
                  letterSpacing: 0.1,
                }}>
                  Origen Seleccionado: {ciudadOrigen}
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Barra de búsqueda a la izquierda, solo si NO hay ciudad de origen seleccionada */}
        {!(nivel === 'ciudad' && ciudadOrigen) && !(nivel === 'pais' && ciudadOrigen) && (
          <div style={{ position: 'absolute', left: 780, top: 0, bottom: 0, display: 'flex', alignItems: 'center', minWidth: 260, maxWidth: 340, width: '28vw' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6366f1',
                fontSize: 20,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                zIndex: 2,
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="7" stroke="#6366f1" strokeWidth="2"/>
                  <path d="M15.5 15.5L13 13" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar país o ciudad..."
                value={search}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '10px 18px 10px 40px',
                  borderRadius: 22,
                  border: '1.5px solid #a5b4fc',
                  fontSize: 17,
                  background: 'rgba(241,245,255,0.98)',
                  outline: 'none',
                  boxShadow: '0 1px 6px rgba(99,102,241,0.07)',
                  transition: 'border 0.2s',
                  color: '#3730a3',
                  fontWeight: 500,
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, height: 'calc(100% - 74px)' }}>
        <MapContainer center={center} zoom={3} style={{ width: '100%', height: '100%' }} whenReady={e => { mapRef.current = e.target; }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds markers={markers} />
          {markers.map(marker => (
            <Marker
              key={marker.key}
              position={[marker.lat, marker.lon]}
              icon={nivel === 'ciudad' ? marker.icon : customIcon}
              eventHandlers={nivel === 'pais' || nivel === 'ciudad' ? {
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  handleClick(marker);
                }
              } : {}}
              title={marker.nombre}
              interactive={nivel === 'pais' || nivel === 'ciudad'}
            >
              {/* No Popup, solo Tooltip */}
              {(nivel === 'ciudad' || nivel === 'pais') && (
                <Tooltip direction="top" offset={[0, -18]}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: nivel === 'ciudad' && ciudadOrigen === marker.nombre ? 'green' : '#312e81',
                      fontSize: 16,
                      textShadow: '0 1px 4px #fff',
                      transition: 'color 0.3s',
                      filter: nivel === 'ciudad' && ciudadOrigen === marker.nombre ? 'drop-shadow(0 0 6px #22c55e)' : 'none',
                      animation: nivel === 'ciudad' && ciudadOrigen === marker.nombre ? 'markerSelectedAnim 0.7s' : 'none',
                    }}
                  >
                    {marker.nombre}
                  </span>
                </Tooltip>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapaAmigos;
