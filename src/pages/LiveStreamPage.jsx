import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { getSocket } from '../hooks/useSocket';
import {
  Video, VideoOff, Mic, MicOff, StopCircle, Send,
  Gift, Users, Eye, Camera, AlertCircle, CheckCircle,
} from 'lucide-react';

// ─── Gifts ────────────────────────────────────────────────────────────────────
const GIFTS = [
  { id: 'rose',    emoji: '🌹', label: 'Rose',     color: '#f43f5e' },
  { id: 'flower',  emoji: '🌸', label: 'Bloom',    color: '#ec4899' },
  { id: 'sun',     emoji: '🌻', label: 'Sunflower', color: '#f59e0b' },
  { id: 'star',    emoji: '⭐', label: 'Star',     color: '#eab308' },
  { id: 'fire',    emoji: '🔥', label: 'Fire',     color: '#f97316' },
  { id: 'heart',   emoji: '💖', label: 'Heart',    color: '#ec4899' },
  { id: 'diamond', emoji: '💎', label: 'Diamond',  color: '#38bdf8' },
  { id: 'crown',   emoji: '👑', label: 'Crown',    color: '#a855f7' },
];

// ─── WebRTC STUN config ────────────────────────────────────────────────────────
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// ─── Global page styles injected once ─────────────────────────────────────────
const PAGE_STYLES = `
  @keyframes giftPop {
    0%   { opacity:0; transform:translate(-50%,-50%) scale(0.5); }
    20%  { opacity:1; transform:translate(-50%,-60%) scale(1.3); }
    70%  { opacity:1; transform:translate(-50%,-70%) scale(1); }
    100% { opacity:0; transform:translate(-50%,-90%) scale(0.8); }
  }
  @keyframes slideInComment {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes livePulse {
    0%,100% { opacity:1; }
    50%      { opacity:0.4; }
  }
`;

