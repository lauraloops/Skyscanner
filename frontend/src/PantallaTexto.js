import React, { useState } from 'react';
import PresupuestoSlider from './PresupuestoSlider';


export default function PantallaTexto({ onVolver }) {
  const [mostrarPresupuesto, setMostrarPresupuesto] = useState(false);
  const [texto, setTexto] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!texto.trim()) return;
    setLoading(true);
    setError('');
    setGuardado(false);
    try {
      // Solo enviamos el texto al backend
      const response = await fetch('http://127.0.0.1:8000/guardar_texto/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setGuardado(true);
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (mostrarPresupuesto) {
    return <PresupuestoSlider onBack={() => setMostrarPresupuesto(false)} />;
  }
  return (
    <div className="full-screen" style={{ maxWidth: 600, margin: 'auto', paddingTop: 40 }}>
      <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Introduce your text</h2>
      <textarea
        placeholder="Write here..."
        value={texto}
        onChange={e => setTexto(e.target.value)}
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
        onClick={handleGuardar}
        disabled={loading || !texto.trim()}
      >
        {loading ? 'Saving...' : 'Save text'}
      </button>
      <button
        className="right-btn"
        style={{ width: '100%', fontSize: 18, padding: '12px 0', marginBottom: 10, background: '#00eaff', color: '#22304a' }}
        onClick={() => setMostrarPresupuesto(true)}
      >
        Choose budget
      </button>
      {error && (
        <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>
      )}
      {guardado && (
        <div style={{ color: 'green', marginBottom: 16 }}>Text saved successfully!</div>
      )}
      {/* Botón Volver eliminado */}
    </div>
  );
}
