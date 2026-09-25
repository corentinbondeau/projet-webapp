import { Engine, EngineConfiguration } from '../types/engine';

/**
 * Simulateur audio haute-fidélité de moteurs thermiques, rotatifs et électriques
 * basé sur l'API Web Audio standard.
 *
 * Implémente la physique acoustique réelle de chaque configuration :
 * - Fréquence d'allumage par tour de vilebrequin (ex. V12: 6 pul/tour, V8: 4 pul/tour, Flat-6: 3 pul/tour, I5: 2.5 pul/tour)
 * - Harmoniques et timbres spécifiques (Ferrari V12 lyrique, Boxer Porsche rauque, 5-cylindres Audi syncopé, Rotatif Mazda strident, Électrique Tesla)
 * - Sifflement de turbo dynamique et soupape de décharge (Blow-off valve / Wastegate flutter)
 * - Résonance acoustique d'échappement par filtrage formant et saturation non-linéaire (WaveShaper)
 */
export class AudioEngineSimulator {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;

  // Oscillateurs principaux pour les harmoniques de combustion
  private static osc1: OscillatorNode | null = null; // Fondamentale / ordre principal
  private static osc2: OscillatorNode | null = null; // Harmonique d'ordre supérieur
  private static osc3: OscillatorNode | null = null; // Sous-harmonique / grondement de carter
  private static osc4: OscillatorNode | null = null; // Harmonique métallique / timbre aigu
  private static lfo: OscillatorNode | null = null;  // LFO pour le grondement irrégulier (ex. 5 cylindres)
  private static lfoGain: GainNode | null = null;

  // Suralimentation : Bruit blanc + filtre passe-bande résonant (Sifflement Turbo)
  private static turboNoise: AudioBufferSourceNode | null = null;
  private static turboFilter: BiquadFilterNode | null = null;
  private static turboGain: GainNode | null = null;

  // Traitement d'échappement et distorsion
  private static exhaustFilter: BiquadFilterNode | null = null;
  private static waveShaper: WaveShaperNode | null = null;

  // État du moteur en cours de simulation
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
   * Crée une courbe de distorsion douce pour imiter la saturation du collecteur d'échappement
   */
  private static makeDistortionCurve(amount: number = 20): Float32Array {
    const k = typeof amount === 'number' ? amount : 20;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Génère un buffer de bruit blanc réutilisable pour le turbo et les bruits d'aspiration
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
   * Démarre la simulation sonore d'un moteur avec ses caractéristiques physiques
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
        name: 'Moteur Générique'
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

    // 1. Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.3, now + 0.12);

    // 2. Traitement d'échappement (Saturation & Filtre de résonance)
    this.waveShaper = this.ctx.createWaveShaper();
    const distortionAmount = this.isElectric ? 0 : this.getDistortionAmount(this.config);
    this.waveShaper.curve = this.makeDistortionCurve(distortionAmount) as any;
    this.waveShaper.oversample = '4x';

    this.exhaustFilter = this.ctx.createBiquadFilter();
    this.exhaustFilter.type = this.isElectric ? 'lowpass' : 'peaking';
    this.exhaustFilter.gain.setValueAtTime(4, now);
    this.exhaustFilter.Q.setValueAtTime(this.isElectric ? 1 : 3.5, now);

    // 3. Configuration des oscillateurs selon l'architecture du moteur
    this.setupOscillators();

    // 4. Configuration de la suralimentation (Turbo) si applicable
    if (this.isTurbo && !this.isElectric) {
      this.setupTurbo();
    }

    // 5. Connexions du pipeline audio
    this.waveShaper.connect(this.exhaustFilter);
    this.exhaustFilter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.updateFrequency();

    this.isPlaying = true;
  }

