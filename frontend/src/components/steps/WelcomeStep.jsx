import React from 'react';
import KnowSphereLogo from '../KnowSphereLogo';

export default function WelcomeStep({ goNext, onQuickSetup, user }) {
  return (
    <>
      <div className="step-eyebrow">🌐 Kiwix First-Run Onboarding</div>
      <h1 className="step-title">
        {user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'From Installation to Useful Knowledge'}
      </h1>
      <p className="step-desc">
        Your offline library is currently empty. In a few quick steps, we’ll help you pick topics and languages, check your device storage, and download verified <strong>ZIM knowledge packs</strong> — Wikipedia, Khan Academy, medical guides, and eBooks — for 100% offline use.
      </p>

      {/* Apple-Style Luminous Glass Hero Card */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F2F8FF 55%, #E5F1FF 100%)',
        border: '1px solid rgba(0, 113, 227, 0.18)',
        borderRadius: 'var(--r-xl)',
        padding: '24px 28px',
        color: '#1D1D1F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        marginBottom: 20,
        boxShadow: '0 10px 30px rgba(0, 113, 227, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03)',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 68, height: 68,
            background: '#FFFFFF',
            border: '1px solid rgba(0, 113, 227, 0.16)',
            boxShadow: '0 6px 18px rgba(0, 113, 227, 0.12)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <KnowSphereLogo size={48} color="#0071E3" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0071E3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Empty Library Detected · First-Run Setup
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em', marginTop: 2 }}>
              Build Your Personal Offline Archive
            </div>
            <div style={{ fontSize: 13, color: '#515154', marginTop: 4, maxWidth: 440, lineHeight: 1.5 }}>
              Guided setup takes under <strong>2 minutes</strong>. All content is stored locally in open ZIM format with resumable downloads.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={goNext}
        >
          Start Guided Setup →
        </button>
      </div>

      {/* Feature cards */}
      <div className="feature-grid">
        {[
          { icon: '🌐', title: 'Multi-Language Catalog', desc: 'Curated ZIM packs across 8+ major world languages' },
          { icon: '💾', title: 'Storage-Aware Sizing',   desc: 'Automatic browser quota detection & manual budget slider' },
          { icon: '🔄', title: 'Crash-Proof Downloads',  desc: 'HTTP 206 byte-level pause, resume & drop recovery' },
        ].map(f => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* ─── STRETCH GOAL: QUICK SETUP MODE (1-CLICK EXPRESS) ─── */}
      <div style={{
        marginBottom: 20,
        padding: '14px 18px',
        background: '#FFFFFF',
        border: '1px solid var(--k-border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 20, width: 40, height: 40, borderRadius: 12,
            background: '#EAF3FF', border: '1px solid #CCE3FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>⚡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F' }}>
              Quick Setup Mode (1-Click Express Preset)
            </div>
            <div style={{ fontSize: 12, color: '#515154', marginTop: 1 }}>
              Skip the wizard: Pre-selects <strong>Wikipedia (English) Mini</strong> + <strong>WikiMed Medical Encyclopedia</strong> (4.8 GB total) and jumps straight to download.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onQuickSetup}
          style={{
            fontWeight: 600,
            fontSize: 12,
            padding: '7px 14px',
            borderColor: '#CCE3FF',
            background: '#F5F9FF',
            color: '#0071E3',
          }}
          title="Instant 1-click onboarding for rapid setup"
        >
          ⚡ Launch Quick Setup →
        </button>
      </div>

      <div className="bottom-bar">
        <div style={{ fontSize: 12, color: 'var(--k-text3)', fontWeight: 600 }}>
          Step 1 of 7 · Works 100% locally without an account
        </div>
        <button className="btn btn-primary btn-lg" onClick={goNext}>
          Choose Interests →
        </button>
      </div>
    </>
  );
}
