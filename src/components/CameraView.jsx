import { useRef, useEffect, useState, useCallback } from 'react';
import { CameraOff, Sparkles, Hand, RefreshCw, AlertCircle, CheckCircle2, Flower2, Moon, Sun, Wind, SunDim, Droplets, Share2, Award, Zap, Users, ShieldAlert } from 'lucide-react';
import { classifyGesture, getWristRotation } from '../utils/gestureRecognition';
import { drawFlower, COLOR_PALETTES } from '../utils/flowerGeometry';

const GESTURE_INFO = {
  open_palm:      { label: '🖐️ Open Palm',     action: 'Flower Appeared!',   color: '#86efac' },
  fist:           { label: '✊ Closed Fist',    action: 'Flower Removed',     color: '#fca5a5' },
  thumbs_up:      { label: '👍 Thumbs Up',     action: 'Saved to Gallery!',  color: '#fcd34d' },
  two_fingers:    { label: '✌️ Peace Sign',    action: '− Petals',           color: '#c4b5fd' },
  five_fingers:   { label: '🖐️ Five Fingers',  action: '+ Petals',           color: '#f9a8d4' },
  pinch_close:    { label: '🤏 Pinch In',      action: 'Shrinking...',        color: '#7dd3fc' },
  pinch_open:     { label: '🤌 Pinch Out',     action: 'Growing...',          color: '#86efac' },
  heart_gesture:  { label: '🫶 Heart Shape',    action: 'Love Flower Created', color: '#ff6b9d' },
  star_gesture:   { label: '⭐ Star Shape',     action: 'Cosmic Star Flower',  color: '#fcd34d' },
  circle_gesture: { label: '⭕ O Shape',        action: 'Giant Lily Created',  color: '#7dd3fc' },
  none:           { label: 'Show your hand',   action: 'Waiting...',          color: 'rgba(255,255,255,0.35)' },
};

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

