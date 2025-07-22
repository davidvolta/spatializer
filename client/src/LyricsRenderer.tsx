import React, { useRef, useEffect, useState } from 'react';
import type { ParsedLine } from './LyricsParser';

interface LyricsRendererProps {
  currentLine: ParsedLine | null;
  currentBeat: number;
}

export const LyricsRenderer: React.FC<LyricsRendererProps> = ({ 
  currentLine, 
  currentBeat 
}) => {
  const lineRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLine, setDisplayLine] = useState<ParsedLine | null>(currentLine);

  // Handle line changes with fade transition
  useEffect(() => {
    if (currentLine && currentLine !== displayLine && !isTransitioning) {
      setIsTransitioning(true);
      
      // Fade out
      if (lineRef.current) {
        lineRef.current.style.opacity = '0';
      }
      
      setTimeout(() => {
        // Change content
        setDisplayLine(currentLine);
        
        setTimeout(() => {
          // Fade in
          if (lineRef.current) {
            lineRef.current.style.opacity = '1';
          }
          setIsTransitioning(false);
        }, 100);
      }, 100);
    }
  }, [currentLine, displayLine, isTransitioning]);

  // Handle beat highlighting
  useEffect(() => {
    if (!displayLine || !lineRef.current) return;

    // Reset all words: beat words that get highlighted to light red, others to black
    const highlightedBeatWords = new Set(
      displayLine.beatMappings
        .filter(m => m.word && !m.skip && m.beat % 2 === 0) // Only even beats get highlighted
        .map(m => m.word.toLowerCase())
    );
    
    wordRefs.current.forEach((span, word) => {
      if (highlightedBeatWords.has(word)) {
        span.style.color = '#9999FF'; // Light blue for words that get highlighted
        span.style.fontWeight = 'normal'; // Reset to normal weight
        span.style.transition = 'color 0.2s ease-out, text-shadow 0.2s ease-out'; // Add smooth transitions
        span.style.textShadow = 'none'; // Reset glow
      } else {
        span.style.color = 'black'; // Black for all other words
        span.style.fontWeight = 'normal'; // Reset to normal weight
        span.style.transition = 'color 0.2s ease-out, text-shadow 0.2s ease-out'; // Add smooth transitions
        span.style.textShadow = 'none'; // Reset glow
      }
    });

    // Handle even beats (0, 2) - glow and full brightness when beat hits
    const currentMapping = displayLine.beatMappings.find(
      mapping => mapping.beat === currentBeat
    );

    // Handle even beats (0, 2) - these get the glow
    if (currentMapping && currentMapping.word && !currentMapping.skip && currentBeat % 2 === 0) {
      const wordSpan = wordRefs.current.get(currentMapping.word.toLowerCase());
      if (wordSpan) {
        wordSpan.style.color = '#0000FF'; // Full blue for active beat word
        wordSpan.style.fontWeight = 'normal'; // Normal weight for active beat word
        wordSpan.style.textShadow = '0 0 10px #0000FF, 0 0 20px #0000FF'; // Blue glow effect
        
        // Remove glow after 200ms
        setTimeout(() => {
          if (wordSpan) {
            wordSpan.style.textShadow = 'none';
          }
        }, 200);
      }
    }

  }, [currentBeat, displayLine]);

  const createWordSpans = (text: string, beatMappings: any[]) => {
    const words = text.split(' ');
    const beatWords = new Set(
      beatMappings
        .filter(m => m.word && !m.skip)
        .map(m => m.word.toLowerCase())
    );

    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?]/g, '');
      const isBeatWord = beatWords.has(cleanWord);
      
      if (isBeatWord) {
        return (
          <span 
            key={`${word}-${index}`}
            ref={(el) => {
              if (el) wordRefs.current.set(cleanWord, el);
            }}
            style={{ color: 'black' }}
          >
            {word}
          </span>
        );
      }
      
      return <span key={`${word}-${index}`}>{word}</span>;
    }).reduce((acc: React.ReactNode[], curr, index) => {
      if (index === 0) return [curr];
      return [...acc, ' ', curr];
    }, []);
  };

  if (!displayLine) {
    return null;
  }

  return (
    <div 
      ref={lineRef}
      style={{
        position: 'fixed',
        top: 'calc(50% + 148px)', // 48px below the sine wave (50% + 100px + 48px)
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '24px', // Reduced from 48px to 24px (half size)
        textAlign: 'center',
        padding: '20px',
        color: 'black',
        fontFamily: 'Inter, Arial, sans-serif',
        lineHeight: 1.5,
        width: '100vw',
        transition: 'opacity 0.1s ease-in-out',
        opacity: 1
      }}
    >
      {createWordSpans(displayLine.displayText, displayLine.beatMappings)}
    </div>
  );
};