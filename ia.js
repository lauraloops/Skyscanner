import React, { useState } from 'react';

export default function InfoViaje() {
  const [descripcion, setDescripcion] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!descripcion.trim()) return;
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/analyze/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descripcion }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResultado(data);
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-screen" style={{ maxWidth: 600, margin: 'auto', paddingTop: 40 }}>
      <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Añade más información sobre tu viaje</h2>
      <textarea
        placeholder="Escribe una frase sobre tu viaje ideal..."
        value={descripcion}
        onChange={e => setDescripcion(e.target.value)}
        rows={5}
        style={{
          fontSize: 18,
          padding: '12px 14px',
          borderRadius: 10,
          border: '1.5px solid #00aaff',
          marginBottom: 20,
          width: '100%',
          boxSizing: 'border-box',
          background: '#f1f5ff',
          color: '#22304a',
          outline: 'none',
          resize: 'none',
        }}
      />
      <button
        className="right-btn"
        style={{ width: '100%', fontSize: 20, padding: '14px 0', marginBottom: 20 }}
        onClick={handleSubmit}
        disabled={loading || !descripcion.trim()}
      >
        {loading ? 'Buscando ciudades...' : 'Buscar destinos ideales'}
      </button>

      {error && (
        <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>
      )}

      {resultado && (
        <div style={{ background: '#1a2636', padding: 20, borderRadius: 10, color: '#e6f7ff' }}>
          <h3 style={{ color: '#00eaff', marginBottom: 12 }}>Ciudades sugeridas:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {resultado.ciudades_sugeridas.map((c, idx) => (
              <li key={idx} style={{ marginBottom: 12 }}>
                <strong style={{ color: '#00aaff' }}>{c.ciudad}</strong>: {c.razon}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}