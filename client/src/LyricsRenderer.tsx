import React, { useRef, useEffect, useState } from 'react';
import type { ParsedLine } from './LyricsParser';

interface LyricsRendererProps {
  allLines: ParsedLine[];
  currentLineIndex: number;
  currentBeat: number;
}

export const LyricsRenderer: React.FC<LyricsRendererProps> = ({ 
  allLines, 
  currentLineIndex, 
  currentBeat 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Handle scrolling based on current line
  useEffect(() => {
    if (containerRef.current && allLines.length > 0) {
      // Calculate responsive line height (matches CSS clamp)
      const vw = window.innerWidth / 100;
      const lineHeight = Math.max(25, Math.min(5 * vw, 36));
      const scrollPosition = currentLineIndex * lineHeight;
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [currentLineIndex, allLines.length]);

  // Handle beat highlighting
  useEffect(() => {
    if (!allLines.length || currentLineIndex >= allLines.length) return;
    
    const currentLine = allLines[currentLineIndex];

    // Reset all words: beat words that get highlighted to light red, others to black
    const highlightedBeatWords = new Set(
      currentLine.beatMappings
        .filter(m => m.word && !m.skip && m.beat % 2 === 0) // Only even beats get highlighted
        .map(m => m.word!.toLowerCase())
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
    const currentMapping = currentLine.beatMappings.find(
      mapping => mapping.beat === currentBeat
    );

    // Handle even beats (0, 2) - these get the glow
    if (currentMapping && currentMapping.word && !currentMapping.skip && currentBeat % 2 === 0) {
      const wordSpan = wordRefs.current.get(currentMapping.word!.toLowerCase());
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

  }, [currentBeat, currentLineIndex, allLines]);

  const createWordSpans = (text: string, beatMappings: any[], lineIndex: number) => {
    const words = text.split(' ');
    const beatWords = new Set(
      beatMappings
        .filter(m => m.word && !m.skip)
        .map(m => m.word!.toLowerCase())
    );

    const elements: React.ReactNode[] = [];
    
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?]/g, '');
      const isBeatWord = beatWords.has(cleanWord);
      
      if (index > 0) {
        elements.push(<span key={`${lineIndex}-space-${index}`}>&nbsp;</span>); // Add space before each word except the first
      }
      
      if (isBeatWord) {
        elements.push(
          <span 
            key={`${lineIndex}-${word}-${index}`}
            ref={(el) => {
              if (el && lineIndex === currentLineIndex) {
                wordRefs.current.set(cleanWord, el);
              }
            }}
            style={{ color: 'black' }}
          >
            {word}
          </span>
        );
      } else {
        elements.push(
          <span key={`${lineIndex}-${word}-${index}`}>{word}</span>
        );
      }
    });
    
    return elements;
  };

  if (!allLines.length) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 'calc(50% + 198px)', // 98px below the sine wave (50% + 100px + 98px)
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 'clamp(16px, 3vw, 24px)',
        textAlign: 'center',
        color: 'black',
        fontFamily: 'Inter, Arial, sans-serif',
        lineHeight: 1.5,
        width: '800px', // Fixed width container
        height: 'clamp(100px, 20vw, 144px)', // Responsive container height
        overflow: 'hidden',
        scrollBehavior: 'smooth'
      }}
    >
      {allLines.map((line, index) => (
        <div
          key={index}
          style={{
            height: 'clamp(25px, 5vw, 36px)', // Responsive line height
            lineHeight: 'clamp(25px, 5vw, 36px)',
            padding: '0 10px'
          }}
        >
          {createWordSpans(line.displayText, line.beatMappings, index)}
        </div>
      ))}
    </div>
  );
};