export default function LiveStreamPage() {
  const { uid: viewerTargetUid } = useParams();
  const { currentUser, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const socket = getSocket();

  // ── Mode ───────────────────────────────────────────────────────────────────
  // 'lobby' | 'streamer' | 'viewer' | 'ended'
  const [mode, setMode] = useState(viewerTargetUid ? 'viewer' : 'lobby');
  const [streamerUid, setStreamerUid] = useState(viewerTargetUid || null);

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [activeStreams, setActiveStreams] = useState([]);
  const [comments, setComments]           = useState([]);
  const [giftFlash, setGiftFlash]         = useState(null);
  const [viewers, setViewers]             = useState(0);
  const [commentText, setCommentText]     = useState('');
  const commentsEndRef = useRef(null);

  // ── Streamer ───────────────────────────────────────────────────────────────
  const [streamTitle, setStreamTitle]   = useState('');
  const [camPermission, setCamPermission] = useState('idle'); // idle | requesting | granted | denied
  const [isMuted, setIsMuted]           = useState(false);
  const [camOff, setCamOff]             = useState(false);
  const [isStreaming, setIsStreaming]   = useState(false);

  // Keep these in refs so event handlers always see latest value without stale closures
  const localStreamRef  = useRef(null);
  const peersRef        = useRef(new Map()); // viewerUid → RTCPeerConnection
  const localVideoRef   = useRef(null);      // <video> for streamer view
  const lobbyVideoRef   = useRef(null);      // <video> for lobby preview

  // ── Viewer ─────────────────────────────────────────────────────────────────
  const [viewerStreamInfo, setViewerStreamInfo] = useState(null);
  const remoteVideoRef = useRef(null);
  const peerRef        = useRef(null);

  // Keep mode in a ref so WebRTC callbacks see current mode without stale closure
  const modeRef        = useRef(mode);
  const streamerUidRef = useRef(streamerUid);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { streamerUidRef.current = streamerUid; }, [streamerUid]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch active streams for lobby
  // ─────────────────────────────────────────────────────────────────────────
  const fetchStreams = useCallback(async () => {
    try {
      const r = await fetch('/api/live/active');
      if (r.ok) setActiveStreams(await r.json());
    } catch {}
  }, []);

  // Poll every 15s so lobby always stays fresh (fallback for missed socket events)
  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 15000);
    return () => clearInterval(interval);
  }, [fetchStreams]);

  // ─────────────────────────────────────────────────────────────────────────
  // When the lobby preview video element mounts, attach the stream
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (lobbyVideoRef.current && localStreamRef.current) {
      lobbyVideoRef.current.srcObject = localStreamRef.current;
    }
  });

  // When entering streamer mode, bind local stream to streamer video tag
  useEffect(() => {
    if (mode === 'streamer' && localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [mode]);

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-join viewer mode when URL has /:uid (also re-join on socket reconnect)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewerTargetUid || !isLoggedIn || !socket) return;
    const joinStream = () => {
      setMode('viewer');
      setStreamerUid(viewerTargetUid);
      socket.emit('live:join', { streamerUid: viewerTargetUid });
      socket.emit('webrtc:join-relay', { streamerUid: viewerTargetUid });
    };
    joinStream();
    // Re-join on socket reconnect (e.g. brief network blip)
    socket.on('connect', joinStream);
    return () => socket.off('connect', joinStream);
  }, [viewerTargetUid, isLoggedIn, socket]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: Attach remote stream to the <video> tag
  // ─────────────────────────────────────────────────────────────────────────
  const attachRemoteStream = useCallback((stream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // WebRTC peer cleanup helpers
  // ─────────────────────────────────────────────────────────────────────────
  const cleanupViewerPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const cleanupStreamerPeers = useCallback(() => {
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Main Socket.IO / WebRTC event listeners
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // ── Chat / metadata ────────────────────────────────────────────────────
    const onComment = (data) =>
      setComments(prev => [...prev.slice(-99), data]);

    const onGift = (data) => {
      setGiftFlash(data);
      setComments(prev => [...prev.slice(-99), {
        ...data, text: `sent a ${data.gift.label} ${data.gift.emoji}`, isGift: true,
      }]);
      setTimeout(() => setGiftFlash(null), 2500);
    };

    const onViewerCount = ({ streamerUid: uid, count }) => {
      if (uid === streamerUidRef.current) setViewers(count);
    };

    const onJoined = (info) => setViewerStreamInfo(info);

    const onEnded = ({ streamerUid: uid }) => {
      if (uid === streamerUidRef.current) {
        setMode('ended');
        cleanupViewerPeer();
      }
    };

    const onStarted = (stream) => {
      // Upsert: update viewer count if stream already in list, else add it
      setActiveStreams(prev => {
        const exists = prev.find(s => s.streamerUid === stream.uid);
        if (exists) {
          return prev.map(s => s.streamerUid === stream.uid ? { ...s, ...stream, streamerUid: stream.uid } : s);
        }
        return [...prev, { ...stream, streamerUid: stream.uid }];
      });
      // Also refresh from server to get accurate viewer counts
      fetchStreams();
    };

    const onStopped = ({ uid }) => {
      setActiveStreams(prev => prev.filter(s => s.streamerUid !== uid));
      fetchStreams(); // Re-sync from server
    };

    const onNotFound = () => {
      // Stream the viewer tried to join doesn't exist — back to lobby
      console.warn('[Viewer] live:notFound — stream does not exist');
      setMode('lobby');
      setStreamerUid(null);
      navigate('/live');
      fetchStreams();
    };

    // ── Streamer: a new viewer joined the relay ────────────────────────────
    const onViewerJoined = async ({ viewerUid }) => {
      if (!localStreamRef.current) return;
      console.log(`📡 [Streamer] Creating offer for viewer: ${viewerUid}`);

      // Close existing peer for this viewer if any
      if (peersRef.current.has(viewerUid)) {
        peersRef.current.get(viewerUid).close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peersRef.current.set(viewerUid, pc);

      // Push all local tracks into the peer connection
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('webrtc:candidate', { toUid: viewerUid, candidate: e.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`📡 [Streamer→${viewerUid}] state: ${pc.connectionState}`);
      };

      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', { toUid: viewerUid, offer: pc.localDescription });
        console.log(`📡 [Streamer] Offer sent to ${viewerUid}`);
      } catch (err) {
        console.error('[Streamer] createOffer failed:', err);
      }
    };

    // ── Viewer: received offer from streamer ───────────────────────────────
    const onWebRTCOffer = async ({ fromUid, offer }) => {
      console.log(`📡 [Viewer] Offer received from streamer: ${fromUid}`);
      cleanupViewerPeer();

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerRef.current = pc;

      pc.ontrack = (e) => {
        console.log(`📺 [Viewer] ontrack fired, streams:`, e.streams.length);
        if (e.streams && e.streams[0]) {
          attachRemoteStream(e.streams[0]);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('webrtc:candidate', { toUid: fromUid, candidate: e.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`📡 [Viewer] connection state: ${pc.connectionState}`);
      };

      pc.onicegatheringstatechange = () => {
        console.log(`📡 [Viewer] ICE gathering state: ${pc.iceGatheringState}`);
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { toUid: fromUid, answer: pc.localDescription });
        console.log(`📡 [Viewer] Answer sent to ${fromUid}`);
      } catch (err) {
        console.error('[Viewer] handleOffer failed:', err);
      }
    };

    // ── Streamer: received answer from viewer ──────────────────────────────
    const onWebRTCAnswer = async ({ fromUid, answer }) => {
      console.log(`📡 [Streamer] Answer received from viewer: ${fromUid}`);
      const pc = peersRef.current.get(fromUid);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(`📡 [Streamer] Remote description set for ${fromUid}`);
        } catch (err) {
          console.error('[Streamer] setRemoteDescription failed:', err);
        }
      } else {
        console.warn(`[Streamer] No peer found for ${fromUid}`);
      }
    };

    // ── ICE Candidate relay ────────────────────────────────────────────────
    const onWebRTCCandidate = async ({ fromUid, candidate }) => {
      const m = modeRef.current;
      if (m === 'streamer') {
        const pc = peersRef.current.get(fromUid);
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
          catch (e) { console.warn('[Streamer] ICE ignored:', e.message); }
        }
      } else if (m === 'viewer') {
        const pc = peerRef.current;
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
          catch (e) { console.warn('[Viewer] ICE ignored:', e.message); }
        }
      }
    };

    socket.on('live:comment',         onComment);
    socket.on('live:gift',             onGift);
    socket.on('live:viewerCount',      onViewerCount);
    socket.on('live:joined',           onJoined);
    socket.on('live:ended',            onEnded);
    socket.on('live:started',          onStarted);
    socket.on('live:stopped',          onStopped);
    socket.on('live:notFound',         onNotFound);
    socket.on('webrtc:viewer-joined',  onViewerJoined);
    socket.on('webrtc:offer',          onWebRTCOffer);
    socket.on('webrtc:answer',         onWebRTCAnswer);
    socket.on('webrtc:candidate',      onWebRTCCandidate);

    return () => {
      socket.off('live:comment',         onComment);
      socket.off('live:gift',            onGift);
      socket.off('live:viewerCount',     onViewerCount);
      socket.off('live:joined',          onJoined);
      socket.off('live:ended',           onEnded);
      socket.off('live:started',         onStarted);
      socket.off('live:stopped',         onStopped);
      socket.off('live:notFound',        onNotFound);
      socket.off('webrtc:viewer-joined', onViewerJoined);
      socket.off('webrtc:offer',         onWebRTCOffer);
      socket.off('webrtc:answer',        onWebRTCAnswer);
      socket.off('webrtc:candidate',     onWebRTCCandidate);
    };
  }, [socket, cleanupViewerPeer, attachRemoteStream, fetchStreams, navigate]);

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-scroll chat
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // ─────────────────────────────────────────────────────────────────────────
  // Camera permission
  // ─────────────────────────────────────────────────────────────────────────
  const requestCamera = async () => {
    setCamPermission('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      // Attach to lobby preview
      if (lobbyVideoRef.current) {
        lobbyVideoRef.current.srcObject = stream;
      }
      setCamPermission('granted');
    } catch (err) {
      console.error('Camera/mic error:', err);
      setCamPermission('denied');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Stream controls
  // ─────────────────────────────────────────────────────────────────────────
  const startStream = () => {
    if (!streamTitle.trim() || !socket || !localStreamRef.current) return;
    setIsStreaming(true);
    setMode('streamer');
    setStreamerUid(currentUser.uid);
    setComments([]);
    socket.emit('live:start', {
      title: streamTitle.trim(),
      streamerName: currentUser.name,
      streamerAvatar: currentUser.avatar || null,
    });
  };

  const stopStream = () => {
    if (socket) socket.emit('live:stop');
    cleanupStreamerPeers();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setIsStreaming(false);
    setMode('lobby');
    setComments([]);
    setViewers(0);
    setCamPermission('idle');
    fetchStreams();
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    setIsMuted(m => !m);
  };

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = camOff; });
    setCamOff(c => !c);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Chat / Gift actions
  // ─────────────────────────────────────────────────────────────────────────
  const sendComment = (e) => {
    e?.preventDefault();
    if (!commentText.trim() || !socket || !streamerUid) return;
    socket.emit('live:comment', {
      streamerUid,
      text: commentText.trim(),
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderEmoji: currentUser.avatarEmoji || '🌸',
    });
    setCommentText('');
  };

  const sendGift = (gift) => {
    if (!socket || !streamerUid || !isLoggedIn) return;
    socket.emit('live:gift', {
      streamerUid,
      gift,
      senderName: currentUser.name,
      senderEmoji: currentUser.avatarEmoji || '🌸',
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation helpers
  // ─────────────────────────────────────────────────────────────────────────
  const watchStream = (uid) => {
    if (!isLoggedIn) { navigate('/auth'); return; }
    setMode('viewer');
    setStreamerUid(uid);
    setComments([]);
    navigate(`/live/${uid}`);
    if (socket) {
      socket.emit('live:join', { streamerUid: uid });
      socket.emit('webrtc:join-relay', { streamerUid: uid });
    }
  };

  const leaveStream = () => {
    if (socket && streamerUid) socket.emit('live:leave', { streamerUid });
    cleanupViewerPeer();
    setMode('lobby');
    setStreamerUid(null);
    setComments([]);
    navigate('/live');
    fetchStreams();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Guards
  // ─────────────────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 100 }}>
        <style>{PAGE_STYLES}</style>
        <div style={{ fontSize: '4rem' }}>🔴</div>
        <h2 style={{ fontWeight: 900, fontSize: '1.8rem' }}>Login to Go Live</h2>
        <p style={{ color: 'var(--clr-white-60)', textAlign: 'center', maxWidth: 340 }}>
          You need to be logged in to stream or watch live content.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/auth')}>Login / Register</button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STREAMER VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'streamer') {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 80, display: 'flex', gap: 0 }}>
        <style>{PAGE_STYLES}</style>

        {/* ── Camera feed ── */}
        <div style={{ flex: 1, position: 'relative', background: '#000', minHeight: 'calc(100vh - 80px)' }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {camOff && (
            <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <VideoOff size={48} style={{ color: 'var(--clr-white-60)' }} />
              <p style={{ color: 'var(--clr-white-60)' }}>Camera Off</p>
            </div>
          )}

          {/* Gift flash */}
          {giftFlash && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '5rem', animation: 'giftPop 2.5s ease forwards', pointerEvents: 'none', zIndex: 10, textAlign: 'center' }}>
              <div>{giftFlash.gift?.emoji}</div>
              <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, marginTop: 8 }}>
                {giftFlash.senderName} sent a {giftFlash.gift?.label}!
              </div>
            </div>
          )}

          {/* Top bar */}
          <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#ef4444', color: '#fff', padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: '0.75rem', letterSpacing: 1, animation: 'livePulse 1.5s ease infinite' }}>
                🔴 LIVE
              </span>
              <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem' }}>
                {streamTitle}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 999 }}>
              <Eye size={14} style={{ color: '#fff' }} />
              <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>{viewers}</span>
            </div>
          </div>

          {/* Bottom controls */}
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 12, zIndex: 5 }}>
            <button onClick={toggleMic} style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button onClick={toggleCam} style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: camOff ? '#ef4444' : 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              {camOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
            <button onClick={stopStream} style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <StopCircle size={22} />
            </button>
          </div>
        </div>

        {/* Chat sidebar */}
        <ChatSidebar
          comments={comments}
          commentText={commentText}
          setCommentText={setCommentText}
          sendComment={sendComment}
          sendGift={sendGift}
          commentsEndRef={commentsEndRef}
          isLoggedIn={isLoggedIn}
          streamerUid={streamerUid}
          currentUser={currentUser}
          viewers={viewers}
          mode="streamer"
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEWER VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'viewer') {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 80, display: 'flex', gap: 0 }}>
        <style>{PAGE_STYLES}</style>

        {/* ── Remote video stream ── */}
        <div style={{ flex: 1, position: 'relative', background: '#000', minHeight: 'calc(100vh - 80px)' }}>
          {/* Black placeholder while connecting */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, zIndex: 1, pointerEvents: 'none' }}>
            <div style={{ fontSize: '2rem' }}>📡</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Connecting to live stream…</p>
          </div>

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', zIndex: 2 }}
          />

          {/* Gift flash */}
          {giftFlash && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '5rem', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ animation: 'giftPop 2.5s ease forwards' }}>{giftFlash.gift?.emoji}</div>
              <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, marginTop: 8 }}>
                {giftFlash.senderName} sent a {giftFlash.gift?.label}!
              </div>
            </div>
          )}

          {/* Top bar */}
          <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
            <button
              onClick={leaveStream}
              style={{ fontSize: '0.8rem', padding: '6px 14px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, cursor: 'pointer' }}
            >
              ← Leave
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#ef4444', color: '#fff', padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: '0.75rem', animation: 'livePulse 1.5s ease infinite' }}>
                🔴 LIVE
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 999 }}>
                <Eye size={14} style={{ color: '#fff' }} />
                <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>{viewers} watching</span>
              </div>
            </div>
          </div>

          {/* Stream info HUD */}
          <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(0,0,0,0.5)', padding: '12px 18px', borderRadius: 14, border: '1px solid var(--glass-border)', color: '#fff', zIndex: 5 }}>
            <h4 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '0.95rem' }}>
              {viewerStreamInfo?.title || 'Live Stream'}
            </h4>
            <div style={{ fontSize: '0.78rem', color: 'var(--clr-white-80)' }}>
              Streaming by {viewerStreamInfo?.streamerName}
            </div>
          </div>
        </div>

        <ChatSidebar
          comments={comments}
          commentText={commentText}
          setCommentText={setCommentText}
          sendComment={sendComment}
          sendGift={sendGift}
          commentsEndRef={commentsEndRef}
          isLoggedIn={isLoggedIn}
          streamerUid={streamerUid}
          currentUser={currentUser}
          viewers={viewers}
          mode="viewer"
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STREAM ENDED
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'ended') {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <style>{PAGE_STYLES}</style>
        <div style={{ fontSize: '4rem' }}>🌸</div>
        <h2 style={{ fontWeight: 900 }}>Stream Ended</h2>
        <p style={{ color: 'var(--clr-white-60)' }}>The streamer has ended this live.</p>
        <button className="btn btn-primary" onClick={() => { setMode('lobby'); navigate('/live'); fetchStreams(); }}>
          Back to Live Hub
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOBBY
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', paddingTop: 90, paddingBottom: 80, maxWidth: 1100, margin: '0 auto', padding: '90px 24px 80px' }}>
      <style>{PAGE_STYLES}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 999, padding: '6px 20px', marginBottom: 20 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'livePulse 1.5s ease infinite' }} />
          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>LIVE HUB</span>
        </div>
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: 12 }}>Go Live or Watch Now</h1>
        <p style={{ color: 'var(--clr-white-60)', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>
          Stream your garden journey, watch other creators live, send gifts and comment in real time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* ── Start Stream Panel ── */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={20} style={{ color: 'var(--clr-green)' }} /> Start Your Stream
          </h3>

          {camPermission === 'idle' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📷</div>
              <p style={{ color: 'var(--clr-white-60)', marginBottom: 20, fontSize: '0.9rem' }}>
                We need access to your camera and microphone to go live.
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={requestCamera}>
                <Camera size={16} /> Allow Camera &amp; Mic
              </button>
            </div>
          )}

          {camPermission === 'requesting' && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--clr-white-60)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              <p>Waiting for camera permission…</p>
            </div>
          )}

          {camPermission === 'denied' && (
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12 }}>
              <AlertCircle size={32} style={{ color: '#f87171', marginBottom: 8 }} />
              <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: 12 }}>
                Camera access denied. Please allow it in your browser settings.
              </p>
              <button className="btn btn-secondary" onClick={requestCamera}>Try Again</button>
            </div>
          )}

          {camPermission === 'granted' && (
            <>
              {/* Live preview */}
              <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
                <video
                  ref={lobbyVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CheckCircle size={16} style={{ color: 'var(--clr-green)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-green)' }}>Camera &amp; mic ready</span>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Stream Title *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Growing my first orchid 🌸"
                  value={streamTitle}
                  onChange={e => setStreamTitle(e.target.value)}
                  maxLength={80}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', background: 'linear-gradient(135deg,#ef4444,#f97316)' }}
                onClick={startStream}
                disabled={!streamTitle.trim()}
              >
                🔴 Go Live
              </button>
            </>
          )}
        </div>

        {/* ── Active Streams ── */}
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={20} style={{ color: 'var(--clr-lavender)' }} />
            Live Now
            {activeStreams.length > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                {activeStreams.length}
              </span>
            )}
          </h3>

          {activeStreams.length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌙</div>
              <p style={{ color: 'var(--clr-white-60)', fontSize: '0.9rem' }}>
                No active streams right now.<br />Be the first to go live!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeStreams.map(stream => (
                <div
                  key={stream.streamerUid}
                  className="glass-card"
                  style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => watchStream(stream.streamerUid)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                      {stream.streamerAvatar
                        ? <img src={stream.streamerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : stream.streamerEmoji || '🌸'}
                      <span style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, background: '#ef4444', borderRadius: '50%', border: '2px solid #0a0a0a' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stream.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-white-60)' }}>{stream.streamerName}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700 }}>LIVE</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--clr-white-60)' }}>
                        <Eye size={11} style={{ display: 'inline', marginRight: 3 }} />
                        {stream.viewers}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chat Sidebar ───────────────────────────────────────────────────────────────
function ChatSidebar({ comments, commentText, setCommentText, sendComment, sendGift, commentsEndRef, isLoggedIn, streamerUid, currentUser, viewers, mode }) {
  const [showGifts, setShowGifts] = useState(false);

  return (
    <div style={{ width: 340, flexShrink: 0, background: 'rgba(10,10,20,0.97)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--glass-border)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Live Chat</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--clr-white-60)' }}>
          <Users size={13} />{viewers} viewers
        </div>
      </div>

      {/* Comments */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
        {comments.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--clr-white-40)', fontSize: '0.8rem', marginTop: 40 }}>
            💬 Be the first to comment!
          </div>
        )}
        {comments.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, animation: 'slideInComment 0.2s ease', background: c.isGift ? 'rgba(251,191,36,0.07)' : 'transparent', borderRadius: 8, padding: c.isGift ? '6px 8px' : 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, overflow: 'hidden' }}>
              {c.senderAvatar ? <img src={c.senderAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.senderEmoji || '🌸'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '0.72rem', color: c.isGift ? '#fbbf24' : 'var(--clr-green)', marginRight: 6 }}>{c.senderName}</span>
              <span style={{ fontSize: '0.78rem', color: c.isGift ? '#fbbf24' : 'var(--clr-white-80)', wordBreak: 'break-word' }}>{c.text}</span>
            </div>
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>

      {/* Gift shelf */}
      {showGifts && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GIFTS.map(g => (
            <button
              key={g.id}
              onClick={() => sendGift(g)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 10px', borderRadius: 10, border: `1px solid ${g.color}22`, background: `${g.color}11`, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${g.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${g.color}11`; }}
            >
              <span style={{ fontSize: '1.4rem' }}>{g.emoji}</span>
              <span style={{ fontSize: '0.6rem', color: g.color, fontWeight: 700 }}>{g.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--glass-border)' }}>
        {isLoggedIn ? (
          <>
            <form onSubmit={sendComment} style={{ display: 'flex', gap: 8 }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Say something…"
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                maxLength={200}
              />
              <button type="submit" style={{ width: 38, height: 38, borderRadius: 8, border: 'none', background: 'var(--clr-green)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </form>
            {streamerUid && (
              <button
                onClick={() => setShowGifts(g => !g)}
                style={{ marginTop: 8, width: '100%', background: showGifts ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showGifts ? 'rgba(251,191,36,0.3)' : 'var(--glass-border)'}`, borderRadius: 8, padding: '7px 12px', color: showGifts ? '#fbbf24' : 'var(--clr-white-60)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
              >
                <Gift size={14} /> {showGifts ? 'Hide Gifts' : 'Send a Gift 🎁'}
              </button>
            )}
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--clr-white-40)', fontSize: '0.8rem' }}>Login to chat</p>
        )}
      </div>
    </div>
  );
}
