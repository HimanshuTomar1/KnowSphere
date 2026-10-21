import React from 'react';

function fmtBytes(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + ' TB';
  if (bytes >= 1e9)  return (bytes / 1e9).toFixed(1) + ' GB';
  if (bytes >= 1e6)  return (bytes / 1e6).toFixed(1) + ' MB';
  if (bytes >= 1e3)  return (bytes / 1e3).toFixed(1) + ' KB';
  return bytes + ' B';
}

export default function LeftUpStorageCard({
  storageGB = 20,
  usedBytes = 0,
  subtitle = 'Available device budget after installing selected packs',
  onExpand = null
}) {
  const totalAllocatedBytes = (parseFloat(storageGB) || 20) * 1e9;
  const remainingBytes = Math.max(0, totalAllocatedBytes - usedBytes);

  const usedPercent = Math.min(100, Math.max(0, (usedBytes / totalAllocatedBytes) * 100));
  const freePercent = Math.max(0, 100 - usedPercent);
  const isOverBudget = usedBytes > totalAllocatedBytes;

  return (
    <div className="left-up-storage-card" style={isOverBudget ? { borderColor: '#F87171', background: '#FEF2F2' } : {}}>
      <div className="left-up-header">
        <div className="left-up-title-wrap">
          <div className="left-up-icon" style={isOverBudget ? { background: '#FEE2E2', color: '#DC2626' } : {}}>
            {isOverBudget ? '⚠️' : '💾'}
          </div>
          <div>
            <div className="left-up-label" style={isOverBudget ? { color: '#B91C1C' } : {}}>
              REMAINING STORAGE AFTER INSTALL
            </div>
            <div className="left-up-highlight">
              <span className="left-up-big-val" style={isOverBudget ? { color: '#DC2626' } : {}}>
                {isOverBudget ? `Over budget by ${fmtBytes(usedBytes - totalAllocatedBytes)}` : `${fmtBytes(remainingBytes)} free`}
              </span>
              <span className="left-up-badge" style={isOverBudget ? { background: '#FEE2E2', color: '#B91C1C', borderColor: '#FCA5A5' } : {}}>
                {isOverBudget ? 'Storage Limit Exceeded' : `${freePercent.toFixed(1)}% Available`}
              </span>
            </div>
            <div style={{ fontSize: 11, color: isOverBudget ? '#B91C1C' : 'var(--k-text3)', marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
        </div>

        <div className="left-up-metrics-grid">
          <div className="left-up-stat">
            <span className="stat-label">Storage Budget</span>
            <span className="stat-val">{(storageGB || 20)} GB</span>
          </div>
          <div className="left-up-stat">
            <span className="stat-label">Selected ZIMs</span>
            <span className="stat-val stat-used">{fmtBytes(usedBytes)}</span>
          </div>
          <div className="left-up-stat">
            <span className="stat-label">Remaining</span>
            <span className="stat-val stat-free" style={isOverBudget ? { color: '#DC2626' } : {}}>
              {fmtBytes(remainingBytes)}
            </span>
          </div>
          {onExpand && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onExpand}
              style={{ fontSize: 11, padding: '4px 10px', fontWeight: 700, color: 'var(--k-blue-accent)' }}
            >
              + Adjust Budget
            </button>
          )}
        </div>
      </div>

      {/* Dual Segment Progress Bar */}
      <div className="left-up-meter">
        <div
          className="left-up-bar-used"
          style={{
            width: `${usedPercent}%`,
            background: isOverBudget ? '#EF4444' : undefined
          }}
          title={`Selected Packs: ${fmtBytes(usedBytes)} (${usedPercent.toFixed(1)}%)`}
        />
        <div
          className="left-up-bar-free"
          style={{ width: `${freePercent}%` }}
          title={`Remaining Free: ${fmtBytes(remainingBytes)} (${freePercent.toFixed(1)}%)`}
        />
      </div>

      <div className="left-up-legend">
        <div className="legend-item">
          <span className="legend-dot dot-used" style={isOverBudget ? { background: '#EF4444' } : {}} />
          <span>Selected ZIM Knowledge Packs ({fmtBytes(usedBytes)} · {usedPercent.toFixed(1)}%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-free" />
          <span><strong>Remaining Storage</strong> ({fmtBytes(remainingBytes)} · {freePercent.toFixed(1)}% free)</span>
        </div>
      </div>
    </div>
  );
}
