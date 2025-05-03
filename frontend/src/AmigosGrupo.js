import React, { useState } from 'react';
import MapaAmigos from './MapaAmigos';

function generateGroupCode() {
  // Simple random code, can be improved
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}


export default function AmigosGrupo({ numAmigos, onAllJoined }) {
  const [groupCode] = useState(generateGroupCode());
  const [participants, setParticipants] = useState([]); // array de nombres
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  // Solo modo "un usuario" local
  const [isCreator] = useState(true); // Solo modo local, siempre creador
  const [inputCode, setInputCode] = useState('');
  const [origins, setOrigins] = useState({}); // { nombre: origen }
  const [vibes, setVibes] = useState({}); // { nombre: [vibes] }
  const [selectingOrigin, setSelectingOrigin] = useState(false);
  const [selectingVibes, setSelectingVibes] = useState(false);
  const [myOrigin, setMyOrigin] = useState('');
  const [myVibes, setMyVibes] = useState([]);

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
  const handleSaveVibes = () => {
    setVibes(prev => {
      const updated = { ...prev, [name]: myVibes };
      // Si todos han seleccionado origen y vibes, avisar al padre
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
          <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Unirse a un grupo</h2>
          <input
            type="text"
            placeholder="Código del grupo"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            style={{ fontSize: 20, padding: '10px 18px', borderRadius: 12, border: '1.5px solid #00aaff', marginBottom: 18, width: '100%' }}
          />
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ fontSize: 20, padding: '10px 18px', borderRadius: 12, border: '1.5px solid #00aaff', marginBottom: 18, width: '100%' }}
          />
          <button
            className="right-btn"
            style={{ width: '100%', fontSize: 20, padding: '14px 0', marginBottom: 10 }}
            onClick={handleJoin}
          >
            Unirse
          </button>
        </div>
      );
    }
    if (selectingOrigin) {
      return (
        <div className="full-screen" style={{ maxWidth: 1200, margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Selecciona tu ciudad de origen en el mapa</h2>
          <div style={{ width: '100%' }}>
            <MapaAmigos onSelect={handleSelectOrigin} />
          </div>
        </div>
      );
    }
    if (selectingVibes) {
      return (
        <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
          <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Selecciona tus vibes</h2>
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
            Guardar preferencias
          </button>
        </div>
      );
    }
    return (
      <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
        <h2 style={{ color: '#00aaff', marginBottom: 18 }}>¡Gracias, {name}!</h2>
        <div style={{ color: '#e6f7ff', marginBottom: 18 }}>
          Esperando a que los demás seleccionen su origen y vibes...
        </div>
        <div style={{ color: '#e6f7ff', marginBottom: 8 }}>Orígenes seleccionados:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.entries(origins).map(([n, o]) => (
            <li key={n} style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>{n}: {o}</li>
          ))}
        </ul>
        <div style={{ color: '#e6f7ff', margin: '16px 0 8px 0' }}>Vibes seleccionadas:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.entries(vibes).map(([n, v]) => (
            <li key={n} style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>{n}: {v.map(x => x.replace(/_/g, ' ')).join(', ')}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Creator view
  if (!joined) {
    return (
      <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
        <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Invita a tus amigos</h2>
        <div style={{ fontSize: 18, marginBottom: 10 }}>Código del grupo:</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 2, color: '#fff', background: '#1a2636', padding: '12px 32px', borderRadius: 16, marginBottom: 18, userSelect: 'all' }}>{groupCode}</div>
        <div style={{ fontSize: 16, color: '#e6f7ff', marginBottom: 18 }}>Comparte este código con tus amigos para que se unan.</div>
        <input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ fontSize: 20, padding: '10px 18px', borderRadius: 12, border: '1.5px solid #00aaff', marginBottom: 18, width: '100%' }}
        />
        <button
          className="right-btn"
          style={{ width: '100%', fontSize: 20, padding: '14px 0', marginBottom: 10 }}
          onClick={handleJoin}
          disabled={joined || !name}
        >
          {joined ? '¡Ya estás en el grupo!' : 'Entrar en el grupo'}
        </button>
        <div style={{ marginTop: 24, width: '100%' }}>
          <div style={{ fontSize: 18, color: '#e6f7ff', marginBottom: 8 }}>Participantes ({participants.length}/{numAmigos}):</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {participants.map((p, i) => (
              <li key={i} style={{ fontSize: 18, color: '#00eaff', marginBottom: 4 }}>{p}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 32 }}>
          <button
            style={{ background: 'none', border: 'none', color: '#00aaff', textDecoration: 'underline', cursor: 'pointer', fontSize: 15 }}
          >
            ¿Eres un amigo? Unirse a un grupo
          </button>
        </div>
      </div>
    );
  }
  if (selectingOrigin) {
    return (
      <div className="full-screen" style={{ maxWidth: 1200, margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Selecciona tu ciudad de origen en el mapa</h2>
        <div style={{ width: '100%' }}>
          <MapaAmigos onSelect={handleSelectOrigin} />
        </div>
      </div>
    );
  }
  if (selectingVibes) {
    return (
      <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
        <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Selecciona tus vibes</h2>
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
          Guardar preferencias
        </button>
      </div>
    );
  }
  return (
    <div className="full-screen" style={{ maxWidth: 500, margin: 'auto' }}>
      <h2 style={{ color: '#00aaff', marginBottom: 18 }}>¡Gracias, {name}!</h2>
      <div style={{ color: '#e6f7ff', marginBottom: 18 }}>
        Esperando a que los demás seleccionen su origen y vibes...
      </div>
      <div style={{ color: '#e6f7ff', marginBottom: 8 }}>Orígenes seleccionados:</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {Object.entries(origins).map(([n, o]) => (
          <li key={n} style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>{n}: {o}</li>
        ))}
      </ul>
      <div style={{ color: '#e6f7ff', margin: '16px 0 8px 0' }}>Vibes seleccionadas:</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {Object.entries(vibes).map(([n, v]) => (
          <li key={n} style={{ fontSize: 17, color: '#00eaff', marginBottom: 4 }}>{n}: {v.map(x => x.replace(/_/g, ' ')).join(', ')}</li>
        ))}
      </ul>
    </div>
  );
}
