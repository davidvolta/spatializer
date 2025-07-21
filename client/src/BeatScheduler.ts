import * as Tone from 'tone';

export interface BeatEvent {
  timestamp: number;
  audioTime: number;
}

export class BeatScheduler {
  private callbacks: Set<(event: BeatEvent) => void> = new Set();
  private isStarted = false;
  private beatCount = 0;

  constructor(private initialBPM: number = 100) {
    // Only set initial state - no external operations
  }

  private async initializeTransport() {
    await Tone.start();
    
    // Create tick sound - sharp, percussive click
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.02 }
    }).toDestination();
    
    Tone.Transport.bpm.value = this.initialBPM;
    
    // Schedule beat callbacks on every quarter note with precise timing
    Tone.Transport.scheduleRepeat((time) => {
      // Play tick sound at precise time - short percussive hit
      synth.triggerAttackRelease('C5', '64n', time);
      
      console.log(`Beat ${this.beatCount}`);
      this.beatCount++;
      
      const beatEvent: BeatEvent = {
        timestamp: Date.now(),
        audioTime: time
      };

      // Schedule the callback to fire at the precise audio time
      // This uses setTimeout but with Web Audio's precise timing
      const delay = (time - Tone.now()) * 1000; // Convert to milliseconds
      setTimeout(() => {
        this.callbacks.forEach(callback => {
          callback(beatEvent);
        });
      }, Math.max(0, delay));
    }, "4n");
  }

  async start() {
    if (this.isStarted) return; // Guard clause - prevent multiple starts
    
    await this.initializeTransport();
    this.beatCount = 0;
    this.isStarted = true;
    Tone.Transport.start();
  }

  stop() {
    Tone.Transport.stop();
    this.isStarted = false; // Allow restart
  }

  pause() {
    Tone.Transport.pause();
  }

  setBPM(bpm: number) {
    if (bpm >= 60 && bpm <= 200) {
      Tone.Transport.bpm.value = bpm;
    }
  }

  getBPM(): number {
    return Tone.Transport.bpm.value;
  }

  isPlaying(): boolean {
    return Tone.Transport.state === 'started';
  }

  onBeat(callback: (event: BeatEvent) => void) {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  dispose() {
    this.callbacks.clear();
    Tone.Transport.cancel();
  }
}