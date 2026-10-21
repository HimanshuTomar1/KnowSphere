import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import LeftUpStorageCard from '../LeftUpStorageCard';
import OfflineReaderModal from '../OfflineReaderModal';

const NETWORK_TYPES = [
  { id: '2g',    label: '2G Edge',    speed: 0.2, icon: '📶', desc: 'Slow Cellular' },
  { id: '3g',    label: '3G Mobile',  speed: 2,   icon: '📶', desc: 'Standard 3G' },
  { id: '4g',    label: '4G LTE',     speed: 15,  icon: '📶', desc: 'Fast Mobile' },
  { id: 'wifi',  label: 'Wi-Fi',      speed: 30,  icon: '📡', desc: 'Broadband Wi-Fi' },
  { id: 'fiber', label: 'Fiber / 5G', speed: 100, icon: '🚀', desc: 'Gigabit Fiber' },
];

function formatDuration(seconds) {
  if (isNaN(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.ceil(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function estimateTime(bytes, speedMbps) {
  if (!bytes || bytes <= 0) return '0s';
  const speed = speedMbps || 15;
  const seconds = (bytes * 8) / (speed * 1e6);
  return formatDuration(seconds);
}

export default function DownloadStep({
  recommendations = [],
  setRecommendations,
  selectedZims = [],
  setSelectedZims,
  sessionId,
  storageGB = 20,
  setStorageGB,
  speedMbps = 15,
  setSpeedMbps,
  downloads = [],
  setDownloads,
  openRecoveryDemo,
  goNext,
  goBack,
}) {
  const [started,  setStarted]  = useState(false);
  const [starting, setStarting] = useState(false);
  const [error,    setError]    = useState(null);
  const [activeReaderPack, setActiveReaderPack] = useState(null);
  const [localSpeed, setLocalSpeed] = useState(speedMbps || 15);
  const mountedRef = useRef(true);

  const currentSpeed = speedMbps || localSpeed;

  const handleSelectNetwork = speed => {
    setLocalSpeed(speed);
    if (typeof setSpeedMbps === 'function') {
      setSpeedMbps(speed);
    }
  };

  const currentNetwork = useMemo(() => {
    return (
      NETWORK_TYPES.find(n => Math.abs(n.speed - currentSpeed) < 0.01) || {
        id: 'custom',
        label: `${currentSpeed} Mbps`,
        speed: currentSpeed,
        icon: '📡',
        desc: `${currentSpeed} Mbps Connection`,
      }
    );
  }, [currentSpeed]);

  // If recommendations or selections are empty (e.g. direct nav or refresh), auto-recover
  useEffect(() => {
    mountedRef.current = true;
    if (!recommendations || recommendations.length === 0) {
      axios.get('/api/recommendations', { params: { storageGB: storageGB || 20 } })
        .then(res => {
          const recs = res.data.recommendations || [];
          if (recs.length > 0 && mountedRef.current) {
            if (typeof setRecommendations === 'function') setRecommendations(recs);
            if ((!selectedZims || selectedZims.length === 0) && typeof setSelectedZims === 'function') {
              setSelectedZims(res.data.defaultSelectedIds || [recs[0].id]);
            }
          }
        })
        .catch(err => console.warn('Auto-recover recommendations error:', err));
    }
    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line

  // Compute packs to download with bulletproof fallbacks
  const packs = useMemo(() => {
    const list = Array.isArray(recommendations) ? recommendations : [];
    const selected = Array.isArray(selectedZims) ? selectedZims : [];
    const filtered = list.filter(z => selected.includes(z.id));
    if (filtered.length > 0) return filtered;
    if (list.length > 0) return list.slice(0, 3);
    
    return [
      {
        id: 'ted-en',
        title: 'TED Talks',
        description: 'Inspiring talks on science, tech, education and global issues.',
        category: 'education',
        sizeBytes: 7.8e9,
        sizeFormatted: '7.8 GB',
        downloadTime: '~10 min',
        icon: '💡'
      },
      {
        id: 'wikimed-en',
        title: 'WikiMed Medical Encyclopedia',
        description: 'Complete offline healthcare guide and medical references.',
        category: 'health',
        sizeBytes: 4.8e9,
        sizeFormatted: '4.8 GB',
        downloadTime: '~6 min',
        icon: '🩺'
      }
    ];
  }, [recommendations, selectedZims]);

  // ── Start downloads ───────────────────────────────────────────────
  const startDownloads = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const results = await Promise.all(
        packs.map(z =>
          axios.post('/api/download/start', { zimId: z.id, sessionId }).then(r => ({
            downloadId: r.data.downloadId,
            zimId: z.id,
            title: z.title,
            icon: z.icon || '📦',
            sizeBytes: z.sizeBytes,
            downloadedBytes: 0,
            status: 'downloading',
            progress: '0',
            downloadedFormatted: '0 B',
            totalFormatted: z.sizeFormatted,
            sourceUrl: z.downloadUrl || null,
          }))
        )
      );
      if (!mountedRef.current) return;
      setDownloads(results);
      setStarted(true);
    } catch (err) {
      console.error('Download start error:', err);
      setError('Failed to start downloads. Please verify the backend is running.');
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }, [packs, sessionId, setDownloads]);

  // ── Bulletproof Polling Loop ──────────────────────────────────────
  useEffect(() => {
    if (!started) return;

    const intervalId = setInterval(async () => {
      if (!mountedRef.current) return;

      try {
        const res = await axios.get('/api/downloads');
        const serverList = res.data || [];

        setDownloads(prev => {
          if (!prev || prev.length === 0) return prev;
          return prev.map(dl => {
            const found = serverList.find(s => s.id === dl.downloadId || s.zimId === dl.zimId);
            if (!found) return dl;
            return {
              ...dl,
              ...found,
              downloadId: found.id || dl.downloadId,
              status: found.status || dl.status,
              progress: found.progress !== undefined ? found.progress : dl.progress,
              downloadedBytes: found.downloadedBytes !== undefined ? found.downloadedBytes : dl.downloadedBytes,
              downloadedFormatted: found.downloadedFormatted || dl.downloadedFormatted,
              totalFormatted: found.totalFormatted || dl.totalFormatted,
              sourceUrl: found.sourceUrl || dl.sourceUrl,
            };
          });
        });
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 700);

    return () => clearInterval(intervalId);
  }, [started, setDownloads]);

  const safe      = Array.isArray(downloads) ? downloads : [];
  const allDone   = safe.length > 0 && safe.every(d => ['completed','cancelled'].includes(d.status));
  const doneCount = safe.filter(d => d.status === 'completed').length;

  // Calculate storage metrics dynamically
  const preflightSelectedBytes = useMemo(
    () => packs.reduce((acc, p) => acc + (p.sizeBytes || 0), 0),
    [packs]
  );

  const activeUsedBytes = useMemo(() => {
    if (!started && safe.length === 0) return preflightSelectedBytes;
    return safe.reduce((acc, d) => {
      if (d.status === 'cancelled') return acc;
      if (d.status === 'completed') return acc + (d.sizeBytes || 0);
      return acc + (d.downloadedBytes || 0);
    }, 0);
  }, [safe, started, preflightSelectedBytes]);

  // ── Per-download controls ─────────────────────────────────────────
  const pause = async id => {
    await axios.post(`/api/download/${id}/pause`);
    setDownloads(p => p.map(d => d.downloadId === id ? { ...d, status:'paused' } : d));
  };
  const resume = async id => {
    await axios.post(`/api/download/${id}/resume`);
    setDownloads(p => p.map(d => d.downloadId === id ? { ...d, status:'downloading' } : d));
  };
  const cancel = async id => {
    await axios.post(`/api/download/${id}/cancel`);
    setDownloads(p => p.map(d => d.downloadId === id ? { ...d, status:'cancelled' } : d));
  };

  const handleExpandStorage = () => {
    if (typeof setStorageGB === 'function') {
      setStorageGB(storageGB + 10);
    }
  };

  // Direct physical download trigger to save .zim file to user's computer
  const handleDownloadFile = dl => {
    const id = dl.downloadId || dl.id;
    const downloadUrl = `http://localhost:5000/api/download/${id}/file`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${(dl.title || dl.zimId).replace(/[^a-zA-Z0-9_-]/g, '_')}.zim`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Reusable Dynamic Network Selector Bar Component ──────────────
  const renderNetworkSwitcher = () => (
    <div style={{
      padding: '12px 16px',
      background: '#FFFFFF',
      border: '1.5px solid var(--k-border)',
      borderRadius: 'var(--r-lg)',
      marginBottom: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--k-text)', fontFamily: 'Inter, sans-serif' }}>
              Network Connection: <span style={{ color: 'var(--k-blue)' }}>{currentNetwork.label}</span>
              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--k-text3)', fontWeight: 500 }}>
                ({currentSpeed} Mbps · {currentNetwork.desc})
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--k-text3)', marginTop: 1 }}>
              Download times and ETAs calculate dynamically based on active network profile:
            </div>
          </div>
        </div>

        <span style={{
          fontSize: 11,
          fontWeight: 600,
          background: 'var(--k-bg2)',
          color: 'var(--k-text2)',
          padding: '3px 10px',
          borderRadius: 99,
          border: '1px solid var(--k-border)'
        }}>
          ⚡ Live ETA Engine Active
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {NETWORK_TYPES.map(net => {
          const isCurrent = Math.abs(currentSpeed - net.speed) < 0.01;
          return (
            <button
              key={net.id}
              type="button"
              className={`speed-pill ${isCurrent ? 'active' : ''}`}
              onClick={() => handleSelectNetwork(net.speed)}
              style={{
                fontSize: 11,
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
                borderRadius: 99,
              }}
            >
              <span>{net.icon}</span>
              <span>{net.label}</span>
              <span style={{ opacity: 0.85, fontSize: 10 }}>({net.speed} Mbps)</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── PRE-FLIGHT SCREEN ────────────────────────────────────────────
  if (!started && !starting && safe.length === 0) {
    return (
      <>
        <div className="step-eyebrow">⬇️ Step 6 of 7</div>
        <h2 className="step-title">Ready to download</h2>
        <p className="step-desc">
          Review your selected packs and storage allocation, then click <strong>Start Downloading</strong> to begin.
          Content will be verified and saved for 100% offline access.
        </p>

        {error && (
          <div className="banner err" style={{ marginBottom: 16 }}>
            <span className="banner-ico">❌</span>{error}
          </div>
        )}

        {/* ── Prominent Left Up Storage Card ── */}
        <LeftUpStorageCard
          storageGB={storageGB}
          usedBytes={preflightSelectedBytes}
          subtitle="Remaining storage after downloading selected packs"
          onExpand={handleExpandStorage}
        />

        {/* ── Dynamic Network Type Switcher ── */}
        {renderNetworkSwitcher()}

        {/* ── Batch Estimated Download Time Banner ── */}
        <div style={{
          padding: '12px 16px',
          background: '#EFF6FF',
          border: '1.5px solid #BFDBFE',
          borderRadius: 'var(--r-md)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⏱</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#1E40AF' }}>
                Batch Download Time Estimate: ~{estimateTime(preflightSelectedBytes, currentSpeed)}
              </div>
              <div style={{ fontSize: 11, color: '#1D4ED8' }}>
                Total {packs.length} packs ({((preflightSelectedBytes)/1e9).toFixed(1)} GB) under {currentNetwork.label} ({currentSpeed} Mbps)
              </div>
            </div>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            background: '#DBEAFE',
            color: '#1E40AF',
            padding: '2px 8px',
            borderRadius: 6
          }}>
            Dynamic Formula: (Bytes × 8) ÷ Rate
          </span>
        </div>

        {/* ── Recovery Demonstration Launcher ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          padding: '12px 16px', background: '#ECFDF5', border: '1.5px solid #A7F3D0',
          borderRadius: 'var(--r-lg)', marginBottom: 18
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🧪</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#065F46' }}>
                Resilient Recovery & Crash Proofing Built In
              </div>
              <div style={{ fontSize: 11, color: '#047857' }}>
                Downloads use atomic chunk verification. If Wi-Fi cuts out, downloads resume at the exact byte.
              </div>
            </div>
          </div>
          {openRecoveryDemo && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={openRecoveryDemo}
              style={{ background: '#059669', borderColor: '#047857', fontWeight: 800 }}
            >
              🧪 Run Recovery Test
            </button>
          )}
        </div>

        <div className="pre-list">
          {packs.map(z => {
            const packTime = estimateTime(z.sizeBytes, currentSpeed);
            return (
              <div key={z.id} className="pre-row">
                <div className="pre-ico">{z.icon || '📦'}</div>
                <div className="pre-body">
                  <div className="pre-name">{z.title}</div>
                  <div className="pre-sub">{z.description}</div>
                </div>
                <div className="pre-right">
                  <div className="pre-size">{z.sizeFormatted}</div>
                  <div className="pre-time" style={{ color: 'var(--k-blue-dark)', fontWeight: 800 }}>
                    ⏱ ~{packTime} at {currentNetwork.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="banner info">
          <span className="banner-ico">ℹ️</span>
          Downloads run in the background with automatic chunk caching. Interrupted downloads can be resumed at any time.
        </div>

        <div className="bottom-bar">
          <button className="btn btn-ghost" onClick={goBack}>← Back</button>
          <button
            className="btn btn-primary btn-lg"
            onClick={startDownloads}
          >
            ⬇️ Start Downloading ({packs.length} pack{packs.length !== 1 ? 's' : ''})
          </button>
        </div>
      </>
    );
  }

  // ─── ACTIVE DOWNLOAD SCREEN ───────────────────────────────────────
  return (
    <>
      <div className="step-eyebrow">⬇️ Step 6 of 7</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <h2 className="step-title" style={{ margin: 0 }}>
          {allDone ? `🎉 ${doneCount} pack${doneCount !== 1 ? 's' : ''} ready offline!` : 'Downloading Content…'}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {doneCount > 0 && (
            <button
              type="button"
              className="btn-offline-read"
              onClick={() => setActiveReaderPack(safe.find(d => d.status === 'completed'))}
            >
              📖 Open Offline Reader ({doneCount})
            </button>
          )}
          {allDone && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={startDownloads}
              title="Restart downloads"
            >
              🔄 Redownload
            </button>
          )}
        </div>
      </div>

      <p className="step-desc" style={{ marginTop: 6 }}>
        {allDone
          ? 'Your content is verified and cached locally. You can open and read articles right now without any internet connection.'
          : 'High-speed local caching active. You can pause or resume individual packs, and open completed ones immediately.'}
      </p>

      {/* ── Prominent Left Up Storage Card (Real-time updates) ── */}
      <LeftUpStorageCard
        storageGB={storageGB}
        usedBytes={activeUsedBytes}
        subtitle={allDone ? "Final remaining storage on your device" : "Storage remaining as downloads complete"}
        onExpand={handleExpandStorage}
      />

      {/* ── Interactive Network Switcher (Live ETA Recalculation) ── */}
      {renderNetworkSwitcher()}

      {/* ── Recovery Demonstration Banner ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        padding: '10px 14px', background: '#ECFDF5', border: '1.5px solid #A7F3D0',
        borderRadius: 'var(--r-lg)', marginBottom: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🧪</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#065F46' }}>
              Fault-Tolerant Knowledge Stream
            </div>
            <div style={{ fontSize: 11, color: '#047857' }}>
              Test network failure and verify zero data rollback with the recovery simulator.
            </div>
          </div>
        </div>
        {openRecoveryDemo && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={openRecoveryDemo}
            style={{ background: '#059669', borderColor: '#047857', fontWeight: 800, fontSize: 11, padding: '5px 12px' }}
          >
            🧪 Run Recovery Test
          </button>
        )}
      </div>

      {starting && (
        <div className="loader"><div className="spinner" /><span>Connecting to KnowSphere library and initializing download stream…</span></div>
      )}

      {error && (
        <div className="banner err" style={{ marginBottom: 14 }}>
          <span className="banner-ico">❌</span>
          <div style={{ flex: 1 }}>{error}</div>
          <button className="btn btn-primary btn-sm" onClick={startDownloads}>Retry</button>
        </div>
      )}

      {/* Done notification banner */}
      {doneCount > 0 && (
        <div className="banner ok" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>📖</span>
            <div>
              <strong>Offline Reading Ready!</strong>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {doneCount} pack{doneCount > 1 ? 's' : ''} saved locally. Click <strong>Open & Read Offline</strong> or save the raw <strong>.ZIM</strong> file to disk.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-green btn-sm"
              style={{ fontWeight: 800 }}
              onClick={() => setActiveReaderPack(safe.find(d => d.status === 'completed'))}
            >
              📖 Read Now
            </button>
          </div>
        </div>
      )}

      {/* ── Active Downloads List with Dynamic ETAs ── */}
      <div className="dl-list">
        {safe.map(dl => {
          const pct = Math.min(parseFloat(dl.progress) || 0, 100);
          const isDone = dl.status === 'completed';

          const remBytes = Math.max(0, (dl.sizeBytes || 1.5e9) - (dl.downloadedBytes || 0));
          const etaFormatted = estimateTime(remBytes, currentSpeed);

          const badge = {
            downloading: <span className="badge b-blue">Downloading ({pct.toFixed(0)}%)</span>,
            paused:      <span className="badge b-amber">Paused</span>,
            completed:   <span className="badge b-green">✅ Done</span>,
            cancelled:   <span className="badge b-muted">Cancelled</span>,
            failed:      <span className="badge b-red">Failed</span>,
          }[dl.status] || <span className="badge b-blue">{dl.status}</span>;

          return (
            <div key={dl.downloadId || dl.id} className={`dl-card ${dl.status}`}>
              <div className="dl-head">
                <div className="dl-ico">{dl.icon || '📦'}</div>
                <div className="dl-meta">
                  <div className="dl-name">{dl.title}</div>
                  
                  {/* Download Progress Bytes & Dynamic Network ETA */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                    <span className="dl-bytes" style={{ margin: 0 }}>
                      {dl.downloadedFormatted || '0 B'} / {dl.totalFormatted || '—'}
                    </span>

                    {!isDone && dl.status === 'downloading' && (
                      <>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#1E40AF',
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          padding: '1px 8px',
                          borderRadius: 99
                        }}>
                          ⏱ Remaining: ~{etaFormatted} ({currentNetwork.label})
                        </span>
                        <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                          ⚡ Rate: ~{currentSpeed} Mbps
                        </span>
                      </>
                    )}

                    {dl.status === 'paused' && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#B45309',
                        background: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        padding: '1px 8px',
                        borderRadius: 99
                      }}>
                        ⏸ Paused · ~{etaFormatted} remaining at {currentNetwork.label}
                      </span>
                    )}

                    {isDone && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#15803D',
                        background: '#DCFCE7',
                        border: '1px solid #86EFAC',
                        padding: '1px 8px',
                        borderRadius: 99
                      }}>
                        ✓ Complete · Cached to local disk
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {badge}
                  {isDone && (
                    <>
                      <button
                        type="button"
                        className="btn-offline-read"
                        onClick={() => setActiveReaderPack(dl)}
                        title="Open and read this package offline"
                      >
                        📖 Open & Read Offline
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, fontWeight: 800 }}
                        onClick={() => handleDownloadFile(dl)}
                        title="Download .ZIM file directly to computer"
                      >
                        💾 Save .ZIM
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Track */}
              <div className="dl-track">
                <div className={`dl-fill ${dl.status}`} style={{ width: `${pct}%` }} />
              </div>

              {/* Progress Footer with Dynamic Time Left */}
              <div className="dl-foot">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="dl-pct">{pct.toFixed(1)}%</span>
                  {!isDone && dl.status === 'downloading' && (
                    <span style={{ fontSize: 11, color: 'var(--k-blue-dark)', fontWeight: 800 }}>
                      ⏱ ~{etaFormatted} left
                    </span>
                  )}
                </div>

                {(dl.status === 'downloading' || dl.status === 'paused') && (
                  <div className="dl-btns">
                    {dl.status === 'downloading'
                      ? <button className="btn btn-ghost btn-sm" onClick={() => pause(dl.downloadId)}>⏸ Pause</button>
                      : <button className="btn btn-primary btn-sm" onClick={() => resume(dl.downloadId)}>▶ Resume</button>
                    }
                    <button className="btn btn-danger btn-sm" onClick={() => cancel(dl.downloadId)}>✕ Cancel</button>
                  </div>
                )}

                {isDone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#2E7D32', fontWeight: 700 }}>
                      ⚡ Available offline without internet
                    </span>
                    {dl.sourceUrl && dl.sourceUrl.startsWith('http') && (
                      <a
                        href={dl.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 11, color: 'var(--k-blue)', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Global Mirror CDN ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {safe.some(d => d.status === 'paused' || d.status === 'cancelled') && (
        <div className="banner warn" style={{ marginTop: 14 }}>
          <span className="banner-ico">🔄</span>
          Paused downloads can be resumed at any time — partial progress is safely preserved.
        </div>
      )}

      <div className="bottom-bar">
        <button className="btn btn-ghost" onClick={goBack} disabled={!allDone}>← Back</button>
        <button className="btn btn-primary" onClick={goNext} disabled={!allDone}>
          {allDone ? 'Finish Setup →' : 'Waiting for downloads to complete…'}
        </button>
      </div>

      {/* ── Offline Reader Modal (strictly displays completed downloads) ── */}
      <OfflineReaderModal
        isOpen={!!activeReaderPack}
        onClose={() => setActiveReaderPack(null)}
        zimPack={activeReaderPack}
        downloadedPacks={downloads.filter(d => d.status === 'completed')}
        onSelectPack={setActiveReaderPack}
      />
    </>
  );
}
