import React, { useEffect, useState } from 'react';

const SPEEDS = [
  { label: '2G — 0.2 Mbps',  value: 0.2 },
  { label: '3G — 2 Mbps',    value: 2   },
  { label: 'Wi-Fi — 10 Mbps', value: 10  },
  { label: 'Fast — 50 Mbps', value: 50  },
];

const BUDGET_PRESETS = [
  { label: 'Compact · 4 GB',       gb: 4   },
  { label: 'Standard · 20 GB',     gb: 20  },
  { label: 'Educator · 64 GB',     gb: 64  },
  { label: 'Full Library · 128 GB', gb: 128 },
];

const PRESET_DRIVES = [
  { id: 'sd-64',   name: 'MicroSD Card',  brand: 'SanDisk Ultra',        sizeGB: 64,  icon: '💾' },
  { id: 'sd-128',  name: 'MicroSD Card',  brand: 'Samsung EVO Plus',     sizeGB: 128, icon: '💾' },
  { id: 'usb-256', name: 'USB-OTG Drive', brand: 'Kingston DataTraveler', sizeGB: 256, icon: '🔌' },
];

export default function StorageStep({ storageGB, setStorageGB, speedMbps, setSpeedMbps, goNext, goBack }) {
  const [detectedGB, setDetectedGB] = useState(null);
  const [manualGB,   setManualGB]   = useState('');
  const [detecting,  setDetecting]  = useState(true);
  const [warning,    setWarning]    = useState(null);

  // External drives state & collapsible toggle
  const [mountedDrives, setMountedDrives] = useState([]);
  const [showExternalDrawer, setShowExternalDrawer] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState(null);
  const [persistedStatus, setPersistedStatus] = useState(null);

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate()
        .then(e => {
          const gb = parseFloat(((e.quota - (e.usage || 0)) / 1e9).toFixed(1));
          setDetectedGB(gb);
          if (!storageGB) {
            setStorageGB(gb);
            setManualGB(String(gb));
          } else {
            setManualGB(String(storageGB));
          }
        })
        .catch(() => setWarning('Could not detect storage automatically.'))
        .finally(() => setDetecting(false));
    } else {
      setWarning('StorageManager API not supported in this browser.');
      setDetecting(false);
      if (storageGB) setManualGB(String(storageGB));
    }
  }, [setStorageGB, storageGB]);

  const gb = parseFloat(manualGB) || detectedGB || 0;
  const fillPct   = Math.min((gb / 150) * 100, 100);
  const fillClass = gb < 2 ? 'danger' : gb < 10 ? 'warn' : '';
  const hint      = gb < 2  ? '⚠️ Very limited — only compact ZIM packs (< 1 GB) fit'
                 : gb < 15 ? '⚡ Moderate — Wikipedia Mini, WikiMed, and DevDocs fit comfortably'
                 : gb < 80 ? '✅ Generous — Khan Academy, TED Talks, full WikiMed & eBooks fit'
                 :           '🚀 Massive — Full English Wikipedia (97 GB) & complete reference packs fit!';

  const updateBudget = val => {
    const clean = Math.max(0.5, parseFloat(Number(val).toFixed(1)));
    setManualGB(String(clean));
    setStorageGB(clean);
  };

  const handleManual = e => {
    setManualGB(e.target.value);
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && v > 0) setStorageGB(v);
  };

  const addStorage = amount => {
    const current = parseFloat(manualGB) || detectedGB || 0;
    const updated = Math.max(0.5, parseFloat((current + amount).toFixed(1)));
    updateBudget(updated);
  };

  // Mount / Unmount External SD Card / USB OTG
  const toggleMountDrive = drive => {
    const isMounted = mountedDrives.some(d => d.id === drive.id);

    if (isMounted) {
      setMountedDrives(prev => prev.filter(d => d.id !== drive.id));
      const current = parseFloat(manualGB) || detectedGB || 0;
      const updated = Math.max(0.5, parseFloat((current - drive.sizeGB).toFixed(1)));
      updateBudget(updated);
      setCleanFeedback(`Ejected ${drive.name} (-${drive.sizeGB} GB)`);
    } else {
      setMountedDrives(prev => [...prev, drive]);
      const current = parseFloat(manualGB) || detectedGB || 0;
      const updated = parseFloat((current + drive.sizeGB).toFixed(1));
      updateBudget(updated);
      setCleanFeedback(`Mounted ${drive.name} (+${drive.sizeGB} GB) to your offline library budget!`);
    }
    setTimeout(() => setCleanFeedback(null), 3500);
  };

  const handleRequestPersistent = async () => {
    if (navigator.storage?.persist) {
      const isPersisted = await navigator.storage.persist();
      setPersistedStatus(isPersisted ? '✓ Persistent storage granted — browser will not auto-evict ZIM files.' : 'Browser declined persistent storage lock.');
    } else {
      setPersistedStatus('Persistent storage API not supported in this browser.');
    }
    setTimeout(() => setPersistedStatus(null), 4000);
  };

  return (
    <>
      <div className="step-eyebrow">💾 Step 4 of 7</div>
      <h2 className="step-title">Storage & Connection</h2>
      <p className="step-desc">
        Set the maximum storage budget you want to allocate for offline ZIM archives and choose your current connection speed for accurate download time estimates.
      </p>

      {cleanFeedback && (
        <div className="banner ok" style={{ animation: 'fadeIn 0.2s ease' }}>
          <span className="banner-ico">✨</span>
          <span>{cleanFeedback}</span>
        </div>
      )}

      {detecting ? (
        <div className="loader"><div className="spinner" /><span>Detecting available device storage…</span></div>
      ) : (
        <>
          {/* Storage status banner */}
          {detectedGB !== null ? (
            <div className="detect-box">
              <div className="detect-ico">💾</div>
              <div style={{ flex: 1 }}>
                <div className="detect-title">Browser Storage Quota: ~{detectedGB} GB available</div>
                <div className="detect-sub">
                  Detected via <code>navigator.storage.estimate()</code> · Adjust your target library budget below
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleRequestPersistent}
                style={{ background: '#fff', borderColor: '#86EFAC', color: '#166534' }}
              >
                🔒 Lock Quota
              </button>
            </div>
          ) : (
            <div className="detect-box warn">
              <div className="detect-ico warn">⚠️</div>
              <div>
                <div className="detect-title">{warning}</div>
                <div className="detect-sub">Use the slider or manual input below to set your available storage budget</div>
              </div>
            </div>
          )}

          {persistedStatus && (
            <div className="banner info" style={{ marginBottom: 14 }}>
              <span className="banner-ico">🔒</span>
              <span>{persistedStatus}</span>
            </div>
          )}

          {/* Current Budget Meter (with restored CSS classes) */}
          {gb > 0 && (
            <div className="meter-box">
              <div className="meter-top">
                <div>
                  <span className="meter-key">Allocated Offline Library Budget</span>
                  <div style={{ fontSize: 11, color: 'var(--k-text3)', marginTop: 2 }}>
                    Recommendations in Step 5 will automatically fit within this capacity cap
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`meter-val ${fillClass}`}>{gb} GB</span>
                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                    {gb} GB Remaining Free
                  </div>
                </div>
              </div>
              <div className="meter-track">
                <div className={`meter-fill ${fillClass}`} style={{ width: `${fillPct}%` }} />
              </div>
              <div className="meter-hint">{hint}</div>
            </div>
          )}

          {/* ─── INTERACTIVE STORAGE BUDGET SLIDER & PRESETS ───────────────────── */}
          <div className="storage-boost-wrap">
            <div className="storage-boost-header">
              <div className="storage-boost-title">
                <span>🎚️</span> Adjust Storage Budget
              </div>
              <span style={{ fontSize: 11, color: 'var(--k-text3)', fontWeight: 600 }}>
                Drag slider, pick a preset tier, or enter an exact GB value
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="150"
              step="1"
              value={Math.min(gb || 20, 150)}
              onChange={e => updateBudget(parseFloat(e.target.value))}
              className="storage-slider"
              aria-label="Storage budget in gigabytes"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--k-text3)', fontWeight: 600, marginBottom: 14 }}>
              <span>1 GB (Minimal)</span>
              <span>20 GB (Standard)</span>
              <span>64 GB (SD Card)</span>
              <span>150 GB+ (Full Archives)</span>
            </div>

            {/* Preset Budget Tiers */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div className="quick-boost-pills" style={{ marginBottom: 0 }}>
                {BUDGET_PRESETS.map(p => (
                  <button
                    key={p.gb}
                    type="button"
                    className={`boost-pill ${Math.abs(gb - p.gb) < 0.5 ? 'active' : ''}`}
                    onClick={() => updateBudget(p.gb)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Compact Stepper + Manual Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="stepper-wrap">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => addStorage(-1)}
                    disabled={gb <= 1}
                    title="Decrease 1 GB"
                  >
                    –
                  </button>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => addStorage(1)}
                    title="Increase 1 GB"
                  >
                    +
                  </button>
                </div>
                <div style={{ position: 'relative', width: 110 }}>
                  <input
                    id="gbInput"
                    type="number"
                    min="0.5"
                    step="0.5"
                    className="field-input"
                    style={{ paddingRight: 32, fontWeight: 700 }}
                    value={manualGB}
                    onChange={handleManual}
                    placeholder="20"
                    aria-label="Custom storage target in GB"
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: 'var(--k-text3)' }}>
                    GB
                  </span>
                </div>
              </div>
            </div>

            {/* ─── COLLAPSIBLE EXTERNAL STORAGE / SD CARD EXPANSION ─────── */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--k-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setShowExternalDrawer(prev => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--k-blue-accent)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  <span>{showExternalDrawer || mountedDrives.length > 0 ? '▾' : '▸'}</span>
                  <span>📁 Simulate External MicroSD / USB-OTG Expansion</span>
                </button>
                {mountedDrives.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--k-green-dark)', fontWeight: 700 }}>
                    ✓ {mountedDrives.length} External Drive{mountedDrives.length > 1 ? 's' : ''} Mounted
                  </span>
                )}
              </div>

              {(showExternalDrawer || mountedDrives.length > 0) && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 11, color: 'var(--k-text3)', marginBottom: 8 }}>
                    Test how mounting removable storage expands your budget for multi-gigabyte ZIM archives:
                  </p>
                  <div className="external-drive-grid">
                    {PRESET_DRIVES.map(drive => {
                      const isMounted = mountedDrives.some(d => d.id === drive.id);
                      return (
                        <div
                          key={drive.id}
                          className={`external-drive-card ${isMounted ? 'attached' : ''}`}
                          onClick={() => toggleMountDrive(drive)}
                        >
                          <div style={{ fontSize: 22, marginBottom: 4 }}>{drive.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--k-text)' }}>
                            +{drive.sizeGB} GB {drive.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--k-text3)' }}>
                            {drive.brand}
                          </div>
                          <div style={{
                            marginTop: 6, fontSize: 11, fontWeight: 700,
                            color: isMounted ? 'var(--k-green-dark)' : 'var(--k-blue-accent)'
                          }}>
                            {isMounted ? '✓ Mounted (Click to Eject)' : '+ Mount Drive'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {mountedDrives.length > 0 && (
                    <div className="mounted-drives-list">
                      {mountedDrives.map(drive => (
                        <div key={drive.id} className="mounted-drive-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{drive.icon}</span>
                            <strong>{drive.brand} ({drive.name})</strong>
                            <span style={{ color: 'var(--k-green-dark)', fontWeight: 700 }}>+{drive.sizeGB} GB active</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMountDrive(drive)}
                            style={{
                              background: 'none', border: 'none', color: 'var(--k-red)',
                              cursor: 'pointer', fontSize: 11, fontWeight: 700
                            }}
                          >
                            ✕ Eject
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Connection Speed */}
      <div className="sec-label" style={{ marginTop: 8 }}>📡 Connection speed assumption (for download time estimates)</div>
      <div className="speed-pills" style={{ marginBottom: 20 }}>
        {SPEEDS.map(s => (
          <button
            key={s.value}
            type="button"
            className={`speed-pill ${speedMbps === s.value ? 'active' : ''}`}
            onClick={() => setSpeedMbps(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bottom-bar">
        <button className="btn btn-ghost" onClick={goBack}>← Back</button>
        <button className="btn btn-primary" onClick={goNext} disabled={!storageGB || storageGB <= 0}>
          See recommendations ({gb} GB budget) →
        </button>
      </div>
    </>
  );
}
