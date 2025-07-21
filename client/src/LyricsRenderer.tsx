import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (!currentLine || !lineRef.current) return;

    // Reset all words to black
    wordRefs.current.forEach(span => {
      span.style.color = 'black';
    });

    // Define colors for each beat position
    const beatColors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'cyan', 'magenta'];

    // Highlight all beat words with their position colors (skip silent beats)
    currentLine.beatMappings.forEach(mapping => {
      if (mapping.word && !mapping.skip) {
        const wordSpan = wordRefs.current.get(mapping.word.toLowerCase());
        if (wordSpan) {
          wordSpan.style.color = beatColors[mapping.beat] || 'black';
        }
      }
      // Silent beats ([-]) are completely ignored in display
    });
  }, [currentBeat, currentLine]);

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

  if (!currentLine) {
    return (
      <div style={{
        fontSize: '24px',
        textAlign: 'center',
        padding: '40px',
        color: 'black'
      }}>
        Ready to play...
      </div>
    );
  }

  return (
    <div 
      ref={lineRef}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '24px',
        textAlign: 'center',
        padding: '20px',
        color: 'black',
        fontFamily: 'Arial, sans-serif',
        lineHeight: 1.5,
        maxWidth: '90vw'
      }}
    >
      {createWordSpans(currentLine.displayText, currentLine.beatMappings)}
    </div>
  );
};