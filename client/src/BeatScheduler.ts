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
    
    // Create tick sound - sharp, percussive click with softer volume
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.02 }
    });
    
    // Add gain node to control volume - set to 30% of original volume
    const gainNode = new Tone.Gain(0.3);
    synth.connect(gainNode);
    gainNode.toDestination();
    
    // Load background music using ArrayBuffer approach
    try {
      console.log('Attempting to load background music...');
      
      // Fetch the file as ArrayBuffer for better control
      const response = await fetch("/music/dandelion.mp3");
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
      console.log('Background music loaded successfully');
    } catch (error) {
      console.error('Background music loading failed:', error);
      console.log('Continuing without background music...');
      this.backgroundMusic = null;
    }
    
    Tone.Transport.bpm.value = this.initialBPM;
    
    // Schedule beat callbacks on every quarter note with precise timing
    Tone.Transport.scheduleRepeat((time) => {
      // Only play tick sound on even beats (beatCount % 2 === 0)
      if (this.beatCount % 2 === 0) {
        synth.triggerAttackRelease('C5', '64n', time);
      }
      
      // The callback will handle logging with word info
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
      this.backgroundMusic.start();
      console.log('Background music start() called');
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