import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { BeatScheduler } from './BeatScheduler';
import './Pulsehead.css';

interface PulseheadProps {
  beatScheduler: BeatScheduler;
}

export default function Pulsehead({ beatScheduler }: PulseheadProps) {
  const pulseheadRef = useRef<HTMLDivElement | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailHistory = useRef<{timestamp: number, y: number}[]>([]);
  const pausedTimeRef = useRef(0);
  const pauseStartTimeRef = useRef<number | null>(null);
  const currentYPositionRef = useRef(0);

  useEffect(() => {
    // Initialize pulsehead at bottom position (beat 0 start)
    if (pulseheadRef.current) {
      pulseheadRef.current.style.transform = 'translateY(-100px)';
      pulseheadRef.current.style.opacity = '1';
    }
  }, []);

  useEffect(() => {
    let beatCount = 0;
    let animationId: number;
    let startTime: number | null = null;

    const animate = () => {
      if (!pulseheadRef.current || !canvasRef.current) return;
      
      // Handle pause/resume timing
      if (!beatScheduler.isPlaying()) {
        // Freeze animation - track pause duration
        if (pauseStartTimeRef.current === null) {
          pauseStartTimeRef.current = performance.now();
        }
        animationId = requestAnimationFrame(animate);
        return;
      } else if (pauseStartTimeRef.current !== null) {
        // Resuming - add paused duration to total
        pausedTimeRef.current += performance.now() - pauseStartTimeRef.current;
        pauseStartTimeRef.current = null;
      }
      
      if (startTime === null) {
        startTime = performance.now();
      }
      
      const currentTime = performance.now();
      const elapsed = currentTime - startTime - pausedTimeRef.current;
      const beatDuration = (60 / 73) * 1000; // ms per beat at 73 BPM
      const totalBeats = elapsed / beatDuration;
      
      // Continuous sine wave animation - full range
      const sineValue = Math.cos(totalBeats * Math.PI);
      const yPosition = -sineValue * 100; // Start at bottom (-100px), moves to top (+100px) on beat
      
      // Always show pulsehead and update position
      if (pulseheadRef.current) {
        pulseheadRef.current.style.transform = `translateY(${yPosition}px)`;
        pulseheadRef.current.style.opacity = '1';
      }
      
      // Store current position for pause
      currentYPositionRef.current = yPosition;
      
      // Calculate color transition based on Y position
      // From 0 to +100px: stay grey
      // From 0 to -100px: transition grey to blue with easing
      let colorProgress = 0;
      if (yPosition < 0) {
        // Moving towards top (-100px), use ease-in
        const normalizedPosition = Math.abs(yPosition) / 100; // 0 to 1
        colorProgress = normalizedPosition * normalizedPosition; // ease-in (quadratic)
      }
      
      // Interpolate between grey (#808080) and blue (#0000FF)
      const greyR = 128, greyG = 128, greyB = 128;
      const blueR = 0, blueG = 0, blueB = 255;
      
      const r = Math.round(greyR + (blueR - greyR) * colorProgress);
      const g = Math.round(greyG + (blueG - greyG) * colorProgress);
      const b = Math.round(greyB + (blueB - greyB) * colorProgress);
      
      // Only update color if not currently flashing
      if (!pulseheadRef.current.classList.contains('flashing')) {
        pulseheadRef.current.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      }
      
      // Record current Y position with timestamp (pen marking the paper)
      trailHistory.current.push({
        timestamp: currentTime,
        y: yPosition
      });
      
      // Keep only recent history (last 8 seconds of trail)
      const maxAge = 8000;
      trailHistory.current = trailHistory.current.filter(point => 
        currentTime - point.timestamp < maxAge
      );
      
      // Draw trail (paper moving left under the pen)
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (trailHistory.current.length > 1) {
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const trailSpeed = 100; // pixels per second moving left
          
          ctx.strokeStyle = '#CCCCCC';
          ctx.lineWidth = 2;
          ctx.beginPath();
          
          trailHistory.current.forEach((point, index) => {
            const age = currentTime - point.timestamp;
            const x = centerX - (age / 1000) * trailSpeed; // Move left based on age
            const y = centerY + point.y;
            
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          
          ctx.stroke();
        }
        
      }
      
      animationId = requestAnimationFrame(animate);
    };

    const unsubscribe = beatScheduler.onBeat((beatEvent) => {
      if (!pulseheadRef.current) return;

      // Force reset timing on every start
      if (beatCount === 0) {
        startTime = performance.now();
        pausedTimeRef.current = 0;
        pauseStartTimeRef.current = null;
      }

      // Clear any existing flash timeout
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      // Flash exactly on even beats (0, 2)
      if (beatCount % 2 === 0) {
        const delay = (beatEvent.audioTime - Tone.now()) * 1000; // Convert to milliseconds
        
        setTimeout(() => {
          if (pulseheadRef.current) {
            pulseheadRef.current.classList.add('flashing');
          }
        }, Math.max(0, delay));
      }
      
      
      beatCount++;

      // End flash after 150ms
      flashTimeoutRef.current = setTimeout(() => {
        if (pulseheadRef.current) {
          pulseheadRef.current.classList.remove('flashing');
        }
      }, 150);
    });

    // Start animation loop
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
      <canvas 
        ref={canvasRef}
        className="trail-canvas"
        width={window.innerWidth}
        height={window.innerHeight}
      />
      <div 
        ref={pulseheadRef}
        className="pulsehead"
        aria-label="Metronome pulse indicator"
      />
    </div>
  );
}