import { useState } from 'react';
import { Sparkles, Heart, Zap, Play, RotateCcw, Share2, Compass, Cpu, MessageSquare, Flame, Shield, Dna } from 'lucide-react';
import { drawFlower, COLOR_PALETTES } from '../utils/flowerGeometry';
import { FLOWER_TYPES } from '../data/flowers';

export default function OmniversePage() {
  // 1. AI Emotion Bloom states
  const [selectedEmotion, setSelectedEmotion] = useState('Happy');
  const [emotionStory, setEmotionStory] = useState(
    'A radiant sunflower garden filled with bright golden pollen. It exudes warmth, cheerfulness, and positive energy.'
  );
  
  // 2. Voice + Hand Fusion states
  const [voiceText, setVoiceText] = useState('');
  const [voiceLog, setVoiceLog] = useState(['Say or type: "Create Rose" or "Set Cosmic"']);

  // 3. Flower Genetics Lab states
  const [parentA, setParentA] = useState('rose');
  const [parentB, setParentB] = useState('cosmic_flower');
  const [hybridName, setHybridName] = useState('Dragon Cosmic Hybrid');
  const [hybridColor, setHybridColor] = useState('#ff6b9d');
  const [hybridPetals, setHybridPetals] = useState(16);
  const [mutationRate, setMutationRate] = useState(12);

  // 4. Space Garden & Premium Effects states
  const [spaceTheme, setSpaceTheme] = useState('moon'); // moon | mars | blackhole
  const [premiumEffect, setPremiumEffect] = useState('butterflies'); // butterflies | crystal | fire

  // 5. Esports Tournament Live Battle simulation states
  const [battleLog, setBattleLog] = useState([
    '⚔️ Tournament lobby open.',
    '👑 Opponent Aria Bloom joined.'
  ]);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [battleActive, setBattleActive] = useState(false);

  const EMOTIONS = {
    Happy: {
      story: 'A radiant sunflower garden filled with bright golden pollen. It exudes warmth, cheerfulness, and positive energy.',
      colorIdx: 1, // Sunflower yellow
      petals: 18,
    },
    Sad: {
      story: 'A serene blue crystal orchid blooming under moonlight. Brings peace, calmness, and beautiful reflective light.',
      colorIdx: 3, // Lavender/Blue
      petals: 6,
    },
    Excited: {
      story: 'A neon bloom forest emitting colorful energy sparks. Symbolizes intense passion, creativity, and drive.',
      colorIdx: 7, // Cosmic multi-color
      petals: 22,
    },
    Peaceful: {
      story: 'A pure white celestial lotus floating on a quiet pond. Creates a calm state of mindfulness and alignment.',
      colorIdx: 6, // Daisy white/yellow
      petals: 12,
    }
  };

  const handleEmotionSelect = (emo) => {
    setSelectedEmotion(emo);
    setEmotionStory(EMOTIONS[emo].story);
  };

  // Hybrid Synthesis logic
  const handleSynthesize = () => {
    const pA = FLOWER_TYPES.find(f => f.id === parentA);
    const pB = FLOWER_TYPES.find(f => f.id === parentB);
    const newName = `${pA ? pA.name : 'Unknown'}-${pB ? pB.name : 'Unknown'} Hybrid`;
    setHybridName(newName);
    setHybridColor(pA ? pA.colors[0] : '#c4b5fd');
    setHybridPetals(Math.floor(((pA?.petalCount || 8) + (pB?.petalCount || 8)) / 2) + 2);
    setMutationRate(Math.floor(Math.random() * 40) + 5);
  };

  // Voice Command Trigger
  const handleVoiceCommand = (cmd) => {
    const cleanCmd = cmd.toLowerCase().trim();
    setVoiceLog(prev => [...prev.slice(-3), `🎤 Recognized: "${cmd}"`]);
    if (cleanCmd.includes('rose')) {
      setVoiceLog(prev => [...prev, '🤖 Action: Growing Red Rose...']);
    } else if (cleanCmd.includes('cosmic')) {
      setVoiceLog(prev => [...prev, '🤖 Action: Setting galaxy star theme...']);
    } else if (cleanCmd.includes('sparkle')) {
      setVoiceLog(prev => [...prev, '🤖 Action: Triggering pollen storm!']);
    } else {
      setVoiceLog(prev => [...prev, '🤖 Command not recognized. Try "Create Rose"']);
    }
  };

  // Esports battle simulation
  const startBattle = () => {
    setBattleActive(true);
    setUserScore(0);
    setOpponentScore(0);
    setBattleLog(['🔥 Speed Bloom Battle Started!', '👉 Tap gestures quickly to build flower!']);

    let round = 1;
    const interval = setInterval(() => {
      if (round > 5) {
        clearInterval(interval);
        setBattleActive(false);
        setBattleLog(p => [...p, '🏆 Battle Finished!']);
        return;
      }
      const userStep = Math.floor(Math.random() * 30) + 15;
      const oppStep = Math.floor(Math.random() * 30) + 15;
      setUserScore(s => s + userStep);
      setOpponentScore(s => s + oppStep);
      setBattleLog(p => [...p, `Round ${round}: You scored +${userStep} | Aria scored +${oppStep}`]);
      round++;
    }, 1200);
  };

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#06081a' }}>
      
      {/* ── Header ── */}
      <div style={{
        padding: '50px 0 35px',
        background: 'radial-gradient(ellipse at top, rgba(196,181,253,0.12), transparent)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div className="container">
          <span className="section-tag">🌌 OMNIVERSE EXPERIMENTAL PORTAL</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, marginTop: 12 }}>
            Ultimate Future <span className="text-gradient-cosmic">Features Portal</span>
          </h1>
          <p style={{ color: 'var(--clr-white-60)', marginTop: 8, fontSize: '0.95rem' }}>
            Interact with tomorrow: AI Emotion Blooms, voice control, hybrid gene editors, metaverse space modules, and esports speed bloom arenas.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
        
        {/* Main Grid Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28 }}>
          
          {/* 1. AI Emotion Bloom Module */}
          <div className="glass-card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 90, height: 90, background: 'radial-gradient(circle, rgba(134,239,172,0.15), transparent)', borderRadius: '50%' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={18} style={{ color: 'var(--clr-green)' }} />
              🧠 AI Emotion Bloom
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--clr-white-60)', marginBottom: 16 }}>
              Select simulated facial emotion to generate custom matches:
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {['Happy', 'Sad', 'Excited', 'Peaceful'].map(emo => (
                <button
                  key={emo}
                  onClick={() => handleEmotionSelect(emo)}
                  style={{
                    padding: '8px 14px', borderRadius: 99, border: '1px solid var(--glass-border)',
                    background: selectedEmotion === emo ? 'linear-gradient(135deg, var(--clr-green), var(--clr-sky))' : 'var(--glass-bg)',
                    color: selectedEmotion === emo ? '#06081a' : 'white',
                    fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {emo === 'Happy' ? '😊 Happy' : emo === 'Sad' ? '😢 Sad' : emo === 'Excited' ? '🤪 Excited' : '🧘 Peaceful'}
                </button>
              ))}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 14, border: '1px solid var(--glass-border)', marginBottom: 12 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--clr-green)', marginBottom: 4 }}>AI Story Description</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-white-80)', lineHeight: 1.5 }}>
                {emotionStory}
              </div>
            </div>
          </div>

          {/* 2. Voice + Hand Fusion Assistant */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={18} style={{ color: 'var(--clr-sky)' }} />
              🎤 Voice + Hand Assistant
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--clr-white-60)', marginBottom: 16 }}>
              Say gesture directions (e.g. "Create Rose" or "Set Cosmic Theme").
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="form-input"
                placeholder="Type command here..."
                value={voiceText}
                onChange={e => setVoiceText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (handleVoiceCommand(voiceText), setVoiceText(''))}
                style={{ fontSize: '0.78rem' }}
              />
              <button
                onClick={() => { handleVoiceCommand(voiceText || 'Create Rose'); setVoiceText(''); }}
                className="btn btn-primary btn-sm"
              >
                Send
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, minHeight: 110, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {voiceLog.map((log, i) => (
                <div key={i} style={{ color: log.startsWith('🤖') ? 'var(--clr-green)' : 'var(--clr-white-60)' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Genetics Lab Breeder */}
          <div className="glass-card" style={{ padding: 24, gridColumn: '1 / -1' }} className="glass-card grid-col-all">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Dna size={18} style={{ color: 'var(--clr-lavender)' }} />
              🧬 Flower Genetics Lab
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--clr-white-60)', marginBottom: 20 }}>
              Cross-breed two distinct flower genomes to generate impossible hybrid phenotypes.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto 1fr', gap: 16, alignItems: 'center' }} className="grid-2-resp">
              {/* Parent A Selection */}
              <div className="form-group">
                <label className="form-label">Parent Genotype A</label>
                <select className="form-select" value={parentA} onChange={e => setParentA(e.target.value)}>
                  {FLOWER_TYPES.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
                </select>
              </div>

              {/* Parent B Selection */}
              <div className="form-group">
                <label className="form-label">Parent Genotype B</label>
                <select className="form-select" value={parentB} onChange={e => setParentB(e.target.value)}>
                  {FLOWER_TYPES.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
                </select>
              </div>

              {/* Synthesis trigger */}
              <button onClick={handleSynthesize} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '0.85rem' }}>
                🧬 Combine Chromosomes
              </button>

              {/* Hybrid Output Result */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14, border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.73rem', color: 'var(--clr-green)', fontWeight: 800, marginBottom: 2 }}>🧬 Hybrid Offspring</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{hybridName}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)', marginTop: 4 }}>
                  Petals: {hybridPetals} | Mutations: <strong style={{ color: 'var(--clr-gold)' }}>{mutationRate}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Cosmic space & Premium effects */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={18} style={{ color: 'var(--clr-gold)' }} />
              🛰️ Space Garden & Effects
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--clr-white-60)', marginBottom: 14 }}>
              Unlock space ecology simulators:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Space Theme */}
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Space Greenhouse</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['moon', 'mars', 'blackhole'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSpaceTheme(t)}
                      style={{
                        flex: 1, padding: 8, fontSize: '0.72rem', fontWeight: 800,
                        border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer',
                        background: spaceTheme === t ? 'rgba(252,211,77,0.15)' : 'var(--glass-bg)',
                        color: spaceTheme === t ? 'var(--clr-gold)' : 'white'
                      }}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Premium effects */}
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Insane Premium Effects</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['butterflies', 'crystal', 'fire'].map(e => (
                    <button
                      key={e}
                      onClick={() => setPremiumEffect(e)}
                      style={{
                        flex: 1, padding: 8, fontSize: '0.72rem', fontWeight: 800,
                        border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer',
                        background: premiumEffect === e ? 'rgba(196,181,253,0.15)' : 'var(--glass-bg)',
                        color: premiumEffect === e ? 'var(--clr-lavender)' : 'white'
                      }}
                    >
                      {e.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Esports challenge tournament */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={18} style={{ color: 'var(--clr-pink)' }} />
              🏆 Esports Bloom Challenge
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--clr-white-60)', marginBottom: 16 }}>
              Compete in real-time speed bloom tournaments against AI or other creators:
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.73rem', color: 'var(--clr-white-60)' }}>Your Speed</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--clr-green)' }}>{userScore} bps</div>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>VS</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.73rem', color: 'var(--clr-white-60)' }}>Aria Bloom</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fca5a5' }}>{opponentScore} bps</div>
              </div>
            </div>

            <button
              onClick={startBattle}
              disabled={battleActive}
              className="btn btn-primary"
              style={{ width: '100%', padding: 10, fontSize: '0.82rem', marginBottom: 14 }}
            >
              {battleActive ? '⚔️ Speed Blooming...' : '🔥 Start Speed Bloom Tournament'}
            </button>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: 10, borderRadius: 10, maxHeight: 90, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.73rem', fontFamily: 'monospace' }}>
              {battleLog.map((log, i) => (
                <div key={i} style={{ color: 'var(--clr-white-60)' }}>{log}</div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
