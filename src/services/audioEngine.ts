/**
 * Simulateur audio réaliste de régime moteur basé sur l'API Web Audio standard
 * Génère des harmoniques de moteur (vilebrequin, échappement) sans fichier externe lourd.
 */
export class AudioEngineSimulator {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static osc1: OscillatorNode | null = null;
  private static osc2: OscillatorNode | null = null;
  private static osc3: OscillatorNode | null = null;
  private static filter: BiquadFilterNode | null = null;
  private static isPlaying: boolean = false;
  private static basePitch: number = 500;
  private static currentRpm: number = 800;
  private static maxRpm: number = 8000;

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
   * Démarre la simulation sonore d'un moteur
   */
  public static start(basePitch: number = 500, maxRpm: number = 8500) {
    this.initContext();
    if (!this.ctx) return;
    if (this.isPlaying) this.stop();

    this.basePitch = basePitch;
    this.maxRpm = maxRpm;
    this.currentRpm = Math.round(maxRpm * 0.12); // Ralenti ~900-1000 RPM

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 0.1);

    // Filtre passe-bas pour imiter le pot d'échappement
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(3, this.ctx.currentTime);

    // Oscillateur fondamental (dents de scie pour harmoniques riches de combustion)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';

    // Oscillateur harmonique secondaire (carré adouci)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';

    // Oscillateur sub-bass grondement
    this.osc3 = this.ctx.createOscillator();
    this.osc3.type = 'sawtooth';

    // Gain individuel pour équilibrer
    const g1 = this.ctx.createGain();
    g1.gain.value = 0.5;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.35;
    const g3 = this.ctx.createGain();
    g3.gain.value = 0.25;

    this.osc1.connect(g1);
    this.osc2.connect(g2);
    this.osc3.connect(g3);

    g1.connect(this.filter);
    g2.connect(this.filter);
    g3.connect(this.filter);

    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.updateFrequency();

    this.osc1.start();
    this.osc2.start();
    this.osc3.start();

    this.isPlaying = true;
  }

  /**
   * Met à jour le régime moteur (RPM)
   */
  public static setRpm(rpm: number) {
    this.currentRpm = Math.max(700, Math.min(rpm, this.maxRpm));
    if (this.isPlaying) {
      this.updateFrequency();
    }
  }

  private static updateFrequency() {
    if (!this.ctx || !this.osc1 || !this.osc2 || !this.osc3 || !this.filter) return;

    const rpmRatio = this.currentRpm / this.maxRpm;
    // Fréquence fondamentale liée au RPM et au pitch spécifique du moteur
    const freq = 30 + (this.basePitch * 0.45) * rpmRatio;

    const now = this.ctx.currentTime;
    this.osc1.frequency.setTargetAtTime(freq, now, 0.04);
    this.osc2.frequency.setTargetAtTime(freq * 1.5, now, 0.04);
    this.osc3.frequency.setTargetAtTime(freq * 0.5, now, 0.04);

    // Ouvrir le filtre quand le régime monte (son plus perçant à haut régime)
    const filterFreq = 300 + (rpmRatio * 2800);
    this.filter.frequency.setTargetAtTime(filterFreq, now, 0.04);
  }

  /**
   * Donne un coup d'accélérateur (Rev / Rupture)
   */
  public static revUp(callbackRpm?: (rpm: number) => void) {
    if (!this.isPlaying) return;
    const targetRpm = Math.round(this.maxRpm * 0.95);
    const idleRpm = Math.round(this.maxRpm * 0.12);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.06;
      if (progress <= 0.5) {
        // Montée rapide
        const current = idleRpm + (targetRpm - idleRpm) * (progress / 0.5);
        this.setRpm(current);
        callbackRpm?.(current);
      } else if (progress <= 1.0) {
        // Redescente
        const decProgress = (progress - 0.5) / 0.5;
        const current = targetRpm - (targetRpm - idleRpm) * decProgress;
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
   * Arrête le son avec un fondu doux
   */
  public static stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    try {
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.osc3?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.osc3?.disconnect();
          this.masterGain?.disconnect();
        } catch {
          // Ignorer si déjà arrêté
        }
        this.isPlaying = false;
      }, 160);
    } catch {
      this.isPlaying = false;
    }
  }

  public static getActiveStatus(): boolean {
    return this.isPlaying;
  }
}
