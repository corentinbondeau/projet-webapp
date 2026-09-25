import { Engine, EngineConfiguration } from '../types/engine';

/**
 * Simulateur audio haute-fidélité et velouté pour moteurs de voitures.
 * Utilise la synthèse soustractive et additive via l'API Web Audio standard :
 * - Calcul des ordres d'allumage physiques (V12, V10, V8, Flat-6, 5 en ligne, etc.)
 * - Étage de saturation douce (soft clipping par tanh) sans distorsion numérique agressive
 * - Compresseur dynamique de studio (DynamicsCompressorNode) pour éliminer toute saturation/clipping
 * - Filtrage acoustique d'échappement progressif
 */
export class AudioEngineSimulator {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static compressor: DynamicsCompressorNode | null = null;

  // Oscillateurs pour la texture de combustion
  private static osc1: OscillatorNode | null = null; // Fondamentale d'allumage
  private static osc2: OscillatorNode | null = null; // Harmonique d'ordre 2
  private static osc3: OscillatorNode | null = null; // Sous-harmonique carter / basse
  private static osc4: OscillatorNode | null = null; // Harmonique supérieure / timbre
  private static lfo: OscillatorNode | null = null;  // LFO de battement syncopé (5-cylindres)
  private static lfoGain: GainNode | null = null;

  // Suralimentation (Sifflement de turbo feutré)
  private static turboNoise: AudioBufferSourceNode | null = null;
  private static turboFilter: BiquadFilterNode | null = null;
  private static turboGain: GainNode | null = null;

  // Filtres acoustiques d'échappement
  private static exhaustFilter: BiquadFilterNode | null = null;
  private static waveShaper: WaveShaperNode | null = null;

  // État
  private static isPlaying: boolean = false;
  private static currentEngine: Partial<Engine> | null = null;
  private static currentRpm: number = 800;
  private static idleRpm: number = 800;
  private static maxRpm: number = 8500;
  private static isElectric: boolean = false;
  private static isTurbo: boolean = false;
  private static config: EngineConfiguration = 'V8';

  private static initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Courbe de saturation douce type lampe analogique (tanh)
   * Évite complètement le clipping numérique désagréable.
   */
  private static makeSoftSaturationCurve(): Float32Array {
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const drive = 1.15;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    return curve;
  }

  /**
   * Génère un buffer de bruit blanc pour le turbo
   */
  private static createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  /**
   * Démarre la simulation sonore d'un moteur
   */
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
    this.config = engine.configuration || 'V8';
    this.isElectric = engine.configuration === 'Électrique' || engine.fuel === 'Électrique';
    this.isTurbo = ['Turbo', 'Bi-Turbo', 'Quad-Turbo'].includes(engine.aspiration || '');
    this.maxRpm = engine.maxRpm || 8500;
    this.idleRpm = this.isElectric ? 0 : Math.round(this.maxRpm * 0.11);
    this.currentRpm = this.idleRpm;

    const now = this.ctx.currentTime;

    // 1. Compresseur Dynamique de Studio (Anti-saturation / Limiteur)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, now);
    this.compressor.knee.setValueAtTime(12, now);
    this.compressor.ratio.setValueAtTime(8, now);
    this.compressor.attack.setValueAtTime(0.005, now);
    this.compressor.release.setValueAtTime(0.12, now);

