import HeroSection from '../components/HeroSection';
import CameraView from '../components/CameraView';
import { GESTURE_MAP, FLOWER_TYPES } from '../data/flowers';
import { Sparkles, Flower2, Camera, Palette, Wind, Star, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '✋', title: 'Gesture Control', desc: 'Control everything with natural hand movements. No touch required.', color: 'rgba(134,239,172,0.1)', border: 'rgba(134,239,172,0.3)' },
  { icon: '🌸', title: 'Real-Time Blooming', desc: 'Watch flowers grow and bloom in real-time as you move your hands.', color: 'rgba(249,168,212,0.1)', border: 'rgba(249,168,212,0.3)' },
  { icon: '🎨', title: '8 Palettes', desc: 'Swipe through beautiful hand-curated color palettes for every mood.', color: 'rgba(196,181,253,0.1)', border: 'rgba(196,181,253,0.3)' },
  { icon: '📸', title: 'Save & Share', desc: 'Capture your creations and share them to the global garden gallery.', color: 'rgba(125,211,252,0.1)', border: 'rgba(125,211,252,0.3)' },
  { icon: '🌿', title: 'Virtual Garden', desc: 'Build your personal garden with all your created flowers arranged beautifully.', color: 'rgba(134,239,172,0.1)', border: 'rgba(134,239,172,0.3)' },
  { icon: '🏆', title: 'Achievements', desc: 'Unlock rare flower types and earn badges as you master gestures.', color: 'rgba(252,211,77,0.1)', border: 'rgba(252,211,77,0.3)' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <HeroSection />

      {/* Camera Section */}
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">🎥 Live AI Camera</span>
            <h2 className="section-title">
              Hand Tracking{' '}
              <span className="text-gradient-green">in Action</span>
            </h2>
            <p className="section-subtitle">
              Allow camera access and use your hands to create stunning flowers in real-time.
              Our AI detects 21 hand landmarks for precise gesture recognition.
            </p>
          </div>
          <CameraView />
        </div>
      </section>

      {/* Gesture Guide */}
      <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(13,17,48,0.5), transparent)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">🤚 Gesture Library</span>
            <h2 className="section-title">
              Your Hands Are the{' '}
              <span className="text-gradient-cosmic">Controller</span>
            </h2>
            <p className="section-subtitle">
              10 intuitive gestures let you create, customize, and control every aspect
              of your digital flowers.
            </p>
          </div>

          <div className="gesture-grid">
            {GESTURE_MAP.map((g) => (
              <div key={g.gesture} className="gesture-card">
                <span className="gesture-emoji">{g.icon}</span>
                <div className="gesture-name">{g.gesture}</div>
                <div className="gesture-action">{g.action}</div>
                <div className="gesture-dot" style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">✨ Features</span>
            <h2 className="section-title">
              Everything You Need to{' '}
              <span className="text-gradient-gold">Bloom</span>
            </h2>
          </div>

          <div className="grid-3">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="feature-card"
                style={{ borderColor: f.border }}
              >
                <div className="feature-icon" style={{ background: f.color, fontSize: '1.8rem' }}>
                  {f.icon}
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flower Types Preview */}
      <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(13,17,48,0.8), transparent)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">🌺 Flower Collection</span>
            <h2 className="section-title">
              8 Stunning{' '}
              <span className="text-gradient-green">Flower Types</span>
            </h2>
            <p className="section-subtitle">
              From Common roses to Legendary Cosmic flowers. Unlock new types as you grow.
            </p>
          </div>

          <div className="grid-4">
            {FLOWER_TYPES.map(f => (
              <div key={f.id} className="glass-card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>{f.emoji}</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--clr-white-60)', marginBottom: 12, lineHeight: 1.5 }}>
                  {f.description}
                </div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 12 }}>
                  {f.colors.map((c, i) => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
                  ))}
                </div>
                <span className={`badge badge-${f.rarity.toLowerCase()}`}>{f.rarity}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div style={{
            textAlign: 'center',
            padding: '80px 40px',
            background: 'linear-gradient(135deg, rgba(134,239,172,0.08), rgba(196,181,253,0.08))',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-xl)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -80, left: -80, width: 300, height: 300,
              background: 'radial-gradient(circle, rgba(134,239,172,0.1), transparent)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -80, right: -80, width: 300, height: 300,
              background: 'radial-gradient(circle, rgba(196,181,253,0.1), transparent)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />

            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🌸</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginBottom: 16 }}>
              Ready to <span className="text-gradient-green">Bloom?</span>
            </h2>
            <p style={{ color: 'var(--clr-white-60)', fontSize: '1.05rem', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
              Open your camera, show your palm, and watch magic unfold. 
              Your first flower is just a gesture away.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/studio" className="btn btn-primary btn-lg">
                <Flower2 size={20} />
                Open Studio
              </Link>
              <Link to="/gallery" className="btn btn-secondary btn-lg">
                <Globe size={20} />
                View Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '1.5rem' }}>🌸</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>HandBloom AI</span>
              </div>
              <p className="footer-brand-desc">
                Grow digital flowers with your hands. The world's first gesture-controlled
                digital garden powered by AI hand tracking.
              </p>
              <div className="footer-social">
                {['🐦', '📘', '📸', '💼'].map((icon, i) => (
                  <a key={i} href="#" className="social-btn">{icon}</a>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['Studio', 'Garden', 'Gallery', 'Achievements'] },
              { title: 'Tech', links: ['Hand Tracking', 'MediaPipe', 'Three.js', 'API Docs'] },
              { title: 'Company', links: ['About', 'Blog', 'Privacy', 'Contact'] },
            ].map(col => (
              <div key={col.title}>
                <div className="footer-heading">{col.title}</div>
                <ul className="footer-links">
                  {col.links.map(link => <li key={link}><a href="#">{link}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span>© 2026 HandBloom AI. All rights reserved.</span>
            <span>Made with 🌸 and ✨ magic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
