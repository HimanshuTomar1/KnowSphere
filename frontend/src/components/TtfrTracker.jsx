import React, { useState, useEffect } from 'react';

/**
 * TtfrTracker — Time-to-First-Resource live benchmark tracker
 * Measures user elapsed time from onboarding launch until the first knowledge pack is completed and ready to read.
 */
export default function TtfrTracker({
  startTime,
  firstResourceTime,
  stepIndex,
  onOpenDetails
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    if (firstResourceTime) {
      setElapsedSeconds(Math.max(1, Math.round((firstResourceTime - startTime) / 1000)));
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(1, Math.round((Date.now() - startTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, firstResourceTime]);

  const formatTime = secs => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCompleted = !!firstResourceTime;
  const targetSeconds = 120; // 2 minutes benchmark target
  const isAheadOfTarget = elapsedSeconds <= targetSeconds;

  return (
    <div
      onClick={onOpenDetails}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 10px',
        borderRadius: 99,
        background: isCompleted ? '#F0FDF4' : '#F4F4F5',
        border: `1px solid ${isCompleted ? '#86EFAC' : '#E4E4E7'}`,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        fontFamily: 'Inter, sans-serif'
      }}
      title="Time-to-First-Resource (TTFR) Live Metric. Click for usability benchmarks."
    >
      <span style={{ fontSize: 13 }}>{isCompleted ? '🏆' : '⏱'}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: isCompleted ? '#166534' : 'var(--k-text2)',
          letterSpacing: '0.02em'
        }}>
          {isCompleted ? 'TTFR Achieved:' : 'TTFR Benchmark:'}
        </span>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: isCompleted ? '#15803D' : 'var(--k-text)',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {formatTime(elapsedSeconds)}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '1px 6px',
          borderRadius: 4,
          background: isCompleted ? '#DCFCE7' : '#E4E4E7',
          color: isCompleted ? '#166534' : '#52525B'
        }}>
          {isCompleted
            ? `${Math.round(((targetSeconds - elapsedSeconds) / targetSeconds) * 100)}% under target`
            : 'Target: < 2m'}
        </span>
      </div>
    </div>
  );
}