    // 2. Master Gain équilibré
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.16, now + 0.12);

    // 3. Traitement analogique doux (WaveShaper)
    this.waveShaper = this.ctx.createWaveShaper();
    this.waveShaper.curve = this.makeSoftSaturationCurve() as any;
    this.waveShaper.oversample = '4x';

    // 4. Filtre acoustique d'échappement (Passe-bas soyeux)
    this.exhaustFilter = this.ctx.createBiquadFilter();
    this.exhaustFilter.type = 'lowpass';
    this.exhaustFilter.frequency.setValueAtTime(450, now);
    this.exhaustFilter.Q.setValueAtTime(1.2, now);

    // 5. Configuration des oscillateurs selon l'architecture
    this.setupOscillators();

    // 6. Turbo feutré si applicable
    if (this.isTurbo && !this.isElectric) {
      this.setupTurbo();
    }

    // 7. Connexions audio protégées contre la saturation
    this.waveShaper.connect(this.exhaustFilter);
    this.exhaustFilter.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.updateFrequency();
    this.isPlaying = true;
  }

  /**
   * Configure les couches d'oscillateurs avec des gains équilibrés
   */
  private static setupOscillators() {
    if (!this.ctx || !this.waveShaper) return;

    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.osc3 = this.ctx.createOscillator();
    this.osc4 = this.ctx.createOscillator();

    const g1 = this.ctx.createGain();
    const g2 = this.ctx.createGain();
    const g3 = this.ctx.createGain();
    const g4 = this.ctx.createGain();

    if (this.isElectric) {
      // ÉLECTRIQUE : Ondes sinusoïdales douces + sifflement d'onduleur
      this.osc1.type = 'sine';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sine';
      this.osc4.type = 'sine';

      g1.gain.value = 0.22;
      g2.gain.value = 0.10;
      g3.gain.value = 0.08;
      g4.gain.value = 0.05;
    } else if (this.config === 'Rotatif') {
      // ROTATIF (WANKEL) : Son continu rapide
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sine';
      this.osc4.type = 'triangle';

      g1.gain.value = 0.18;
      g2.gain.value = 0.12;
      g3.gain.value = 0.10;
      g4.gain.value = 0.06;
    } else if (this.config === 'V12') {
      // V12 : Sonorité riche, pure et symphonique
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sine';
      this.osc4.type = 'sawtooth';

      g1.gain.value = 0.16;
      g2.gain.value = 0.14;
      g3.gain.value = 0.12;
      g4.gain.value = 0.06;
    } else if (this.config === 'V10') {
      // V10 : Cri F1 wailing
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sawtooth';
      this.osc4.type = 'sine';

      g1.gain.value = 0.18;
      g2.gain.value = 0.12;
      g3.gain.value = 0.10;
      g4.gain.value = 0.05;
    } else if (this.config === '5 en ligne') {
      // 5 EN LIGNE : Son syncopé (Audi RS3)
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sawtooth';
      this.osc4.type = 'sine';

      g1.gain.value = 0.18;
      g2.gain.value = 0.12;
      g3.gain.value = 0.10;
      g4.gain.value = 0.05;

      // Battement 5 cylindres
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.value = 2.5;
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.osc1.frequency);
      this.lfo.start();
    } else if (this.config === 'Flat-6') {
      // FLAT-6 (Porsche Boxer) : Timbre rauque mais propre
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sine';
      this.osc4.type = 'sawtooth';

      g1.gain.value = 0.18;
      g2.gain.value = 0.12;
      g3.gain.value = 0.12;
      g4.gain.value = 0.06;
    } else if (this.config === 'W16') {
      // W16 : Grondement grave et velouté
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sine';
      this.osc4.type = 'sine';

      g1.gain.value = 0.15;
      g2.gain.value = 0.10;
      g3.gain.value = 0.18; // Sub-bass rond
      g4.gain.value = 0.04;
    } else {
      // V8, 6 en ligne, 4 en ligne
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sine';
      this.osc4.type = 'triangle';

      g1.gain.value = 0.18;
      g2.gain.value = 0.12;
      g3.gain.value = 0.12;
      g4.gain.value = 0.05;
    }

    this.osc1.connect(g1);
    this.osc2.connect(g2);
    this.osc3.connect(g3);
    this.osc4.connect(g4);

    g1.connect(this.waveShaper);
    g2.connect(this.waveShaper);
    g3.connect(this.waveShaper);
    g4.connect(this.waveShaper);

    this.osc1.start();
    this.osc2.start();
    this.osc3.start();
    this.osc4.start();
  }

  /**
   * Suralimentation : souffle feutré sans bruit strident
   */
  private static setupTurbo() {
    if (!this.ctx || !this.compressor) return;

    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    this.turboNoise = this.ctx.createBufferSource();
    this.turboNoise.buffer = noiseBuffer;
    this.turboNoise.loop = true;

    this.turboFilter = this.ctx.createBiquadFilter();
    this.turboFilter.type = 'bandpass';
    this.turboFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    this.turboFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.turboNoise.connect(this.turboFilter);
    this.turboFilter.connect(this.turboGain);
    this.turboGain.connect(this.compressor);

    this.turboNoise.start();
  }

  /**
   * Décharge de turbo au lever de pied (Blow-off valve feutrée)
   */
  private static triggerBlowOffValve() {
    if (!this.ctx || !this.isTurbo || this.isElectric || !this.compressor) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const bovSource = this.ctx.createBufferSource();
    bovSource.buffer = noiseBuffer;

    const bovFilter = this.ctx.createBiquadFilter();
    bovFilter.type = 'bandpass';
    bovFilter.frequency.setValueAtTime(3000, now);
    bovFilter.Q.setValueAtTime(2.5, now);

    const bovGain = this.ctx.createGain();
    bovGain.gain.setValueAtTime(0.08, now);
    bovGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    bovSource.connect(bovFilter);
    bovFilter.connect(bovGain);
    bovGain.connect(this.compressor);

    bovSource.start(now);
    bovSource.stop(now + 0.3);
  }

  /**
   * Ordre d'allumage par configuration
   */
  private static getPulsesPerRevolution(config: EngineConfiguration): number {
    switch (config) {
      case '4 en ligne':
      case 'Flat-4':
        return 2.0;
      case '5 en ligne':
        return 2.5;
      case '6 en ligne':
      case 'Flat-6':
      case 'V6':
        return 3.0;
      case 'V8':
        return 4.0;
      case 'V10':
        return 5.0;
      case 'V12':
        return 6.0;
      case 'W16':
        return 8.0;
      case 'Rotatif':
        return 3.0;
      default:
        return 3.0;
    }
  }

  /**
   * Ajuste le régime moteur en temps réel
   */
  public static setRpm(rpm: number) {
    this.currentRpm = Math.max(0, Math.min(rpm, this.maxRpm));
    if (this.isPlaying) {
      this.updateFrequency();
    }
  }

  /**
   * Met à jour les fréquences et les filtres de façon fluide
   */
  private static updateFrequency() {
    if (!this.ctx || !this.osc1 || !this.osc2 || !this.osc3 || !this.osc4 || !this.exhaustFilter) return;

    const now = this.ctx.currentTime;
    const rpm = this.currentRpm;
    const rpmRatio = Math.max(0.01, rpm / this.maxRpm);

    if (this.isElectric) {
      // ÉLECTRIQUE : Fréquence pure
      const inverterFreq = 180 + (rpm * 0.12);
      this.osc1.frequency.setTargetAtTime(inverterFreq, now, 0.04);
      this.osc2.frequency.setTargetAtTime(inverterFreq * 2.0, now, 0.04);
      this.osc3.frequency.setTargetAtTime(inverterFreq * 0.5, now, 0.04);
      this.osc4.frequency.setTargetAtTime(inverterFreq * 3.0, now, 0.04);

      const filterFreq = 400 + (rpmRatio * 3200);
      this.exhaustFilter.frequency.setTargetAtTime(filterFreq, now, 0.04);
      return;
    }

    // MOTEURS THERMIQUES & ROTATIFS
    const pulsesPerRev = this.getPulsesPerRevolution(this.config);
    const baseFiringFreq = Math.max(22, (rpm / 60) * pulsesPerRev);

    if (this.config === 'V12') {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 2.0, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 3.0, now, 0.035);
    } else if (this.config === 'V10') {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 2.0, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 2.5, now, 0.035);
    } else if (this.config === '5 en ligne') {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 1.5, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 2.5, now, 0.035);

      if (this.lfo) {
        this.lfo.frequency.setTargetAtTime(rpm / 140, now, 0.04);
      }
    } else if (this.config === 'Flat-6') {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 2.0, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 3.0, now, 0.035);
    } else {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 2.0, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 3.0, now, 0.035);
    }

    // Filtre acoustique progressif sans agressivité
    const exhaustCutoff = 220 + (rpmRatio * 1600);
    this.exhaustFilter.frequency.setTargetAtTime(exhaustCutoff, now, 0.04);

    // Turbo modéré
    if (this.isTurbo && this.turboFilter && this.turboGain) {
      const turboFreq = 1800 + (rpmRatio * 4200);
      this.turboFilter.frequency.setTargetAtTime(turboFreq, now, 0.05);

      const turboVolume = Math.pow(rpmRatio, 2.0) * 0.06;
      this.turboGain.gain.setTargetAtTime(turboVolume, now, 0.05);
    }
  }

  /**
   * Coup d'accélérateur réaliste
   */
  public static revUp(callbackRpm?: (rpm: number) => void) {
    if (!this.isPlaying) return;
    const targetRpm = Math.round(this.maxRpm * 0.94);
    const idleRpm = this.idleRpm;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      if (progress <= 0.45) {
        // Montée
        const current = idleRpm + (targetRpm - idleRpm) * Math.sin((progress / 0.45) * (Math.PI / 2));
        this.setRpm(current);
        callbackRpm?.(current);
      } else if (progress <= 0.55) {
        // Rupteur
        const current = targetRpm + (Math.random() - 0.5) * (this.maxRpm * 0.02);
        this.setRpm(current);
        callbackRpm?.(current);
      } else if (progress <= 1.0) {
        // Descente
        if (progress === 0.60 && this.isTurbo) {
          this.triggerBlowOffValve();
        }
        const decProgress = (progress - 0.55) / 0.45;
        const current = targetRpm - (targetRpm - idleRpm) * Math.pow(decProgress, 1.6);
        this.setRpm(current);
        callbackRpm?.(current);
      } else {
        clearInterval(interval);
        this.setRpm(idleRpm);
        callbackRpm?.(idleRpm);
      }
    }, 25);
  }

  /**
   * Arrêt doux
   */
  public static stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.osc3?.stop();
          this.osc4?.stop();
          this.lfo?.stop();
          this.turboNoise?.stop();

          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.osc3?.disconnect();
          this.osc4?.disconnect();
          this.lfo?.disconnect();
          this.lfoGain?.disconnect();
          this.turboNoise?.disconnect();
          this.turboFilter?.disconnect();
          this.turboGain?.disconnect();
          this.waveShaper?.disconnect();
          this.exhaustFilter?.disconnect();
          this.compressor?.disconnect();
          this.masterGain?.disconnect();
        } catch {
          // Déjà arrêté
        }
        this.isPlaying = false;
        this.currentEngine = null;
      }, 130);
    } catch {
      this.isPlaying = false;
      this.currentEngine = null;
    }
  }

  public static getActiveStatus(): boolean {
    return this.isPlaying;
  }

  public static getCurrentEngine(): Partial<Engine> | null {
    return this.currentEngine;
  }
}
