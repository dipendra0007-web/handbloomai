import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, Image, Mic, Video, PhoneOff, Square } from 'lucide-react';
import { getSocket } from '../hooks/useSocket';
import { playAICallerTune, playDialTone, stopAllRingtones } from '../utils/ringtone';

export default function MessagesPage() {
  const { currentUser, isLoggedIn } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const localStream = useRef(null);
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);
  const activeContactRef = useRef(null); // ref mirror to avoid stale closures in socket handlers
  const currentUserRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const voiceRecorderRef = useRef(null);
  const voiceTimer = useRef(null);

  // Call states
  const [inCall, setInCall] = useState(false);
  const [callSession, setCallSession] = useState(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callerName, setCallerName] = useState('');
  const [callerUid, setCallerUid] = useState('');
  const [callStatus, setCallStatus] = useState(''); // 'dialing' | 'connected' | 'ended' | 'declined'
  const callSessionRef = useRef(null);
  const callStatusRef = useRef(null);
  useEffect(() => { callSessionRef.current = callSession; }, [callSession]);
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);

  // Typing indicators
  const [typingFrom, setTypingFrom] = useState(null); // uid of who is typing
  const typingTimeout = useRef(null);
  const isTypingRef = useRef(false);

  // Unread badges per contact uid
  const [unreadMap, setUnreadMap] = useState({});

  // Online users set
  const [onlineUids, setOnlineUids] = useState(new Set());

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  // ── Fetch contacts from REST (initial load) ────────────────────────────────
  const fetchContacts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return;
      const list = await res.json();
      const filtered = list.filter(u => u.uid !== currentUser.uid);
      setContacts(filtered);
      setOnlineUids(new Set(list.filter(u => u.isOnline).map(u => u.uid)));
      if (filtered.length > 0 && !activeContactRef.current) {
        setActiveContact(filtered[0]);
      }
    } catch {}
  }, [currentUser?.uid]);

  // ── Fetch messages for active chat ────────────────────────────────────────
  const fetchMessages = useCallback(async (contactUid) => {
    if (!currentUser || !contactUid) return;
    try {
      const res = await fetch(`/api/messages?userA=${currentUser.uid}&userB=${contactUid}`);
      if (res.ok) setMessages(await res.json());
    } catch {}
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentUser) fetchContacts();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.uid);
      // Mark as read — notify the contact
      const socket = getSocket();
      socket.emit('message:read', { toUid: activeContact.uid });
    }
  }, [activeContact?.uid]);

  // ── Notification beep helper ───────────────────────────────────────────────
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  // ── Socket.IO real-time listeners ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket();

    // ── Incoming message ──────────────────────────────────────────────────
    const onMessageNew = (msg) => {
      const ac = activeContactRef.current;
      // Append to chat if the sender is the current active contact
      if (ac && msg.sender === ac.uid) {
        setMessages(prev => {
          // Deduplicate by id
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark read
        socket.emit('message:read', { toUid: msg.sender });
      } else {
        // Not the active chat — show badge + beep
        setUnreadMap(prev => ({ ...prev, [msg.sender]: (prev[msg.sender] || 0) + 1 }));
        if (msg.type === 'text' || msg.type === 'image' || msg.type === 'voice') {
          playBeep();
        }
      }

      // Handle incoming CALL INVITE
      if (msg.type === 'call-invite') {
        if (!callSessionRef.current) {
          setCallSession(msg.content);
          setCallerName(msg.senderName);
          setCallerUid(msg.sender);
          setIsIncomingCall(true);
          setCallStatus('incoming');
          playAICallerTune();
        }
        return;
      }

      // Handle CALL ACCEPT (caller side)
      if (msg.type === 'call-accept' && msg.content === callSessionRef.current && callStatusRef.current === 'dialing') {
        stopAllRingtones();
        setCallStatus('connected');
        startLocalStream();
        return;
      }

      // Handle CALL DECLINE
      if (msg.type === 'call-decline' && msg.content === callSessionRef.current) {
        stopAllRingtones();
        setCallStatus('declined');
        setTimeout(() => { setInCall(false); setCallSession(null); }, 2500);
        return;
      }

      // Handle CALL END
      if (msg.type === 'call-end' && msg.content === callSessionRef.current) {
        stopAllRingtones();
        stopLocalStream(false);
        return;
      }
    };

    // ── Own sent message echoed back (multi-tab support) ──────────────────
    const onMessageSent = (msg) => {
      const ac = activeContactRef.current;
      if (ac && msg.receiver === ac.uid) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    // ── Typing indicators ─────────────────────────────────────────────────
    const onTypingStart = ({ fromUid }) => {
      const ac = activeContactRef.current;
      if (ac?.uid === fromUid) {
        setTypingFrom(fromUid);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingFrom(null), 3000);
      }
    };

    const onTypingStop = ({ fromUid }) => {
      const ac = activeContactRef.current;
      if (ac?.uid === fromUid) setTypingFrom(null);
    };

    // ── Read receipts ────────────────────────────────────────────────────
    const onMessageRead = ({ fromUid }) => {
      // Could add read tick UI here
    };

    // ── User presence ─────────────────────────────────────────────────────
    const onUserOnline = ({ uid }) => {
      setOnlineUids(prev => new Set([...prev, uid]));
      // Update contacts list with new user if not already present
      if (uid !== currentUser.uid) {
        fetchContacts();
      }
    };

    const onUserOffline = ({ uid }) => {
      setOnlineUids(prev => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    };

    // ── New user registered — add to contacts instantly ──────────────────
    const onUserRegistered = (newUser) => {
      if (newUser.uid === currentUser.uid) return;
      setContacts(prev => {
        if (prev.some(c => c.uid === newUser.uid)) return prev;
        return [...prev, newUser];
      });
    };

    // ── Profile updated — refresh contacts ───────────────────────────────
    const onProfileUpdated = (updatedUser) => {
      if (updatedUser.uid === currentUser.uid) return; // AuthContext handles own profile
      setContacts(prev => prev.map(c => c.uid === updatedUser.uid ? { ...c, ...updatedUser } : c));
      // Refresh active contact too
      if (activeContactRef.current?.uid === updatedUser.uid) {
        setActiveContact(prev => ({ ...prev, ...updatedUser }));
      }
    };

    // ── User deleted ─────────────────────────────────────────────────────
    const onUserDeleted = ({ uid }) => {
      setContacts(prev => prev.filter(c => c.uid !== uid));
      if (activeContactRef.current?.uid === uid) {
        setActiveContact(null);
        setMessages([]);
      }
    };

    socket.on('message:new', onMessageNew);
    socket.on('message:sent', onMessageSent);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('message:read', onMessageRead);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);
    socket.on('user:registered', onUserRegistered);
    socket.on('user:profileUpdated', onProfileUpdated);
    socket.on('user:deleted', onUserDeleted);

    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('message:sent', onMessageSent);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('message:read', onMessageRead);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
      socket.off('user:registered', onUserRegistered);
      socket.off('user:profileUpdated', onProfileUpdated);
      socket.off('user:deleted', onUserDeleted);
      stopAllRingtones();
    };
  }, [currentUser?.uid]);

  // ── Typing emit on keystroke ──────────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!activeContact) return;
    const socket = getSocket();
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { toUid: activeContact.uid });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing:stop', { toUid: activeContact.uid });
    }, 1500);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (type = 'text', content = text) => {
    if (type === 'text' && !content.trim()) return;
    if (!currentUser || !activeContact) return;

    // Clear typing
    isTypingRef.current = false;
    const socket = getSocket();
    socket.emit('typing:stop', { toUid: activeContact.uid });

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: currentUser.uid,
          senderName: currentUser.name,
          receiver: activeContact.uid,
          receiverName: activeContact.name,
          type,
          content,
        })
      });
      if (res.ok) {
        if (type === 'text') setText('');
        // message:sent socket event will append to local messages (from backend echo)
      }
    } catch {}
  };

  // ── Voice Recording ────────────────────────────────────────────────────────
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => handleSend('voice', reader.result);
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      voiceRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVoice(true);
      setRecordingDuration(0);
      voiceTimer.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch {
      alert('Microphone permission required for voice notes.');
    }
  };

  const stopVoiceRecording = () => {
    if (voiceRecorderRef.current && isRecordingVoice) {
      voiceRecorderRef.current.stop();
      setIsRecordingVoice(false);
      clearInterval(voiceTimer.current);
    }
  };

  // ── Video Calling ──────────────────────────────────────────────────────────
  const startCall = async () => {
    const sessionId = `call-${Date.now()}`;
    setCallSession(sessionId);
    callSessionRef.current = sessionId;
    setInCall(true);
    setCallStatus('dialing');
    callStatusRef.current = 'dialing';
    playDialTone();
    await handleSend('call-invite', sessionId);
  };

  const acceptCall = async () => {
    stopAllRingtones();
    setIsIncomingCall(false);
    setInCall(true);
    setCallStatus('connected');
    callStatusRef.current = 'connected';
    const caller = contacts.find(c => c.uid === callerUid);
    if (caller) setActiveContact(caller);
    await handleSend('call-accept', callSession);
    startLocalStream();
  };

  const declineCall = async () => {
    stopAllRingtones();
    setIsIncomingCall(false);
    setInCall(false);
    await handleSend('call-decline', callSession);
    setCallSession(null);
    callSessionRef.current = null;
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      recordedChunks.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
      recorder.onstop = async () => {
        const videoBlob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => handleSend('call-recording', reader.result);
        reader.readAsDataURL(videoBlob);
      };
      mediaRecorder.current = recorder;
      recorder.start(1000);
    } catch (e) {
      console.warn('Camera/Mic not available.', e);
    }
  };

  const stopLocalStream = async (sendEndMsg = true) => {
    stopAllRingtones();
    if (sendEndMsg && callSessionRef.current) {
      await handleSend('call-end', callSessionRef.current);
    }
    if (mediaRecorder.current?.state !== 'inactive') mediaRecorder.current?.stop();
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setInCall(false);
    setCallSession(null);
    callSessionRef.current = null;
    setCallStatus('ended');
    callStatusRef.current = 'ended';
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleSend('image', reader.result);
    reader.readAsDataURL(file);
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isLoggedIn) {
    return (
      <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Authentication Required</h2>
          <p style={{ color: 'var(--clr-white-60)', marginBottom: 24 }}>Please register or login to chat with partners.</p>
          <a href="/auth" className="btn btn-primary">Sign In</a>
        </div>
      </div>
    );
  }

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', background: '#06081a' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: 24, padding: '40px 24px', flex: 1 }}>

        {/* ── Contact list ── */}
        <div className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
            💬 Contacts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {contacts.map(c => {
              const unread = unreadMap[c.uid] || 0;
              const isOnline = onlineUids.has(c.uid);
              return (
                <button
                  key={c.uid}
                  onClick={() => {
                    setActiveContact(c);
                    setUnreadMap(prev => ({ ...prev, [c.uid]: 0 }));
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: activeContact?.uid === c.uid ? 'rgba(134,239,172,0.1)' : 'transparent',
                    color: 'white',
                    border: activeContact?.uid === c.uid ? '1px solid rgba(134,239,172,0.3)' : '1px solid transparent',
                    transition: 'all 0.2s', position: 'relative'
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden' }}>
                      {c.avatar ? <img src={c.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.avatarEmoji || '🌸'}
                    </div>
                    {/* Online indicator */}
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 10, height: 10, borderRadius: '50%',
                      background: isOnline ? '#4ade80' : '#6b7280',
                      border: '2px solid #06081a'
                    }} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: '0.68rem', color: isOnline ? 'var(--clr-green)' : 'var(--clr-white-60)' }}>
                      {isOnline ? '● Online' : c.username}
                    </div>
                  </div>
                  {unread > 0 && (
                    <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 99, fontWeight: 700, flexShrink: 0 }}>
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
            {contacts.length === 0 && (
              <p style={{ color: 'var(--clr-white-60)', fontSize: '0.78rem', textAlign: 'center', marginTop: 20 }}>No other users registered.</p>
            )}
          </div>
        </div>

        {/* ── Chat box ── */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {activeContact ? (
            <>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ fontSize: '1.4rem' }}>{activeContact.avatarEmoji || '🌸'}</span>
                    <span style={{
                      position: 'absolute', bottom: 0, right: -2,
                      width: 9, height: 9, borderRadius: '50%',
                      background: onlineUids.has(activeContact.uid) ? '#4ade80' : '#6b7280',
                      border: '2px solid #06081a'
                    }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{activeContact.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>
                      {typingFrom === activeContact.uid
                        ? <span style={{ color: 'var(--clr-green)', fontStyle: 'italic' }}>✍️ typing...</span>
                        : onlineUids.has(activeContact.uid) ? <span style={{ color: 'var(--clr-green)' }}>● Online</span> : activeContact.username
                      }
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={startCall} className="btn btn-secondary btn-sm" style={{ padding: 8 }} title="Video Call">
                    <Video size={16} />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {messages.map(m => {
                  const isMe = m.sender === currentUser.uid;
                  if (['call-invite', 'call-accept', 'call-decline', 'call-end'].includes(m.type)) {
                    return (
                      <div key={m.id} style={{ alignSelf: 'center', fontSize: '0.72rem', color: 'var(--clr-white-60)', background: 'rgba(255,255,255,0.04)', padding: '4px 14px', borderRadius: 99, border: '1px solid var(--glass-border)' }}>
                        {m.type === 'call-invite' && '📞 Call started'}
                        {m.type === 'call-accept' && '🟢 Call connected'}
                        {m.type === 'call-decline' && '🔴 Call declined'}
                        {m.type === 'call-end' && '📞 Call ended'}
                        <span style={{ marginLeft: 6, opacity: 0.5 }}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      <div style={{
                        padding: '12px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMe ? 'linear-gradient(135deg, var(--clr-green), var(--clr-sky))' : 'var(--glass-bg)',
                        color: isMe ? '#06081a' : 'white',
                        border: isMe ? 'none' : '1px solid var(--glass-border)',
                      }}>
                        {m.type === 'text' && <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{m.content}</div>}
                        {m.type === 'image' && <img src={m.content} alt="shared" style={{ width: '100%', maxWidth: 260, borderRadius: 10 }} />}
                        {m.type === 'voice' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>🔊 Voice Message</div>
                            <audio src={m.content} controls style={{ width: '100%', maxWidth: 240, height: 32 }} />
                          </div>
                        )}
                        {m.type === 'call-recording' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--clr-white-60)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              🎥 Video Call Ended (Recording archived to Admin Logs)
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--clr-white-60)', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
                {/* Typing indicator bubble */}
                {typingFrom === activeContact.uid && (
                  <div style={{ alignSelf: 'flex-start', padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '18px 18px 18px 4px', fontSize: '1rem' }}>
                    <span style={{ letterSpacing: 2 }}>•••</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Video Call Overlay */}
              {inCall && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,8,26,0.98)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 30 }}>
                  <div style={{ color: 'white', textAlign: 'center' }}>
                    <h3 style={{ fontWeight: 800 }}>📞 Video Call</h3>
                    <p style={{ color: 'var(--clr-green)', fontSize: '0.85rem', marginTop: 4 }}>
                      {callStatus === 'dialing' && `Calling ${activeContact.name}...`}
                      {callStatus === 'connected' && '🟢 Connected · Recording'}
                      {callStatus === 'declined' && '🔴 Call declined'}
                    </p>
                  </div>
                  {callStatus === 'connected' && (
                    <video ref={videoRef} autoPlay playsInline muted
                      style={{ width: '100%', maxHeight: '55%', borderRadius: 20, background: '#111', objectFit: 'cover', transform: 'scaleX(-1)', border: '2px solid var(--clr-green)' }}
                    />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={() => stopLocalStream(true)} className="btn"
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 99, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <PhoneOff size={16} /> Hang Up
                    </button>
                  </div>
                </div>
              )}

              {/* Incoming Call Modal */}
              {isIncomingCall && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="glass-card" style={{ padding: 32, maxWidth: 360, width: '90%', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', animation: 'pulse 1s infinite', marginBottom: 16 }}>📞</div>
                    <h3 style={{ fontWeight: 900, marginBottom: 4 }}>Incoming Video Call</h3>
                    <p style={{ color: 'var(--clr-green)', fontWeight: 700, marginBottom: 4 }}>{callerName}</p>
                    <p style={{ color: 'var(--clr-white-60)', fontSize: '0.78rem', marginBottom: 24 }}>AI caller tune playing...</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                      <button onClick={declineCall} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                        🔴 Decline
                      </button>
                      <button onClick={acceptCall} style={{ background: 'var(--clr-green)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                        🟢 Answer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(0,0,0,0.15)' }}>
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm" style={{ padding: 10 }} title="Send Photo">
                  <Image size={16} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />

                {isRecordingVoice ? (
                  <button onClick={stopVoiceRecording} className="btn btn-primary"
                    style={{ padding: '10px 14px', background: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Square size={14} /> <span>{formatDuration(recordingDuration)}</span>
                  </button>
                ) : (
                  <button onClick={startVoiceRecording} className="btn btn-secondary btn-sm" style={{ padding: 10 }} title="Voice Note">
                    <Mic size={16} />
                  </button>
                )}

                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Write a message..."
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={e => e.key === 'Enter' && handleSend('text')}
                />

                <button onClick={() => handleSend('text')} className="btn btn-primary" style={{ padding: 10 }}>
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <p style={{ margin: 'auto', color: 'var(--clr-white-60)' }}>Select a contact to start messaging.</p>
          )}
        </div>

      </div>
    </div>
  );
}
