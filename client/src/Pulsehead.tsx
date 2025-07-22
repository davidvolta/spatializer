import { useEffect, useState, useRef } from 'react';
import { BeatScheduler } from './BeatScheduler';
import type { BeatEvent } from './BeatScheduler';
import './Pulsehead.css';

interface PulseheadProps {
  beatScheduler: BeatScheduler;
}

export default function Pulsehead({ beatScheduler }: PulseheadProps) {
  const pulseheadRef = useRef<HTMLDivElement | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [yPosition, setYPosition] = useState(0);

  useEffect(() => {
    // Initialize pulsehead at bottom position (beat 0 peak)
    if (pulseheadRef.current) {
      pulseheadRef.current.style.transform = 'translateY(100px)';
    }
  }, []);

  useEffect(() => {
    let beatCount = 0;
    let animationId: number;
    let startTime = performance.now();

    const animate = () => {
      if (!pulseheadRef.current) return;
      
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      const beatDuration = (60 / 73) * 1000; // ms per beat at 73 BPM
      const progress = (elapsed % beatDuration) / beatDuration;
      const totalBeats = elapsed / beatDuration;
      
      // Continuous sine wave animation
      const sineValue = Math.cos((totalBeats + 1) * Math.PI);
      const yPosition = sineValue * 100; // Flip sign so even beats are at +100px
      
      pulseheadRef.current.style.transform = `translateY(${yPosition}px)`;
      
      animationId = requestAnimationFrame(animate);
    };

    const unsubscribe = beatScheduler.onBeat((event: BeatEvent) => {
      if (!pulseheadRef.current) return;

      // Clear any existing flash timeout
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      // Only flash on even beats (0, 2) - when at bottom of sine wave (+100px)
      if (beatCount % 2 === 0) {
        pulseheadRef.current.classList.add('flashing');
      }
      
      beatCount++;

      // End flash after 150ms
      flashTimeoutRef.current = setTimeout(() => {
        if (pulseheadRef.current) {
          pulseheadRef.current.classList.remove('flashing');
        }
      }, 150);
    });

    // Start animation
    animationId = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      cancelAnimationFrame(animationId);
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [beatScheduler]);

  return (
    <div className="pulsehead-container">
      <div className="reference-lines">
        <div className="reference-line upper"></div>
        <div className="reference-line lower"></div>
      </div>
      <div 
        ref={pulseheadRef}
        className="pulsehead"
        aria-label="Metronome pulse indicator"
      />
    </div>
  );
}