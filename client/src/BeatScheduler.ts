import * as Tone from 'tone';

export interface BeatEvent {
  timestamp: number;
  audioTime: number;
}

export class BeatScheduler {
  private callbacks: Set<(event: BeatEvent) => void> = new Set();
  private isStarted = false;
  private beatCount = 0;
  private instrumentalTrack: Tone.Player | null = null;
  private vocalTrack: Tone.Player | null = null;

  constructor(private initialBPM: number = 73) {
    // Only set initial state - no external operations
  }

  private async initializeTransport() {
    await Tone.start();
    
    // Set master volume to audible level
    Tone.getDestination().volume.value = -6; // -6dB master volume
    
    // Load both instrumental and vocal tracks
    try {
      // Load instrumental track
      const instrumentalResponse = await fetch("/music/dandelion.mp3");
      if (!instrumentalResponse.ok) {
        throw new Error(`Failed to fetch instrumental: ${instrumentalResponse.status}`);
      }
      const instrumentalBuffer = await instrumentalResponse.arrayBuffer();
      const instrumentalAudioBuffer = await Tone.getContext().decodeAudioData(instrumentalBuffer);
      
      this.instrumentalTrack = new Tone.Player(instrumentalAudioBuffer).toDestination();
      this.instrumentalTrack.volume.value = -6; // Start at full instrumental volume
      this.instrumentalTrack.loop = true;
      
      // Load vocal track
      const vocalResponse = await fetch("/music/dandelion_full.mp3");
      if (!vocalResponse.ok) {
        throw new Error(`Failed to fetch vocal: ${vocalResponse.status}`);
      }
      const vocalBuffer = await vocalResponse.arrayBuffer();
      const vocalAudioBuffer = await Tone.getContext().decodeAudioData(vocalBuffer);
      
      this.vocalTrack = new Tone.Player(vocalAudioBuffer).toDestination();
      this.vocalTrack.volume.value = -Infinity; // Start muted (crossfader at 0)
      this.vocalTrack.loop = true;
    } catch (error) {
      console.error('Audio track loading failed:', error);
      this.instrumentalTrack = null;
      this.vocalTrack = null;
    }
    
    Tone.Transport.bpm.value = this.initialBPM;
    
    // Schedule beat callbacks on every quarter note with precise timing
    Tone.Transport.scheduleRepeat((time) => {
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
    
    // Start both tracks if loaded and ready
    if (this.instrumentalTrack) {
      this.instrumentalTrack.sync().start(0);
    }
    if (this.vocalTrack) {
      this.vocalTrack.sync().start(0);
    }
    
    Tone.Transport.start();
  }

  stop() {
    Tone.Transport.stop();
    
    // Stop both tracks if playing
    if (this.instrumentalTrack) {
      this.instrumentalTrack.stop();
    }
    if (this.vocalTrack) {
      this.vocalTrack.stop();
    }
    
    this.isStarted = false; // Allow restart
  }

  pause() {
    Tone.Transport.pause();
  }

  resume() {
    Tone.Transport.start();
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

  setVocalsEnabled(enabled: boolean) {
    if (this.instrumentalTrack) {
      this.instrumentalTrack.volume.value = enabled ? -Infinity : -6;
    }
    
    if (this.vocalTrack) {
      this.vocalTrack.volume.value = enabled ? -6 : -Infinity;
    }
  }

  dispose() {
    this.callbacks.clear();
    Tone.Transport.cancel();
  }
}