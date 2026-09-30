import { Engine } from '../types/engine';

type SampleKey =
  | 'v8'
  | 'v12'
  | 'flat6'
  | 'sports'
  | 'muscle'
  | 'idle'
  | 'high'
  | 'start'
  | 'bmw'
  | 'a45'
  | 'bugatti';

const SAMPLE_FILES: Record<SampleKey, string> = {
  v8: '/sounds/v8-rev.mp3',
  v12: '/sounds/ferrari-v12.mp3',
  flat6: '/sounds/porsche-flat6.mp3',
  sports: '/sounds/sports-rev.mp3',
  muscle: '/sounds/muscle-rev.mp3',
  idle: '/sounds/idle-loop.mp3',
  high: '/sounds/high-rev.mp3',
  start: '/sounds/car-start.mp3',
  // samples custom (fichiers fournis)
  bmw: '/sounds/bmw.mp3',
  a45: '/sounds/a45.mp3',
  bugatti: '/sounds/bugatti-chiron.mp3'
};

/**
 * sons réels (samples) joués via web audio api.
 * playbackRate suit le régime (rpm).
 */
export class AudioEngineSimulator {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static filter: BiquadFilterNode | null = null;

  private static loopSource: AudioBufferSourceNode | null = null;
  private static loopGain: GainNode | null = null;
  private static oneShotSource: AudioBufferSourceNode | null = null;

  private static bufferCache = new Map<string, AudioBuffer>();
  private static isPlaying = false;
  private static currentEngine: Partial<Engine> | null = null;
  private static currentRpm = 800;
  private static idleRpm = 800;
  private static maxRpm = 8500;
  private static isElectric = false;
  private static sampleKey: SampleKey = 'idle';
  private static revTimer: ReturnType<typeof setInterval> | null = null;

  private static initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private static pickSample(engine: Partial<Engine>): SampleKey {
    const cfg = engine.configuration || 'V8';
    const name = `${engine.name || ''} ${engine.manufacturer || ''}`.toLowerCase();

    // samples dédiés fournis
    if (name.includes('bmw') || name.includes('m5') || cfg === 'V10') return 'bmw';
    if (name.includes('a 45') || name.includes('a45') || (name.includes('mercedes') && name.includes('amg') && cfg === '4 en ligne')) {
      return 'a45';
    }
    if (name.includes('bugatti') || name.includes('chiron') || cfg === 'W16') return 'bugatti';

    if (cfg === 'Électrique' || engine.fuel === 'Électrique' || name.includes('tesla')) return 'high';
    if (cfg === 'V12' || name.includes('ferrari') || name.includes('lamborghini')) return 'v12';
    if (cfg === 'Flat-6' || name.includes('porsche')) return 'flat6';
    if (cfg === 'V8' || name.includes('corvette') || name.includes('mustang')) return 'v8';
    if (cfg === 'Rotatif' || name.includes('rx-8') || name.includes('mazda')) return 'high';
    if (cfg === 'V6' || name.includes('gt-r') || name.includes('nissan')) return 'sports';
    if (cfg === '5 en ligne' || cfg === '6 en ligne' || cfg === '4 en ligne' || name.includes('supra') || name.includes('audi')) {
      return 'muscle';
    }
    return 'idle';
  }

  private static async loadBuffer(url: string, maxSeconds = 10): Promise<AudioBuffer> {
    this.initContext();
    if (!this.ctx) throw new Error('no audio context');

    const cached = this.bufferCache.get(url);
    if (cached) return cached;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`sound fetch failed: ${url}`);
    const raw = await res.arrayBuffer();
    const decoded = await this.ctx.decodeAudioData(raw.slice(0));

    // coupe les longs samples (ex: ferrari ~1min) pour charger plus vite
    const maxFrames = Math.min(decoded.length, Math.floor(decoded.sampleRate * maxSeconds));
    if (maxFrames >= decoded.length) {
      this.bufferCache.set(url, decoded);
      return decoded;
    }

