import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ACHIEVEMENTS } from '../data/flowers';
import { getSocket } from '../hooks/useSocket';
import { Award, Share2, Settings, Edit2, Camera, X, MapPin, Link2, UserPlus, UserMinus, ShieldOff, Shield, MessageCircle, Search, Loader } from 'lucide-react';

const TABS = ['Portfolio', 'Garden', 'Achievements', 'Activity'];

function StatBox({ icon, value, label }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 70 }}>
      <div style={{ fontSize: '0.8rem', marginBottom: 2 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: '1.3rem', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--clr-white-60)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { currentUser, updateProfile, followUser, blockUser, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const viewUid = searchParams.get('uid');
  const [allUsers, setAllUsers] = useState([]);

  const isOwnProfile = !viewUid || viewUid === currentUser?.uid;
  const userToShow = isOwnProfile ? currentUser : (allUsers.find(u => u.uid === viewUid) || null);

  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('Portfolio');
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [website, setWebsite] = useState(currentUser?.website || '');

  const [instagram, setInstagram] = useState(currentUser?.instagram || '');
  const [twitter, setTwitter] = useState(currentUser?.twitter || '');
  const [github, setGithub] = useState(currentUser?.github || '');
  const [youtube, setYoutube] = useState(currentUser?.youtube || '');
  const [hobbies, setHobbies] = useState(currentUser?.hobbies || '');

  const [avatarEmoji, setAvatarEmoji] = useState(currentUser?.avatarEmoji || '🌸');
  const [avatar, setAvatar] = useState(currentUser?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const fileRef = useRef(null);

  // Load all users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await fetch('/api/users');
        if (res.ok) setAllUsers(await res.json());
      } catch {} finally { setLoadingUsers(false); }
    };
    fetchUsers();
  }, []);

  // Real-time socket updates
  useEffect(() => {
    const socket = getSocket();
    const handleProfileUpdate = (u) => {
      setAllUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, ...u } : x));
    };
    const handleUserRegistered = (u) => {
      setAllUsers(prev => prev.some(x => x.uid === u.uid) ? prev : [...prev, u]);
    };
    const handleUserDeleted = ({ uid }) => {
      setAllUsers(prev => prev.filter(x => x.uid !== uid));
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

  useEffect(() => {
    if (!isLoggedIn) navigate('/auth');
  }, [isLoggedIn]);

  // Sync form fields when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setBio(currentUser.bio || '');
      setLocation(currentUser.location || '');
      setWebsite(currentUser.website || '');
      setInstagram(currentUser.instagram || '');
      setTwitter(currentUser.twitter || '');
      setGithub(currentUser.github || '');
      setYoutube(currentUser.youtube || '');
      setHobbies(currentUser.hobbies || '');
      setAvatarEmoji(currentUser.avatarEmoji || '🌸');
      setAvatar(currentUser.avatar || null);
    }
  }, [currentUser]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      allUsers.filter(u =>
        u.uid !== currentUser?.uid &&
        (u.username?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q))
      ).slice(0, 8)
    );
  }, [searchQuery, allUsers]);

  const handleSave = async () => {
    setErrorMsg('');
    setSaving(true);
    try {
      await updateProfile({
        name, username, email, bio, location, website,
        instagram, twitter, github, youtube,
        avatarEmoji, avatar, hobbies
      });
      setEditing(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleFollow = async (uid) => {
    await followUser(uid);
    const res = await fetch('/api/users');
    if (res.ok) setAllUsers(await res.json());
  };

  const handleBlock = async (uid) => {
    await blockUser(uid);
    const res = await fetch('/api/users');
    if (res.ok) setAllUsers(await res.json());
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!currentUser) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <p style={{ color: 'var(--clr-white-60)' }}>Please login to view your profile.</p>
      <button className="btn btn-primary" onClick={() => navigate('/auth')}>Login</button>
    </div>
  );

  // If viewing another user and not found yet
  if (!isOwnProfile && !userToShow) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <p style={{ color: 'var(--clr-white-60)' }}>User not found.</p>
      <button className="btn btn-primary" onClick={() => navigate('/profile')}>Back to My Profile</button>
    </div>
  );

  const followingIds = currentUser.following || [];
  const blockedIds = currentUser.blockedUsers || [];
  const u2 = userToShow || currentUser; // safe fallback
  const earnedCount = ACHIEVEMENTS.filter(a => (u2.xp || 0) >= (a.xpRequired || 999)).length;

  const discoverUsers = allUsers.filter(u =>
    u.uid !== currentUser.uid &&
    !blockedIds.includes(u.uid) &&
    !u.isBlocked
  );

  const emojis = ['🌸', '🌺', '🌻', '🌹', '🪷', '💐', '🌷', '🌼', '🦋', '✨'];

  // Helper: render social links for a user object
  const renderSocialLinks = (u) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
      {u.instagram && (
        <a href={`https://instagram.com/${u.instagram.replace('@','')}`} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 10, fontSize: '0.75rem', color: '#f472b6', textDecoration: 'none' }}>
          📸 {u.instagram}
        </a>
      )}
      {u.twitter && (
        <a href={`https://twitter.com/${u.twitter.replace('@','')}`} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 10, fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none' }}>
          🐦 {u.twitter}
        </a>
      )}
      {u.github && (
        <a href={`https://github.com/${u.github}`} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, fontSize: '0.75rem', color: '#e2e8f0', textDecoration: 'none' }}>
          💻 {u.github}
        </a>
      )}
      {u.youtube && (
        <a href={u.youtube.startsWith('http') ? u.youtube : `https://${u.youtube}`} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: '0.75rem', color: '#f87171', textDecoration: 'none' }}>
          📺 YouTube
        </a>
      )}
    </div>
  );

  // Helper: render hobby tags for a user object
  const renderHobbies = (u) => {
    if (!u.hobbies) return null;
    const tags = u.hobbies.split(',').map(h => h.trim()).filter(Boolean);
    if (tags.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {tags.map((t, i) => (
          <span key={i} style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, color: 'var(--clr-green)', fontWeight: 700 }}>
            🏷️ {t}
          </span>
        ))}
      </div>
    );
  };

  // Helper: render a user row in search/discover
  const renderUserRow = (u, gradient) => {
    const isFollowing = followingIds.includes(u.uid);
    const isBlocked = blockedIds.includes(u.uid);
    return (
      <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
        <div onClick={() => navigate(`/profile?uid=${u.uid}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer', minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', overflow: 'hidden', flexShrink: 0 }}>
            {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.avatarEmoji || '🌸'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--clr-green)' }}>{u.username}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button title={isFollowing ? 'Unfollow' : 'Follow'} onClick={() => handleFollow(u.uid)}
            style={{ width: 28, height: 28, borderRadius: 8, background: isFollowing ? 'rgba(134,239,172,0.15)' : 'var(--clr-green)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFollowing ? 'var(--clr-green)' : '#000' }}>
            {isFollowing ? <UserMinus size={12} /> : <UserPlus size={12} />}
          </button>
          <button title="Message" onClick={() => navigate(`/messages?with=${u.uid}`)}
            style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(125,211,252,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-sky)' }}>
            <MessageCircle size={12} />
          </button>
          <button title={isBlocked ? 'Unblock' : 'Block'} onClick={() => handleBlock(u.uid)}
            style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(252,165,165,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5' }}>
            {isBlocked ? <Shield size={12} /> : <ShieldOff size={12} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }} className="profile-grid">
      {/* ── Left Column ─── */}
      <div>
        {/* Back to own profile button when viewing another user */}
        {!isOwnProfile && (
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/profile')} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to My Profile
          </button>
        )}

        {/* Profile Card */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          {/* Cover */}
          <div style={{ height: 120, background: 'linear-gradient(135deg,var(--clr-green),var(--clr-sky),var(--clr-lavender))', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%,rgba(255,255,255,0.08) 0%,transparent 60%)', pointerEvents: 'none' }} />
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            {/* Avatar + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -40, marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))',
                  border: '3px solid var(--clr-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.2rem', overflow: 'hidden',
                }}>
                  {editing
                    ? (avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarEmoji)
                    : (u2.avatar ? <img src={u2.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u2.avatarEmoji || '🌸'))
                  }
                </div>
                {editing && (
                  <button onClick={() => fileRef.current?.click()} style={{
                    position: 'absolute', bottom: 0, right: 0, width: 24, height: 24,
                    background: 'var(--clr-green)', borderRadius: '50%', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}>
                    <Camera size={12} color="#000" />
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {isOwnProfile ? (
                  editing ? (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setErrorMsg(''); }}><X size={14} /> Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader size={14} className="spin" /> : null} Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit2 size={14} /> Edit Profile</button>
                      <button className="btn btn-secondary btn-sm" style={{ color: '#fca5a5' }} onClick={handleLogout}>Logout</button>
                    </>
                  )
                ) : (
                  <>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleFollow(u2.uid)}
                      style={{
                        background: followingIds.includes(u2.uid) ? 'rgba(134,239,172,0.15)' : 'var(--clr-green)',
                        color: followingIds.includes(u2.uid) ? 'var(--clr-green)' : '#000',
                        border: followingIds.includes(u2.uid) ? '1px solid rgba(134,239,172,0.3)' : 'none',
                        fontWeight: 700, padding: '6px 14px', borderRadius: 10, cursor: 'pointer'
                      }}
                    >
                      {followingIds.includes(u2.uid) ? 'Following' : 'Follow'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/messages?with=${u2.uid}`)}
                      style={{ padding: '6px 14px', borderRadius: 10 }}>Message</button>
                    <button className="btn btn-secondary btn-sm" style={{ color: '#fca5a5', padding: '6px 14px', borderRadius: 10 }}
                      onClick={() => handleBlock(u2.uid)}>
                      {blockedIds.includes(u2.uid) ? 'Unblock' : 'Block'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── Edit Form ─── */}
            {editing && isOwnProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {errorMsg && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(252,165,165,0.1)', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.3)', fontSize: '0.8rem' }}>
                    ⚠️ {errorMsg}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hobbies (comma separated)</label>
                    <input className="form-input" value={hobbies} onChange={e => setHobbies(e.target.value)} placeholder="e.g. Gardening, Painting, VR" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-input" rows={3} value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input className="form-input" value={website} onChange={e => setWebsite(e.target.value)} />
                  </div>
                </div>

                <h4 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--clr-green)', marginTop: 8 }}>Social Media Profiles</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Instagram Username</label>
                    <input className="form-input" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Twitter / X Username</label>
                    <input className="form-input" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@handle" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GitHub Username</label>
                    <input className="form-input" value={github} onChange={e => setGithub(e.target.value)} placeholder="username" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">YouTube Channel Link</label>
                    <input className="form-input" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="youtube.com/c/..." />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Avatar Emoji</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {emojis.map(em => (
                      <button key={em} onClick={() => { setAvatarEmoji(em); setAvatar(null); }}
                        style={{ width: 36, height: 36, fontSize: '1.2rem', borderRadius: 10, background: avatarEmoji === em ? 'rgba(134,239,172,0.2)' : 'rgba(255,255,255,0.04)', border: `2px solid ${avatarEmoji === em ? 'var(--clr-green)' : 'var(--glass-border)'}`, cursor: 'pointer' }}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Read-Only Profile Display ─── */
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ fontWeight: 900, fontSize: '1.3rem', margin: 0 }}>{u2.name}</h2>
                  {u2.role === 'admin' && <span className="badge badge-legendary">👑 Admin</span>}
                  {u2.isOnline && <span style={{ fontSize: '0.65rem', padding: '2px 8px', background: 'rgba(134,239,172,0.1)', color: 'var(--clr-green)', borderRadius: 99, border: '1px solid rgba(134,239,172,0.2)' }}>🟢 Online</span>}
                </div>
                <div style={{ color: 'var(--clr-green)', fontSize: '0.82rem', marginBottom: 2 }}>{u2.username}</div>
                <div style={{ color: 'var(--clr-white-60)', fontSize: '0.78rem', marginBottom: 8 }}>✉️ {u2.email}</div>
                {u2.bio && <p style={{ color: 'var(--clr-white-60)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 10 }}>{u2.bio}</p>}

                {renderHobbies(u2)}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.75rem', color: 'var(--clr-white-60)', marginBottom: 12 }}>
                  {u2.location && <span><MapPin size={12} style={{ marginRight: 4 }} />{u2.location}</span>}
                  {u2.website && <a href={u2.website} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-sky)', display: 'flex', alignItems: 'center', gap: 4 }}><Link2 size={12} />{u2.website}</a>}
                </div>

                {renderSocialLinks(u2)}
              </>
            )}

            {/* Stats */}
            {!editing && (
              <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap', borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
                <StatBox icon="🌸" value={u2.flowers || 0} label="Flowers" />
                <StatBox icon="📤" value={u2.shared || 0} label="Shared" />
                <StatBox icon="❤️" value={u2.likes || 0} label="Likes" />
                <StatBox icon="👥" value={(u2.following || followingIds).length || 0} label="Following" />
                <StatBox icon="🏆" value={earnedCount} label="Badges" />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: '14px 22px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap',
                  color: activeTab === t ? 'var(--clr-green)' : 'var(--clr-white-60)',
                  borderBottom: activeTab === t ? '2px solid var(--clr-green)' : '2px solid transparent',
                }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ padding: 24 }}>
            {activeTab === 'Portfolio' && (
              <div style={{ color: 'var(--clr-white-60)', textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌸</div>
                <div style={{ fontWeight: 700 }}>No flowers created yet.</div>
                <div style={{ fontSize: '0.8rem', marginTop: 6 }}>Use hand gestures in the Studio to create flowers!</div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/studio')}>Open Studio</button>
              </div>
            )}
            {activeTab === 'Garden' && (
              <div style={{ color: 'var(--clr-white-60)', textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌿</div>
                <div style={{ fontWeight: 700 }}>Your garden is empty.</div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/garden')}>Visit Garden</button>
              </div>
            )}
            {activeTab === 'Achievements' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                {ACHIEVEMENTS.map((a, i) => {
                  const earned = (u2.xp || 0) >= (a.xpRequired || 999);
                  return (
                    <div key={i} className="glass-card" style={{ padding: 16, opacity: earned ? 1 : 0.4, textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 6 }}>{a.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }}>{a.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{a.description}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {activeTab === 'Activity' && (
              <div style={{ color: 'var(--clr-white-60)', textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
                <div style={{ fontWeight: 700 }}>No recent activity.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Column ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Search Users */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} style={{ color: 'var(--clr-green)' }} /> Find Gardeners
          </h4>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              placeholder="Search by @username or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.length === 0 ? (
                <div style={{ color: 'var(--clr-white-60)', fontSize: '0.8rem', textAlign: 'center', padding: 12 }}>No users found</div>
              ) : (
                searchResults.map(u => renderUserRow(u, 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))'))
              )}
            </div>
          )}
        </div>

        {/* Community — Discover Users */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 14 }}>🌍 Community Gardeners</h4>
          {loadingUsers && <div style={{ textAlign: 'center', color: 'var(--clr-white-60)', fontSize: '0.82rem' }}>Loading...</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
            {discoverUsers.slice(0, 12).map(u => renderUserRow(u, 'linear-gradient(135deg,var(--clr-lavender),var(--clr-gold))'))}
            {discoverUsers.length === 0 && !loadingUsers && (
              <div style={{ textAlign: 'center', color: 'var(--clr-white-60)', padding: 24, fontSize: '0.82rem' }}>
                No other gardeners found yet.
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 14 }}>🔐 {isOwnProfile ? 'Account Info' : `${u2.name}'s Info`}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-white-60)' }}>Email</span>
              <span style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u2.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-white-60)' }}>Joined</span>
              <span style={{ fontWeight: 600 }}>{u2.joinedAt ? new Date(u2.joinedAt).toLocaleDateString() : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-white-60)' }}>Level</span>
              <span style={{ fontWeight: 700, color: 'var(--clr-gold)' }}>⭐ Level {u2.level || 1}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-white-60)' }}>XP</span>
              <span style={{ fontWeight: 700, color: 'var(--clr-green)' }}>{u2.xp || 0} XP</span>
            </div>
          </div>
          {isOwnProfile && (
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 14, color: '#fca5a5', borderColor: 'rgba(252,165,165,0.3)' }} onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
