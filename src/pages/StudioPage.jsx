import CreationStudio from '../components/CreationStudio';
import CameraView from '../components/CameraView';
import { useState } from 'react';
import { Palette, Camera, HelpCircle } from 'lucide-react';

export default function StudioPage() {
  const [mode, setMode] = useState('studio'); // 'studio' | 'camera'

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div style={{
        padding: '40px 0 32px',
        background: 'radial-gradient(ellipse at top, rgba(196,181,253,0.08), transparent)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="section-tag">🎨 Creation Studio</span>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginTop: 12 }}>
                Flower <span className="text-gradient-cosmic">Creation Studio</span>
              </h1>
              <p style={{ color: 'var(--clr-white-60)', marginTop: 8 }}>
                Design flowers manually or use gesture control with your camera.
              </p>
            </div>

            <div className="tabs">
              <button
                className={`tab-btn${mode === 'studio' ? ' active' : ''}`}
                onClick={() => setMode('studio')}
              >
                <Palette size={15} style={{ marginRight: 6 }} />
                Manual Studio
              </button>
              <button
                className={`tab-btn${mode === 'camera' ? ' active' : ''}`}
                onClick={() => setMode('camera')}
              >
                <Camera size={15} style={{ marginRight: 6 }} />
                Gesture Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {mode === 'studio' ? (
          <CreationStudio />
        ) : (
          <div>
            <div style={{
              padding: '16px 20px',
              background: 'rgba(134,239,172,0.05)',
              border: '1px solid rgba(134,239,172,0.2)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <HelpCircle size={18} style={{ color: 'var(--clr-green)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--clr-white-80)' }}>
                <strong>Gesture Mode:</strong> Show an open palm to create a flower. Pinch to resize.
                Swipe to change colors. Thumbs up to save to gallery.
              </p>
            </div>
            <CameraView />
          </div>
        )}
      </div>
    </div>
  );
}
