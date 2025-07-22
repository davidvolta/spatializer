import * as Tone from 'tone';

export interface BeatEvent {
  timestamp: number;
  audioTime: number;
}

export class BeatScheduler {
  private callbacks: Set<(event: BeatEvent) => void> = new Set();
  private isStarted = false;
  private beatCount = 0;
  private backgroundMusic: Tone.Player | null = null;

  constructor(private initialBPM: number = 73) {
    // Only set initial state - no external operations
  }

  private async initializeTransport() {
    await Tone.start();
    
    // Set master volume to audible level
    Tone.getDestination().volume.value = -6; // -6dB master volume
    
    // Load background music using ArrayBuffer approach
    try {
      // Try .mp3 file for better mobile compatibility
      const response = await fetch("/music/dandelion.mp3");
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Create audio buffer using Web Audio API directly
      const audioBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);
      
      // Create Tone.Player with the decoded buffer
      this.backgroundMusic = new Tone.Player(audioBuffer).toDestination();
      
      // Set audible volume level
      this.backgroundMusic.volume.value = -12; // -12dB should be clearly audible
      
      // Set it to loop
      this.backgroundMusic.loop = true;
    } catch (error) {
      console.error('Background music loading failed:', error);
      this.backgroundMusic = null;
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
    
    // Start background music if loaded and ready
    if (this.backgroundMusic) {
      // Sync with Transport for proper timing
      this.backgroundMusic.sync().start(0);
    }
    
    Tone.Transport.start();
  }

  stop() {
    Tone.Transport.stop();
    
    // Stop background music if playing
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
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

  dispose() {
    this.callbacks.clear();
    Tone.Transport.cancel();
  }
}