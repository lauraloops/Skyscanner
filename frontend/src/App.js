import React from 'react';
import './App.css';
import plane from './plane.png';


import MapaAmigos from './MapaAmigos';
import AmigosGrupo from './AmigosGrupo';
import Vibes from './Vibes';
import PantallaTexto from './PantallaTexto';

function App() {
  const [mode, setMode] = React.useState(null);
  const [numAmigos, setNumAmigos] = React.useState(2);
  const [amigosConfirmado, setAmigosConfirmado] = React.useState(false);
  const [showMapaAmigos, setShowMapaAmigos] = React.useState(false);
  const [pantallaTexto, setPantallaTexto] = React.useState(false);

  return (
    <>
      {!mode && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1828' }}>
          {/* Avión orbitando en cuadrado y dejando estela */}
          <div className="plane-square-orbit">
            <img src={plane} alt="plane" className="plane-img-square" />
          </div>
          <div className="split-screen" style={{ background: 'none', boxShadow: 'none', position: 'static', width: 'auto', height: 'auto' }}>
            <div className="button-group">
              <button className="left-btn" onClick={() => setMode('solo')}>
                Travel Alone
              </button>
              <button className="right-btn" onClick={() => setMode('amigos')}>
                Travel with Friends
              </button>
            </div>
          </div>
        </div>
      )}
      {/* El modo solo ya no muestra PantallaTexto */}
      {mode === 'amigos' && (
        pantallaTexto ? (
          <PantallaTexto onVolver={() => setPantallaTexto(false)} />
        ) : (
          <>
            <script dangerouslySetInnerHTML={{__html:`window.setPantallaTexto = ${setPantallaTexto.toString()}`}} />
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#22304a' }}>
              <h2>Travel with Friends</h2>
              {!amigosConfirmado ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '32px' }}>
                  <label style={{ fontSize: '1.3rem', color: '#e6f7ff' }}>
                    How many friends are you going to travel with? (including yourself)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
                    <button
                      style={{
                        fontSize: '2rem',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: '2px solid #00aaff',
                        background: '#1a2636',
                        color: '#00aaff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s, color 0.2s',
                      }}
                      onClick={() => setNumAmigos(n => Math.max(1, n - 1))}
                      aria-label="Disminuir"
                    >
                      −
                    </button>
                    <span style={{
                      fontSize: '2rem',
                      minWidth: '48px',
                      textAlign: 'center',
                      color: '#e6f7ff',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      border: '2px solid #00aaff',
                      borderRadius: '12px',
                      background: '#1a2636',
                      padding: '8px 24px',
                      userSelect: 'none',
                    }}>{numAmigos}</span>
                    <button
                      style={{
                        fontSize: '2rem',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: '2px solid #00aaff',
                        background: '#1a2636',
                        color: '#00aaff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s, color 0.2s',
                      }}
                      onClick={() => setNumAmigos(n => Math.min(20, n + 1))}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="right-btn"
                    style={{ padding: '18px 40px', fontSize: '1.3rem', marginTop: '10px' }}
                    onClick={() => setAmigosConfirmado(true)}
                  >
                    Continue
                  </button>
                </div>
              ) : (
                !showMapaAmigos ? (
                  <AmigosGrupo
                    numAmigos={numAmigos}
                    onAllJoined={(data) => {
                      // data.users es el array [{usuario, origen, vibes}]
                      fetch('http://127.0.0.1:8000/guardar_usuario', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data.users),
                      })
                        .then(res => res.json())
                        .then(respuesta => {
                          // Mostrar confirmación solo si el backend responde OK
                          if (respuesta && respuesta.ok) {
                            setShowMapaAmigos('success');
                          } else {
                            setShowMapaAmigos('error');
                          }
                        })
                        .catch(err => {
                          setShowMapaAmigos('error');
                        });
                    }}
                    setPantallaTexto={setPantallaTexto}
                  />
                ) : (
                  showMapaAmigos === 'error' ? (
                    <div style={{ marginTop: '-20px', color: '#ff4d4f', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <h2 style={{ color: '#ff4d4f', marginBottom: 18, marginTop: 40 }}>Error sending data to backend</h2>
                      <p style={{ marginBottom: '18px', textAlign: 'center' }}>Please try again later.</p>
                    </div>
                  ) : (
                    <div style={{ marginTop: '-20px', color: '#e6f7ff', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '0px', }}>Perfect! You are {numAmigos} people.</h3>
                      <p style={{ marginBottom: '18px', textAlign: 'center' }}>Select the area of interest on the map or visualize the meeting point.</p>
                      <MapaAmigos />
                    </div>
                  )
                )
              )}
            </div>
          </>
        )
      )}
    </>
  );
}

export default App;