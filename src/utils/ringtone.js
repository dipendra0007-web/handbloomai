// Dynamic synthesized audio ringtone generator using Web Audio API
// Works locally with no external assets needed!

let audioCtx = null;
let tuneInterval = null;
let dialInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Melodic AI caller tune
export function playAICallerTune() {
  stopAllRingtones();
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
  let index = 0;

  const playSequence = () => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[index % notes.length], ctx.currentTime);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      index++;
    } catch (e) {
      console.warn('Audio Context error playing sequence:', e);
    }
  };

  playSequence();
  tuneInterval = setInterval(playSequence, 200);
}

// Dialer ringing sound
export function playDialTone() {
  stopAllRingtones();
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const playRing = () => {
    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime); // Standard US dial tone frequency 1
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, ctx.currentTime); // Standard US dial tone frequency 2

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 2.0);
      osc2.stop(ctx.currentTime + 2.0);
    } catch (e) {
      console.warn('Audio Context error playing dial ring:', e);
    }
  };

  playRing();
  dialInterval = setInterval(playRing, 3500);
}

// Stop all audio
export function stopAllRingtones() {
  if (tuneInterval) {
    clearInterval(tuneInterval);
    tuneInterval = null;
  }
  if (dialInterval) {
    clearInterval(dialInterval);
    dialInterval = null;
  }
}
