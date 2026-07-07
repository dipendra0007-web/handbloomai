import { useRef, useEffect, useState } from 'react';
import { drawFlower } from '../utils/flowerGeometry';
import { COLOR_PALETTES } from '../utils/flowerGeometry';
import { FLOWER_TYPES } from '../data/flowers';
import { Sparkles, RotateCcw, Download, Save, Flower2, RefreshCw, Moon, Sun, Wind, Eye, ShoppingBag } from 'lucide-react';

export default function CreationStudio() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const rotRef = useRef(0);

  const [params, setParams] = useState({
    petals: 10,
    size: 140,
    rotation: 0,
    colorIdx: 0,
    flowerType: 0,
    bloomSpeed: 1,
    autoRotate: true,
  });

  const [bloomProgress, setBloomProgress] = useState(1);
  const [isReblooming, setIsReblooming] = useState(false);
  const [saved, setSaved] = useState(false);

  // Environmental simulations
  const [dayMode, setDayMode] = useState(false);
  const [wind, setWind] = useState(30);
  const [light, setLight] = useState(60);
  const [water, setWater] = useState(50);

  // Studio Mode: 'builder' | 'bouquet' | 'market'
  const [studioTab, setStudioTab] = useState('builder');
  const [bouquetFlowers, setBouquetFlowers] = useState([
    { emoji: '🌹', name: 'Classic Rose', x: 200, y: 250, size: 70 },
    { emoji: '🌻', name: 'Bright Sunflower', x: 250, y: 200, size: 80 },
    { emoji: '🪷', name: 'Lotus Essence', x: 300, y: 240, size: 75 },
  ]);

  const palette = COLOR_PALETTES[params.colorIdx % COLOR_PALETTES.length];

  // AI DNA Generator
  const [dna, setDna] = useState('HB-DNA-402-A');
  const [personality, setPersonality] = useState('Celestial & Serene');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Radial background light (changes based on Day/Night mode)
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
      if (dayMode) {
        bgGrad.addColorStop(0, 'rgba(253,224,71,0.08)');
        bgGrad.addColorStop(1, 'rgba(255,255,255,0)');
      } else {
        bgGrad.addColorStop(0, 'rgba(13,17,48,0.8)');
        bgGrad.addColorStop(1, 'rgba(6,8,26,0)');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      if (params.autoRotate) {
        rotRef.current += (0.15 + wind / 150) * params.bloomSpeed;
      }

      if (studioTab === 'builder') {
        // Draw primary flower
        drawFlower(ctx, {
          x: w / 2,
          y: h / 2,
          size: params.size * (light / 75), // Sunlight scales size
          petals: params.petals,
          color: palette.colors[0],
          colorSecondary: palette.colors[1] || palette.colors[0],
          rotation: rotRef.current + params.rotation,
          bloomProgress,
          glowColor: palette.colors[0],
          withStem: true,
        });
      } else if (studioTab === 'bouquet') {
        // Draw bouquet arrangement
        // Draw the vase
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w/2 - 40, h - 30);
        ctx.lineTo(w/2 + 40, h - 30);
        ctx.lineTo(w/2 + 25, h - 140);
        ctx.lineTo(w/2 - 25, h - 140);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        bouquetFlowers.forEach((f, idx) => {
          // Draw individual flower
          drawFlower(ctx, {
            x: f.x,
            y: f.y,
            size: f.size,
            petals: 8 + (idx * 3),
            color: COLOR_PALETTES[idx % COLOR_PALETTES.length].colors[0],
            colorSecondary: COLOR_PALETTES[idx % COLOR_PALETTES.length].colors[1],
            rotation: rotRef.current * (0.5 + idx * 0.2),
            bloomProgress: 1,
            glowColor: COLOR_PALETTES[idx % COLOR_PALETTES.length].colors[0],
            withStem: true,
          });
        });
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [params, bloomProgress, palette, dayMode, wind, light, studioTab, bouquetFlowers]);

  const rebloom = () => {
    setIsReblooming(true);
    setBloomProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.03 * params.bloomSpeed;
      setBloomProgress(Math.min(1, progress));
      if (progress >= 1) {
        clearInterval(interval);
        setIsReblooming(false);
      }
    }, 16);
  };

  const saveFlower = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key, val) => {
    setParams(p => ({ ...p, [key]: val }));
    // Change DNA based on adjustments
    setDna(`HB-DNA-${Math.floor(params.size + params.petals * 17)}-${params.colorIdx}`);
  };

  const addToBouquet = (emoji, name) => {
    if (bouquetFlowers.length >= 6) return;
    const newFlower = {
      emoji,
      name,
      x: 180 + Math.random() * 140,
      y: 150 + Math.random() * 100,
      size: 55 + Math.random() * 25
    };
    setBouquetFlowers(p => [...p, newFlower]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--glass-border)', paddingBottom: 12 }}>
        {['builder', 'bouquet', 'market'].map(tab => (
          <button
            key={tab}
            onClick={() => setStudioTab(tab)}
            style={{
              padding: '10px 20px', borderRadius: 99, border: 'none',
              fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.25s',
              background: studioTab === tab ? 'linear-gradient(135deg, var(--clr-green), var(--clr-sky))' : 'var(--glass-bg)',
              color: studioTab === tab ? '#06081a' : 'var(--clr-white-80)'
            }}
          >
            {tab === 'builder' ? '🎨 Flower Studio' : tab === 'bouquet' ? '💐 Bouquet Designer' : '🛍️ Bloom Marketplace'}
          </button>
        ))}
      </div>

      <div className="studio-layout" style={{ height: 'auto' }}>
        {/* Left Panel */}
        <div className="studio-panel">
          {studioTab === 'builder' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flower2 size={18} style={{ color: 'var(--clr-green)' }} />
                Flower Controls
              </h3>

              {/* Flower type */}
              <div className="form-group">
                <label className="form-label">Flower Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {FLOWER_TYPES.slice(0, 6).map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => { update('flowerType', i); update('colorIdx', i); }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${params.flowerType === i ? 'rgba(134,239,172,0.5)' : 'var(--glass-border)'}`,
                        background: params.flowerType === i ? 'rgba(134,239,172,0.1)' : 'var(--glass-bg)',
                        color: 'var(--clr-white)',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>{f.emoji}</span>
                      <span>{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Petals */}
              <div className="slider-group">
                <div className="slider-label">
                  <span>Petals</span>
                  <span className="slider-value">{params.petals}</span>
                </div>
                <input
                  type="range" min={3} max={24} value={params.petals}
                  className="slider"
                  onChange={e => update('petals', +e.target.value)}
                />
              </div>

              {/* Size */}
              <div className="slider-group">
                <div className="slider-label">
                  <span>Size</span>
                  <span className="slider-value">{params.size}px</span>
                </div>
                <input
                  type="range" min={60} max={220} value={params.size}
                  className="slider"
                  onChange={e => update('size', +e.target.value)}
                />
              </div>

              {/* Ecosystem Wind/Light/Water controls */}
              <div className="slider-group">
                <div className="slider-label"><span>💨 Wind Power</span><span className="slider-value">{wind}%</span></div>
                <input type="range" min={0} max={100} value={wind} className="slider" onChange={e => setWind(+e.target.value)} />
              </div>

              <div className="slider-group">
                <div className="slider-label"><span>☀️ Sunlight Intensity</span><span className="slider-value">{light}%</span></div>
                <input type="range" min={0} max={100} value={light} className="slider" onChange={e => setLight(+e.target.value)} />
              </div>

              <div className="slider-group">
                <div className="slider-label"><span>💧 Water saturation</span><span className="slider-value">{water}%</span></div>
                <input type="range" min={0} max={100} value={water} className="slider" onChange={e => setWater(+e.target.value)} />
              </div>
            </>
          )}

          {studioTab === 'bouquet' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Bouquet Materials</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-white-60)', marginBottom: 16 }}>
                Click flowers below to add them to your personalized arrangement pot.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FLOWER_TYPES.map(f => (
                  <button
                    key={f.id}
                    onClick={() => addToBouquet(f.emoji, f.name)}
                    style={{
                      padding: '12px 14px', borderRadius: 12, border: '1px solid var(--glass-border)',
                      background: 'var(--glass-bg)', color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>{f.emoji} {f.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-green)' }}>+ Add to Pot</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setBouquetFlowers([])} className="btn btn-secondary btn-sm" style={{ marginTop: 16, width: '100%' }}>
                Clear Pot
              </button>
            </>
          )}

          {studioTab === 'market' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Bloom Marketplace</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-white-60)', marginBottom: 20 }}>
                Buy premium decorative flowers or list your designs for Bloom Coins!
              </p>

              <div style={{ background: 'rgba(134,239,172,0.05)', border: '1px solid rgba(134,239,172,0.2)', padding: 14, borderRadius: 12, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--clr-green)', marginBottom: 4 }}>📈 Trading Streak</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-white-60)' }}>Complete 3 trades to earn a mystery seeds box.</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'VIP Golden Petal', cost: 250, rarity: 'Legendary' },
                  { name: 'Monsoon Lily Seeds', cost: 120, rarity: 'Epic' },
                  { name: 'Winter Frost Orchid', cost: 80, rarity: 'Rare' },
                ].map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--glass-bg)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{item.name}</div>
                      <span className={`badge badge-${item.rarity.toLowerCase()}`} style={{ fontSize: '0.62rem', marginTop: 4 }}>{item.rarity}</span>
                    </div>
                    <button onClick={() => alert(`${item.name} bought successfully!`)} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      💎 {item.cost}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Canvas Area */}
        <div className="studio-canvas-area" style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="studio-canvas"
            style={{ maxWidth: 500, maxHeight: 500 }}
          />

          {/* Day/Night ambient indicator */}
          <div style={{ position: 'absolute', top: 16, left: 16, pointerEvents: 'none', display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem' }}>
            {dayMode ? <Sun size={15} style={{ color: 'var(--clr-gold)' }} /> : <Moon size={15} style={{ color: 'var(--clr-lavender)' }} />}
            <span style={{ fontWeight: 800 }}>{dayMode ? 'Day Mode' : 'Night Mode'}</span>
          </div>

          <div style={{
            position: 'absolute', top: 16, right: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {studioTab === 'builder' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={rebloom}
                disabled={isReblooming}
              >
                {isReblooming ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Rebloom
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={saveFlower}
            >
              {saved ? '✓ Saved!' : <><Save size={14} /> Save Flower</>}
            </button>
            <button onClick={() => setDayMode(!dayMode)} className="btn btn-secondary btn-sm" style={{ padding: 8 }}>
              {dayMode ? '🌙 Set Night' : '☀️ Set Day'}
            </button>
          </div>
        </div>

        {/* Right Panel - DNA & Personality */}
        <div className="studio-panel">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} style={{ color: 'var(--clr-lavender)' }} />
            AI DNA Sequence
          </h3>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 12, border: '1px solid var(--glass-border)', marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-white-60)', marginBottom: 4 }}>Genotype Code</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--clr-lavender)', fontSize: '0.9rem' }}>
              {dna}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-white-60)', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
              Predicted Rarity: <strong style={{ color: 'var(--clr-green)' }}>{params.petals > 16 ? 'Legendary' : 'Epic'}</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 12, border: '1px solid var(--glass-border)', marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-white-60)', marginBottom: 4 }}>Flower Personality</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{personality}</div>
          </div>

          <div className="divider" style={{ margin: '16px 0' }} />

          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--clr-white-60)' }}>
            Ecosystem Stats
          </h4>
          {[
            { label: 'Wind Resistance', value: `${wind}%` },
            { label: 'Sunlight Exposure', value: `${light}%` },
            { label: 'Hydration Level', value: `${water}%` },
            { label: 'Evolution Stage', value: 'Phase 3 (Blooming)' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              fontSize: '0.82rem',
            }}>
              <span style={{ color: 'var(--clr-white-60)' }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
