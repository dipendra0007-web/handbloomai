import { useState } from 'react';
import GardenGallery from '../components/GardenGallery';
import { GALLERY_FLOWERS } from '../data/flowers';
import { Heart, Share2, Download, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'saved' | 'shared'

  // Mock user's own flowers (first 6)
  const myFlowers = GALLERY_FLOWERS.slice(0, 6);
  // Mock saved flowers (next 8)
  const savedFlowers = GALLERY_FLOWERS.slice(6, 14);
  // Mock shared (all with higher likes)
  const sharedFlowers = GALLERY_FLOWERS.slice(0, 12).map(f => ({ ...f, likes: f.likes + 100 }));

  const TABS = [
    { id: 'my', label: 'My Flowers', count: myFlowers.length },
    { id: 'saved', label: 'Saved', count: savedFlowers.length },
    { id: 'shared', label: 'Shared', count: sharedFlowers.length },
  ];

  const active = { my: myFlowers, saved: savedFlowers, shared: sharedFlowers }[activeTab];

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        padding: '60px 0 40px',
        background: 'radial-gradient(ellipse at top, rgba(125,211,252,0.08), transparent)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <span className="section-tag">📸 Collection</span>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, marginTop: 12 }}>
                Save & <span className="text-gradient-sky">Share</span> Collection
              </h1>
              <p style={{ color: 'var(--clr-white-60)', marginTop: 8 }}>
                Your personal flower collection. Save, share, and download your creations.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary">
                <Download size={16} />
                Export All
              </button>
              <Link to="/studio" className="btn btn-primary">
                <Plus size={16} />
                Create New
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { label: 'Created', value: '6', icon: '🌸' },
            { label: 'Saved', value: '8', icon: '❤️' },
            { label: 'Shared', value: '12', icon: '📤' },
            { label: 'Total Likes', value: '1,247', icon: '⭐' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '16px 24px', textAlign: 'center', flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--clr-white-60)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 32 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              <span style={{
                marginLeft: 6,
                padding: '1px 7px',
                borderRadius: 99,
                background: activeTab === t.id ? 'rgba(0,0,0,0.2)' : 'var(--clr-white-10)',
                fontSize: '0.72rem',
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {active.length > 0 ? (
          <GardenGallery flowers={active} title="" />
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--clr-white-60)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🌱</div>
            <p>No flowers here yet. Start creating!</p>
            <Link to="/studio" className="btn btn-primary" style={{ marginTop: 24 }}>
              <Plus size={16} />
              Create Flower
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
