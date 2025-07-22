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
    // Initialize pulsehead at top position (beat 0 peak)
    if (pulseheadRef.current) {
      pulseheadRef.current.style.transform = 'translateY(-100px)';
    }
  }, []);

  useEffect(() => {
    let beatCount = 0;

    const unsubscribe = beatScheduler.onBeat((event: BeatEvent) => {
      if (!pulseheadRef.current) return;

      console.log(`Pulsehead beat ${beatCount}, Y position will be:`, Math.sin(beatCount * Math.PI) * 100);

      // Clear any existing flash timeout
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      // Only flash on odd beats (1, 3) - when at bottom of sine wave (+100px)
      if (beatCount % 2 === 0) {
        pulseheadRef.current.classList.add('flashing');
      }

      // Calculate sine wave Y position (each beat is a peak)
      // Use cosine so beat 0 = top peak (-100px), beat 1 = bottom peak (+100px)
      const sineValue = Math.cos(beatCount * Math.PI);
      const newYPosition = sineValue * -100; // Scale and invert: +1 = -100px (top), -1 = +100px (bottom)
      
      // Update Y position via direct DOM manipulation for sample-accurate timing
      pulseheadRef.current.style.transform = `translateY(${newYPosition}px)`;
      
      beatCount++;

      // End flash after 150ms
      flashTimeoutRef.current = setTimeout(() => {
        if (pulseheadRef.current) {
          pulseheadRef.current.classList.remove('flashing');
        }
      }, 150);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
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