import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart, MessageCircle, Share2, Award, Zap, Compass, Users,
  Play, Gift, ShieldCheck, Flame, BarChart2, Star, Volume2, Maximize,
  Plus, MessageSquare, ShoppingBag, Eye, Send, Moon, Sun
} from 'lucide-react';
import { FLOWER_TYPES } from '../data/flowers';

const MOCK_STORIES = [
  { id: 1, name: 'Luna Star', emoji: '🌸', active: true, image: '🌹' },
  { id: 2, name: 'Aria Bloom', emoji: '🌺', active: true, image: '🪷' },
  { id: 3, name: 'Nova Green', emoji: '🌻', active: true, image: '🌻' },
  { id: 4, name: 'Zara Spark', emoji: '✨', active: false, image: '🌺' },
];

const MOCK_POSTS = [
  {
    id: 1,
    creator: 'Luna Star',
    handle: '@lunastar',
    avatar: '🌸',
    content: 'Just synthesized a rare Pink-Gold Tulip hybrid in the genetics lab! DNA: TUL-GEN-77-X. Mutation rate is 24%! What do you guys think? 🧬✨',
    flowerEmoji: '🌷',
    color: '#ff6b9d',
    likes: 124,
    comments: [
      { author: 'Aria Bloom', text: 'Beautiful! Did you use a classic tulip as base?' },
      { author: 'Nova Green', text: 'Mutation rate is insane, congrats.' }
    ]
  },
  {
    id: 2,
    creator: 'Aria Bloom',
    handle: '@aria',
    avatar: '🌺',
    content: 'Testing the space Mars garden greenhouse mode. Sunlight exposure at 80% creates huge glowing sunflowers! 🛰️☀️🌻',
    flowerEmoji: '🌻',
    color: '#ffd60a',
    likes: 98,
    comments: []
  }
];

