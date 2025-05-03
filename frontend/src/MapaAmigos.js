import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import customIcon from './customMarkerIcon';

function MapaAmigos() {
  const [ciudades, setCiudades] = useState([]);
  // Centro aproximado del mundo
  const center = [20, 0];

  useEffect(() => {
    import('./aeropuertos_por_zona.json').then(data => {
      setCiudades(data.default || data);x
    });
  }, []);

  // Componente para ajustar el mapa a los marcadores
  function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
      if (markers.length > 0) {
        const bounds = markers.map(m => [m.lat, m.lon]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }, [markers, map]);
    return null;
  }

  return (
    <div style={{ width: '1000px', maxWidth: '90vw', height: '500px', borderRadius: '16px', overflow: 'hidden', margin: '0 auto 24px auto', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
      <MapContainer center={center} zoom={8} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={ciudades} />
        {ciudades.map(zonaObj => (
          <Marker
            key={zonaObj.zona}
            position={[zonaObj.lat, zonaObj.lon]}
            icon={customIcon}
          >
            <Popup>
              <b>{zonaObj.zona}</b><br />
              {zonaObj.airports.length} aeropuerto(s)<br />
              {zonaObj.airports.slice(0, 10).map(a => (
                <span key={a.IATA}>{a.IATA} - {a.name}<br /></span>
              ))}
              {zonaObj.airports.length > 10 && <span>...y más</span>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapaAmigos;
