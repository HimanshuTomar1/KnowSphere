import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function InterestsStep({ interests, setInterests, goNext, goBack }) {
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/categories')
      .then(r => setCats(r.data))
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = id =>
    setInterests(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <>
      <div className="step-eyebrow">🎯 Step 2 of 7</div>
      <h2 className="step-title">What interests you?</h2>
      <p className="step-desc">
        Pick any topics you'd like offline access to. We'll use these to recommend the most relevant content packs.
      </p>

      {interests.length > 0 && (
        <div className="sel-pill">✓ {interests.length} topic{interests.length > 1 ? 's' : ''} selected</div>
      )}

      {loading ? (
        <div className="loader"><div className="spinner" /><span>Loading categories…</span></div>
      ) : (
        <div className="interest-grid">
          {cats.map(c => (
            <div
              key={c.id}
              className={`interest-tile ${interests.includes(c.id) ? 'on' : ''}`}
              onClick={() => toggle(c.id)}
              role="checkbox"
              aria-checked={interests.includes(c.id)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && toggle(c.id)}
            >
              <span className="it-check">✓</span>
              <span className="it-emoji">{c.icon}</span>
              <span className="it-name">{c.label}</span>
              <span className="it-desc">{c.description}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bottom-bar">
        <button className="btn btn-ghost" onClick={goBack}>← Back</button>
        <button className="btn btn-primary" onClick={goNext} disabled={interests.length === 0}>
          Continue →
        </button>
      </div>
    </>
  );
}
