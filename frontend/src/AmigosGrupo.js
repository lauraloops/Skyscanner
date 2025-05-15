import React, { useState } from 'react';
import MapaAmigos from './MapaAmigos';
import Vibes from './Vibes';

function generateGroupCode() {
  // Simple random code, can be improved
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}


export default function AmigosGrupo({ numAmigos, onAllJoined, setPantallaTexto }) {
  const [groupCode] = useState(generateGroupCode());
  const [participants, setParticipants] = useState([]); // array de nombres
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(true); // Ahora se puede cambiar
  const [inputCode, setInputCode] = useState('');
  const [origins, setOrigins] = useState({}); // { nombre: origen }
  const [vibes, setVibes] = useState({}); // { nombre: [vibes] }
  const [selectingOrigin, setSelectingOrigin] = useState(false);
  const [selectingVibes, setSelectingVibes] = useState(false);
  const [myOrigin, setMyOrigin] = useState('');
  const [myVibes, setMyVibes] = useState([]);
  const [misVibesNombres, setMisVibesNombres] = useState([]);
  // Hook para enviar datos solo una vez cuando estén listos
  const [enviado, setEnviado] = React.useState(false);
  React.useEffect(() => {
    if (!enviado && name && origins[name] && Array.isArray(vibes[name]) && vibes[name].length > 0) {
      guardarUsuario(name, origins[name], vibes[name]);
      setEnviado(true);
    }
    // Solo se envía una vez al montar la pantalla
    // eslint-disable-next-line
  }, [name, origins, vibes, enviado]);

  // Simulate join (no backend, just local)
  const handleJoin = () => {
    if (!name) return;
    setParticipants(prev => {
      if (prev.find(p => p === name)) return prev;
      return [...prev, name];
    });
    setJoined(true);
    setSelectingOrigin(true);
  };

  // Guardar origen del participante y pasar a vibes
  const handleSelectOrigin = (ciudad) => {
    if (!ciudad) return;
    setMyOrigin(ciudad);
    setOrigins(prev => ({ ...prev, [name]: ciudad }));
    setSelectingOrigin(false);
    setSelectingVibes(true);
  };

  // Guardar vibes del participante
  const guardarUsuario = (usuario, origen, vibes) => {
    fetch('http://127.0.0.1:8000/guardar_usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ usuario, origen, vibes }]),
    });
  };

  const handleSaveVibes = () => {
    // Guarda los nombres de las vibes seleccionadas
    setMisVibesNombres(myVibes.map(v => v.replace(/_/g, ' ')));
    setVibes(prev => {
      const updated = { ...prev, [name]: myVibes };
      // Enviar los datos de este usuario al backend inmediatamente
      guardarUsuario(name, origins[name], myVibes);
      const user = {
        usuario: name,
        origen: origins[name],
        vibes: (updated[name] || []).filter(Boolean),
      };
      // Llama a onAllJoined con solo este usuario
      onAllJoined({ users: [user] });
      return updated;
    });
    setSelectingVibes(false);
    // Mostrar confirmación visual después de enviar
    setTimeout(() => {
      window.alert('¡Tu vuelo ideal está en camino!');
    }, 200);
  };

  // Opciones de vibes (puedes ajustar según dataset)
  const vibesOptions = [
    'nightlife_and_entertainment',
    'underrated_destinations',
    'beach',
    'art_and_culture',
    'great_food',
    'outdoor_adventures',
  ];

  // Simulate friend view
  if (!isCreator) {
    if (!joined) {
      return (
        <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
          <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Join group</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <input
              type="text"
              placeholder="Group code"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              style={{
                fontSize: 20,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid #00aaff',
                marginBottom: 14,
                width: '100%',
                boxSizing: 'border-box',
                background: '#f1f5ff',
                color: '#22304a',
                outline: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                fontSize: 20,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid #00aaff',
                marginBottom: 18,
                width: '100%',
                boxSizing: 'border-box',
                background: '#f1f5ff',
                color: '#22304a',
                outline: 'none',
              }}
            />
          </div>
          <button
            className="right-btn"
            style={{ width: '100%', fontSize: 20, padding: '14px 0', marginBottom: 10 }}
            onClick={handleJoin}
          >
            Unirse
          </button>
          {/* Botón Volver eliminado */}
        </div>
      );
    }
    if (selectingOrigin) {
      return (
        <div className="full-screen" style={{ maxWidth: 1200, margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Select your origin city in the map</h2>
          <div style={{ width: '100%' }}>
            <MapaAmigos onSelect={handleSelectOrigin} />
          </div>
          {/* Botón Volver eliminado */}
        </div>
      );
    }
    if (selectingVibes) {
      return (
        <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
          <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Select your vibes</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            {vibesOptions.map(vibe => (
              <button
                key={vibe}
                type="button"
                className={myVibes.includes(vibe) ? 'right-btn' : 'left-btn'}
                style={{ fontSize: 16, padding: '10px 18px', minWidth: 120, border: myVibes.includes(vibe) ? '2px solid #00eaff' : '2px solid #22304a', background: myVibes.includes(vibe) ? '#00aaff' : '#22304a', color: '#fff' }}
                onClick={() => setMyVibes(arr => arr.includes(vibe) ? arr.filter(v => v !== vibe) : [...arr, vibe])}
              >
                {vibe.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <button
            className="right-btn"
            style={{ width: '100%', fontSize: 20, padding: '14px 0', marginBottom: 10 }}
            onClick={handleSaveVibes}
            disabled={myVibes.length === 0}
          >
            Save preferences
          </button>
          {/* Botón Volver eliminado */}
        </div>
      );
    }
    return (
      <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
        <h2 style={{ color: '#00aaff', marginBottom: 18 }}>¡Gracias, {name}!</h2>
        <div style={{ color: '#e6f7ff', marginBottom: 18 }}>
          Waiting for others to select their origin and vibes...
        </div>
        <div style={{ color: '#e6f7ff', marginBottom: 8 }}>Selected origins:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.entries(origins).map(([n, o]) => (
            <li key={n} style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>{n}: {o}</li>
          ))}
        </ul>
        <div style={{ color: '#e6f7ff', margin: '16px 0 8px 0' }}>Your selected vibes:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Array.isArray(vibes[name]) && vibes[name].length > 0 ? (
            <li style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>{vibes[name].map(x => x.replace(/_/g, ' ')).join(', ')}</li>
          ) : (
            <li style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>No selected vibes</li>
          )}
        </ul>
        <button
          className="right-btn"
          style={{ fontSize: 20, padding: '14px 0', margin: '0 0 24px 0', width: 320, alignSelf: 'center' }}
          onClick={() => {
            if (typeof window.setPantallaCreativa === 'function') {
              window.setPantallaCreativa(true);
            }
          }}
        >
          Use your creativity
        </button>
      </div>
    );
  }

  // Creator view
  if (!joined && isCreator) {
    return (
      <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
        <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Invite your friends</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: 18, marginBottom: 8, alignSelf: 'flex-start' }}>Group code:</div>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#fff',
            background: '#1a2636',
            padding: '10px 0',
            borderRadius: 10,
            marginBottom: 14,
            userSelect: 'all',
            width: '100%',
            textAlign: 'center',
            wordBreak: 'break-all',
            boxSizing: 'border-box',
          }}>{groupCode}</div>
          <div style={{ fontSize: 16, color: '#e6f7ff', marginBottom: 16, alignSelf: 'flex-start' }}>Share this code with your friends to join.</div>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              fontSize: 20,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid #00aaff',
              marginBottom: 18,
              width: '100%',
              boxSizing: 'border-box',
              background: '#f1f5ff',
              color: '#22304a',
              outline: 'none',
            }}
          />
        </div>
        <button
          className="right-btn"
          style={{ width: '100%', fontSize: 20, padding: '14px 0', marginBottom: 10 }}
          onClick={handleJoin}
          disabled={joined || !name}
        >
          {joined ? '¡You are in the group!' : 'Join the group'}
        </button>
        <div style={{ marginTop: 24, width: '100%' }}>
          <div style={{ fontSize: 18, color: '#e6f7ff', marginBottom: 8 }}>Participants ({participants.length}/{numAmigos}):</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {participants.map((p, i) => (
              <li key={i} style={{ fontSize: 18, color: '#00eaff', marginBottom: 4 }}>{p}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 32 }}>
          <button
            style={{ background: 'none', border: 'none', color: '#00aaff', textDecoration: 'underline', cursor: 'pointer', fontSize: 15 }}
            onClick={() => setIsCreator(false)}
          >
            You are not the creator? Click here to join as a friend
          </button>
          {/* Botón Volver eliminado */}
        </div>
      </div>
    );
  }
  if (selectingOrigin) {
    return (
      <div className="full-screen" style={{ maxWidth: 1200, margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Select your origin city in the map</h2>
        <div style={{ width: '100%' }}>
          <MapaAmigos onSelect={handleSelectOrigin} />
        </div>
      </div>
    );
  }
  if (selectingVibes) {
    return (
      <VibesScreen
        onSave={vibes => {
          setMyVibes(vibes);
          setMisVibesNombres(vibes.map(v => v.replace(/_/g, ' ')));
          setVibes(prev => {
            const updated = { ...prev, [name]: vibes };
            // Solo actualizar el estado, NO llamar a guardarUsuario aquí
            if (
              Object.keys(updated).length === participants.length &&
              Object.keys(origins).length === participants.length &&
              participants.length === numAmigos
            ) {
              onAllJoined({ origins, vibes: updated });
            }
            return updated;
          });
          setSelectingVibes(false);
        }}
      />
    );
  }

// Wrapper para usar Vibes y obtener el resultado, asegurando estructura válida
function VibesScreen({ onSave }) {
  const [selected, setSelected] = useState([]);
  // Las opciones deben coincidir con el orden de Vibes.js
  const vibesOptions = [
    'Nightlife and Entertainment',
    'Underrated Destinations',
    'Art and Culture',
    'Beach',
    'Great Food',
    'Outdoor Adventures',
  ];
  // selected es un array de booleanos o números (10/0), lo convertimos a nombres
  const getSelectedVibesNames = () => {
    if (!Array.isArray(selected)) return [];
    // Si son booleanos o 10/0
    return selected
      .map((val, idx) => (val === true || val === 10) ? vibesOptions[idx] : null)
      .filter(Boolean);
  };
  return (
    <div className="full-screen" style={{ maxWidth: 700, margin: 'auto', position: 'relative', minHeight: '80vh' }}>
      <Vibes onSelected={setSelected} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button
          className="right-btn"
          style={{ fontSize: 20, padding: '14px 40px' }}
          onClick={() => onSave(getSelectedVibesNames())}
          disabled={getSelectedVibesNames().length === 0}
        >
          Save vibes
        </button>
        {/* Botón Volver eliminado */}
      </div>
    </div>
  );
}
    return (
      <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
        <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Thanks, {name}!</h2>
        <div style={{ color: '#e6f7ff', marginBottom: 18 }}>
          Waiting for others to select their origin and vibes...
        </div>
        <div style={{ color: '#e6f7ff', marginBottom: 8 }}>Selected origins:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.entries(origins).map(([n, o]) => (
            <li key={n} style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>{n}: {o}</li>
          ))}
        </ul>
        <div style={{ color: '#e6f7ff', margin: '16px 0 8px 0' }}>Your selected vibes:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {misVibesNombres.length > 0 ? (
            <li style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>{misVibesNombres.join(', ')}</li>
          ) : (
            <li style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>No selected vibes</li>
          )}
        </ul>
        <button
          className="right-btn"
          style={{ fontSize: 20, padding: '14px 0', margin: '0 0 24px 0', width: 320, alignSelf: 'center', marginTop: 30 }}
          onClick={() => {
            if (typeof setPantallaTexto === 'function') {
              setPantallaTexto(true);
            }
          }}
        >
          Use your creativity
        </button>
      </div>
    );
}