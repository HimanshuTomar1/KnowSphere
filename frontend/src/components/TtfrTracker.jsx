import React, { useState, useEffect } from 'react';

/**
 * TtfrTracker — Time-to-First-Resource live dynamic benchmark tracker
 * Measures user elapsed time from onboarding launch until the first knowledge pack is completed and ready to read.
 */
export default function TtfrTracker({
  startTime,
  firstResourceTime,
  stepIndex,
  onOpenDetails
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (firstResourceTime && startTime) {
      return Math.max(1, Math.round((firstResourceTime - startTime) / 1000));
    }
    const origin = startTime || Date.now();
    return Math.max(0, Math.round((Date.now() - origin) / 1000));
  });

  useEffect(() => {
    if (firstResourceTime && startTime) {
      setElapsedSeconds(Math.max(1, Math.round((firstResourceTime - startTime) / 1000)));
      return;
    }

    const origin = startTime || Date.now();
    // Update immediately
    setElapsedSeconds(Math.max(0, Math.round((Date.now() - origin) / 1000)));

    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.round((Date.now() - origin) / 1000)));
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
        padding: '5px 12px',
        borderRadius: 99,
        background: isCompleted ? '#F0FDF4' : '#F8FAFC',
        border: `1.5px solid ${isCompleted ? '#86EFAC' : '#E2E8F0'}`,
        boxShadow: isCompleted ? '0 1px 3px rgba(22, 101, 52, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
      title="Time-to-First-Resource (TTFR) Live Stopwatch. Click to open usability benchmarks."
    >
      {!isCompleted ? (
        <span style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#3B82F6',
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.25)',
          animation: 'pulse 1.5s infinite'
        }} />
      ) : (
        <span style={{ fontSize: 13 }}>🏆</span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: isCompleted ? '#166534' : '#64748B',
          letterSpacing: '0.02em'
        }}>
          {isCompleted ? 'TTFR Achieved:' : 'TTFR Clock:'}
        </span>
        <span style={{
          fontSize: 13,
          fontWeight: 800,
          color: isCompleted ? '#15803D' : '#0F172A',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 32
        }}>
          {formatTime(elapsedSeconds)}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 6,
          background: isCompleted ? '#DCFCE7' : '#E2E8F0',
          color: isCompleted ? '#166534' : '#475569'
        }}>
          {isCompleted
            ? `${Math.max(0, Math.round(((targetSeconds - elapsedSeconds) / targetSeconds) * 100))}% under target`
            : 'Target: < 2m'}
        </span>
      </div>
    </div>
  );
}
