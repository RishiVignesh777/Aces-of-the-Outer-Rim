/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private musicActive: boolean = false;
  private musicTimer: number | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.setupEngineSound();
    } catch {
      // Audio not supported or blocked
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.engineGain) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.08, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private setupEngineSound() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    this.engineOsc = osc;
    this.engineFilter = filter;
    this.engineGain = gain;
  }

  public updateEngineSound(throttle: number, boost: boolean, speedRatio: number) {
    if (!this.ctx || !this.engineOsc || !this.engineFilter || !this.engineGain) return;
    if (this.isMuted) return;

    const now = this.ctx.currentTime;
    const baseFreq = 50 + speedRatio * 90 + (boost ? 70 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);

    const filterFreq = 180 + speedRatio * 350 + (boost ? 400 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);

    const targetGain = 0.05 + Math.abs(throttle) * 0.07 + (boost ? 0.09 : 0);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  public playLaser(pitchMult = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const startFreq = 880 * pitchMult;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(70 * pitchMult, now + 0.12);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playTorpedoLaunch() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(280, now + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playExplosion(isLarge = false) {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Sub rumble
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isLarge ? 90 : 130, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + (isLarge ? 0.9 : 0.45));

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(isLarge ? 0.5 : 0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + (isLarge ? 0.95 : 0.5));

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + (isLarge ? 1.0 : 0.55));

    // White noise blast
    const bufferSize = ctx.sampleRate * (isLarge ? 0.8 : 0.35);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isLarge ? 1200 : 800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + (isLarge ? 0.8 : 0.35));

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(isLarge ? 0.4 : 0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isLarge ? 0.8 : 0.35));

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }

  public playSwitchClick() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playMissileLockWarning() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1150, now);
    osc.frequency.setValueAtTime(1350, now + 0.06);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playRadioBeep() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // A6 note
    osc.frequency.setValueAtTime(2200, now + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playShieldHit() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public startAtmosphericMusic() {
    if (this.musicActive) return;
    this.musicActive = true;
    let step = 0;
    const notes = [110, 130.81, 146.83, 164.81, 196, 220]; // A minor pentatonic bass

    const tick = () => {
      if (!this.musicActive) return;
      if (this.ctx && !this.isMuted) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        const note = notes[step % notes.length];
        osc.frequency.setValueAtTime(note / 2, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
        step++;
      }
      this.musicTimer = window.setTimeout(tick, 500);
    };
    tick();
  }

  public stopAtmosphericMusic() {
    this.musicActive = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const sound = new SoundEngine();
