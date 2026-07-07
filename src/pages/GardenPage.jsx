import { useState, useEffect, useCallback } from 'react';
import GardenGallery from '../components/GardenGallery';
import { GALLERY_FLOWERS, CATEGORIES, REWARD_COUPONS } from '../data/flowers';
import { Search, Plus, Award, Tag, Zap, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSocket } from '../hooks/useSocket';

export default function GardenPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        // Sort by level/xp descending
        const sortedUsers = [...data].sort((a,b) => (b.level || 1) - (a.level || 1));
        setLeaderboard(sortedUsers);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    const socket = getSocket();

    const handleProfileUpdate = (u) => {
      setLeaderboard(prev => {
        const updated = prev.map(x => x.uid === u.uid ? { ...x, ...u } : x);
        return updated.sort((a,b) => (b.level || 1) - (a.level || 1));
      });
    };

    const handleUserRegistered = (u) => {
      setLeaderboard(prev => {
        const updated = prev.some(x => x.uid === u.uid) ? prev : [...prev, u];
        return updated.sort((a,b) => (b.level || 1) - (a.level || 1));
      });
    };

    const handleUserDeleted = ({ uid }) => {
      setLeaderboard(prev => prev.filter(x => x.uid !== uid));
    };

    socket.on('user:profileUpdated', handleProfileUpdate);
    socket.on('user:registered', handleUserRegistered);
    socket.on('user:deleted', handleUserDeleted);

    return () => {
      socket.off('user:profileUpdated', handleProfileUpdate);
      socket.off('user:registered', handleUserRegistered);
      socket.off('user:deleted', handleUserDeleted);
    };
  }, []);

  const categories = ['All', ...CATEGORIES.map(c => c.name)];

  const handleApplyCoupon = () => {
    const found = REWARD_COUPONS.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (found) {
      setAppliedCoupon(found);
      setCouponMsg(`✓ ${found.discount} Coupon Activated: ${found.description}`);
    } else {
      setCouponMsg('✕ Invalid Coupon Code. Try BLOOMSPRING');
    }
  };

  const filtered = GALLERY_FLOWERS.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.creator.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'likes') return b.likes - a.likes;
    if (sortBy === 'petals') return b.petals - a.petals;
    return b.id - a.id;
  });

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        padding: '60px 0 40px',
        background: 'radial-gradient(ellipse at top, rgba(134,239,172,0.08), transparent)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <span className="section-tag">🌿 Virtual Garden</span>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, marginTop: 12 }}>
                The Global <span className="text-gradient-green">Garden Universe</span>
              </h1>
              <p style={{ color: 'var(--clr-white-60)', marginTop: 8, fontSize: '1rem' }}>
                {GALLERY_FLOWERS.length} flowers blooming · {CATEGORIES.length} categories
              </p>
            </div>
            <Link to="/studio" className="btn btn-primary">
              <Plus size={18} />
              Create Flower
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.1fr', gap: 28 }} className="grid-2-resp">
          
          {/* Main Feed Column */}
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-60)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  placeholder="Search flowers or creators..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 160 }}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="likes">Most Liked</option>
                <option value="petals">Most Petals</option>
              </select>
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="btn btn-sm"
                  style={{
                    background: activeCategory === cat
                      ? 'linear-gradient(135deg, var(--clr-green), var(--clr-sky))'
                      : 'var(--glass-bg)',
                    color: activeCategory === cat ? '#0d1130' : 'var(--clr-white-80)',
                    border: activeCategory === cat ? 'none' : '1px solid var(--glass-border)',
                  }}
                >
                  {cat === 'All' ? '🌿' : CATEGORIES.find(c => c.name === cat)?.icon} {cat}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <GardenGallery flowers={sorted} title="All Blooms" />
          </div>

          {/* Sidebar Widgets Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Widget 1: Challenge */}
            <div className="glass-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle, rgba(252,211,77,0.15), transparent)', borderRadius: '50%' }} />
              <h4 style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--clr-gold)', fontSize: '0.95rem', marginBottom: 12 }}>
                <Zap size={16} /> Weekly Challenge
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-white-80)', lineHeight: 1.5, marginBottom: 12 }}>
                Create a flower with <strong>18+ petals</strong> using the <strong>Cosmic palette</strong> to earn a bonus badge!
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--clr-white-60)' }}>Prize:</span>
                <strong style={{ color: 'var(--clr-gold)' }}>🏆 150 Bloom Coins</strong>
              </div>
              <Link to="/studio" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
                Enter Challenge
              </Link>
            </div>

            {/* Widget 2: Leaderboard */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--clr-sky)', fontSize: '0.95rem', marginBottom: 14 }}>
                <Award size={16} /> Leaderboard
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {leaderboard.map((u, index) => (
                  <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 800, color: index === 0 ? 'var(--clr-gold)' : index === 1 ? 'var(--clr-sky)' : 'var(--clr-white-60)' }}>
                      #{index + 1}
                    </span>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (u.avatarEmoji || '🌸')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>Level {u.level || 1}</div>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <p style={{ color: 'var(--clr-white-60)', fontSize: '0.78rem', textAlign: 'center' }}>No users recorded.</p>
                )}
              </div>
            </div>

            {/* Widget 3: Coupon Rewards Box */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--clr-lavender)', fontSize: '0.95rem', marginBottom: 14 }}>
                <Gift size={16} /> Claim Coupons
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--clr-white-60)', marginBottom: 12 }}>
                Enter coupon codes to claim discounts in the marketplace store.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  className="form-input"
                  placeholder="Code (e.g. BLOOMSPRING)"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  style={{ fontSize: '0.78rem', padding: '8px 12px' }}
                />
                <button onClick={handleApplyCoupon} className="btn btn-secondary btn-sm" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
                  Apply
                </button>
              </div>
              {couponMsg && (
                <div style={{
                  fontSize: '0.75rem',
                  color: appliedCoupon ? 'var(--clr-green)' : '#fca5a5',
                  background: appliedCoupon ? 'rgba(134,239,172,0.05)' : 'rgba(252,165,165,0.05)',
                  padding: '8px 10px',
                  borderRadius: 8,
                }}>
                  {couponMsg}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
