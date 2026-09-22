/**
 * Web Audio Synthesizer & WAV Encoder for Commercial Mockup Soundtracks.
 * Generates high-fidelity preview music tracks right in the browser.
 */

// Convert AudioBuffer to 16-bit PCM WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');

  // FMT sub-chunk
  writeString('fmt ');
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // two-byte int (1 is PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // Data sub-chunk
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

export type SynthGenre =
  | 'acoustic-cafe'
  | 'urban-lofi'
  | 'electro-commercial'
  | 'ambient-zen'
  | 'indie-rock'
  | 'lounge-jazz';

interface SynthOptions {
  genre?: string;
  durationSeconds?: number;
  tempo?: string;
}

// Convert MIDI note number to frequency in Hz
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Synthesize a full preview musical track using OfflineAudioContext.
 * Returns a data URL that can be played in any <audio> element.
 */
export async function synthesizeMockupTrack(options: SynthOptions = {}): Promise<string> {
  const duration = Math.min(Math.max(options.durationSeconds || 15, 6), 30);
  const sampleRate = 44100;
  const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
    2,
    sampleRate * duration,
    sampleRate
  );

  const genreKey = (options.genre || '').toLowerCase();
  let genre: SynthGenre = 'acoustic-cafe';
  if (genreKey.includes('lofi') || genreKey.includes('hip') || genreKey.includes('street')) {
    genre = 'urban-lofi';
  } else if (genreKey.includes('electro') || genreKey.includes('pop') || genreKey.includes('upbeat')) {
    genre = 'electro-commercial';
  } else if (genreKey.includes('ambient') || genreKey.includes('zen') || genreKey.includes('nature')) {
    genre = 'ambient-zen';
  } else if (genreKey.includes('rock') || genreKey.includes('guitar')) {
    genre = 'indie-rock';
  } else if (genreKey.includes('jazz') || genreKey.includes('lounge')) {
    genre = 'lounge-jazz';
  }

  // Master Gain & Limiter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.75, 0);
  masterGain.connect(offlineCtx.destination);

  // Reverb simulation using delay & feedback
  const delay = offlineCtx.createDelay();
  delay.delayTime.value = 0.28;
  const feedback = offlineCtx.createGain();
  feedback.gain.value = 0.35;
  const delayFilter = offlineCtx.createBiquadFilter();
  delayFilter.type = 'lowpass';
  delayFilter.frequency.value = 2200;

  delay.connect(feedback);
  feedback.connect(delayFilter);
  delayFilter.connect(delay);
  delay.connect(masterGain);

  const now = 0;

  if (genre === 'acoustic-cafe') {
    // 90 BPM Acoustic guitar & warm electric piano
    const bpm = 92;
    const beatSec = 60 / bpm;
    // Chords: Cmaj7 (C E G B), Am7 (A C E G), Dm7 (D F A C), G7 (G B D F)
    const progressions = [
      [60, 64, 67, 71], // Cmaj7
      [57, 60, 64, 67], // Am7
      [50, 53, 57, 60], // Dm7
      [55, 59, 62, 65], // G7
    ];

    let t = now;
    let chordIdx = 0;
    while (t < duration - 1) {
      const chord = progressions[chordIdx % progressions.length];
      // Play arpeggio
      chord.forEach((note, noteIdx) => {
        const noteTime = t + noteIdx * (beatSec * 0.45);
        if (noteTime >= duration) return;

        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();

        // Warm triangle / sine mixture
        osc.type = noteIdx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(midiToFreq(note), noteTime);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.2);

        osc.connect(gain);
        gain.connect(masterGain);
        gain.connect(delay);

        osc.start(noteTime);
        osc.stop(noteTime + 1.3);
      });

      // Soft bass note
      const bassOsc = offlineCtx.createOscillator();
      const bassGain = offlineCtx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(midiToFreq(chord[0] - 24), t);
      bassGain.gain.setValueAtTime(0.35, t);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + beatSec * 1.8);
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(t);
      bassOsc.stop(t + beatSec * 2);

      t += beatSec * 2;
      chordIdx++;
    }
  } else if (genre === 'urban-lofi') {
    // 84 BPM Mellow Lofi Boom-Bap Beat
    const bpm = 84;
    const beatSec = 60 / bpm;
    // Chords: Fmaj7 (F A C E), Em7 (E G B D), Dm9 (D F A C E), G13 (G B F E)
    const chords = [
      [53, 57, 60, 64],
      [52, 55, 59, 62],
      [50, 53, 57, 60, 64],
      [43, 55, 59, 65, 64],
    ];

    let t = now;
    let bar = 0;
    while (t < duration - 1) {
      const chord = chords[bar % chords.length];

      // Electric Rhodes Chord
      chord.forEach((note) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(midiToFreq(note + 12), t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 2.2);
        osc.connect(gain);
        gain.connect(masterGain);
        gain.connect(delay);
        osc.start(t);
        osc.stop(t + beatSec * 2.5);
      });

      // 4-beat Boom Bap Drum Loop
      for (let b = 0; b < 4; b++) {
        const beatTime = t + b * beatSec;
        if (beatTime >= duration) break;

        // Kick on 0 and 2.5
        if (b === 0 || b === 2) {
          const kickOsc = offlineCtx.createOscillator();
          const kickGain = offlineCtx.createGain();
          kickOsc.frequency.setValueAtTime(120, beatTime);
          kickOsc.frequency.exponentialRampToValueAtTime(42, beatTime + 0.12);
          kickGain.gain.setValueAtTime(0.65, beatTime);
          kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.25);
          kickOsc.connect(kickGain);
          kickGain.connect(masterGain);
          kickOsc.start(beatTime);
          kickOsc.stop(beatTime + 0.26);
        }

        // Snare / Rimshot on 1 and 3
        if (b === 1 || b === 3) {
          const noiseGain = offlineCtx.createGain();
          noiseGain.gain.setValueAtTime(0.3, beatTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.18);
          // Noise buffer
          const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.2, sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let k = 0; k < data.length; k++) data[k] = Math.random() * 2 - 1;
          const noiseSrc = offlineCtx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          const noiseFilter = offlineCtx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.value = 1800;
          noiseSrc.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(masterGain);
          noiseSrc.start(beatTime);
          noiseSrc.stop(beatTime + 0.2);
        }

        // Hi-hat ticking
        const hatGain = offlineCtx.createGain();
        hatGain.gain.setValueAtTime(0.12, beatTime + beatSec * 0.5);
        hatGain.gain.exponentialRampToValueAtTime(0.001, beatTime + beatSec * 0.5 + 0.04);
        const hatOsc = offlineCtx.createOscillator();
        hatOsc.type = 'highpass' as any;
        const hatNoise = offlineCtx.createBuffer(1, sampleRate * 0.05, sampleRate);
        const hdata = hatNoise.getChannelData(0);
        for (let k = 0; k < hdata.length; k++) hdata[k] = Math.random() * 2 - 1;
        const hSrc = offlineCtx.createBufferSource();
        hSrc.buffer = hatNoise;
        hSrc.connect(hatGain);
        hatGain.connect(masterGain);
        hSrc.start(beatTime + beatSec * 0.5);
        hSrc.stop(beatTime + beatSec * 0.5 + 0.06);
      }

      t += beatSec * 4;
      bar++;
    }
  } else {
    // Upbeat Electro Commercial / Pop
    const bpm = 120;
    const beatSec = 60 / bpm;
    // Notes: C, G, A, F
    const bassNotes = [36, 43, 45, 41];
    let t = now;
    let step = 0;

    while (t < duration - 1) {
      const rootNote = bassNotes[Math.floor(step / 4) % bassNotes.length];

      // Punchy commercial 4-on-the-floor kick
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.1);
      kickGain.gain.setValueAtTime(0.7, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(t);
      kickOsc.stop(t + 0.22);

      // Bass synth pluck
      const bassOsc = offlineCtx.createOscillator();
      const bassGain = offlineCtx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(midiToFreq(rootNote + 12), t + beatSec * 0.25);
      bassGain.gain.setValueAtTime(0.28, t + beatSec * 0.25);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + beatSec * 0.7);
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(t + beatSec * 0.25);
      bassOsc.stop(t + beatSec * 0.75);

      // Arpeggiator sparkle
      const arpNote = rootNote + 24 + ((step % 4) * 4);
      const arpOsc = offlineCtx.createOscillator();
      const arpGain = offlineCtx.createGain();
      arpOsc.type = 'sine';
      arpOsc.frequency.setValueAtTime(midiToFreq(arpNote), t + beatSec * 0.5);
      arpGain.gain.setValueAtTime(0, t + beatSec * 0.5);
      arpGain.gain.linearRampToValueAtTime(0.18, t + beatSec * 0.5 + 0.02);
      arpGain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 0.5 + 0.35);
      arpOsc.connect(arpGain);
      arpGain.connect(delay);
      arpGain.connect(masterGain);
      arpOsc.start(t + beatSec * 0.5);
      arpOsc.stop(t + beatSec * 0.5 + 0.4);

      t += beatSec;
      step++;
    }
  }

  // Render audio buffer
  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);

  return URL.createObjectURL(wavBlob);
}
