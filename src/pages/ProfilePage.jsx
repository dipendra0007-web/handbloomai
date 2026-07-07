import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ACHIEVEMENTS } from '../data/flowers';
import { getSocket } from '../hooks/useSocket';
import {
  Award, Share2, Edit2, Camera, X, MapPin, Link2, UserPlus, UserMinus,
  ShieldOff, Shield, MessageCircle, Search, Loader, CheckCircle, Users,
  Star, Radio, Heart, ChevronRight, BadgeCheck
} from 'lucide-react';

const PROFILE_TABS = ['Portfolio', 'Followers', 'Following', 'Achievements'];
const AVATAR_EMOJIS = ['🌸','🌺','🌻','🌹','🌷','🌼','🍀','🌿','🍃','🦋','🐝','🌙','⭐','🔮','🎨','🎭'];

function StatBox({ icon, value, label, onClick }) {
  return (
    <div onClick={onClick} style={{ textAlign: 'center', minWidth: 70, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.opacity = '0.75'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      <div style={{ fontSize: '0.8rem', marginBottom: 2 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: '1.3rem', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--clr-white-60)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function UserCard({ user, currentUser, onFollow, onMessage, navigateToProfile }) {
  const isFollowing = currentUser?.following?.includes(user.uid);
  const followsYou = user.following?.includes(currentUser?.uid) || user.followers?.includes(currentUser?.uid);

  return (
    <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div onClick={() => navigateToProfile(user.uid)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
        {user.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.avatarEmoji || '🌸'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span onClick={() => navigateToProfile(user.uid)} style={{ fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>{user.name}</span>
          {user.isCreator ? <BadgeCheck size={14} style={{ color: 'var(--clr-sky)', flexShrink: 0 }} /> : null}
          {user.isLive ? <span style={{ fontSize: '0.6rem', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>LIVE</span> : null}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{user.username}</span>
          {followsYou && !isFollowing && <span style={{ background: 'rgba(134,239,172,0.1)', color: 'var(--clr-green)', fontSize: '0.6rem', padding: '1px 6px', borderRadius: 6, border: '1px solid rgba(134,239,172,0.2)' }}>Follows you</span>}
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.isOnline ? 'var(--clr-green)' : '#555', display: 'inline-block' }}></span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {currentUser && user.uid !== currentUser.uid && (
          <>
            <button onClick={() => onMessage(user)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--clr-white-60)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <MessageCircle size={14} />
            </button>
            <button onClick={() => onFollow(user.uid)} style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${isFollowing ? 'rgba(239,68,68,0.3)' : 'rgba(134,239,172,0.3)'}`, background: isFollowing ? 'rgba(239,68,68,0.08)' : 'rgba(134,239,172,0.08)', color: isFollowing ? '#f87171' : 'var(--clr-green)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {isFollowing ? <><UserMinus size={12} /> Unfollow</> : followsYou ? <><UserPlus size={12} /> Follow Back</> : <><UserPlus size={12} /> Follow</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { currentUser, updateProfile, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const socket = getSocket();

  const viewUid = searchParams.get('uid');
  const [allUsers, setAllUsers] = useState([]);
  const isOwnProfile = !viewUid || viewUid === currentUser?.uid;
  const userToShow = isOwnProfile ? currentUser : (allUsers.find(u => u.uid === viewUid) || null);

  // ── Edit form state ────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('Portfolio');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [youtube, setYoutube] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🌸');
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── User search ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ── Followers lists ────────────────────────────────────────────────────────
  const [followers, setFollowers] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  // ── Creator apply ──────────────────────────────────────────────────────────
  const [creatorStatus, setCreatorStatus] = useState(null); // null | {status, requestedAt}
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [creatorReason, setCreatorReason] = useState('');
  const [creatorPortfolio, setCreatorPortfolio] = useState('');
  const [applyingCreator, setApplyingCreator] = useState(false);

  const fileRef = useRef(null);

  // ── Load users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const r = await fetch('/api/users');
      if (r.ok) setAllUsers(await r.json());
    } catch {} finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Load followers for viewed profile ──────────────────────────────────────
  const fetchFollowers = useCallback(async (uid) => {
    if (!uid) return;
    setLoadingFollowers(true);
    try {
      const r = await fetch(`/api/users/${uid}/followers`);
      if (r.ok) setFollowers(await r.json());
    } catch {} finally { setLoadingFollowers(false); }
  }, []);

  useEffect(() => {
    const uid = viewUid || currentUser?.uid;
    fetchFollowers(uid);
  }, [viewUid, currentUser?.uid, fetchFollowers]);

  // ── Load creator status ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOwnProfile || !currentUser?.uid) return;
    fetch(`/api/creator/status/${currentUser.uid}`)
      .then(r => r.json()).then(d => setCreatorStatus(d)).catch(() => {});
  }, [isOwnProfile, currentUser?.uid]);

  // ── Populate edit fields when userToShow changes ───────────────────────────
  useEffect(() => {
    if (!currentUser) return;
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
  }, [currentUser]);

  // ── Real-time socket sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onProfile = (u) => {
      setAllUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, ...u } : x));
      // Also refresh followers if the followed/follower changed
      const uid = viewUid || currentUser?.uid;
      if (u.uid === uid || u.following?.includes(uid) || u.followers?.includes(uid)) {
        fetchFollowers(uid);
      }
    };
    const onCreatorApproved = ({ uid }) => {
      if (uid === currentUser?.uid) setCreatorStatus({ status: 'approved' });
    };
    const onCreatorRejected = ({ uid }) => {
      if (uid === currentUser?.uid) setCreatorStatus({ status: 'rejected' });
    };
    socket.on('user:profileUpdated', onProfile);
    socket.on('user:registered', u => setAllUsers(prev => [...prev.filter(x => x.uid !== u.uid), u]));
    socket.on('user:deleted', ({ uid }) => setAllUsers(prev => prev.filter(x => x.uid !== uid)));
    socket.on('user:online', ({ uid }) => setAllUsers(prev => prev.map(x => x.uid === uid ? { ...x, isOnline: true } : x)));
    socket.on('user:offline', ({ uid }) => setAllUsers(prev => prev.map(x => x.uid === uid ? { ...x, isOnline: false } : x)));
    socket.on('creator:approved', onCreatorApproved);
    socket.on('creator:rejected', onCreatorRejected);
    return () => {
      socket.off('user:profileUpdated', onProfile);
      socket.off('creator:approved', onCreatorApproved);
      socket.off('creator:rejected', onCreatorRejected);
    };
  }, [socket, viewUid, currentUser?.uid, fetchFollowers]);

  // ── Search ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      allUsers.filter(u => u.uid !== currentUser?.uid &&
        (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)))
        .slice(0, 10)
    );
  }, [searchQuery, allUsers, currentUser?.uid]);

  // ── Follow ─────────────────────────────────────────────────────────────────
  const handleFollow = async (targetUid) => {
    if (!isLoggedIn) { navigate('/auth'); return; }
    try {
      await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.uid, followedId: targetUid }),
      });
      fetchUsers();
      fetchFollowers(viewUid || currentUser?.uid);
    } catch {}
  };

  // ── Message ────────────────────────────────────────────────────────────────
  const handleMessage = (user) => {
    navigate(`/messages?uid=${user.uid}`);
  };

  // ── Navigate to user profile ───────────────────────────────────────────────
  const navigateToProfile = (uid) => {
    navigate(`/profile?uid=${uid}`);
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const result = await updateProfile({ name, username, email, bio, location, website, instagram, twitter, github, youtube, avatarEmoji, avatar, hobbies });
      if (result?.error) { setErrorMsg(result.error); }
      else { setEditing(false); setSuccessMsg('Profile saved!'); setTimeout(() => setSuccessMsg(''), 3000); }
    } catch (e) { setErrorMsg(e.message); }
    setSaving(false);
  };

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Apply creator ──────────────────────────────────────────────────────────
  const handleCreatorApply = async () => {
    if (!creatorReason.trim()) return;
    setApplyingCreator(true);
    try {
      const r = await fetch('/api/creator/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid, reason: creatorReason, portfolio: creatorPortfolio }),
      });
      const d = await r.json();
      if (r.ok) { setCreatorStatus({ status: 'pending', requestedAt: new Date().toISOString() }); setShowCreatorModal(false); }
      else { setErrorMsg(d.error); }
    } catch (e) { setErrorMsg(e.message); }
    setApplyingCreator(false);
  };

  // ── Guard: if not own profile and user not found ───────────────────────────
  if (!currentUser && !isOwnProfile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, paddingTop: 80 }}>
        <div style={{ fontSize: '3rem' }}>🔒</div>
        <h2 style={{ fontWeight: 800 }}>Login Required</h2>
        <button className="btn btn-primary" onClick={() => navigate('/auth')}>Login</button>
      </div>
    );
  }

  const displayUser = userToShow;
  const followingList = displayUser?.following || [];
  const isFollowingViewed = !isOwnProfile && currentUser?.following?.includes(viewUid);
  const viewedFollowsMe = !isOwnProfile && (allUsers.find(u => u.uid === viewUid)?.following?.includes(currentUser?.uid));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 80 }}>

      {/* Creator Modal */}
      {showCreatorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
          <div className="glass-card" style={{ padding: 32, maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BadgeCheck size={20} style={{ color: 'var(--clr-sky)' }} /> Apply for Creator Verification
              </h3>
              <button onClick={() => setShowCreatorModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--clr-white-60)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ color: 'var(--clr-white-60)', fontSize: '0.85rem', marginBottom: 20 }}>Tell us why you should be a verified creator on HandBloom AI. Admin will review your application.</p>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Why do you want to be a creator? *</label>
              <textarea className="form-input" rows={3} placeholder="I create floral art and grow rare plants..." value={creatorReason} onChange={e => setCreatorReason(e.target.value)} style={{ resize: 'vertical', minHeight: 80 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Portfolio / Social Link (optional)</label>
              <input className="form-input" placeholder="https://instagram.com/yourhandle" value={creatorPortfolio} onChange={e => setCreatorPortfolio(e.target.value)} />
            </div>
            {errorMsg && <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: 12 }}>{errorMsg}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreatorModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreatorApply} disabled={applyingCreator || !creatorReason.trim()} style={{ flex: 1 }}>
                {applyingCreator ? '⏳ Sending...' : '🚀 Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Profile Header ────────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: 32, marginBottom: 24, position: 'relative' }}>
          {successMsg && (
            <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(134,239,172,0.15)', border: '1px solid rgba(134,239,172,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8rem', color: 'var(--clr-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', overflow: 'hidden', border: '3px solid var(--clr-green)', position: 'relative' }}>
                {(editing ? avatar : displayUser?.avatar) ? (
                  <img src={editing ? avatar : displayUser?.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (editing ? avatarEmoji : displayUser?.avatarEmoji) || '🌸'}
                {displayUser?.isLive && !editing && (
                  <div style={{ position: 'absolute', inset: 0, border: '3px solid #ef4444', borderRadius: '50%', animation: 'pulse 1.5s ease infinite' }}></div>
                )}
              </div>
              {isOwnProfile && editing && (
                <>
                  <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--clr-green)', border: 'none', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={13} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>
                  {displayUser?.name || 'Unknown'}
                </h1>
                {displayUser?.isCreator ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 999, padding: '2px 10px', fontSize: '0.7rem', color: 'var(--clr-sky)', fontWeight: 700 }}>
                    <BadgeCheck size={11} /> Verified Creator
                  </span>
                ) : null}
                {displayUser?.role === 'admin' ? (
                  <span style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 999, padding: '2px 10px', fontSize: '0.7rem', color: '#c084fc', fontWeight: 700 }}>👑 Admin</span>
                ) : null}
                {displayUser?.isLive ? (
                  <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700, animation: 'pulse 1.5s ease infinite' }}>🔴 LIVE</span>
                ) : null}
              </div>
              <div style={{ color: 'var(--clr-white-60)', fontSize: '0.85rem', marginBottom: 8 }}>{displayUser?.username}</div>
              {displayUser?.bio && <p style={{ color: 'var(--clr-white-80)', fontSize: '0.85rem', marginBottom: 8, lineHeight: 1.5 }}>{displayUser.bio}</p>}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--clr-white-60)' }}>
                {displayUser?.location && <span><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{displayUser.location}</span>}
                {displayUser?.website && <a href={displayUser.website} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-sky)', display: 'flex', alignItems: 'center', gap: 4 }}><Link2 size={12} /> {displayUser.website}</a>}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              {isOwnProfile ? (
                <>
                  <button className="btn btn-primary" onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving} style={{ minWidth: 120 }}>
                    {saving ? <Loader size={14} className="spin" /> : editing ? '💾 Save' : <><Edit2 size={14} /> Edit Profile</>}
                  </button>
                  {editing && <button className="btn btn-secondary" onClick={() => { setEditing(false); setErrorMsg(''); }} style={{ minWidth: 120 }}>Cancel</button>}
                  {/* Creator apply button */}
                  {!currentUser?.isCreator && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => { setCreatorReason(''); setCreatorPortfolio(''); setShowCreatorModal(true); }}
                      disabled={creatorStatus?.status === 'pending'}
                      style={{ minWidth: 120, fontSize: '0.78rem', borderColor: creatorStatus?.status === 'pending' ? 'rgba(251,191,36,0.3)' : undefined, color: creatorStatus?.status === 'pending' ? '#fbbf24' : undefined }}
                    >
                      {creatorStatus?.status === 'pending' ? '⏳ Application Pending' :
                       creatorStatus?.status === 'rejected' ? '🔄 Re-apply Creator' :
                       <><BadgeCheck size={13} /> Apply as Creator</>}
                    </button>
                  )}
                  {currentUser?.isCreator && !displayUser?.isLive && (
                    <button className="btn btn-secondary" onClick={() => navigate('/live')} style={{ minWidth: 120, fontSize: '0.78rem', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
                      <Radio size={13} /> Go Live
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => handleFollow(viewUid)} style={{ minWidth: 120 }}>
                    {isFollowingViewed ? <><UserMinus size={14} /> Unfollow</> : viewedFollowsMe ? <><UserPlus size={14} /> Follow Back</> : <><UserPlus size={14} /> Follow</>}
                  </button>
                  {currentUser && (
                    <button className="btn btn-secondary" onClick={() => navigate(`/messages?uid=${viewUid}`)} style={{ minWidth: 120 }}>
                      <MessageCircle size={14} /> Message
                    </button>
                  )}
                  {displayUser?.isLive && (
                    <button className="btn btn-secondary" onClick={() => navigate(`/live/${viewUid}`)} style={{ minWidth: 120, borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
                      <Radio size={13} /> Watch Live
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 28, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
            <StatBox icon="🌸" value={displayUser?.flowers || 0} label="Flowers" />
            <StatBox icon="❤️" value={displayUser?.likes || 0} label="Likes" />
            <StatBox icon="⭐" value={`Lv.${displayUser?.level || 1}`} label={`${displayUser?.xp || 0} XP`} />
            <StatBox icon="👥" value={followers.length} label="Followers" onClick={() => setActiveTab('Followers')} />
            <StatBox icon="➡️" value={followingList.length} label="Following" onClick={() => setActiveTab('Following')} />
          </div>

          {/* Social links */}
          {(displayUser?.instagram || displayUser?.twitter || displayUser?.github || displayUser?.youtube) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {displayUser.instagram && <a href={`https://instagram.com/${displayUser.instagram}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 8, color: '#f472b6', textDecoration: 'none' }}>📸 @{displayUser.instagram}</a>}
              {displayUser.twitter && <a href={`https://twitter.com/${displayUser.twitter}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, color: '#38bdf8', textDecoration: 'none' }}>🐦 @{displayUser.twitter}</a>}
              {displayUser.github && <a href={`https://github.com/${displayUser.github}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#e2e8f0', textDecoration: 'none' }}>💻 {displayUser.github}</a>}
              {displayUser.youtube && <a href={`https://youtube.com/${displayUser.youtube}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', textDecoration: 'none' }}>📺 YouTube</a>}
            </div>
          )}

          {/* Hobbies */}
          {displayUser?.hobbies && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {displayUser.hobbies.split(',').map(h => h.trim()).filter(Boolean).map((h, i) => (
                <span key={i} style={{ fontSize: '0.7rem', padding: '3px 10px', background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, color: 'var(--clr-green)' }}>🏷️ {h}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── EDIT FORM ──────────────────────────────────────────────────────── */}
        {isOwnProfile && editing && (
          <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 20, fontSize: '1rem' }}>✏️ Edit Your Profile</h3>
            {errorMsg && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.83rem' }}>{errorMsg}</div>}

            {/* Avatar emoji picker */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Avatar Emoji</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AVATAR_EMOJIS.map(e => (
                  <button key={e} onClick={() => { setAvatarEmoji(e); setAvatar(null); }}
                    style={{ width: 38, height: 38, borderRadius: 8, border: `2px solid ${avatarEmoji === e && !avatar ? 'var(--clr-green)' : 'transparent'}`, background: 'rgba(255,255,255,0.06)', fontSize: '1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={username} onChange={e => setUsername(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Location</label><input className="form-input" placeholder="City, Country" value={location} onChange={e => setLocation(e.target.value)} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Bio</label><textarea className="form-input" rows={2} value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} /></div>
              <div className="form-group"><label className="form-label">Website</label><input className="form-input" placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Hobbies (comma separated)</label><input className="form-input" placeholder="Gardening, Photography..." value={hobbies} onChange={e => setHobbies(e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--clr-white-60)', marginBottom: 10 }}>🔗 Social Media</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">📸 Instagram handle</label><input className="form-input" placeholder="yourhandle" value={instagram} onChange={e => setInstagram(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">🐦 Twitter/X handle</label><input className="form-input" placeholder="yourhandle" value={twitter} onChange={e => setTwitter(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">💻 GitHub username</label><input className="form-input" placeholder="yourusername" value={github} onChange={e => setGithub(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">📺 YouTube channel</label><input className="form-input" placeholder="channel name/ID" value={youtube} onChange={e => setYoutube(e.target.value)} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => { setEditing(false); setErrorMsg(''); }} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? <><Loader size={14} className="spin" /> Saving...</> : '💾 Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ── TABS ──────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: '1px solid var(--glass-border)' }}>
          {PROFILE_TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', background: activeTab === t ? 'var(--clr-green)' : 'transparent', color: activeTab === t ? '#000' : 'var(--clr-white-60)', fontWeight: activeTab === t ? 800 : 500, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }}>
              {t === 'Followers' ? `Followers (${followers.length})` : t === 'Following' ? `Following (${followingList.length})` : t}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ───────────────────────────────────────────────────── */}

        {/* Portfolio */}
        {activeTab === 'Portfolio' && (
          <div>
            {/* User search (own profile only) */}
            {isOwnProfile && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-40)' }} />
                  <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search users by name or @username..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {searchResults.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {searchResults.map(u => (
                      <UserCard key={u.uid} user={u} currentUser={currentUser} onFollow={handleFollow} onMessage={handleMessage} navigateToProfile={navigateToProfile} />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌸</div>
              <p style={{ color: 'var(--clr-white-60)', fontSize: '0.9rem' }}>
                {isOwnProfile ? 'Your garden creations will appear here.' : `${displayUser?.name}'s garden creations will appear here.`}
              </p>
            </div>
          </div>
        )}

        {/* Followers */}
        {activeTab === 'Followers' && (
          <div>
            {loadingFollowers ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--clr-white-60)' }}><Loader size={24} className="spin" /></div>
            ) : followers.length === 0 ? (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>👥</div>
                <p style={{ color: 'var(--clr-white-60)', fontSize: '0.9rem' }}>No followers yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {followers.map(u => (
                  <UserCard key={u.uid} user={{...u, ...(allUsers.find(x => x.uid === u.uid) || {})}} currentUser={currentUser} onFollow={handleFollow} onMessage={handleMessage} navigateToProfile={navigateToProfile} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Following */}
        {activeTab === 'Following' && (
          <div>
            {followingList.length === 0 ? (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>➡️</div>
                <p style={{ color: 'var(--clr-white-60)', fontSize: '0.9rem' }}>Not following anyone yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {followingList.map(uid => {
                  const u = allUsers.find(x => x.uid === uid);
                  if (!u) return null;
                  return <UserCard key={uid} user={u} currentUser={currentUser} onFollow={handleFollow} onMessage={handleMessage} navigateToProfile={navigateToProfile} />;
                })}
              </div>
            )}
          </div>
        )}

        {/* Achievements */}
        {activeTab === 'Achievements' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {(ACHIEVEMENTS || []).map((ach, i) => (
              <div key={i} className="glass-card" style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{ach.icon || '🏆'}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{ach.title || ach.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{ach.desc || ach.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
