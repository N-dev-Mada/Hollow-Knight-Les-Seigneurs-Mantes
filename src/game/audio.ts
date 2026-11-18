/**
 * Web Audio API synthesizer for Mantis Lords sound effects and dynamic gothic boss music.
 * Completely procedural with zero external audio assets.
 */

import { WindowWithWebkitAudio } from './types';

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private sfxVolume: number = 0.9;
  private musicVolume: number = 0.65;

  // Music sequencing
  private isPlayingMusic: boolean = false;
  private musicTimer: number | null = null;
  private currentStep: number = 0;
  private musicPhase: 1 | 2 = 1;
  private tempo: number = 148; // BPM
  private focusOscillator: OscillatorNode | null = null;
  private focusGain: GainNode | null = null;
  public isPaused: boolean = false;

  constructor() {
    // AudioContext will be initialized on user gesture
  }

  public init() {
    if (this.ctx && this.ctx.state !== 'suspended') return;

    try {
      const win = window as WindowWithWebkitAudio;
      const AudioCtx = window.AudioContext || win.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch {
      // AudioContext not supported or restricted
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  // --- SOUND EFFECTS ---

  /** Nail slash swing sound (swoosh with high cut) */
  public playNailSwing(direction: 'horizontal' | 'up' | 'down') {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Filtered noise buffer for cloth/blade whoosh
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.5, now);
    const startFreq = direction === 'down' ? 1200 : direction === 'up' ? 2200 : 1600;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    // Subtle metallic whistle
    const tone = this.ctx.createOscillator();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(direction === 'down' ? 650 : 880, now);
    tone.frequency.exponentialRampToValueAtTime(220, now + 0.1);

    const toneGain = this.ctx.createGain();
    toneGain.gain.setValueAtTime(0.25, now);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    tone.connect(toneGain);
    toneGain.connect(this.sfxGain);
    tone.start(now);
    tone.stop(now + 0.12);
  }

  /** Nail hitting enemy - metallic slice and heavy thud */
  public playNailHitEnemy() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Metallic ring
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1180, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.18);
    osc2.stop(now + 0.18);
  }

  /** POGO bounce - high metallic resonance and energetic bounce ping */
  public playNailPogo() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Bright chime ping
    const chimes = [987.77, 1318.51, 1975.53]; // B5, E6, B6
    chimes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.3);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.35 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.35);
    });

    // Spring punch
    const kick = this.ctx.createOscillator();
    kick.type = 'triangle';
    kick.frequency.setValueAtTime(260, now);
    kick.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    const kickGain = this.ctx.createGain();
    kickGain.gain.setValueAtTime(0.9, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    kick.connect(kickGain);
    kickGain.connect(this.sfxGain);
    kick.start(now);
    kick.stop(now + 0.15);
  }

  /** Player hurt sound */
  public playPlayerHurt() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.25);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /** Dash whoosh with mothwing resonance */
  public playDash() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(250, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  /** Jump sound */
  public playJump() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Focus gathering hum - starts or modulates */
  public startFocusGather() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    if (this.focusOscillator) return;

    const now = this.ctx.currentTime;
    this.focusOscillator = this.ctx.createOscillator();
    this.focusGain = this.ctx.createGain();

    this.focusOscillator.type = 'sine';
    this.focusOscillator.frequency.setValueAtTime(280, now);
    this.focusOscillator.frequency.linearRampToValueAtTime(520, now + 1.2);

    this.focusGain.gain.setValueAtTime(0.01, now);
    this.focusGain.gain.linearRampToValueAtTime(0.4, now + 1.1);

    this.focusOscillator.connect(this.focusGain);
    this.focusGain.connect(this.sfxGain);
    this.focusOscillator.start(now);
  }

  /** Stop focus gathering hum */
  public stopFocusGather() {
    if (this.focusGain && this.ctx && this.focusOscillator) {
      const osc = this.focusOscillator;
      const gain = this.focusGain;
      this.focusOscillator = null;
      this.focusGain = null;
      gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // L'oscillateur a déjà été arrêté ou déconnecté
        }
      }, 60);
    }
  }

  /** Focus heal completed chime */
  public playFocusHeal() {
    this.stopFocusGather();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.4, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + 0.75);
    });
  }

  /** Boss appears/teleports sound */
  public playBossAppear() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** Boss telegraph screech / lance gleam */
  public playBossTelegraph() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.15);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(700, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Boss ground dash supersonic charge */
  public playBossDash() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  /** Boss dive ground impact slam */
  public playBossDiveImpact() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sub rumble
    const kick = this.ctx.createOscillator();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(160, now);
    kick.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    kick.connect(gain);
    gain.connect(this.sfxGain);
    kick.start(now);
    kick.stop(now + 0.4);

    // Stone shatter burst
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  /** Boomerang throw sound */
  public playBoomerangThrow() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Metallic impact when blade or glaive strikes stone wall or is caught */
  public playNailHitWall() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** Victory fanfare - royal Hollow Knight chord progression */
  public playVictoryFanfare() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const notes = [220, 261.63, 329.63, 440, 523.25, 659.25]; // Am chord arpeggiated
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.35, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 1.3);
    });
  }

  // --- PROCEDURAL BGM: MANTIS LORDS GOTHIC WALTZ / CADENCE ---

  public startMusic(phase: 1 | 2 = 1) {
    this.init();
    this.musicPhase = phase;
    this.tempo = phase === 1 ? 148 : 166;
    if (this.isPlayingMusic) return;

    this.isPlayingMusic = true;
    this.currentStep = 0;
    this.scheduleNextBeat();
  }

  public setPhase(phase: 1 | 2) {
    this.musicPhase = phase;
    this.tempo = phase === 1 ? 148 : 166;
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.stopFocusGather();
      if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(0.08, this.ctx.currentTime, 0.1);
      }
    } else {
      if (this.musicGain && this.ctx && !this.isMuted) {
        this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.1);
      }
    }
  }

  private scheduleNextBeat = () => {
    if (!this.isPlayingMusic || !this.ctx || !this.musicGain || this.isMuted) {
      if (this.isPlayingMusic) {
        this.musicTimer = window.setTimeout(this.scheduleNextBeat, 100);
      }
      return;
    }

    if (this.isPaused) {
      this.musicTimer = window.setTimeout(this.scheduleNextBeat, 100);
      return;
    }

    const stepDuration = 60 / this.tempo / 4; // 16th notes
    const now = this.ctx.currentTime;

    this.playStep(this.currentStep, now);
    this.currentStep = (this.currentStep + 1) % 64;

    const ms = stepDuration * 1000;
    this.musicTimer = window.setTimeout(this.scheduleNextBeat, ms);
  };

  /**
   * Generates a baroque harpsichord arpeggio + cello bassline + relentless marching percussion.
   * Cadence in D minor / A minor.
   */
  private playStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    // Bass note every quarter note (step % 4 === 0)
    // Progression: Dm - Bb - Gm - A (each 16 steps)
    const measure = Math.floor(step / 16);
    const rootNotes = [146.83, 116.54, 98.0, 110.0]; // D3, Bb2, G2, A2
    const currentRoot = rootNotes[measure % 4];

    if (step % 4 === 0) {
      // Cello staccato bass
      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(currentRoot / 2, time); // Low sub bass

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(450, time);

      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(0.32, time);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(time);
      bassOsc.stop(time + 0.2);

      // Percussion: Kick on beat 1 & 3 of measure
      if (step % 8 === 0) {
        const kick = this.ctx.createOscillator();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(120, time);
        kick.frequency.exponentialRampToValueAtTime(38, time + 0.1);

        const kickGain = this.ctx.createGain();
        kickGain.gain.setValueAtTime(0.45, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        kick.connect(kickGain);
        kickGain.connect(this.musicGain);
        kick.start(time);
        kick.stop(time + 0.13);
      }
    }

    // Snare / Rimshot on beat 2 & 4
    if (step % 8 === 4) {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, time);

      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime(0.25, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      noise.connect(filter);
      filter.connect(snareGain);
      snareGain.connect(this.musicGain);
      noise.start(time);
    }

    // Harpsichord Arpeggio on 16th notes
    // Arpeggio pattern over current chord
    const chordIntervals = [
      [0, 3, 7, 12, 15, 12, 7, 3], // Dm
      [0, 4, 7, 12, 14, 12, 7, 4], // Bb
      [0, 3, 7, 10, 12, 10, 7, 3], // Gm
      [0, 4, 7, 12, 13, 12, 7, 4], // A maj / dom
    ];
    const intervals = chordIntervals[measure % 4];
    const noteOffset = intervals[step % intervals.length];
    const arpFreq = currentRoot * Math.pow(2, noteOffset / 12);

    const arpOsc = this.ctx.createOscillator();
    arpOsc.type = 'triangle';
    arpOsc.frequency.setValueAtTime(arpFreq * 2, time);

    const arpGain = this.ctx.createGain();
    arpGain.gain.setValueAtTime(0.18, time);
    arpGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    arpOsc.connect(arpGain);
    arpGain.connect(this.musicGain);
    arpOsc.start(time);
    arpOsc.stop(time + 0.1);

    // Phase 2 extra intensity: Soaring violin lead countermelody
    if (this.musicPhase === 2 && step % 2 === 0) {
      const leadIntervals = [12, 15, 17, 19, 15, 17, 12, 10];
      const leadOffset = leadIntervals[(step / 2) % leadIntervals.length];
      const leadFreq = currentRoot * Math.pow(2, leadOffset / 12) * 2;

      const leadOsc = this.ctx.createOscillator();
      leadOsc.type = 'sawtooth';
      leadOsc.frequency.setValueAtTime(leadFreq, time);

      const leadFilter = this.ctx.createBiquadFilter();
      leadFilter.type = 'lowpass';
      leadFilter.frequency.setValueAtTime(1400, time);

      const leadGain = this.ctx.createGain();
      leadGain.gain.setValueAtTime(0.12, time);
      leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.musicGain);

      leadOsc.start(time);
      leadOsc.stop(time + 0.15);
    }
  }

  /** Subtle crystal chime on button hover */
  public playUiHover() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /** Resonant metallic confirmation click on button select */
  public playUiSelect() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export const audio = new AudioManager();