  /**
   * Configure les oscillateurs selon l'architecture (V12, Flat-6, V10, V8, 5 en ligne, Rotatif, Électrique)
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
      // MOTEUR ÉLECTRIQUE : Ondes pures sinusoïdales / harmoniques de champ magnétique
      this.osc1.type = 'sine';     // Whine principal de l'onduleur
      this.osc2.type = 'triangle'; // Harmonique d'engrenage
      this.osc3.type = 'sine';     // Sub-harmonic magnétique
      this.osc4.type = 'sine';     // Ultra-high pitch sifflement

      g1.gain.value = 0.55;
      g2.gain.value = 0.25;
      g3.gain.value = 0.20;
      g4.gain.value = 0.15;
    } else if (this.config === 'Rotatif') {
      // MOTEUR ROTATIF (WANKEL) : Son strident type tronçonneuse / turbine
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'sawtooth';
      this.osc3.type = 'triangle';
      this.osc4.type = 'sawtooth';

      g1.gain.value = 0.45;
      g2.gain.value = 0.35;
      g3.gain.value = 0.25;
      g4.gain.value = 0.20;
    } else if (this.config === 'V12') {
      // V12 : Symphonie aiguë et musicale (6 explosions / tour)
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'sawtooth';
      this.osc3.type = 'triangle';
      this.osc4.type = 'sawtooth';

      g1.gain.value = 0.45;
      g2.gain.value = 0.35;
      g3.gain.value = 0.30;
      g4.gain.value = 0.25;
    } else if (this.config === 'V10') {
      // V10 : Cri F1 wailing avec harmoniques impaires
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'sawtooth';
      this.osc3.type = 'sawtooth';
      this.osc4.type = 'triangle';

      g1.gain.value = 0.50;
      g2.gain.value = 0.35;
      g3.gain.value = 0.25;
      g4.gain.value = 0.20;
    } else if (this.config === '5 en ligne') {
      // 5 EN LIGNE (Audi Quattro / RS3) : Son syncopé inimitable (1-2-4-5-3)
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sawtooth';
      this.osc4.type = 'sawtooth';

      g1.gain.value = 0.45;
      g2.gain.value = 0.35;
      g3.gain.value = 0.30;
      g4.gain.value = 0.20;

      // LFO pour moduler l'irrégularité caractéristique du 5 cylindres
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.value = 4.0;
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.osc1.frequency);
      this.lfo.start();
    } else if (this.config === 'Flat-6') {
      // FLAT-6 (Porsche Boxer) : Timbre rauque et métallique avec annulation des forces
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sawtooth';
      this.osc4.type = 'sawtooth';

      g1.gain.value = 0.50;
      g2.gain.value = 0.35;
      g3.gain.value = 0.30;
      g4.gain.value = 0.25;
    } else if (this.config === 'W16') {
      // W16 (Bugatti) : Mur de basse titanesque (8 explosions / tour)
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'sawtooth';
      this.osc3.type = 'sawtooth';
      this.osc4.type = 'triangle';

      g1.gain.value = 0.40;
      g2.gain.value = 0.30;
      g3.gain.value = 0.50; // Grondement sub-bass colossal
      g4.gain.value = 0.20;
    } else {
      // V8, 6 en ligne, 4 en ligne, etc.
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'sawtooth';
      this.osc4.type = 'sawtooth';

      g1.gain.value = 0.50;
      g2.gain.value = 0.35;
      g3.gain.value = 0.30;
      g4.gain.value = 0.15;
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
   * Configure le système de suralimentation (Sifflement de turbo)
   */
  private static setupTurbo() {
    if (!this.ctx || !this.waveShaper) return;

    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    this.turboNoise = this.ctx.createBufferSource();
    this.turboNoise.buffer = noiseBuffer;
    this.turboNoise.loop = true;

    this.turboFilter = this.ctx.createBiquadFilter();
    this.turboFilter.type = 'bandpass';
    this.turboFilter.frequency.setValueAtTime(2500, this.ctx.currentTime);
    this.turboFilter.Q.setValueAtTime(5.0, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.turboNoise.connect(this.turboFilter);
    this.turboFilter.connect(this.turboGain);
    this.turboGain.connect(this.waveShaper);

    this.turboNoise.start();
  }

  /**
   * Renvoie le degré de saturation du collecteur selon la configuration
   */
  private static getDistortionAmount(config: EngineConfiguration): number {
    switch (config) {
      case 'Flat-6': return 35; // Très métallique
      case 'V10': return 30;    // F1 criard
      case 'V12': return 22;    // Pur et lyrique
      case 'Rotatif': return 40;// Très agressif
      case '5 en ligne': return 28;
      case 'W16': return 18;
      default: return 20;
    }
  }

  /**
   * Calcule le nombre d'explosions par tour de vilebrequin (Cylinder Firing Order)
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
   * Met à jour le régime moteur (RPM) en temps réel
   */
  public static setRpm(rpm: number) {
    this.currentRpm = Math.max(0, Math.min(rpm, this.maxRpm));
    if (this.isPlaying) {
      this.updateFrequency();
    }
  }

  /**
   * Met à jour les fréquences des oscillateurs et les filtres selon le régime (RPM)
   */
  private static updateFrequency() {
    if (!this.ctx || !this.osc1 || !this.osc2 || !this.osc3 || !this.osc4 || !this.exhaustFilter) return;

    const now = this.ctx.currentTime;
    const rpm = this.currentRpm;
    const rpmRatio = Math.max(0.01, rpm / this.maxRpm);

    if (this.isElectric) {
      // --- SYNTHÈSE MOTEUR ÉLECTRIQUE ---
      // Fréquence directement proportionnelle au régime très élevé (jusqu'à 20 000 tr/min)
      const inverterFreq = 220 + (rpm * 0.18); // 220 Hz à l'arrêt -> 3800 Hz à 20 000 tr/min
      this.osc1.frequency.setTargetAtTime(inverterFreq, now, 0.04);
      this.osc2.frequency.setTargetAtTime(inverterFreq * 2.0, now, 0.04);
      this.osc3.frequency.setTargetAtTime(inverterFreq * 0.5, now, 0.04);
      this.osc4.frequency.setTargetAtTime(inverterFreq * 3.0, now, 0.04);

      // Filtre passe-bas doux
      const filterFreq = 600 + (rpmRatio * 5000);
      this.exhaustFilter.frequency.setTargetAtTime(filterFreq, now, 0.04);
      return;
    }

    // --- SYNTHÈSE MOTEURS THERMIQUES & ROTATIFS ---
    const pulsesPerRev = this.getPulsesPerRevolution(this.config);
    // Fréquence fondamentale réelle d'allumage : f = (RPM / 60) * pulsesPerRev
    const baseFiringFreq = Math.max(18, (rpm / 60) * pulsesPerRev);

    // Modulation selon la configuration
    if (this.config === 'V12') {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 2.0, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 3.0, now, 0.035);
    } else if (this.config === 'V10') {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 2.0, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 2.5, now, 0.035); // Signature impaire V10
    } else if (this.config === '5 en ligne') {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 1.5, now, 0.035); // Battement 1.5x
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 2.5, now, 0.035);

      if (this.lfo) {
        this.lfo.frequency.setTargetAtTime(rpm / 120, now, 0.04);
      }
    } else if (this.config === 'Rotatif') {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq * 1.5, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 3.0, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.75, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 4.5, now, 0.035);
    } else if (this.config === 'Flat-6') {
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 2.0, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 4.0, now, 0.035); // Aigu métallique Porsche
    } else {
      // V8, 6 en ligne, 4 en ligne
      this.osc1.frequency.setTargetAtTime(baseFiringFreq, now, 0.035);
      this.osc2.frequency.setTargetAtTime(baseFiringFreq * 2.0, now, 0.035);
      this.osc3.frequency.setTargetAtTime(baseFiringFreq * 0.5, now, 0.035);
      this.osc4.frequency.setTargetAtTime(baseFiringFreq * 3.0, now, 0.035);
    }

    // Résonance d'échappement qui s'ouvre à plein régime
    const exhaustCutoff = 250 + (rpmRatio * 2400);
    this.exhaustFilter.frequency.setTargetAtTime(exhaustCutoff, now, 0.04);

    // Sifflement de turbo proportionnel à la charge et au régime
    if (this.isTurbo && this.turboFilter && this.turboGain) {
      const turboFreq = 1800 + (rpmRatio * 5500); // 1.8 kHz -> 7.3 kHz
      this.turboFilter.frequency.setTargetAtTime(turboFreq, now, 0.05);

      const turboVolume = Math.pow(rpmRatio, 2.2) * 0.18;
      this.turboGain.gain.setTargetAtTime(turboVolume, now, 0.05);
    }
  }

  /**
   * Joue un son de décharge de turbo (Blow-Off Valve / Wastegate Flutter)
   */
  private static triggerBlowOffValve() {
    if (!this.ctx || !this.isTurbo || this.isElectric) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const bovSource = this.ctx.createBufferSource();
    bovSource.buffer = noiseBuffer;

    const bovFilter = this.ctx.createBiquadFilter();
    bovFilter.type = 'bandpass';
    bovFilter.frequency.setValueAtTime(3500, now);
    bovFilter.Q.setValueAtTime(4.0, now);

    const bovGain = this.ctx.createGain();
    bovGain.gain.setValueAtTime(0.2, now);
    // Décharge en sifflement pulsé ("psssht-tsu-tsu")
    bovGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    bovSource.connect(bovFilter);
    bovFilter.connect(bovGain);
    bovGain.connect(this.ctx.destination);

    bovSource.start(now);
    bovSource.stop(now + 0.4);
  }

  /**
   * Donne un coup d'accélérateur réaliste (Montée fulgurante, rupteur et redescente)
   */
  public static revUp(callbackRpm?: (rpm: number) => void) {
    if (!this.isPlaying) return;
    const targetRpm = Math.round(this.maxRpm * 0.96);
    const idleRpm = this.idleRpm;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      if (progress <= 0.45) {
        // Accélération franche
        const current = idleRpm + (targetRpm - idleRpm) * Math.sin((progress / 0.45) * (Math.PI / 2));
        this.setRpm(current);
        callbackRpm?.(current);
      } else if (progress <= 0.55) {
        // Rupture en zone rouge
        const jitter = (Math.random() - 0.5) * (this.maxRpm * 0.04);
        const current = targetRpm + jitter;
        this.setRpm(current);
        callbackRpm?.(current);
      } else if (progress <= 1.0) {
        // Relâchement de l'accélérateur
        if (progress === 0.60 && this.isTurbo) {
          this.triggerBlowOffValve();
        }
        const decProgress = (progress - 0.55) / 0.45;
        const current = targetRpm - (targetRpm - idleRpm) * Math.pow(decProgress, 1.8);
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
   * Arrête le moteur avec un fondu doux
   */
  public static stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

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
          this.masterGain?.disconnect();
        } catch {
          // Ignorer si déjà arrêté
        }
        this.isPlaying = false;
        this.currentEngine = null;
      }, 160);
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
