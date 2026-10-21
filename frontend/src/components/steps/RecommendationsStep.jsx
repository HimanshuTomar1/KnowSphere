import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import LeftUpStorageCard from '../LeftUpStorageCard';

function estimateTime(bytes, speedMbps) {
  if (!bytes || bytes <= 0) return '0s';
  const speed = speedMbps || 10;
  const seconds = (bytes * 8) / (speed * 1e6);
  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)} min`;
  return `~${(seconds / 3600).toFixed(1)} hr`;
}

export default function RecommendationsStep({
  interests = [], languages = ['en'], storageGB = 20, speedMbps = 10,
  setStorageGB, setSpeedMbps,
  recommendations = [], setRecommendations,
  selectedZims = [], setSelectedZims,
  saveSession, goNext, goBack,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  const interestsKey = Array.isArray(interests) ? interests.slice().sort().join(',') : '';
  const languagesKey = Array.isArray(languages) ? languages.slice().sort().join(',') : 'en';
  const prevProfileRef = useRef('');

  const fetchRecommendations = useCallback(async (forceReselect = false) => {
    setLoading(true);
    setError(null);
    try {
      let sid = null;
      if (typeof saveSession === 'function') {
        sid = await saveSession({
          interests,
          languages,
          storageGB: storageGB || 20,
          connectionSpeedMbps: speedMbps || 10,
        });
      }

      const params = {
        sessionId: sid || '',
        interests: interestsKey,
        languages: languagesKey || 'en',
        storageGB: storageGB || 20,
        speedMbps: speedMbps || 10,
      };

      const res = await axios.get('/api/recommendations', { params });
      const recs = res.data.recommendations || [];
      setRecommendations(recs);

      // Adapt selection automatically when preferences, storage, or speed profile change
      const currentValid = selectedZims.filter(id => recs.some(r => r.id === id));
      if (forceReselect || currentValid.length === 0) {
        if (res.data.defaultSelectedIds && res.data.defaultSelectedIds.length > 0) {
          setSelectedZims(res.data.defaultSelectedIds);
        } else {
          const fitting = recs.filter(z => z.fitsInStorage).map(z => z.id);
          setSelectedZims(fitting.length > 0 ? fitting : [recs[0]?.id].filter(Boolean));
        }
      }
    } catch (err) {
      console.error('Recommendations error:', err);
      setError('Could not load recommendations. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [interests, languages, interestsKey, languagesKey, storageGB, speedMbps, saveSession, setRecommendations, selectedZims, setSelectedZims]);

  // Automatically recalculate recommendations whenever preferences, storageGB, or speedMbps change
  useEffect(() => {
    const profileKey = `${interestsKey}|${languagesKey}|${storageGB}|${speedMbps}`;
    if (prevProfileRef.current !== profileKey || recommendations.length === 0) {
      const shouldReselect = prevProfileRef.current !== '' && prevProfileRef.current !== profileKey;
      prevProfileRef.current = profileKey;
      fetchRecommendations(shouldReselect);
    }
  }, [interestsKey, languagesKey, storageGB, speedMbps]); // eslint-disable-line

  const toggleZim = id => {
    setSelectedZims(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedPacks = useMemo(() =>
    recommendations.filter(z => selectedZims.includes(z.id)),
    [recommendations, selectedZims]
  );

  const totalBytes = useMemo(() =>
    selectedPacks.reduce((acc, z) => acc + (z.sizeBytes || 0), 0),
    [selectedPacks]
  );

  const availableBytes = (storageGB || 20) * 1e9;
  const isOverBudget = totalBytes > availableBytes;

  // 1-Click fix to boost storage when user selects heavy archives
  const handleBoostStorageToFit = () => {
    const neededGB = Math.ceil((totalBytes / 1e9) + 2);
    if (typeof setStorageGB === 'function') {
      setStorageGB(neededGB);
      setFeedback(`⚡ Storage budget increased to ${neededGB} GB so all selected packs fit.`);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // 1-Click fix for a specific pack
  const handleExpandForPack = (zimSizeBytes, e) => {
    e.stopPropagation();
    const packGB = Math.ceil(zimSizeBytes / 1e9);
    const newStorage = Math.max(storageGB + packGB, Math.ceil((totalBytes + zimSizeBytes) / 1e9) + 2);
    if (typeof setStorageGB === 'function') {
      setStorageGB(newStorage);
      setFeedback(`⚡ Storage budget expanded to ${newStorage} GB to accommodate this pack.`);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Filtered view by category
  const filteredRecommendations = useMemo(() => {
    if (categoryFilter === 'all') return recommendations;
    return recommendations.filter(z => z.category === categoryFilter);
  }, [recommendations, categoryFilter]);

  // Extract unique categories for filter pills
  const categoriesPresent = useMemo(() => {
    const set = new Set(recommendations.map(z => z.category));
    return Array.from(set);
  }, [recommendations]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="step-eyebrow" style={{ marginBottom: 0 }}>✨ Step 5 of 7</div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => fetchRecommendations(true)}
          disabled={loading}
          title="Recalculate recommendations"
        >
          {loading ? 'Refreshing…' : '🔄 Reset to Top Picks'}
        </button>
      </div>

      <h2 className="step-title">Recommended Knowledge Packs</h2>
      <p className="step-desc" style={{ marginBottom: 14 }}>
        Automatically adapted to your languages ({languages.join(', ').toUpperCase() || 'EN'}), topics, storage budget ({storageGB || 20} GB), and connection speed ({speedMbps} Mbps).
      </p>

      {feedback && (
        <div className="banner ok" style={{ animation: 'fadeIn 0.25s ease' }}>
          <span className="banner-ico">✨</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* ─── TOP STORAGE SUMMARY BAR (Live feedback without scrolling) ─── */}
      <LeftUpStorageCard
        storageGB={storageGB}
        usedBytes={totalBytes}
        subtitle={
          isOverBudget
            ? `Selection exceeds your ${storageGB} GB budget by ${((totalBytes - availableBytes) / 1e9).toFixed(1)} GB`
            : `Total selected: ${selectedPacks.length} pack${selectedPacks.length !== 1 ? 's' : ''} (~${estimateTime(totalBytes, speedMbps)} at ${speedMbps} Mbps)`
        }
        onExpand={handleBoostStorageToFit}
      />

      {isOverBudget && (
        <div style={{
          marginBottom: 14, padding: '12px 16px', borderRadius: 'var(--r-md)',
          background: 'var(--k-red-bg)', border: '1.5px solid var(--k-red-bd)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10
        }}>
          <span style={{ fontSize: 12, color: 'var(--k-red)', fontWeight: 700 }}>
            ⚠️ Selection exceeds your {storageGB} GB budget by {((totalBytes - availableBytes) / 1e9).toFixed(1)} GB. Uncheck a pack or expand your budget.
          </span>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleBoostStorageToFit}
            style={{ fontWeight: 800 }}
          >
            ⚡ Expand Budget to {Math.ceil((totalBytes / 1e9) + 2)} GB
          </button>
        </div>
      )}

      {/* ─── CONNECTION-AWARE RECOMMENDATIONS BAR ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '10px 14px',
        background: '#FFFFFF',
        border: '1px solid var(--k-border)',
        borderRadius: 'var(--r-lg)',
        marginBottom: 14,
        fontSize: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1D1D1F', fontWeight: 600 }}>
          <span>📶 Connection-Aware Ranking:</span>
          <span style={{ color: '#64748B', fontWeight: 500, fontSize: 11 }}>
            {speedMbps <= 2 ? 'Low-bandwidth mode active (prioritizing compact/mini ZIM packs)' : 'Broadband mode active (full multimedia archives prioritized)'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: '2G (0.2M)', speed: 0.2 },
            { label: '3G (2M)', speed: 2 },
            { label: 'Wi-Fi (10M)', speed: 10 },
            { label: 'Fast (50M)', speed: 50 },
          ].map(net => {
            const isActive = Math.abs(speedMbps - net.speed) < 0.1;
            return (
              <button
                key={net.speed}
                type="button"
                onClick={() => setSpeedMbps && setSpeedMbps(net.speed)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 99,
                  border: isActive ? '1px solid #0071E3' : '1px solid #D2D2D7',
                  background: isActive ? '#0071E3' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#515154',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {net.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter tabs & Quick selection actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`speed-pill ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
            style={{ fontSize: 11, padding: '4px 12px' }}
          >
            All ({recommendations.length})
          </button>
          {categoriesPresent.map(cat => (
            <button
              key={cat}
              type="button"
              className={`speed-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
              style={{ fontSize: 11, padding: '4px 12px', textTransform: 'capitalize' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setSelectedZims(recommendations.filter(z => z.fitsInStorage).map(z => z.id))}
          >
            Select All Fitting
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setSelectedZims([])}
          >
            Clear All
          </button>
        </div>
      </div>

      {loading && (
        <div className="loader">
          <div className="spinner" />
          <span>Scoring and ranking ZIM files for your preferences…</span>
        </div>
      )}

      {error && (
        <div className="banner err">
          <span className="banner-ico">❌</span>
          <div>
            <strong>Error loading packs:</strong> {error}
            <div style={{ marginTop: 6 }}>
              <button className="btn btn-primary btn-sm" onClick={() => fetchRecommendations(false)}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredRecommendations.length === 0 && (
        <div className="empty">
          <span className="empty-ico">🔍</span>
          <div className="empty-txt">
            No matching packs found for this filter.<br />
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setCategoryFilter('all')}>
              Show all ({recommendations.length})
            </button>
          </div>
        </div>
      )}

      {/* ─── ZIM CARDS LIST ────────────────────────────────────────── */}
      {!loading && !error && filteredRecommendations.length > 0 && (
        <div className="zim-list">
          {filteredRecommendations.map(z => {
            const isChecked = selectedZims.includes(z.id);
            const fits = z.sizeBytes <= availableBytes;
            const overflowGB = !fits ? ((z.sizeBytes - availableBytes) / 1e9).toFixed(1) : null;

            return (
              <div
                key={z.id}
                className={`zim-card ${isChecked ? 'on' : ''}`}
                onClick={() => toggleZim(z.id)}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && toggleZim(z.id)}
              >
                <div className="zim-chk">{isChecked ? '✓' : ''}</div>
                <div className="zim-ico">{z.icon || '📖'}</div>

                <div className="zim-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div className="zim-name">{z.title}</div>
                    {z.recommended && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, background: '#EFF6FF',
                        color: '#2563EB', padding: '1px 8px', borderRadius: 99,
                        border: '1px solid #DBEAFE'
                      }}>
                        ⭐ Recommended Match
                      </span>
                    )}
                    {speedMbps <= 2 && (z.sizeBytes <= 1.5e9) && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, background: '#F0FDF4',
                        color: '#166534', padding: '1px 8px', borderRadius: 99,
                        border: '1px solid #86EFAC'
                      }}>
                        📶 Fast on {speedMbps <= 0.5 ? '2G' : '3G'}
                      </span>
                    )}
                    {!fits && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, background: '#FEF2F2',
                        color: '#DC2626', padding: '1px 8px', borderRadius: 99,
                        border: '1px solid #FECACA'
                      }}>
                        Exceeds Budget (+{overflowGB} GB)
                      </span>
                    )}
                  </div>

                  <div className="zim-desc">{z.description}</div>

                  <div className="tags">
                    <span className="tag t-size">💾 {z.sizeFormatted}</span>
                    <span className="tag t-time">⏱ {z.sizeBytes ? estimateTime(z.sizeBytes, speedMbps) : (z.downloadTime || '~5 min')} at {speedMbps} Mbps</span>
                    <span className="tag t-lang">🌐 {z.language?.toUpperCase()}</span>
                    <span className="tag" style={{ background: 'var(--k-bg2)', color: 'var(--k-text2)', textTransform: 'capitalize' }}>
                      📁 {z.category}
                    </span>
                  </div>

                  {/* Quick Expand button if pack is too big */}
                  {!fits && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontSize: 11, padding: '3px 10px',
                          borderColor: '#FCA5A5', background: '#FFF5F5', color: '#B91C1C'
                        }}
                        onClick={e => handleExpandForPack(z.sizeBytes, e)}
                      >
                        ⚡ Expand Budget to Fit This Pack
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── BOTTOM NAV BAR ────────────────────────────────────────── */}
      <div className="bottom-bar">
        <button className="btn btn-ghost" onClick={goBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={goNext}
          disabled={selectedZims.length === 0 || isOverBudget || loading}
        >
          {selectedZims.length === 0
            ? 'Select at least 1 pack'
            : isOverBudget
            ? 'Resolve storage budget to continue'
            : `Download ${selectedZims.length} pack${selectedZims.length !== 1 ? 's' : ''} (${(totalBytes / 1e9).toFixed(1)} GB) →`}
        </button>
      </div>
    </>
  );
}
