


import React from 'react';
import './App.css';
import plane from './plane.svg';

function App() {
  const [mode, setMode] = React.useState(null);

  return (
    <div className="container skyscanner-bg">
      {!mode && (
        <div className="split-screen">
          <div className="plane-orbit">
            <img src={plane} alt="plane" className="plane-img" />
          </div>
          <button className="left-btn" onClick={() => setMode('solo')}>Viajar solo</button>
          <button className="right-btn" onClick={() => setMode('amigos')}>Viajar con Amigos</button>
          <div className="plane-orbit plane-orbit-right">
            <img src={plane} alt="plane" className="plane-img" />
          </div>
        </div>
      )}
      {mode === 'solo' && (
        <div className="full-screen">
          <h2>Modo Viajar solo (en desarrollo)</h2>
        </div>
      )}
      {mode === 'amigos' && (
        <div className="full-screen">
          <h2>Viajar con Amigos</h2>
          {/* Aquí irá el siguiente paso: seleccionar número de amigos */}
        </div>
      )}
    </div>
  );
}

export default App;