export default function CameraView({ onGestureChange }) {
  const videoRef = useRef(null);
  const flowerCanvasRef = useRef(null);
  const skeletonCanvasRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const handsRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const processingRef = useRef(false);

  // Custom states
  const [dayMode, setDayMode] = useState(false); // Day/Night Mode
  const [windLevel, setWindLevel] = useState(30);
  const [sunlightLevel, setSunlightLevel] = useState(50);
  const [waterLevel, setWaterLevel] = useState(40);
  const [bloomCoins, setBloomCoins] = useState(120);
  const [dna, setDna] = useState('ATCG-HB-889-X');
  const [rarity, setRarity] = useState('Epic');
  const [activeTab, setActiveTab] = useState('sim'); // sim | ai | multi
  const [isSaved, setIsSaved] = useState(false);

  // Multi-flower duplication state
  const [secondFlower, setSecondFlower] = useState(false);

  /* Flower state lives in a ref (no re-render per frame) */
  const fs = useRef({ visible: false, size: 110, petals: 8, colorIdx: 0, rotation: 0 });
  const prevGestureRef = useRef('none');
  const gestureTimer = useRef(null);

  const [status, setStatus] = useState('idle');
  const [handOn, setHandOn] = useState(false);
  const [gesture, setGesture] = useState('none');
  const [mpReady, setMpReady] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 640, h: 480 });

  // Sparkles/Particles state for simulations
  const particles = useRef([]);

  /* ── Particles update & animation loop ─────────────────────────── */
  useEffect(() => {
    let alive = true;
    let autoAngle = 0;

    const tick = () => {
      if (!alive) return;

      // 1. Draw Flower
      const c = flowerCanvasRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        const cw = c.width || 640;
        const ch = c.height || 480;
        ctx.clearRect(0, 0, cw, ch);

        if (fs.current.visible) {
          autoAngle += (windLevel / 200) + 0.05; // Wind speeds up rotation
          const pal = COLOR_PALETTES[fs.current.colorIdx % COLOR_PALETTES.length];

          // Draw main flower
          drawFlower(ctx, {
            x: secondFlower ? cw * 0.35 : cw / 2,
            y: ch / 2,
            size: fs.current.size,
            petals: Math.max(3, Math.min(24, fs.current.petals)),
            color: pal.colors[0],
            colorSecondary: pal.colors[1] || pal.colors[0],
            rotation: fs.current.rotation + autoAngle,
            bloomProgress: 1,
            glowColor: pal.colors[0],
            withStem: false,
          });

          // Draw second flower if duplicate mode is active
          if (secondFlower) {
            drawFlower(ctx, {
              x: cw * 0.65,
              y: ch / 2,
              size: fs.current.size * 0.9,
              petals: Math.max(3, Math.min(24, fs.current.petals + 2)),
              color: pal.colors[1] || pal.colors[0],
              colorSecondary: pal.colors[0],
              rotation: fs.current.rotation - autoAngle * 0.8,
              bloomProgress: 1,
              glowColor: pal.colors[1] || pal.colors[0],
              withStem: false,
            });
          }
        }
      }

      // 2. Draw Simulation Particles (Wind / Water / Pollen)
      const pc = particleCanvasRef.current;
      if (pc) {
        const pctx = pc.getContext('2d');
        const pw = pc.width || 640;
        const ph = pc.height || 480;
        pctx.clearRect(0, 0, pw, ph);

        // Spawn particles based on sunlight/water levels
        const maxParticles = Math.floor((sunlightLevel + waterLevel) / 4) + 10;
        while (particles.current.length < maxParticles) {
          particles.current.push({
            x: Math.random() * pw,
            y: Math.random() * ph,
            size: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * (windLevel / 10) + (windLevel / 20),
            vy: Math.random() * (waterLevel / 20) + 0.5,
            alpha: Math.random() * 0.5 + 0.3,
            color: Math.random() > 0.5 ? 'rgba(134,239,172,0.8)' : 'rgba(125,211,252,0.8)'
          });
        }

        particles.current.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x > pw || p.y > ph) {
            p.x = Math.random() * pw;
            p.y = 0;
          }
          pctx.save();
          pctx.globalAlpha = p.alpha;
          pctx.shadowBlur = sunlightLevel / 5;
          pctx.shadowColor = p.color;
          pctx.fillStyle = p.color;
          pctx.beginPath();
          pctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          pctx.fill();
          pctx.restore();
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [windLevel, sunlightLevel, waterLevel, secondFlower]);

  /* ── Draw hand skeleton ──────────────────────────────────────────── */
  const drawSkeleton = useCallback((landmarks, w, h) => {
    const sc = skeletonCanvasRef.current;
    if (!sc) return;
    const ctx = sc.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    /* Connections */
    ctx.strokeStyle = 'rgba(134,239,172,0.75)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    HAND_CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
      ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
      ctx.stroke();
    });

    /* Joints */
    landmarks.forEach((lm, i) => {
      const isTip = [4,8,12,16,20].includes(i);
      const isWrist = i === 0;
      const r = isWrist ? 7 : isTip ? 5 : 3;
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, r, 0, Math.PI * 2);
      ctx.fillStyle = isWrist ? '#fcd34d' : isTip ? '#f9a8d4' : '#86efac';
      ctx.shadowBlur = isWrist || isTip ? 12 : 0;
      ctx.shadowColor = isWrist ? '#fcd34d' : '#f9a8d4';
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, []);

  /* ── Clear skeleton canvas ───────────────────────────────────────── */
  const clearSkeleton = useCallback(() => {
    const sc = skeletonCanvasRef.current;
    if (!sc) return;
    sc.getContext('2d').clearRect(0, 0, sc.width, sc.height);
  }, []);

  /* ── Apply gesture to flower state ──────────────────────────────── */
  const applyGesture = useCallback((g, landmarks) => {
    // Award Bloom Coins for new gestures detected
    setBloomCoins(c => c + 2);

    switch (g) {
      case 'open_palm':
        fs.current.visible = true;
        break;
      case 'fist':
        fs.current.visible = false;
        break;
      case 'five_fingers':
        fs.current.petals = Math.min(24, fs.current.petals + 1);
        break;
      case 'two_fingers':
        fs.current.petals = Math.max(3, fs.current.petals - 1);
        break;
      case 'pinch_close':
        fs.current.size = Math.max(40, fs.current.size - 4);
        break;
      case 'pinch_open':
        fs.current.size = Math.min(220, fs.current.size + 4);
        break;
      case 'heart_gesture':
        fs.current.visible = true;
        fs.current.petals = 14;
        fs.current.colorIdx = 3; // Pinkish
        setDna('LOVE-GEN-77-X');
        setRarity('Epic');
        break;
      case 'star_gesture':
        fs.current.visible = true;
        fs.current.petals = 20;
        fs.current.colorIdx = 7; // Gold/Purple
        setDna('STAR-GEN-99-Z');
        setRarity('Legendary');
        break;
      case 'circle_gesture':
        fs.current.visible = true;
        fs.current.size = 200;
        fs.current.petals = 16;
        fs.current.colorIdx = 2; // Celestial
        setDna('GIANT-LILY-10');
        setRarity('Rare');
        break;
    }
    if (landmarks) {
      const wr = getWristRotation(landmarks);
      if (typeof wr === 'number') fs.current.rotation = wr;
    }
  }, []);

  /* ── MediaPipe results callback ──────────────────────────────────── */
  const onResults = useCallback((results) => {
    const detected = !!(results.multiHandLandmarks?.length);
    setHandOn(detected);

    const vw = canvasSize.w;
    const vh = canvasSize.h;

    // Detect two-hand duplication gesture
    if (results.multiHandLandmarks?.length >= 2) {
      setSecondFlower(true);
    }

    if (!detected) {
      clearSkeleton();
      setGesture('none');
      prevGestureRef.current = 'none';
      return;
    }

    const lm = results.multiHandLandmarks[0];
    drawSkeleton(lm, vw, vh);

    const g = classifyGesture(lm);

    /* Continuous gestures */
    if (g === 'pinch_close' || g === 'pinch_open') applyGesture(g, lm);

    /* Discrete gestures (debounced) */
    if (g !== 'none' && g !== prevGestureRef.current) {
      prevGestureRef.current = g;
      setGesture(g);
      applyGesture(g, lm);
      onGestureChange?.(g);
      clearTimeout(gestureTimer.current);
      gestureTimer.current = setTimeout(() => {
        setGesture('none'); prevGestureRef.current = 'none';
      }, 1800);
    }
  }, [canvasSize, drawSkeleton, clearSkeleton, applyGesture, onGestureChange]);

  /* ── Start camera ────────────────────────────────────────────────── */
  const startCamera = async () => {
    setStatus('requesting');

    /* 1 ── Camera permission */
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (err) {
      console.error('[Camera] Permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('denied');
      } else if (err.name === 'NotFoundError') {
        setStatus('no-camera');
      } else {
        setStatus('error');
      }
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    video.srcObject = stream;

    /* Wait for video metadata */
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });
    await video.play();

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    setCanvasSize({ w: vw, h: vh });

    /* Sync canvas sizes */
    [flowerCanvasRef, skeletonCanvasRef, particleCanvasRef].forEach(ref => {
      if (ref.current) { ref.current.width = vw; ref.current.height = vh; }
    });

    setStatus('active');
    setStatus('mediapipe-loading');

    let attempts = 0;
    while (typeof window.Hands === 'undefined' && attempts < 60) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }

    if (typeof window.Hands === 'undefined') {
      console.error('[MediaPipe] window.Hands not available after timeout');
      setStatus('mediapipe-error');
      setMpReady(false);
      setStatus('active-no-mp');
      return;
    }

    /* 3 ── Init MediaPipe Hands */
    try {
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onResults);
      handsRef.current = hands;

      /* 4 ── Frame-by-frame processing loop */
      const sendFrames = async () => {
        if (!handsRef.current || !streamRef.current) return;
        if (!processingRef.current && video.readyState >= 2) {
          processingRef.current = true;
          try { await handsRef.current.send({ image: video }); }
          catch {}
          processingRef.current = false;
        }
        setTimeout(sendFrames, 34); // ~30 fps
      };

      sendFrames();
      setMpReady(true);
      setStatus('active');

    } catch (err) {
      console.error('[MediaPipe] Init error:', err);
      setStatus('active-no-mp');
      setMpReady(false);
    }
  };

  /* ── Stop camera ─────────────────────────────────────────────────── */
  const stopCamera = () => {
    handsRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    clearSkeleton();
    fs.current.visible = false;
    setStatus('idle');
    setHandOn(false);
    setGesture('none');
    setMpReady(false);
    setSecondFlower(false);
    prevGestureRef.current = 'none';
  };

  const saveToGarden = () => {
    setIsSaved(true);
    setBloomCoins(c => c + 50); // reward
    setTimeout(() => setIsSaved(false), 2000);
  };

  const isActive = status === 'active' || status === 'active-no-mp';
  const isLoading = status === 'requesting' || status === 'mediapipe-loading';
  const gInfo = GESTURE_INFO[gesture] || GESTURE_INFO.none;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: 24, alignItems: 'start' }} className="grid-2-resp">
      
      {/* ── Left Side: Camera & Live Overlays ── */}
      <div>
        <div style={{
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          background: dayMode ? '#1e293b' : '#06081a',
          border: '1px solid var(--glass-border)',
          minHeight: 440,
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
          transition: 'all 0.5s ease',
        }}>
          
          {/* Day/Night ambient lighting overlays */}
          <div style={{
            position: 'absolute', inset: 0,
            background: dayMode ? 'rgba(253,224,71,0.04)' : 'rgba(196,181,253,0.02)',
            pointerEvents: 'none', zIndex: 1,
          }} />

          {/* Live Video */}
          <video
            ref={videoRef}
            playsInline muted autoPlay
            style={{
              display: isActive ? 'block' : 'none',
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
            }}
          />

          {/* Canvas Overlays */}
          <canvas ref={flowerCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)', mixBlendMode: 'screen', zIndex: 3 }} />
          <canvas ref={skeletonCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)', zIndex: 4 }} />
          <canvas ref={particleCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', mixBlendMode: 'screen', zIndex: 2 }} />

          {/* HUD Top Bar */}
          {isActive && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.7), transparent)',
              zIndex: 10,
              pointerEvents: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', fontWeight: 800 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: handOn ? 'var(--clr-green)' : 'var(--clr-gold)',
                  boxShadow: handOn ? '0 0 10px var(--clr-green)' : '0 0 10px var(--clr-gold)',
                  animation: 'pulse 1.2s infinite'
                }} />
                {handOn ? '✋ TRACKING HAND' : '👀 SCANNING...'}
              </div>

              {/* Day/Night and Duplicate buttons on HUD */}
              <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
                <button
                  onClick={() => setSecondFlower(!secondFlower)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 12px', background: secondFlower ? 'rgba(134,239,172,0.2)' : 'rgba(0,0,0,0.5)', borderColor: secondFlower ? 'var(--clr-green)' : 'transparent' }}
                  title="Simulate 2-hand gesture to duplicate flowers"
                >
                  👥 {secondFlower ? 'Duplicate On' : 'Duplicate'}
                </button>
                <button
                  onClick={() => setDayMode(!dayMode)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.5)' }}
                >
                  {dayMode ? <Sun size={14} style={{ color: 'var(--clr-gold)' }} /> : <Moon size={14} style={{ color: 'var(--clr-lavender)' }} />}
                </button>
              </div>
            </div>
          )}

          {/* ── Center Gesture Action Alert ── */}
          {gesture !== 'none' && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              textAlign: 'center', pointerEvents: 'none',
              animation: 'fadeSlideUp 0.3s ease',
              zIndex: 5,
            }}>
              <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 15px currentColor)' }}>
                {gInfo.label.split(' ')[0]}
              </div>
              <div style={{
                marginTop: 10, padding: '8px 20px',
                background: 'rgba(6,8,26,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: 99,
                fontSize: '0.9rem', fontWeight: 800,
                color: gInfo.color,
                border: `1px solid ${gInfo.color}66`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}>
                {gInfo.action}
              </div>
            </div>
          )}

          {/* ── Status Placeholders ── */}
          {!isActive && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 20, padding: 32,
              background: 'radial-gradient(ellipse at center, rgba(13,17,48,0.96), #06081a)',
              zIndex: 9
            }}>
              {status === 'idle' && (
                <>
                  <div style={{ fontSize: '4.5rem', animation: 'gestureFloat 3s ease-in-out infinite' }}>🌸</div>
                  <h3 style={{ fontWeight: 900, fontSize: '1.4rem' }}>Gesture Mode Simulator</h3>
                  <p style={{ color: 'var(--clr-white-60)', fontSize: '0.875rem', textAlign: 'center', maxWidth: 360 }}>
                    Enable camera to track real hand movements. Watch flowers bloom and react instantly!
                  </p>
                  <button className="btn btn-primary btn-lg" onClick={startCamera}>
                    📷 Enable Camera & AI Tracking
                  </button>
                </>
              )}
              {isLoading && (
                <>
                  <div style={{ position: 'relative', width: 80, height: 80 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: 'var(--clr-green)', animation: 'spin 1s linear infinite' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🌸</div>
                  </div>
                  <p style={{ fontWeight: 700, color: 'var(--clr-green)' }}>Initializing AI models...</p>
                </>
              )}
              {status === 'denied' && (
                <>
                  <div style={{ fontSize: '3rem' }}>🚫</div>
                  <p style={{ color: '#fca5a5', fontWeight: 800 }}>Camera Blocked</p>
                  <p style={{ color: 'var(--clr-white-60)', fontSize: '0.82rem', textAlign: 'center', maxWidth: 280 }}>
                    Please reset permissions next to the address bar and reload.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Bottom HUD Controls */}
          {isActive && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '16px 20px',
              display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
              background: 'linear-gradient(0deg, rgba(0,0,0,0.8), transparent)',
              zIndex: 10,
            }}>
              <button onClick={stopCamera} className="btn btn-secondary btn-sm" style={{ background: 'rgba(252,165,165,0.15)', color: '#fca5a5', borderColor: 'rgba(252,165,165,0.3)' }}>
                Stop Camera
              </button>
              <button onClick={() => { fs.current.colorIdx = (fs.current.colorIdx + 1) % COLOR_PALETTES.length; }} className="btn btn-secondary btn-sm">
                Next Species Swiper
              </button>
              <button onClick={() => { fs.current.visible = true; fs.current.size = 110; }} className="btn btn-primary btn-sm">
                🌸 Bloom Flower
              </button>
              
              {/* Simulate Air Draw Gestures */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => applyGesture('heart_gesture')} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#ff6b9d' }}>🫶 Heart</button>
                <button onClick={() => applyGesture('star_gesture')} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--clr-gold)' }}>⭐ Cosmic Star</button>
                <button onClick={() => applyGesture('circle_gesture')} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--clr-sky)' }}>⭕ Giant Lily</button>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--clr-gold)', fontWeight: 800 }}>
                💎 {bloomCoins} Bloom Coins
              </div>
            </div>
          )}
        </div>

        {/* Quick Guide Strip */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 20px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--glass-border)', borderTop: 'none',
          borderRadius: '0 0 24px 24px', fontSize: '0.82rem', color: 'var(--clr-white-60)'
        }}>
          <span>Tagline: <strong>"Create Life with Your Hands." 🌸✨</strong></span>
          {isSaved ? <span style={{ color: 'var(--clr-green)' }}>✓ Saved to Garden!</span> : (
            <button onClick={saveToGarden} className="btn btn-secondary btn-sm" style={{ padding: '4px 12px', fontSize: '0.72rem' }}>
              👍 Save to Garden (+50 Coins)
            </button>
          )}
        </div>
      </div>

      {/* ── Right Side: Simulator Panel ── */}
      <div className="glass-card" style={{ padding: 20, minHeight: 440 }}>
        
        {/* Right side tab selection */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, marginBottom: 20 }}>
          {['sim', 'ai', 'multi'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                flex: 1, padding: '6px 10px', fontSize: '0.75rem', fontWeight: 800,
                border: 'none', borderRadius: 8, cursor: 'pointer',
                background: activeTab === t ? 'linear-gradient(135deg, var(--clr-green), var(--clr-sky))' : 'transparent',
                color: activeTab === t ? '#06081a' : 'var(--clr-white-60)',
                transition: 'all 0.2s',
              }}
            >
              {t === 'sim' ? 'Simulation' : t === 'ai' ? 'AI DNA' : 'Multiplayer'}
            </button>
          ))}
        </div>

        {/* Tab 1: Environmental Simulations */}
        {activeTab === 'sim' && (
          <div>
            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 14, color: 'var(--clr-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wind size={15} /> Ecosystem Controls
            </h4>

            {/* Wind simulation */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span>🌪️ Wind Speed</span>
                <span>{windLevel}%</span>
              </div>
              <input type="range" min="0" max="100" value={windLevel} onChange={e => setWindLevel(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            {/* Sunlight simulation */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span>☀️ Sunlight Exposure</span>
                <span>{sunlightLevel}%</span>
              </div>
              <input type="range" min="0" max="100" value={sunlightLevel} onChange={e => setSunlightLevel(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            {/* Water simulation */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span>💧 Water Saturation</span>
                <span>{waterLevel}%</span>
              </div>
              <input type="range" min="0" max="100" value={waterLevel} onChange={e => setWaterLevel(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12,
              border: '1px solid var(--glass-border)', fontSize: '0.78rem', marginTop: 16
            }}>
              <div style={{ fontWeight: 700, color: 'var(--clr-sky)', marginBottom: 4 }}>🦋 Pollinator Attractiveness</div>
              <div style={{ color: 'var(--clr-white-60)' }}>
                {sunlightLevel > 60 && waterLevel > 50 ? '🌸 Bees & butterflies are visiting your flower!' : 'Pour water & light to attract bees.'}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI DNA Generator */}
        {activeTab === 'ai' && (
          <div>
            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 14, color: 'var(--clr-lavender)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={15} /> AI Flower DNA
            </h4>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 12, border: '1px solid var(--glass-border)', marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-white-60)', marginBottom: 4 }}>Genotype Sequence</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--clr-lavender)', fontSize: '0.95rem', letterSpacing: 1 }}>
                {dna}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--clr-white-60)' }}>Rarity Level</span>
                <span className={`badge ${rarity === 'Legendary' ? 'badge-legendary' : rarity === 'Epic' ? 'badge-epic' : 'badge-common'}`} style={{ fontSize: '0.7rem' }}>
                  {rarity}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--clr-white-60)' }}>Growth Stage</span>
                <span style={{ fontWeight: 700, color: 'var(--clr-green)' }}>Fully Bloomed</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--clr-white-60)' }}>DNA Mutations</span>
                <span style={{ fontWeight: 700 }}>2.4%</span>
              </div>
            </div>

            <button
              onClick={() => {
                const seq = `ATCG-HB-${Math.floor(Math.random() * 900 + 100)}-${['X','Y','Z'][Math.floor(Math.random()*3)]}`;
                setDna(seq);
                setRarity(['Common','Rare','Epic','Legendary'][Math.floor(Math.random()*4)]);
                setBloomCoins(c => c + 10);
              }}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 20, padding: 10, fontSize: '0.82rem' }}
            >
              🔄 Recalculate AI DNA
            </button>
          </div>
        )}

        {/* Tab 3: Multiplayer & Gallery sharing */}
        {activeTab === 'multi' && (
          <div>
            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 14, color: 'var(--clr-sky)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={15} /> Multiplayer Garden
            </h4>

            <p style={{ fontSize: '0.78rem', color: 'var(--clr-white-60)', lineHeight: 1.6, marginBottom: 16 }}>
              Connect with friends to design flowers simultaneously. Share garden portals!
            </p>

            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', padding: 12, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--clr-green)', marginBottom: 6 }}>🟢 Active Session</div>
              <div style={{ fontSize: '0.78rem' }}>Lobby: <strong>HB-GARDEN-5173</strong></div>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-white-60)', marginTop: 4 }}>Participants: You, Luna Star</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => alert('Multiplayer connection successful! Lobby code copied.')} className="btn btn-secondary w-full" style={{ padding: 10, fontSize: '0.78rem' }}>
                🔗 Copy Invitation Link
              </button>
              <button className="btn btn-primary w-full" style={{ padding: 10, fontSize: '0.78rem' }}>
                🤝 Open Public Garden Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
