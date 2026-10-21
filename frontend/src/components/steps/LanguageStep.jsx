import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FLAGS = { en:'🇬🇧', hi:'🇮🇳', es:'🇪🇸', fr:'🇫🇷', ar:'🇸🇦', zh:'🇨🇳', de:'🇩🇪', pt:'🇧🇷' };

export default function LanguageStep({ languages, setLanguages, goNext, goBack }) {
  const [langs,   setLangs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/languages')
      .then(r => setLangs(r.data))
      .catch(() => setLangs([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = code =>
    setLanguages(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code]);

  return (
    <>
      <div className="step-eyebrow">🌐 Step 3 of 7</div>
      <h2 className="step-title">Preferred languages</h2>
      <p className="step-desc">
        Select all languages you'd like content in. KnowSphere supports 100+ languages — we'll prioritise your picks.
      </p>

      {languages.length > 0 && (
        <div className="sel-pill">✓ {languages.length} language{languages.length > 1 ? 's' : ''} selected</div>
      )}

      {loading ? (
        <div className="loader"><div className="spinner" /><span>Loading languages…</span></div>
      ) : (
        <div className="lang-list">
          {langs.map(l => (
            <div
              key={l.code}
              className={`lang-row ${languages.includes(l.code) ? 'on' : ''}`}
              onClick={() => toggle(l.code)}
              role="checkbox"
              aria-checked={languages.includes(l.code)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && toggle(l.code)}
            >
              <div className="lang-flag">{FLAGS[l.code] || '🌍'}</div>
              <div className="lang-info">
                <div className="lang-name">{l.label}</div>
                <div className="lang-native">{l.native}</div>
              </div>
              <div className="lang-chk">{languages.includes(l.code) ? '✓' : ''}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bottom-bar">
        <button className="btn btn-ghost" onClick={goBack}>← Back</button>
        <button className="btn btn-primary" onClick={goNext} disabled={languages.length === 0}>
          Continue →
        </button>
      </div>
    </>
  );
}
