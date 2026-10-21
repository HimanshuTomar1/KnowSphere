import React, { useState } from 'react';
import KnowSphereLogo from './KnowSphereLogo';

export default function InnovationsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('oracle');

  // Simulator states for "Pocket Oracle"
  const [oracleQuery, setOracleQuery] = useState('How do you purify water using simple solar disinfection?');
  const [oracleAnswer, setOracleAnswer] = useState(null);
  const [oracleThinking, setOracleThinking] = useState(false);

  // Mesh simulator
  const [meshPeers, setMeshPeers] = useState([
    { id: 'peer-1', name: 'Nearby Phone (Android 14)', distance: '4m away', has: 'WikiMed 2024 (Delta)', shared: '14.2 MB' },
    { id: 'peer-2', name: 'Community Raspberry Pi', distance: '12m away', has: 'Wikipedia Hindi Mini', shared: '180 MB' },
  ]);
  const [meshScanning, setMeshScanning] = useState(false);

  if (!isOpen) return null;

  const handleRunOracle = () => {
    setOracleThinking(true);
    setOracleAnswer(null);
    setTimeout(() => {
      setOracleThinking(false);
      setOracleAnswer({
        summary: "Based on offline WikiMed & Survival Reference ZIM files:\n\n1. SODIS (Solar Water Disinfection): Fill clean, clear PET plastic bottles with water.\n2. Expose bottles to direct sunlight for at least 6 hours (or 2 days if cloudy).\n3. UV-A rays and heat kill diarrhea-causing pathogens without chemical treatment.",
        citation: "WikiMed Medical Encyclopedia (Offline ZIM, Article: #Water_purification_solar)",
        confidence: "99.4% Verified Offline Grounding"
      });
    }, 1200);
  };

  const handleScanMesh = () => {
    setMeshScanning(true);
    setTimeout(() => {
      setMeshScanning(false);
      setMeshPeers(prev => [
        ...prev,
        { id: `peer-${Date.now()}`, name: 'Local Laptop (KnowSphere Node)', distance: '8m away', has: 'DevDocs Offline (Full)', shared: '45 MB' }
      ]);
    }, 1500);
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" style={{ maxWidth: 660, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#EAF3FF',
            border: '1px solid #CCE3FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0071E3', fontSize: 18
          }}>
            💡
          </div>
          <div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--k-text)' }}>
              KnowSphere Next-Gen Innovations
            </h3>
            <p style={{ fontSize: 12, color: 'var(--k-text3)' }}>
              Breakthrough ideas powering KnowSphere: The Global Offline Library
            </p>
          </div>
        </div>

        {/* Feature selector tabs */}
        <div className="auth-tabs" style={{ margin: '18px 0 16px' }}>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'oracle' ? 'active' : ''}`}
            onClick={() => setActiveTab('oracle')}
          >
            🧠 Offline Pocket Oracle
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'mesh' ? 'active' : ''}`}
            onClick={() => setActiveTab('mesh')}
          >
            📡 Wisdom Mesh P2P
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'capsule' ? 'active' : ''}`}
            onClick={() => setActiveTab('capsule')}
          >
            🛡️ Survival Capsule
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'delta' ? 'active' : ''}`}
            onClick={() => setActiveTab('delta')}
          >
            ⚡ ZIM Delta Slices
          </button>
        </div>

        {/* ─── TAB 1: POCKET ORACLE (OFFLINE AI RAG) ────────────────────── */}
        {activeTab === 'oracle' && (
          <div>
            <div className="banner ok" style={{ marginBottom: 14 }}>
              <span className="banner-ico">✨</span>
              <div>
                <strong>Offline Generative AI (Zero-Internet RAG)</strong>
                <div style={{ fontSize: 12 }}>
                  Instead of static search, a local quantized 1.5B model (WebLLM / llama.cpp) indexes your ZIM file chunks with vector embeddings to answer natural language questions offline.
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--k-bg2)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--k-text2)', marginBottom: 6 }}>
                Ask any question across your offline ZIM library:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="field-input"
                  style={{ background: '#fff', fontSize: 13 }}
                  value={oracleQuery}
                  onChange={e => setOracleQuery(e.target.value)}
                  placeholder="e.g. Symptoms of malaria and first-line treatment"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRunOracle}
                  disabled={oracleThinking || !oracleQuery}
                >
                  {oracleThinking ? 'Synthesizing…' : 'Synthesize ⚡'}
                </button>
              </div>
            </div>

            {oracleThinking && (
              <div className="loader" style={{ padding: 24 }}>
                <div className="spinner" />
                <span style={{ fontSize: 13 }}>Reading WikiMed vectors completely offline…</span>
              </div>
            )}

            {oracleAnswer && (
              <div style={{
                background: '#fff', border: '1px solid var(--k-border)', borderRadius: 10,
                padding: 16, animation: 'stepEnter 0.3s ease both'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    🤖 Pocket Oracle Response (100% Offline)
                  </span>
                  <span style={{ fontSize: 11, color: '#166534', fontWeight: 600, background: '#F0FDF4', border: '1px solid #86EFAC', padding: '2px 8px', borderRadius: 99 }}>
                    {oracleAnswer.confidence}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#1A2332', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {oracleAnswer.summary}
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--k-border)', fontSize: 11, color: 'var(--k-text3)' }}>
                  📖 <strong>Primary Source:</strong> {oracleAnswer.citation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: WISDOM MESH (P2P SWARM) ─────────────────────────── */}
        {activeTab === 'mesh' && (
          <div>
            <div className="banner info" style={{ marginBottom: 14 }}>
              <span className="banner-ico">📡</span>
              <div>
                <strong>Off-Grid P2P Swarm ("Wisdom Mesh")</strong>
                <div style={{ fontSize: 12 }}>
                  Traditional offline archives require a Wi-Fi router or hotspot. KnowSphere Wisdom Mesh uses Wi-Fi Direct & Bluetooth Low Energy (BLE) to pass knowledge chunks device-to-device with zero infrastructure.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--k-text)' }}>
                Active Local Peers ({meshPeers.length} detected)
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleScanMesh}
                disabled={meshScanning}
              >
                {meshScanning ? 'Scanning Mesh…' : '🔄 Scan Local Swarm'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {meshPeers.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 10, background: '#fff', border: '1.5px solid var(--k-border)'
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--k-text)' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--k-text3)', marginTop: 2 }}>
                      📍 {p.distance} · Serving: <strong>{p.has}</strong>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--k-blue-dark)', background: 'var(--k-blue-light)', padding: '4px 10px', borderRadius: 99 }}>
                    ⬇ {p.shared} Synced
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 3: SURVIVAL CAPSULE ─────────────────────────────────── */}
        {activeTab === 'capsule' && (
          <div>
            <div className="banner warn" style={{ marginBottom: 14 }}>
              <span className="banner-ico">🛡️</span>
              <div>
                <strong>One-Click "Emergency Survival Capsule" (350 MB)</strong>
                <div style={{ fontSize: 12 }}>
                  Instead of drowning in 100 GB downloads, this preset packs high-density survival triage: First Aid, Water/Food Safety, Basic Ham Radio frequencies, and Off-grid electrical schematics.
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--k-border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--k-text)' }}>
                  🚨 Disaster & Survival Compact Capsule
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 99 }}>
                  348 MB Total
                </span>
              </div>
              <ul style={{ listStyle: 'none', fontSize: 13, color: 'var(--k-text2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>🩹 <strong>Emergency Medicine:</strong> WikiMed Offline Trauma & Triage slice</li>
                <li>💧 <strong>Water & Sanitation:</strong> Field purification and solar still manuals</li>
                <li>🗺️ <strong>Global Terrain Topography:</strong> Major waterways & elevation data</li>
                <li>📻 <strong>Communication:</strong> Emergency radio frequencies & Morse reference</li>
              </ul>
            </div>
          </div>
        )}

        {/* ─── TAB 4: DELTA SLICES ─────────────────────────────────────── */}
        {activeTab === 'delta' && (
          <div>
            <div className="banner ok" style={{ marginBottom: 14 }}>
              <span className="banner-ico">⚡</span>
              <div>
                <strong>Differential ZIM "Delta Slices"</strong>
                <div style={{ fontSize: 12 }}>
                  Traditional offline archives require re-downloading entire 50–90 GB files to stay updated. KnowSphere Delta Slices compute cryptographic diffs, allowing users to update English Wikipedia in just 142 MB over 2G!
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--k-red-bg)', border: '1.5px solid var(--k-red-bd)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--k-red)', textTransform: 'uppercase' }}>Traditional Model</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--k-red)', margin: '6px 0' }}>97 GB</div>
                <div style={{ fontSize: 11, color: 'var(--k-text2)' }}>Must redownload entire archive every time</div>
              </div>

              <div style={{ background: 'var(--k-green-light)', border: '1.5px solid #A5D6A7', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--k-green-dark)', textTransform: 'uppercase' }}>KnowSphere Delta Slices</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--k-green-dark)', margin: '6px 0' }}>142 MB</div>
                <div style={{ fontSize: 11, color: 'var(--k-text2)' }}>Only downloads cryptographic article patches (99.8% bandwidth saved)</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 22, textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close & Back to Onboarding →
          </button>
        </div>
      </div>
    </div>
  );
}
