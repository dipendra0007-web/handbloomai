import { useRef, useEffect, useState } from 'react';
import { drawFlower } from '../utils/flowerGeometry';
import { Heart, Share2, Download, Eye, MessageCircle, ShoppingCart } from 'lucide-react';

function FlowerMiniCanvas({ flower, isShaking }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 240;

    let frame;
    let rot = (flower.rotation || 0);
    let alive = true;

    const draw = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, size, size);
      rot += isShaking ? 0.25 : 0.08; // wind speeds up rotation/spin
      
      const shakeX = isShaking ? (Math.random() - 0.5) * 4 : 0;
      const shakeY = isShaking ? (Math.random() - 0.5) * 4 : 0;

      try {
        drawFlower(ctx, {
          x: (size / 2) + shakeX,
          y: (size / 2) + shakeY,
          size: size * 0.32,
          petals: Math.max(3, Math.min(24, flower.petals || 8)),
          color: flower.color || '#ff6b9d',
          colorSecondary: flower.color || '#ff8fab',
          rotation: rot,
          bloomProgress: 1,
          glowColor: flower.color || '#ff6b9d',
          withStem: false,
        });
      } catch (e) {}
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [flower, isShaking]);

  return (
    <canvas
      ref={ref}
      width={240}
      height={240}
      className="flower-card-canvas"
    />
  );
}

export default function GardenGallery({ flowers, title = 'Your Garden' }) {
  const [liked, setLiked] = useState({});
  const [hoveredId, setHoveredId] = useState(null);
  
  // Simulation wind switch
  const [globalWind, setGlobalWind] = useState(false);

  // Social & Comment states
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentsMap, setCommentsMap] = useState({});

  const toggleLike = (id) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openComments = (flower) => {
    setSelectedFlower(flower);
    setNewComment('');
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const list = commentsMap[selectedFlower.id] || selectedFlower.comments || [];
    const updated = [...list, { author: 'You', text: newComment }];
    setCommentsMap(p => ({ ...p, [selectedFlower.id]: updated }));
    setNewComment('');
  };

  const buyFlower = (flower) => {
    alert(`💐 ${flower.name} purchased successfully for ${flower.priceBloomCoins || 120} Bloom Coins! Added to your collection.`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        {title && (
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{title}</h3>
        )}
        <button
          onClick={() => setGlobalWind(!globalWind)}
          className="btn btn-secondary btn-sm"
          style={{ background: globalWind ? 'rgba(134,239,172,0.15)' : 'var(--glass-bg)', borderColor: globalWind ? 'var(--clr-green)' : 'var(--glass-border)' }}
        >
          💨 {globalWind ? 'Simulate Wind Off' : 'Simulate Wind Shaking'}
        </button>
      </div>

      <div className="garden-grid">
        {flowers.map((flower) => {
          const currentComments = commentsMap[flower.id] || flower.comments || [];
          return (
            <div
              key={flower.id}
              className="flower-card"
              onMouseEnter={() => setHoveredId(flower.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flower-card-canvas-wrap">
                <FlowerMiniCanvas flower={flower} isShaking={globalWind || hoveredId === flower.id} />

                {/* Hover overlay */}
                <div className="flower-card-overlay">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleLike(flower.id)}
                    style={{
                      color: liked[flower.id] ? '#f9a8d4' : 'var(--clr-white)',
                      borderColor: liked[flower.id] ? '#f9a8d4' : undefined,
                    }}
                  >
                    <Heart size={14} fill={liked[flower.id] ? '#f9a8d4' : 'none'} />
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openComments(flower)}>
                    <MessageCircle size={14} />
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => buyFlower(flower)} title="Buy Flower Design">
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>

              <div className="flower-card-info">
                <div className="flower-card-name">{flower.name}</div>
                <div className="flower-card-meta">
                  <span className="flower-card-creator">by {flower.creator}</span>
                  <span className="flower-card-likes">
                    <Heart size={11} fill="#f9a8d4" />
                    {flower.likes + (liked[flower.id] ? 1 : 0)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: flower.color, boxShadow: `0 0 8px ${flower.color}` }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>
                      {flower.petals} petals
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--clr-gold)' }}>
                    💎 {flower.priceBloomCoins || 120} Coins
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Social Comments Modal ── */}
      {selectedFlower && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div className="glass-card" style={{ padding: 28, width: '100%', maxWidth: 440, background: 'rgba(6,8,26,0.96)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ fontWeight: 800 }}>💬 Feed Comments – {selectedFlower.name}</h4>
              <button onClick={() => setSelectedFlower(null)} className="btn btn-secondary btn-sm" style={{ padding: 6 }}>✕</button>
            </div>

            <div style={{ minHeight: 180, maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, paddingRight: 6 }}>
              {(commentsMap[selectedFlower.id] || selectedFlower.comments || []).map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--clr-green)', marginBottom: 2 }}>{c.author}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--clr-white-80)' }}>{c.text}</div>
                </div>
              ))}
              {(commentsMap[selectedFlower.id] || selectedFlower.comments || []).length === 0 && (
                <p style={{ color: 'var(--clr-white-60)', fontSize: '0.82rem', textAlign: 'center', marginTop: 40 }}>Be the first to comment!</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                placeholder="Write a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment()}
              />
              <button onClick={addComment} className="btn btn-primary btn-sm">Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
