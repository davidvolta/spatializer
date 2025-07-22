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
      console.log('Attempting to load background music...');
      
      // Try .wav file instead of .mp3 for better compatibility
      const response = await fetch("/music/dandelion.wav");
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Audio file fetched, size:', arrayBuffer.byteLength, 'bytes');
      
      // Create audio buffer using Web Audio API directly
      const audioBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);
      console.log('Audio decoded successfully:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });
      
      // Create Tone.Player with the decoded buffer
      this.backgroundMusic = new Tone.Player(audioBuffer).toDestination();
      
      // Set audible volume level
      this.backgroundMusic.volume.value = -12; // -12dB should be clearly audible
      
      // Set it to loop
      this.backgroundMusic.loop = true;
      console.log('Background music loaded successfully');
    } catch (error) {
      console.error('Background music loading failed:', error);
      console.log('Continuing without background music...');
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
      console.log('Starting background music...');
      // Sync with Transport for proper timing
      this.backgroundMusic.sync().start(0);
      console.log('Background music synced and started');
    } else {
      console.log('No background music to start');
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
    console.log('Pausing... Transport state:', Tone.Transport.state);
    Tone.Transport.pause();
  }

  resume() {
    console.log('Resuming... Transport state:', Tone.Transport.state);
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