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

  useEffect(() => {
    const unsubscribe = beatScheduler.onBeat((event: BeatEvent) => {
      if (!pulseheadRef.current) return;

      // Clear any existing flash timeout
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      // Direct DOM manipulation for instant visual response
      pulseheadRef.current.classList.add('flashing');

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
      <div 
        ref={pulseheadRef}
        className="pulsehead"
        aria-label="Metronome pulse indicator"
      />
    </div>
  );
}