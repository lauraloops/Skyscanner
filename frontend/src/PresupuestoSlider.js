import React, { useState } from "react";


const PresupuestoSlider = ({ max = 5000, step = 50, onBack }) => {
  const [value, setValue] = useState(max);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showGracias, setShowGracias] = useState(false);

  const handleChange = (e) => {
    setValue(Number(e.target.value));
  };

  const handleBuscar = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // Enviar solo el entero al backend
      const response = await fetch("http://127.0.0.1:8000/guardar_presupuesto/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value)
      });
      if (!response.ok) throw new Error("Error en la petición");
      setSuccess(true);
      // Espera 1.2s y muestra pantalla de gracias
      setTimeout(() => {
        setShowGracias(true);
      }, 1200);
    } catch (err) {
      setError("Error al guardar el presupuesto");
    } finally {
      setLoading(false);
    }
  };

  if (showGracias) {
    return (
      <div className="full-screen" style={{ maxWidth: 600, margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#00aaff', marginBottom: 24, fontSize: 32, textAlign: 'center' }}>Thank you!</h2>
        <p style={{ color: '#e6f7ff', fontSize: 22, textAlign: 'center', marginBottom: 0 }}>You will receive your final destination shortly.</p>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 480, margin: '40px auto', background: '#f1f5ff', borderRadius: 18, boxShadow: '0 2px 16px #00aaff22', padding: 32 }}>
      <h2 style={{ color: '#00aaff', marginBottom: 18 }}>Max Budget</h2>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, fontSize: 18 }}>Max (€{value})</label>
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', fontSize: 16, color: '#22304a', marginBottom: 18 }}>
        <span>€{value}</span>
      </div>
      <button
        className="right-btn"
        style={{ width: '100%', fontSize: 18, padding: '12px 0', marginTop: 10, background: '#00eaff', color: '#22304a' }}
        onClick={handleBuscar}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Start Search'}
      </button>
      {success && (
        <div style={{ color: 'green', marginTop: 12 }}>Budget sent successfully!</div>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 12 }}>{error}</div>
      )}
      {onBack && (
        <button
          className="left-btn"
          style={{ width: '100%', fontSize: 18, padding: '12px 0', marginTop: 10 }}
          onClick={onBack}
        >
          Return
        </button>
      )}
    </div>
  );
};

export default PresupuestoSlider;
