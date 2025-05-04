

import React, { useState } from 'react';

const VIBES = [
  'Nightlife and Entertainment',
  'Underrated Destinations',
  'Art and Culture',
  'Beach',
  'Great Food',
  'Outdoor Adventures',
];

export default function Vibes({ onSelected }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]); // true/false por vibe

  function handleAnswer(ans) {
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);
    if (step < VIBES.length - 1) {
      setStep(step + 1);
    } else {
      // Convierte sí/no a valores 10/0
      const result = newAnswers.map(a => a ? 10 : 0);
      if (onSelected) onSelected(result);
    }
  }

  // Si ya terminó, muestra resumen
  if (answers.length === VIBES.length) {
    return (
      <div style={{ width: 380, maxWidth: '100%', margin: '0 auto', background: '#1a2636', borderRadius: 24, boxShadow: '0 4px 24px #00aaff22', padding: 32, textAlign: 'center' }}>
        <h3 style={{ color: '#00eaff', marginBottom: 18, fontWeight: 700, letterSpacing: 1 }}>Tus Vibes</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#e6f7ff', fontSize: 20 }}>
          {VIBES.map((v, i) => (
            <li key={v} style={{ margin: '12px 0', color: answers[i] ? '#00eaff' : '#e6f7ff', fontWeight: answers[i] ? 700 : 400 }}>
              {v}: {answers[i] ? 'Sí' : 'No'}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Pantalla tipo Tinder
  return (
    <div style={{ width: 380, maxWidth: '100%', margin: '0 auto', background: '#1a2636', borderRadius: 24, boxShadow: '0 4px 24px #00aaff22', padding: 32, textAlign: 'center', minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 28, color: '#00eaff', fontWeight: 800, marginBottom: 32, letterSpacing: 1, textShadow: '0 2px 12px #00aaff44' }}>
        {VIBES[step]}
      </div>
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
        <button
          onClick={() => handleAnswer(false)}
          className="vibes-no-btn"
          style={{
            background: 'linear-gradient(135deg, #22304a 0%, #1a2636 100%)',
            color: '#fff',
            border: '2px solid #ff3b3b',
            borderRadius: 18,
            fontSize: 22,
            fontWeight: 700,
            padding: '18px 36px',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          No
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="vibes-yes-btn"
          style={{
            background: 'linear-gradient(135deg, #00eaff 0%, #00aaff 100%)',
            color: '#22304a',
            border: '2px solid #00eaff',
            borderRadius: 18,
            fontSize: 22,
            fontWeight: 700,
            padding: '18px 36px',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          Yes
        </button>
      </div>
      <div style={{ marginTop: 38, color: '#e6f7ff', fontSize: 17, opacity: 0.7 }}>
        Are you interested in this vibe for your trip?
      </div>
    </div>
  );
}