class SoundManager {
  private audioCtx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  public enabled: boolean = true;

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playTone(freq: number, duration: number = 0.15, type: OscillatorType = 'triangle', gainVal: number = 0.08) {
    if (!this.enabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio playback failsafe
    }
  }

  public playSFX(name: 'jump' | 'select' | 'correct' | 'wrong' | 'coin') {
    if (!this.enabled) return;
    if (name === 'jump') {
      this.playTone(320, 0.12, 'sine', 0.12);
      setTimeout(() => this.playTone(520, 0.16, 'sine', 0.1), 60);
    } else if (name === 'select') {
      this.playTone(600, 0.08, 'triangle', 0.08);
    } else if (name === 'correct') {
      this.playTone(523.25, 0.12, 'triangle', 0.12);
      setTimeout(() => this.playTone(659.25, 0.12, 'triangle', 0.12), 100);
      setTimeout(() => this.playTone(783.99, 0.25, 'triangle', 0.14), 200);
    } else if (name === 'wrong') {
      this.playTone(240, 0.18, 'sawtooth', 0.09);
      setTimeout(() => this.playTone(180, 0.25, 'sawtooth', 0.09), 140);
    } else if (name === 'coin') {
      this.playTone(987.77, 0.08, 'sine', 0.1);
      setTimeout(() => this.playTone(1318.51, 0.2, 'sine', 0.12), 75);
    }
  }

  public startBGM() {
    if (this.bgmInterval) window.clearInterval(this.bgmInterval);
    const melody = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1046, 880, 784, 659, 587];
    this.bgmInterval = window.setInterval(() => {
      if (!this.enabled || document.hidden) return;
      const note = melody[this.bgmStep % melody.length];
      this.playTone(note, 0.22, 'sine', 0.025);
      this.bgmStep++;
    }, 380);
  }

  public stopBGM() {
    if (this.bgmInterval) {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.initAudio();
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.enabled;
  }
}

export const soundManager = new SoundManager();
