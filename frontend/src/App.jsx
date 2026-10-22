import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

import SplashScreen        from './components/SplashScreen';
import KnowSphereLogo      from './components/KnowSphereLogo';
import AuthModal           from './components/AuthModal';
import InnovationsModal    from './components/InnovationsModal';
import RecoveryDemoModal   from './components/RecoveryDemoModal';
import UsabilityTestModal  from './components/UsabilityTestModal';
import TtfrTracker         from './components/TtfrTracker';

import WelcomeStep         from './components/steps/WelcomeStep';
import InterestsStep       from './components/steps/InterestsStep';
import LanguageStep        from './components/steps/LanguageStep';
import StorageStep         from './components/steps/StorageStep';
import RecommendationsStep from './components/steps/RecommendationsStep';
import DownloadStep        from './components/steps/DownloadStep';
import CompleteStep        from './components/steps/CompleteStep';
import {
  persistDownloads,
  persistTelemetry,
  loadPersistedDownloads
} from './utils/offlineStorage';

const STEPS = [
  { id: 'welcome',         label: 'Welcome',      sub: 'Introduction'          },
  { id: 'interests',       label: 'Interests',    sub: 'Topics you care about' },
  { id: 'language',        label: 'Language',     sub: 'Content language'      },
  { id: 'storage',         label: 'Storage',      sub: 'Space & connection'    },
  { id: 'recommendations', label: 'Recommend',    sub: 'Curated packs for you' },
  { id: 'download',        label: 'Download',     sub: 'Get offline content'   },
  { id: 'complete',        label: 'Done!',        sub: "You're offline-ready"  },
];