    const sliced = this.ctx.createBuffer(decoded.numberOfChannels, maxFrames, decoded.sampleRate);
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      sliced.copyToChannel(decoded.getChannelData(ch).subarray(0, maxFrames), ch);
    }
    this.bufferCache.set(url, sliced);
    return sliced;
  }

  private static rpmToRate(rpm: number): number {
    const ratio = Math.max(0, Math.min(1, (rpm - this.idleRpm) / Math.max(1, this.maxRpm - this.idleRpm)));
    if (this.isElectric) {
      // whine plus aigu à haut régime
      return 0.55 + ratio * 1.35;
    }
    // ralenti un peu grave, pleine charge plus aigu
    return 0.72 + ratio * 0.85;
  }

  public static start(engineOrPitch: Engine | number = 500, maxRpmFallback: number = 8500) {
    this.initContext();
    if (!this.ctx) return;
    if (this.isPlaying) this.stop();

    let engine: Partial<Engine>;
    if (typeof engineOrPitch === 'object') {
      engine = engineOrPitch;
    } else {
      engine = {
        soundPitch: engineOrPitch,
        maxRpm: maxRpmFallback,
        configuration: 'V8',
        aspiration: 'Atmosphérique',
        fuel: 'Essence',
        name: 'Moteur'
      };
    }

    this.currentEngine = engine;
    this.isElectric = engine.configuration === 'Électrique' || engine.fuel === 'Électrique';
    this.maxRpm = engine.maxRpm || 8500;
    this.idleRpm = this.isElectric ? 0 : Math.round(this.maxRpm * 0.11);
    this.currentRpm = this.idleRpm;
    this.sampleKey = this.pickSample(engine);
    this.isPlaying = true;

    void this.bootGraph();
  }

  private static async bootGraph() {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;

    try {
      const loopUrl = SAMPLE_FILES[this.sampleKey] || SAMPLE_FILES.idle;
      const startUrl = this.isElectric ? SAMPLE_FILES.high : SAMPLE_FILES.start;

      const [loopBuffer, startBuffer] = await Promise.all([
        this.loadBuffer(loopUrl, this.isCustomSample(this.sampleKey) ? 20 : (this.sampleKey === 'v12' ? 12 : 8)),
        this.loadBuffer(startUrl, 4).catch(() => null)
      ]);

      if (!this.isPlaying || !this.ctx) return;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.55, now + 0.2);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(2800, now);
      this.filter.Q.setValueAtTime(0.7, now);

      this.loopGain = this.ctx.createGain();
      this.loopGain.gain.setValueAtTime(0.9, now);

      this.loopSource = this.ctx.createBufferSource();
      this.loopSource.buffer = loopBuffer;
      this.loopSource.loop = true;
      this.loopSource.playbackRate.setValueAtTime(this.rpmToRate(this.currentRpm), now);

      this.loopSource.connect(this.loopGain);
      this.loopGain.connect(this.filter);
      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.loopSource.start(now);

      // petit bruit de démarreur au contact (sauf électrique / samples custom)
      if (startBuffer && !this.isElectric && !this.isCustomSample(this.sampleKey)) {
        this.oneShotSource = this.ctx.createBufferSource();
        this.oneShotSource.buffer = startBuffer;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.35, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        this.oneShotSource.connect(g);
        g.connect(this.masterGain);
        this.oneShotSource.start(now);
      }

      this.applyRpmAudio(this.currentRpm);
    } catch (err) {
      console.error('impossible de charger le sample moteur:', err);
      this.isPlaying = false;
    }
  }

  private static isCustomSample(key: SampleKey): boolean {
    return key === 'bmw' || key === 'a45' || key === 'bugatti';
  }

  public static setRpm(rpm: number) {
    this.currentRpm = Math.max(this.idleRpm, Math.min(this.maxRpm, rpm));
    this.applyRpmAudio(this.currentRpm);
  }

  private static applyRpmAudio(rpm: number) {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const rate = this.rpmToRate(rpm);
    const rpmRatio = Math.max(0, Math.min(1, (rpm - this.idleRpm) / Math.max(1, this.maxRpm - this.idleRpm)));

    if (this.loopSource) {
      this.loopSource.playbackRate.setTargetAtTime(rate, now, 0.08);
    }
    if (this.filter) {
      const cutoff = 1200 + rpmRatio * 4200;
      this.filter.frequency.setTargetAtTime(cutoff, now, 0.08);
    }
    if (this.loopGain) {
      const vol = 0.55 + rpmRatio * 0.45;
      this.loopGain.gain.setTargetAtTime(vol, now, 0.08);
    }
  }

  public static revUp(callbackRpm?: (rpm: number) => void) {
    if (!this.isPlaying) return;
    if (this.revTimer) clearInterval(this.revTimer);

    const targetRpm = Math.round(this.maxRpm * 0.94);
    const idleRpm = this.idleRpm;
    let progress = 0;

    // one-shot du sample "rev" par-dessus la boucle
    void this.playOneShotRev();

    this.revTimer = setInterval(() => {
      progress += 0.05;
      if (progress <= 0.45) {
        const current = idleRpm + (targetRpm - idleRpm) * Math.sin((progress / 0.45) * (Math.PI / 2));
        this.setRpm(current);
        callbackRpm?.(current);
      } else if (progress <= 0.55) {
        const current = targetRpm + (Math.random() - 0.5) * (this.maxRpm * 0.02);
        this.setRpm(current);
        callbackRpm?.(current);
      } else if (progress <= 1) {
        const decProgress = (progress - 0.55) / 0.45;
        const current = targetRpm - (targetRpm - idleRpm) * Math.pow(decProgress, 1.6);
        this.setRpm(current);
        callbackRpm?.(current);
      } else {
        if (this.revTimer) clearInterval(this.revTimer);
        this.revTimer = null;
        this.setRpm(idleRpm);
        callbackRpm?.(idleRpm);
      }
    }, 50);
  }

  private static async playOneShotRev() {
    if (!this.ctx || !this.masterGain) return;
    try {
      // pour un coup d'accéléro, on préfère le sample dédié si dispo
      const key: SampleKey = this.isCustomSample(this.sampleKey)
        ? this.sampleKey
        : this.sampleKey === 'idle' ? 'muscle'
        : this.sampleKey === 'v12' ? 'v12'
        : this.sampleKey === 'flat6' ? 'flat6'
        : this.sampleKey === 'v8' ? 'v8'
        : this.sampleKey;

      const buffer = await this.loadBuffer(SAMPLE_FILES[key], this.isCustomSample(key) ? 20 : 6);
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;

      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 1;
      const g = this.ctx.createGain();
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.7, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, now + Math.min(5.5, buffer.duration));
      src.connect(g);
      g.connect(this.masterGain);
      src.start(now);
      src.stop(now + Math.min(5.5, buffer.duration));
    } catch {
      // silencieux si le sample one-shot échoue
    }
  }

  public static stop() {
    if (this.revTimer) {
      clearInterval(this.revTimer);
      this.revTimer = null;
    }

    const now = this.ctx?.currentTime ?? 0;
    try {
      if (this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(0.001, now, 0.05);
      }
    } catch {
      // déjà stop
    }

    window.setTimeout(() => {
      try { this.loopSource?.stop(); } catch { /* ignore */ }
      try { this.oneShotSource?.stop(); } catch { /* ignore */ }
      this.loopSource?.disconnect();
      this.oneShotSource?.disconnect();
      this.loopGain?.disconnect();
      this.filter?.disconnect();
      this.masterGain?.disconnect();

      this.loopSource = null;
      this.oneShotSource = null;
      this.loopGain = null;
      this.filter = null;
      this.masterGain = null;
      this.isPlaying = false;
    }, 120);
  }

  public static getActiveStatus(): boolean {
    return this.isPlaying;
  }

  public static getCurrentEngine(): Partial<Engine> | null {
    return this.currentEngine;
  }
}
