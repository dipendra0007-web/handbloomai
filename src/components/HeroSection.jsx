import { useRef, useEffect, useState } from 'react';
import { drawFlower } from '../utils/flowerGeometry';
import { COLOR_PALETTES } from '../utils/flowerGeometry';
import { Sparkles, Wind, Flower2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Particle class for hero canvas
class HeroParticle {
  constructor(w, h) {
    this.reset(w, h);
  }
  reset(w, h) {
    this.x = Math.random() * w;
    this.y = Math.random() * h + h;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.speedY = -(Math.random() * 1.5 + 0.5);
    this.life = 1;
    this.decay = Math.random() * 0.005 + 0.002;
    const colors = ['#86efac', '#c4b5fd', '#7dd3fc', '#fcd34d', '#f9a8d4', '#ffffff'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.type = Math.random() > 0.6 ? 'pollen' : 'circle';
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.03;
  }
  update(w, h) {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
    this.life -= this.decay;
    if (this.life <= 0) this.reset(w, h);
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life * 0.8;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    if (this.type === 'pollen') {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#fcd34d';
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export default function HeroSection() {
  const canvasRef = useRef(null);
  const [bloomProgress, setBloomProgress] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [petals, setPetals] = useState(10);
  const animRef = useRef(null);
  const particles = useRef([]);
  const bloomRef = useRef(0);
  const rotRef = useRef(0);
  const timeRef = useRef(0);

  const palette = COLOR_PALETTES[colorIdx % COLOR_PALETTES.length];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(dpr, dpr);
      // Init particles
      particles.current = Array.from({ length: 80 }, () =>
        new HeroParticle(rect.width, rect.height)
      );
    };

    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      timeRef.current += 0.01;

      // Bloom animation
      if (bloomRef.current < 1) {
        bloomRef.current = Math.min(1, bloomRef.current + 0.005);
        setBloomProgress(bloomRef.current);
      }
      // Auto-rotate
      rotRef.current += 0.1;
      setRotation(rotRef.current);

      ctx.clearRect(0, 0, w, h);

      // Draw background gradient
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, h * 0.7);
      bgGrad.addColorStop(0, 'rgba(13,17,48,0.6)');
      bgGrad.addColorStop(1, 'rgba(6,8,26,0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Update & draw particles
      particles.current.forEach(p => {
        p.update(w, h);
        p.draw(ctx);
      });

      // Draw flower
      drawFlower(ctx, {
        x: w * 0.5,
        y: h * 0.52,
        size: Math.min(w, h) * 0.28 * bloomRef.current,
        petals,
        color: palette.colors[0],
        colorSecondary: palette.colors[1] || palette.colors[0],
        rotation: rotRef.current,
        bloomProgress: bloomRef.current,
        glowColor: palette.colors[0],
        withStem: true,
      });

      // Draw ring glow
      const t = timeRef.current;
      const ringR = Math.min(w, h) * 0.35;
      const ringGrad = ctx.createRadialGradient(w * 0.5, h * 0.52, ringR * 0.8, w * 0.5, h * 0.52, ringR);
      const alpha = 0.08 + 0.04 * Math.sin(t);
      ringGrad.addColorStop(0, palette.colors[0] + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
      ringGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.52, ringR, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [colorIdx, petals]);

  const nextColor = () => setColorIdx(i => (i + 1) % COLOR_PALETTES.length);
  const addPetal = () => setPetals(p => Math.min(24, p + 1));
  const removePetal = () => setPetals(p => Math.max(3, p - 1));

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-bg-gradient" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      <div className="hero-content">
        {/* Text */}
        <div className="hero-text">
          <div className="hero-tag">
            <Sparkles size={12} />
            AI-Powered Gesture Garden
          </div>

          <h1 className="hero-title">
            Grow Digital{' '}
            <span className="text-gradient-green">Flowers</span>{' '}
            With Your{' '}
            <span className="text-gradient-gold">Hands</span>
          </h1>

          <p className="hero-description">
            Wave your hand to bloom a flower. Pinch to resize. Swipe to change colors.
            HandBloom AI transforms your gestures into living, breathing digital art using
            real-time AI hand tracking.
          </p>

          <div className="hero-actions">
            <Link to="/studio" className="btn btn-primary btn-lg">
              <Flower2 size={18} />
              Start Blooming
            </Link>
            <Link to="/garden" className="btn btn-secondary btn-lg">
              <Wind size={18} />
              Explore Garden
            </Link>
          </div>

          <div className="hero-stats">
            {[
              { value: '98K+', label: 'Flowers Created' },
              { value: '12K+', label: 'Gardeners' },
              { value: '24K+', label: 'Shared' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="hero-stat-value">{value}</div>
                <div className="hero-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="hero-visual">
          <div className="hero-canvas-wrap">
            <div className="hero-canvas-bg" />
            <canvas ref={canvasRef} className="hero-canvas" />

            {/* Floating badges */}
            <div className="hero-floating-badges">
              <div className="hero-badge hero-badge-1">
                <span>🌸</span>
                <span>{palette.name} Palette</span>
              </div>
              <div className="hero-badge hero-badge-2">
                <span>✋</span>
                <span>Gesture Active</span>
              </div>
              <div className="hero-badge hero-badge-3" style={{ color: 'var(--clr-gold)' }}>
                <span>✨</span>
                <span>{petals} Petals</span>
              </div>
            </div>
          </div>

          {/* Quick controls */}
          <div style={{
            position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 10, whiteSpace: 'nowrap'
          }}>
            <button onClick={nextColor} className="btn btn-secondary btn-sm">🎨 Color</button>
            <button onClick={addPetal} className="btn btn-secondary btn-sm">+ Petal</button>
            <button onClick={removePetal} className="btn btn-secondary btn-sm">- Petal</button>
          </div>
        </div>
      </div>
    </section>
  );
}