export default function SocialPage() {
  const { currentUser, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // feed | reels | live | creator | auctions
  
  // Real-time synchronization simulation (listening to localStorage changes)
  const [posts, setPosts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hb_social_posts'));
      return saved || MOCK_POSTS;
    } catch {
      return MOCK_POSTS;
    }
  });

  const savePostsToStorage = (updated) => {
    setPosts(updated);
    localStorage.setItem('hb_social_posts', JSON.stringify(updated));
  };

  // Sync listener for multi-device simulation
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'hb_social_posts') {
        try { setPosts(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Post Submission
  const [postText, setPostText] = useState('');
  const [selectedFlower, setSelectedFlower] = useState('rose');

  const handleCreatePost = () => {
    if (!postText.trim()) return;
    const flower = FLOWER_TYPES.find(f => f.id === selectedFlower);
    const newPost = {
      id: Date.now(),
      creator: currentUser?.name || 'Anonymous',
      handle: currentUser?.username || '@user',
      avatar: currentUser?.avatarEmoji || '🌸',
      content: postText,
      flowerEmoji: flower?.emoji || '🌸',
      color: flower?.colors[0] || '#ff6b9d',
      likes: 0,
      comments: []
    };
    const updated = [newPost, ...posts];
    savePostsToStorage(updated);
    setPostText('');
  };

  // Like system (updates instantly without reload)
  const handleLike = (postId) => {
    const updated = posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p);
    savePostsToStorage(updated);
  };

  // Comment System
  const [commentInputs, setCommentInputs] = useState({});
  const handleAddComment = (postId) => {
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;
    const updated = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, { author: currentUser?.name || 'Guest', text }]
        };
      }
      return p;
    });
    savePostsToStorage(updated);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  // 2. Stories States
  const [openStory, setOpenStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);

  useEffect(() => {
    if (!openStory) return;
    setStoryProgress(0);
    const timer = setInterval(() => {
      setStoryProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setOpenStory(null);
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [openStory]);

  // 3. Reels/Shorts States
  const [speed, setSpeed] = useState(1);
  const [reelLikes, setReelLikes] = useState(250);

  // 4. Live Stream Simulation
  const [streamActive, setStreamActive] = useState(false);
  const [liveChat, setLiveChat] = useState([
    { user: 'Luna Star', text: 'Wow, look at those colors!' },
    { user: 'Aria Bloom', text: 'Is this Mars theme greenhouse?' }
  ]);
  const liveChatInterval = useRef(null);

  const startStream = () => {
    setStreamActive(true);
    setLiveChat([{ user: 'System', text: '🟢 Live stream initialized.' }]);
    
    // Simulate real-time chat input from online users
    liveChatInterval.current = setInterval(() => {
      const messages = [
        'Awesome design!',
        'How did you do that?',
        'Synthesize with a Lily!',
        'Send some roses!',
        'Love the particle trails.'
      ];
      const users = ['Luna Star', 'Aria Bloom', 'Nova Green', 'Zara Spark'];
      const text = messages[Math.floor(Math.random() * messages.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      setLiveChat(c => [...c.slice(-6), { user, text }]);
    }, 2000);
  };

  const stopStream = () => {
    setStreamActive(false);
    clearInterval(liveChatInterval.current);
  };

  useEffect(() => {
    return () => clearInterval(liveChatInterval.current);
  }, []);

  // 5. Auctions Bids
  const [bids, setBids] = useState({ 1: 350, 2: 120 });
  const placeBid = (id) => {
    setBids(b => ({ ...b, [id]: b[id] + 50 }));
  };

  if (!isLoggedIn) {
    return (
      <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Authentication Required</h2>
          <p style={{ color: 'var(--clr-white-60)', marginBottom: 24 }}>Please register to access the SocialVerse.</p>
          <a href="/auth" className="btn btn-primary">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#06081a' }}>
      
      {/* ── Sub Navbar Tabs ── */}
      <div style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.15)' }}>
        <div className="container" style={{ display: 'flex', gap: 16, padding: '12px 24px', flexWrap: 'wrap' }}>
          {[
            { id: 'feed', label: '📸 Feed & Posts', icon: MessageSquare },
            { id: 'reels', label: '🎥 Reels & Shorts', icon: Play },
            { id: 'live', label: '🔴 Live Stream', icon: Flame },
            { id: 'auctions', label: '🛍️ Auctions & Shop', icon: ShoppingBag },
            { id: 'creator', label: '🏆 Creator Hub', icon: BarChart2 },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 99, border: 'none',
                fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: '0.82rem',
                cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === t.id ? 'linear-gradient(135deg, var(--clr-green), var(--clr-sky))' : 'transparent',
                color: activeTab === t.id ? '#06081a' : 'var(--clr-white-60)'
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
        
        {/* TAB 1: Feed & Stories */}
        {activeTab === 'feed' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }} className="grid-2-resp">
            
            {/* Main Column */}
            <div>
              {/* Stories Bar */}
              <div className="glass-card" style={{ padding: 18, marginBottom: 28, display: 'flex', gap: 16, overflowX: 'auto', alignItems: 'center' }}>
                {MOCK_STORIES.map(story => (
                  <button
                    key={story.id}
                    onClick={() => setOpenStory(story)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                    }}
                  >
                    <div style={{
                      width: 58, height: 58, borderRadius: '50%',
                      padding: 3, background: story.active ? 'linear-gradient(135deg, var(--clr-pink), var(--clr-sky))' : 'var(--glass-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0d1130', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                        {story.emoji}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-white-80)', fontWeight: 700 }}>{story.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Create Post Card */}
              <div className="glass-card" style={{ padding: 20, marginBottom: 28 }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 12 }}>📤 Share a New Creation</h4>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <textarea
                    className="form-textarea"
                    placeholder="Tell your followers about your flower or genetics mutation..."
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                    style={{ minHeight: 80 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--clr-white-60)' }}>Genotype Icon:</span>
                    <select className="form-select" value={selectedFlower} onChange={e => setSelectedFlower(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
                      {FLOWER_TYPES.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
                    </select>
                  </div>
                  <button onClick={handleCreatePost} className="btn btn-primary btn-sm">
                    Post to Feed
                  </button>
                </div>
              </div>

              {/* Infinite Social Feed List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {posts.map(post => (
                  <div key={post.id} className="glass-card" style={{ padding: 22 }}>
                    
                    {/* Creator Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          {post.avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{post.creator} <span className="badge badge-common" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>Verified</span></div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{post.handle}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '1.8rem' }}>{post.flowerEmoji}</span>
                    </div>

                    <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--clr-white-90)', marginBottom: 16 }}>
                      {post.content}
                    </p>

                    {/* Stats & Actions */}
                    <div style={{ display: 'flex', gap: 18, borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', padding: '10px 0', marginBottom: 14 }}>
                      <button onClick={() => handleLike(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--clr-white-60)', cursor: 'pointer', fontSize: '0.8rem' }} className="hover:text-pink">
                        <Heart size={14} style={{ color: 'var(--clr-rose)' }} fill="var(--clr-rose)" /> {post.likes} Likes
                      </button>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--clr-white-60)' }}>
                        <MessageCircle size={14} /> {post.comments.length} Comments
                      </span>
                    </div>

                    {/* Comments section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {post.comments.map((c, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--clr-green)' }}>{c.author}: </span>
                          <span style={{ color: 'var(--clr-white-80)' }}>{c.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Comment Input */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="form-input"
                        placeholder="Add comment..."
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                        style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                      />
                      <button onClick={() => handleAddComment(post.id)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>Send</button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Column */}
            <div>
              <div className="glass-card" style={{ padding: 20 }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 12 }}>🚀 Trending Hashtags</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
                  {['#GeneticsLab', '#SpaceGarden', '#SpeedBloom', '#HandTracking'].map(tag => (
                    <a key={tag} href="#" style={{ color: 'var(--clr-sky)', textDecoration: 'none' }}>{tag}</a>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Reels/Shorts */}
        {activeTab === 'reels' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: 360, padding: 20, textAlign: 'center', background: '#0d1130' }}>
              <div style={{ width: '100%', height: 480, background: '#222', borderRadius: 16, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ fontSize: '6rem', animation: 'gestureFloat 3s infinite' }}>🌸</div>
                <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, textAlign: 'left' }}>
                  <h4 style={{ fontWeight: 800 }}>@luna_reels</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--clr-white-80)', marginTop: 4 }}>Fastest bloom record with peace gesture! 🏆</p>
                </div>
                
                {/* Speed indicator */}
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 8, fontSize: '0.72rem' }}>
                  ⚡ {speed}x Speed
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
                <button onClick={() => setReelLikes(l => l + 1)} className="btn btn-secondary btn-sm">♥ {reelLikes}</button>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setSpeed(1)} className="btn btn-secondary btn-sm" style={{ borderColor: speed===1 ? 'var(--clr-green)':'' }}>1x</button>
                  <button onClick={() => setSpeed(2)} className="btn btn-secondary btn-sm" style={{ borderColor: speed===2 ? 'var(--clr-green)':'' }}>2x</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Live Stream */}
        {activeTab === 'live' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }} className="grid-2-resp">
            
            {/* Live Camera View Box */}
            <div className="glass-card" style={{ height: 440, position: 'relative', background: '#000', borderRadius: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {streamActive ? (
                <>
                  <div style={{ fontSize: '7rem', animation: 'gestureFloat 2.5s infinite' }}>✨</div>
                  <div style={{ position: 'absolute', top: 16, left: 16, background: '#ef4444', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800 }}>🔴 LIVE</div>
                  <button onClick={stopStream} className="btn btn-secondary btn-sm" style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(252,165,165,0.2)', color: '#fca5a5' }}>
                    End Stream
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎥</div>
                  <h3>Broadcasting Studio</h3>
                  <p style={{ color: 'var(--clr-white-60)', fontSize: '0.82rem', margin: '8px 0 20px' }}>Simulate a multi-guest live broadcast with real-time feedback chats.</p>
                  <button onClick={startStream} className="btn btn-primary">Start Live Stream</button>
                </div>
              )}
            </div>

            {/* Live Chat log */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 440 }}>
              <h4 style={{ padding: 14, borderBottom: '1px solid var(--glass-border)' }}>💬 Live Feed Chat</h4>
              <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {liveChat.map((m, i) => (
                  <div key={i} style={{ fontSize: '0.78rem' }}>
                    <strong style={{ color: 'var(--clr-green)' }}>{m.user}: </strong>
                    <span style={{ color: 'var(--clr-white-90)' }}>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: Auctions */}
        {activeTab === 'auctions' && (
          <div>
            <h3 style={{ fontWeight: 800, marginBottom: 20 }}>🛍️ Rare Flower Auctions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                { id: 1, name: 'Dragon Lotus Genotype', desc: 'Rare mutation with golden stem', timer: '02h:14m', bid: bids[1] },
                { id: 2, name: 'Winter Frost Orchid', desc: 'Epic space garden species', timer: '04h:48m', bid: bids[2] },
              ].map(item => (
                <div key={item.id} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h4 style={{ fontWeight: 800 }}>{item.name}</h4>
                    <span className="badge badge-epic" style={{ fontSize: '0.62rem' }}>{item.timer}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--clr-white-60)', marginBottom: 16 }}>{item.desc}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>Current Bid</div>
                      <strong style={{ color: 'var(--clr-gold)' }}>💎 {item.bid} Coins</strong>
                    </div>
                    <button onClick={() => placeBid(item.id)} className="btn btn-primary btn-sm">Place Bid</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Creator Hub & Analytics */}
        {activeTab === 'creator' && (
          <div>
            <h3 style={{ fontWeight: 800, marginBottom: 20 }}>🏆 Creator Analytics & Earnings</h3>
            <div className="grid-3" style={{ marginBottom: 28 }}>
              {[
                { label: 'Weekly Earnings', value: '$240.50', color: 'var(--clr-green)' },
                { label: 'Total Subscribers', value: '482', color: 'var(--clr-sky)' },
                { label: 'Platform XP Level', value: 'Level 14', color: 'var(--clr-lavender)' },
              ].map(c => (
                <div key={c.label} className="stat-card stat-card-green" style={{ padding: 20 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: c.color }}>{c.value}</div>
                  <div className="stat-card-label" style={{ marginTop: 4 }}>{c.label}</div>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
              <h4 style={{ fontWeight: 800, marginBottom: 10 }}>👑 Apply for Verified Creator Status</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--clr-white-60)', marginBottom: 16 }}>
                Once verified, you can sell digital flower genomes, create subscription clubs, and unlock animated petals visual effects.
              </p>
              <button onClick={() => alert('Verification application submitted to Admin panel!')} className="btn btn-primary">
                Submit Verification Request
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Story Modal Overlay ── */}
      {openStory && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 99999
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 360, padding: 24, textAlign: 'center', background: '#06081a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong style={{ fontSize: '0.95rem' }}>{openStory.name}'s Story</strong>
              <button onClick={() => setOpenStory(null)} className="btn btn-secondary btn-sm" style={{ padding: 4 }}>✕</button>
            </div>
            
            {/* Progress bar */}
            <div className="progress-bar-wrap" style={{ height: 4, marginBottom: 20 }}>
              <div className="progress-bar" style={{ width: `${storyProgress}%`, background: 'var(--clr-green)' }} />
            </div>

            <div style={{ height: 320, background: 'var(--glass-bg)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>
              {openStory.image}
            </div>
            <p style={{ marginTop: 16, fontSize: '0.85rem' }}>Active 24hr story slide</p>
          </div>
        </div>
      )}

    </div>
  );
}