const INITIAL_STATE = {
  stepIndex:       0,
  sessionId:       null,
  interests:       [],
  languages:       [],
  storageGB:       null,
  speedMbps:       10,
  recommendations: [],
  selectedZims:    [],
  downloads:       [],
};

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('knowsphere_entered');
    } catch {
      return false;
    }
  });

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    try {
      sessionStorage.setItem('knowsphere_entered', 'true');
    } catch {}
  }, []);

  const [state, setState] = useState(INITIAL_STATE);
  const [authOpen, setAuthOpen] = useState(false);
  const [innovationsOpen, setInnovationsOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [usabilityOpen, setUsabilityOpen] = useState(false);

  // Time-to-First-Resource (TTFR) measurement & Dynamic Telemetry
  const [startTime, setStartTime] = useState(() => Date.now());
  const [firstResourceTime, setFirstResourceTime] = useState(null);

  // Dynamic Session Telemetry (Time, Step dwell times, interaction counts, error rates)
  const [telemetry, setTelemetry] = useState(() => ({
    sessionStart: Date.now(),
    stepTimes: {
      welcome: 0,
      interests: 0,
      language: 0,
      storage: 0,
      recommendations: 0,
      download: 0,
      complete: 0,
    },
    visitedSteps: ['welcome'],
    interactionCount: 0,
    errorsCount: 0,
    actualTtfrSec: null,
  }));

  // Dynamic user interaction tracker (clicks, keystrokes, sliders, buttons)
  const recordInteraction = useCallback(() => {
    setTelemetry(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
    }));
  }, []);

  // Dynamic Dwell Time Tracker: records exact dwell time on every step live
  useEffect(() => {
    if (showSplash) return;
    const currentStepId = STEPS[state.stepIndex]?.id;
    if (!currentStepId) return;

    setTelemetry(prev => ({
      ...prev,
      visitedSteps: prev.visitedSteps.includes(currentStepId)
        ? prev.visitedSteps
        : [...prev.visitedSteps, currentStepId],
    }));

    const timer = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        stepTimes: {
          ...prev.stepTimes,
          [currentStepId]: (prev.stepTimes[currentStepId] || 0) + 1,
        },
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [state.stepIndex, showSplash]);

  // Detect when first resource becomes ready in THIS onboarding session
  useEffect(() => {
    if (!firstResourceTime && Array.isArray(state.downloads) && state.downloads.length > 0) {
      const newlyDone = state.downloads.find(d => {
        if (d.status !== 'completed') return false;
        const started = d.startedAt || d.sessionStartedAt;
        return started && started >= startTime;
      });

      if (newlyDone) {
        const now = Date.now();
        setFirstResourceTime(now);
        const elapsed = Math.max(1, Math.round((now - startTime) / 1000));
        setTelemetry(prev => ({
          ...prev,
          actualTtfrSec: elapsed,
        }));
      }
    }
  }, [state.downloads, firstResourceTime, startTime]);

  // User auth state with local storage fallback
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('knowsphere_user') || localStorage.getItem('kiwix_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleAuthSuccess = (authUser, token) => {
    setUser(authUser);
    try {
      localStorage.setItem('knowsphere_user', JSON.stringify(authUser));
      if (token) localStorage.setItem('knowsphere_token', token);
    } catch (e) {
      console.warn('Storage failed', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('knowsphere_user');
      localStorage.removeItem('knowsphere_token');
      localStorage.removeItem('kiwix_user');
    } catch (e) {
      console.warn('Storage clear failed', e);
    }
  };

  // Restore persisted downloads from client storage on mount
  useEffect(() => {
    loadPersistedDownloads().then(saved => {
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setState(prev => ({
          ...prev,
          downloads: saved
        }));
      }
    }).catch(() => {});
  }, []);

  // Automatically persist downloads when changed
  useEffect(() => {
    if (state.downloads && state.downloads.length > 0) {
      persistDownloads(state.downloads);
    }
  }, [state.downloads]);

  // Automatically persist live telemetry data
  useEffect(() => {
    persistTelemetry(telemetry);
  }, [telemetry]);

  // Generic setter — supports both value and updater-function
  const set = key => val =>
    setState(prev => ({ ...prev, [key]: typeof val === 'function' ? val(prev[key]) : val }));

  const goNext  = () => setState(p => ({ ...p, stepIndex: Math.min(p.stepIndex + 1, STEPS.length - 1) }));
  const goBack  = () => setState(p => ({ ...p, stepIndex: Math.max(p.stepIndex - 1, 0) }));
  const onReset = () => {
    const now = Date.now();
    setState({ ...INITIAL_STATE });
    setFirstResourceTime(null);
    setStartTime(now);
    setTelemetry({
      sessionStart: now,
      stepTimes: {
        welcome: 0,
        interests: 0,
        language: 0,
        storage: 0,
        recommendations: 0,
        download: 0,
        complete: 0,
      },
      visitedSteps: ['welcome'],
      interactionCount: 0,
      errorsCount: 0,
      actualTtfrSec: null,
    });
  };

  const saveSession = useCallback(async (overrides = {}) => {
    try {
      const res = await axios.post('/api/session', {
        sessionId:           state.sessionId,
        interests:           state.interests,
        languages:           state.languages,
        storageGB:           state.storageGB,
        connectionSpeedMbps: state.speedMbps,
        userEmail:           user?.email || null,
        ...overrides,
      });
      set('sessionId')(res.data.sessionId);
      return res.data.sessionId;
    } catch {
      return state.sessionId;
    }
  }, [state.sessionId, state.interests, state.languages, state.storageGB, state.speedMbps, user]);

  const { stepIndex } = state;

  const ttfrSeconds = firstResourceTime
    ? Math.round((firstResourceTime - startTime) / 1000)
    : Math.round((Date.now() - startTime) / 1000);

  // Dynamic calculation of storage consumption across selection and active downloads
  const selectedPacksBytes = (state.selectedZims || []).reduce((acc, id) => {
    const rec = (state.recommendations || []).find(r => r.id === id);
    return acc + (rec?.sizeBytes || 0);
  }, 0);

  const downloadedBytes = (state.downloads || []).reduce((acc, d) => {
    return acc + (d.downloadedBytes || d.sizeBytes || 0);
  }, 0);

  const effectiveUsedBytes = Math.max(downloadedBytes, selectedPacksBytes);

  // Stretch Goal: 1-Click Quick Setup Mode (Express Onboarding)
  // Fixed to match actual catalogue.json IDs ('wikipedia-en-mini', 'wikimed-en') and category ('health')
  const handleQuickSetup = () => {
    setState(prev => ({
      ...prev,
      interests: ['encyclopedia', 'health'],
      languages: ['en'],
      storageGB: prev.storageGB || 20,
      speedMbps: 15,
      selectedZims: ['wikipedia-en-mini', 'wikimed-en'],
      stepIndex: 5, // Jump straight to Download Step
    }));
    recordInteraction();
  };

  const stepProps = {
    goNext, goBack, saveSession, onReset,
    onQuickSetup: handleQuickSetup,
    user, openAuth: () => setAuthOpen(true),
    sessionId:       state.sessionId,
    interests:       state.interests,       setInterests:       set('interests'),
    languages:       state.languages,       setLanguages:       set('languages'),
    storageGB:       state.storageGB,       setStorageGB:       set('storageGB'),
    speedMbps:       state.speedMbps,       setSpeedMbps:       set('speedMbps'),
    recommendations: state.recommendations, setRecommendations: set('recommendations'),
    selectedZims:    state.selectedZims,    setSelectedZims:    set('selectedZims'),
    downloads:       state.downloads,       setDownloads:       set('downloads'),
    startTime,
    firstResourceTime,
    ttfrSeconds,
    telemetry,
    usedBytes: effectiveUsedBytes,
    openRecoveryDemo:   () => setRecoveryOpen(true),
    openUsabilitySuite: () => setUsabilityOpen(true),
  };

  const views = {
    welcome:         <WelcomeStep         {...stepProps} />,
    interests:       <InterestsStep       {...stepProps} />,
    language:        <LanguageStep        {...stepProps} />,
    storage:         <StorageStep         {...stepProps} />,
    recommendations: <RecommendationsStep {...stepProps} />,
    download:        <DownloadStep        {...stepProps} />,
    complete:        <CompleteStep        {...stepProps} telemetry={telemetry} usedBytes={effectiveUsedBytes} />,
  };

  const progressPct = ((stepIndex) / (STEPS.length - 1)) * 100;

  const getNav = i => {
    if (i < stepIndex) return 'done';
    if (i === stepIndex) return 'active';
    return 'future';
  };

  return (
    <>
      {/* ── Splash screen (shown until animation completes) ──────── */}
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      {/* ── Auth Modal (Login / Register / OTP) ──────────────────── */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        user={user}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />

      {/* ── Unique Innovations Modal ───────────────────────────────── */}
      <InnovationsModal
        isOpen={innovationsOpen}
        onClose={() => setInnovationsOpen(false)}
      />

      {/* ── Recovery Demonstration Simulator ──────────────────────── */}
      <RecoveryDemoModal
        isOpen={recoveryOpen}
        onClose={() => setRecoveryOpen(false)}
        activeDownloads={state.downloads}
      />

      {/* ── Usability Evaluation & Evidence Suite ───────────────────── */}
      <UsabilityTestModal
        isOpen={usabilityOpen}
        onClose={() => setUsabilityOpen(false)}
        telemetry={telemetry}
        storageGB={state.storageGB || 20}
        usedBytes={effectiveUsedBytes}
        stepCount={STEPS.length}
        selectedZimsCount={state.selectedZims.length}
        downloadsCount={state.downloads.length}
      />

      {/* ── Main app (rendered behind splash, visible after) ──────── */}
      {!showSplash && (
        <div
          className="app-shell"
          onClickCapture={recordInteraction}
          onKeyDownCapture={recordInteraction}
        >
          {/* ── KnowSphere-branded sidebar ────────────────────────── */}
          <aside className="sidebar">
            <div className="sidebar-header">
              <KnowSphereLogo size={36} color="#ffffff" />
              <div>
                <div className="sidebar-wordmark">KnowSphere</div>
                <div style={{ fontSize: 10, color: '#86868B', fontWeight: 600, letterSpacing: '0.03em' }}>
                  KIWIX OFFLINE ENGINE
                </div>
              </div>
            </div>

            <nav className="sidebar-nav" aria-label="Onboarding steps">
              {STEPS.map((s, i) => {
                const st = getNav(i);
                const canJump = i < stepIndex || telemetry.visitedSteps.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className={`nav-item ${st} ${canJump ? 'clickable' : ''}`}
                    onClick={() => canJump && setState(p => ({ ...p, stepIndex: i }))}
                    role={canJump ? 'button' : undefined}
                    tabIndex={canJump ? 0 : undefined}
                    onKeyDown={e => canJump && e.key === 'Enter' && setState(p => ({ ...p, stepIndex: i }))}
                    title={canJump ? `Jump to Step ${i + 1}: ${s.label}` : s.label}
                  >
                    <div className="nav-bullet">
                      {st === 'done' ? '✓' : i + 1}
                    </div>
                    <div className="nav-text">
                      <div className="nav-label">{s.label}</div>
                      <div className="nav-sub">{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-footer-logo">
                <KnowSphereLogo size={20} color="#0071E3" />
                <span>KnowSphere · Kiwix ZIM Library</span>
              </div>
            </div>
          </aside>

          {/* ── Main content panel ────────────────────────────────── */}
          <main className="main-panel">
            {/* Top progress line */}
            <div className="top-progress">
              <div className="top-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>

            {/* Top Navigation Bar with TTFR & Grouped Evaluator Toolkit */}
            <header className="top-app-bar">
              <div className="top-bar-left">
                <span className="top-bar-badge">
                  <span>⚡</span> Step {stepIndex + 1} of {STEPS.length}
                </span>

                {/* ── Time-to-First-Resource (TTFR) Live Tracker ── */}
                <TtfrTracker
                  startTime={startTime}
                  firstResourceTime={firstResourceTime}
                  stepIndex={stepIndex}
                  onOpenDetails={() => setUsabilityOpen(true)}
                />
              </div>

              <div className="top-bar-right">
                <div className="eval-toolbar" role="group" aria-label="Evaluator and testing tools">
                  <span className="eval-toolbar-label">Evaluator Suite</span>

                  {/* Interactive Recovery Demo Pill */}
                  <button
                    type="button"
                    className="lab-pill-btn"
                    onClick={() => setRecoveryOpen(true)}
                    title="Run interactive Recovery Demonstration (Simulate Network Disconnect & Zero-Loss Resumption)"
                    style={{ borderColor: '#A7F3D0', background: '#ECFDF5', color: '#065F46' }}
                  >
                    <span>🧪</span> Recovery Demo
                  </button>

                  {/* Usability & SUS Evaluation Suite Pill */}
                  <button
                    type="button"
                    className="lab-pill-btn"
                    onClick={() => setUsabilityOpen(true)}
                    title="View Usability Benchmarks & SUS Usability Score"
                    style={{ borderColor: '#C7D2FE', background: '#EEF2FF', color: '#3730A3' }}
                  >
                    <span>📋</span> Usability & SUS
                  </button>

                  {/* Unique innovations pill */}
                  <button
                    type="button"
                    className="lab-pill-btn"
                    onClick={() => setInnovationsOpen(true)}
                    title="Explore unique offline knowledge innovations"
                  >
                    <span>💡</span> Lab
                  </button>
                </div>

                {/* Optional Cloud Sync Pill */}
                <button
                  type="button"
                  className={`auth-status-pill ${user ? 'logged-in' : ''}`}
                  onClick={() => setAuthOpen(true)}
                  title="Optional device bookmark sync (100% local guest mode by default)"
                >
                  {user ? (
                    <>
                      <span>👤</span>
                      <span>{user.name.split(' ')[0]}</span>
                      <span style={{ fontSize: 11, background: '#16A34A', color: '#fff', borderRadius: 99, padding: '1px 6px' }}>✓</span>
                    </>
                  ) : (
                    <>
                      <span>☁️</span>
                      <span>Optional Sync</span>
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* Step content — key forces re-mount + re-animation */}
            <div className="content-area" key={STEPS[stepIndex].id}>
              {views[STEPS[stepIndex].id]}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
