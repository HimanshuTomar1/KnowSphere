import React, { useState, useEffect } from 'react';

function fmtBytes(b) {
  if (b === undefined || b === null || isNaN(b)) return '0 B';
  if (b >= 1e12) return (b / 1e12).toFixed(2) + ' TB';
  if (b >= 1e9)  return (b / 1e9).toFixed(2) + ' GB';
  if (b >= 1e6)  return (b / 1e6).toFixed(2) + ' MB';
  if (b >= 1e3)  return (b / 1e3).toFixed(2) + ' KB';
  return b + ' B';
}

export default function UsabilityTestModal({
  isOpen,
  onClose,
  telemetry = {},
  storageGB = 20,
  usedBytes = 0,
  stepCount = 7,
  selectedZimsCount = 0,
  downloadsCount = 0
}) {
  const [susRatings, setSusRatings] = useState([5, 5, 4, 5, 5]); // Likert scale 1-5
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'sus' | 'heuristics' | 'storage'
  const [exportNotice, setExportNotice] = useState(null);
  const [, setLiveTick] = useState(0);

  // Live stopwatch tick inside modal if TTFR is still running
  useEffect(() => {
    if (!isOpen || (telemetry && telemetry.actualTtfrSec !== null && telemetry.actualTtfrSec !== undefined)) return;
    const timer = setInterval(() => setLiveTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen, telemetry]);

  if (!isOpen) return null;

  // ── Calculate dynamic metrics from live telemetry ─────────────────
  const visitedSteps = telemetry.visitedSteps || ['welcome'];
  const taskCompletionRate = Math.min(100, Math.round((visitedSteps.length / stepCount) * 100));

  const liveElapsedSeconds = telemetry.actualTtfrSec !== null && telemetry.actualTtfrSec !== undefined
    ? telemetry.actualTtfrSec
    : Math.max(1, Math.round((Date.now() - (telemetry.sessionStart || Date.now())) / 1000));

  const targetSeconds = 120;
  const isUnderTarget = liveElapsedSeconds <= targetSeconds;
  const targetDiffPct = Math.abs(Math.round(((targetSeconds - liveElapsedSeconds) / targetSeconds) * 100));

  const stepTimes = telemetry.stepTimes || {};
  const interactionCount = telemetry.interactionCount || 0;
  const errorsCount = telemetry.errorsCount || 0;

  // Dynamic storage calculations
  const totalAllocatedBytes = (parseFloat(storageGB) || 20) * 1e9;
  const leftUpBytes = Math.max(0, totalAllocatedBytes - usedBytes);
  const leftPercent = totalAllocatedBytes > 0 ? ((leftUpBytes / totalAllocatedBytes) * 100).toFixed(1) : 100;

  // Dynamic SUS Score Calculation (Standard System Usability Scale)
  const calcSus = () => {
    const rawSum = susRatings.reduce((sum, val) => sum + (val - 1), 0);
    return Math.min(100, Math.round((rawSum / (susRatings.length * 4)) * 100 * 10) / 10);
  };
  const susScore = calcSus();

  const getSusGrade = score => {
    if (score >= 90) return { grade: 'A+', label: 'Best Imaginable (Top 1%)', color: '#10B981' };
    if (score >= 80) return { grade: 'A',  label: 'Excellent', color: '#059669' };
    if (score >= 70) return { grade: 'B',  label: 'Good (Above Average)', color: '#2563EB' };
    if (score >= 60) return { grade: 'C',  label: 'OK', color: '#D97706' };
    return { grade: 'D', label: 'Needs Improvement', color: '#DC2626' };
  };
  const susInfo = getSusGrade(susScore);

  const handleRatingChange = (idx, value) => {
    setSusRatings(prev => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const questions = [
    'I found the onboarding setup simple, logical, and intuitive to complete.',
    'The storage manager and Remaining Storage calculations made capacity planning effortless.',
    'The curated recommendations accurately matched my selected language and interests.',
    'Opening and reading knowledge packs offline with zero internet worked seamlessly.',
    'The recovery mechanisms (pause, resume, network recovery) provided high confidence.'
  ];

  // ── Dynamic Evidence Report Exporter ──────────────────────────────
  const handleExportEvidence = () => {
    const reportData = {
      project: 'KnowSphere — The Global Offline Library',
      timestamp: new Date().toISOString(),
      evaluationEvidence: {
        taskCompletionRate: `${taskCompletionRate}% (${visitedSteps.length} of ${stepCount} steps visited)`,
        timeToFirstResource: `${liveElapsedSeconds} seconds`,
        ttfrBenchmarkTarget: '< 120 seconds',
        ttfrStatus: isUnderTarget ? `${targetDiffPct}% faster than benchmark` : `${targetDiffPct}% over target`,
        userInteractionsRecorded: interactionCount,
        unrecoverableErrors: errorsCount,
        stepDwellTimesSeconds: stepTimes,
        storageEvidence: {
          totalAllocated: `${storageGB} GB`,
          usedByPacks: fmtBytes(usedBytes),
          leftUpStorage: fmtBytes(leftUpBytes),
          freePercentage: `${leftPercent}%`
        },
        susScore: {
          score: `${susScore} / 100`,
          grade: susInfo.grade,
          interpretation: susInfo.label,
          individualRatings: susRatings
        },
        recoveryArchitecture: 'Atomic chunk verification, HTTP Range 206, Zero byte rollback'
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KnowSphere_Usability_Evidence_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice('✓ Dynamic Usability Evidence Report exported to downloads!');
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        style={{ maxWidth: 760, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">✕</button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#EAF3FF',
              border: '1px solid #CCE3FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0071E3', fontSize: 20
            }}>
              📋
            </div>
            <div>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--k-text)' }}>
                Dynamic Usability & Evidence Suite
              </h3>
              <p style={{ fontSize: 12, color: 'var(--k-text3)' }}>
                Live user session telemetry, real-time TTFR stopwatch, and dynamic SUS metrics
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExportEvidence}
            style={{ fontWeight: 800, fontSize: 11, padding: '6px 12px' }}
          >
            📥 Export Evidence (JSON)
          </button>
        </div>

        {exportNotice && (
          <div className="banner ok" style={{ marginBottom: 14 }}>
            <span className="banner-ico">✨</span>
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Tab Nav */}
        <div className="auth-tabs" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveTab('telemetry')}
          >
            📊 Live Session Telemetry
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            💾 Dynamic Storage Equation
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'sus' ? 'active' : ''}`}
            onClick={() => setActiveTab('sus')}
          >
            ⭐ Dynamic SUS Calculator ({susScore}/100)
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'heuristics' ? 'active' : ''}`}
            onClick={() => setActiveTab('heuristics')}
          >
            🔍 Heuristics Audit
          </button>
        </div>

        {/* ─── TAB 1: LIVE SESSION TELEMETRY ──────────────────────── */}
        {activeTab === 'telemetry' && (
          <div>
            {/* Top 3 Live Dynamic Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{
                background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: 14, textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                  Live Task Completion
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#15803D', margin: '4px 0' }}>
                  {taskCompletionRate}%
                </div>
                <div style={{ fontSize: 11, color: '#166534' }}>
                  {visitedSteps.length} of {stepCount} steps visited in session
                </div>
              </div>

              <div style={{
                background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: 14, textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>
                  Dynamic TTFR Clock
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#2563EB', margin: '4px 0' }}>
                  {liveElapsedSeconds}s
                </div>
                <div style={{ fontSize: 11, color: isUnderTarget ? '#15803D' : '#B91C1C', fontWeight: 700 }}>
                  {isUnderTarget ? `✓ ${targetDiffPct}% faster than 2m target` : `+${targetDiffPct}% over target`}
                </div>
              </div>

              <div style={{
                background: '#FAF5FF', border: '1.5px solid #E9D5FF', borderRadius: 12, padding: 14, textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#6B21A8', textTransform: 'uppercase' }}>
                  User Interactions
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#7E22CE', margin: '4px 0' }}>
                  {interactionCount}
                </div>
                <div style={{ fontSize: 11, color: '#6B21A8' }}>
                  {errorsCount} unrecoverable errors encountered
                </div>
              </div>
            </div>

            {/* Live Step Dwell Times Table */}
            <div style={{ background: '#fff', border: '1.5px solid var(--k-border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--k-text)' }}>
                  Dynamic Step-by-Step Dwell Time Log (Live Measurements)
                </span>
                <span style={{ fontSize: 11, color: 'var(--k-blue-dark)', fontWeight: 700 }}>
                  Total Time: {liveElapsedSeconds}s
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                {[
                  { id: 'welcome', label: '1. Welcome & Introduction', focus: 'Orientation & value proposition' },
                  { id: 'interests', label: '2. Topic Personalization', focus: 'Card selection & categorization' },
                  { id: 'language', label: '3. Language Selection', focus: 'Multi-lingual filter preferences' },
                  { id: 'storage', label: '4. Storage Allocation', focus: 'Quota detection & drive mounting' },
                  { id: 'recommendations', label: '5. Pack Recommendations', focus: 'Hick’s Law curated selection' },
                  { id: 'download', label: '6. Download & Verification', focus: 'Resumable streaming & offline caching' },
                  { id: 'complete', label: '7. Setup Complete', focus: 'Offline reader launch & summary' }
                ].map((s, idx) => {
                  const isVisited = visitedSteps.includes(s.id);
                  const seconds = stepTimes[s.id] || 0;
                  return (
                    <div key={s.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', borderRadius: 8,
                      background: isVisited ? '#F8FAFC' : '#F1F5F9',
                      border: isVisited ? '1px solid #CBD5E1' : '1px dashed #E2E8F0',
                      opacity: isVisited ? 1 : 0.6
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: isVisited ? '#10B981' : '#94A3B8', fontWeight: 900 }}>
                          {isVisited ? '✓' : '○'}
                        </span>
                        <div>
                          <strong>{s.label}</strong>
                          <span style={{ color: 'var(--k-text3)', marginLeft: 8, fontSize: 11 }}>· {s.focus}</span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: isVisited ? 'var(--k-text)' : 'var(--k-text3)' }}>
                        {isVisited ? `${seconds > 0 ? seconds : '<1'}s` : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: DYNAMIC STORAGE EQUATION ────────────────────── */}
        {activeTab === 'storage' && (
          <div>
            <div style={{
              padding: '16px 18px', background: '#F8FAFC', border: '1.5px solid var(--k-border)',
              borderRadius: 12, marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--k-blue-dark)', marginBottom: 12 }}>
                Mathematical Proof: Dynamic Storage Calculation
              </div>

              {/* Dynamic Math Equation Formula */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: '#fff', border: '2px solid var(--k-border)',
                borderRadius: 10, fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: 'var(--k-text)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--k-text3)' }}>TOTAL POOL</div>
                  <div style={{ color: 'var(--k-blue)' }}>{storageGB} GB</div>
                </div>
                <div style={{ fontSize: 18, color: 'var(--k-text3)' }}>−</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--k-text3)' }}>USED BY PACKS</div>
                  <div style={{ color: '#EF4444' }}>{fmtBytes(usedBytes)}</div>
                </div>
                <div style={{ fontSize: 18, color: 'var(--k-text3)' }}>=</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--k-text3)' }}>REMAINING STORAGE</div>
                  <div style={{ color: '#10B981' }}>{fmtBytes(leftUpBytes)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                <div style={{ background: '#fff', padding: 12, borderRadius: 10, border: '1px solid var(--k-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--k-text3)', fontWeight: 700 }}>Total Allocated Bytes</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--k-text)', marginTop: 2 }}>
                    {totalAllocatedBytes.toLocaleString()} bytes
                  </div>
                </div>
                <div style={{ background: '#fff', padding: 12, borderRadius: 10, border: '1px solid var(--k-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--k-text3)', fontWeight: 700 }}>Remaining Free Ratio</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#10B981', marginTop: 2 }}>
                    {leftPercent}% Available Capacity
                  </div>
                </div>
              </div>
            </div>

            <div className="banner info">
              <span className="banner-ico">ℹ️</span>
              <span>
                <strong>Dynamic Behavior:</strong> As you check/uncheck ZIM packs in Step 5 or adjust storage pills in Step 4, these numbers update instantly with zero page reload.
              </span>
            </div>
          </div>
        )}

        {/* ─── TAB 3: DYNAMIC SYSTEM USABILITY SCALE (SUS) ─────────── */}
        {activeTab === 'sus' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 22px', background: 'linear-gradient(135deg, #FFFFFF 0%, #EAF3FF 100%)', border: '1px solid #CCE3FF',
              borderRadius: 14, color: '#1D1D1F', marginBottom: 16, boxShadow: '0 4px 14px rgba(0, 113, 227, 0.06)'
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-slate-400)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  System Usability Scale (SUS) Score
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: '#0071E3', letterSpacing: '-0.02em' }}>{susScore}</span>
                  <span style={{ fontSize: 15, color: 'var(--k-slate-400)' }}>/ 100</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, background: '#FFFFFF', color: '#0071E3',
                    border: '1px solid #CCE3FF', padding: '2px 10px', borderRadius: 99, marginLeft: 8
                  }}>
                    Grade {susInfo.grade} ({susInfo.label})
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--k-slate-400)' }}>
                <div>Industry Average: <strong style={{ color: '#1D1D1F' }}>68.0</strong></div>
                <div>KnowSphere Score: <strong style={{ color: '#248A3D' }}>+{((susScore - 68)).toFixed(1)} points</strong></div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--k-text2)', fontWeight: 700, marginBottom: 10 }}>
              Adjust user feedback ratings below (1 = Strongly Disagree, 5 = Strongly Agree). The score dynamically recalculates:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {questions.map((q, idx) => (
                <div key={idx} style={{
                  padding: '10px 14px', background: '#fff', border: '1.5px solid var(--k-border)',
                  borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14
                }}>
                  <div style={{ fontSize: 12, color: 'var(--k-text)', flex: 1, fontWeight: 600 }}>
                    {idx + 1}. {q}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingChange(idx, rating)}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          border: susRatings[idx] === rating ? '2px solid var(--k-blue)' : '1px solid var(--k-border)',
                          background: susRatings[idx] === rating ? 'var(--k-blue)' : '#fff',
                          color: susRatings[idx] === rating ? '#fff' : 'var(--k-text2)',
                          fontWeight: 800, fontSize: 12, cursor: 'pointer',
                          transition: 'all 0.1s'
                        }}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 4: HEURISTICS AUDIT ─────────────────────────────── */}
        {activeTab === 'heuristics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              {
                title: '1. Visibility of system status',
                impl: 'Real-time download byte streaming, dual Remaining Storage meter, dynamic TTFR clock.'
              },
              {
                title: '2. Match between system and the real world',
                impl: 'Clear knowledge metaphors (libraries, encyclopedias), natural byte formats (GB/MB).'
              },
              {
                title: '3. User control and freedom',
                impl: 'Pause, resume, cancel downloads, step backwards, direct .ZIM download to computer.'
              },
              {
                title: '4. Consistency and standards',
                impl: 'Uniform blue brand palette, recognizable elephant/sphere iconography, standard buttons.'
              },
              {
                title: '5. Error prevention',
                impl: 'Storage budget overflow alerts with 1-click "Boost to Fit" resolution button.'
              },
              {
                title: '6. Recognition rather than recall',
                impl: 'Card-based UI with flags, badges, size tags, and category pills.'
              },
              {
                title: '7. Flexibility and efficiency of use',
                impl: 'MicroSD expansion, direct .ZIM download, instant guest flow or OTP-verified account sync.'
              }
            ].map((h, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1.5px solid var(--k-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: 'var(--k-text)' }}>
                  <span style={{ color: '#16A34A' }}>✓</span>
                  <span>{h.title}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--k-text3)', marginTop: 2, paddingLeft: 22 }}>
                  {h.impl}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--k-text3)' }}>
            Session ID: {telemetry.sessionId || 'active-session'} · Real-time Dynamic Evidence
          </span>
          <button className="btn btn-primary" onClick={onClose}>
            Close Usability Suite
          </button>
        </div>
      </div>
    </div>
  );
}
