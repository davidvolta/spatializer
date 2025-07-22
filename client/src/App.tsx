import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { BeatScheduler } from './BeatScheduler'
import { LyricsRenderer } from './LyricsRenderer'
import { LyricsParser, type ParsedLyrics } from './LyricsParser'
import Pulsehead from './Pulsehead'
import './App.css'
import './slider-styles.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm] = useState(73)
  const [totalBeatCount, setTotalBeatCount] = useState(0)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const beatSchedulerRef = useRef<BeatScheduler | null>(null)
  const lyricsRef = useRef<ParsedLyrics | null>(null)

  useEffect(() => {
    // Load lyrics from file
    const loadLyrics = async () => {
      try {
        const response = await fetch('/lyrics/dandelion.md')
        const lyricsText = await response.text()
        lyricsRef.current = LyricsParser.parse(lyricsText)
      } catch (error) {
        console.error('Failed to load lyrics:', error)
      }
    }
    
    loadLyrics()
    
    // Initialize BeatScheduler
    beatSchedulerRef.current = new BeatScheduler(bpm)
    
    // Subscribe to beat events
    const unsubscribe = beatSchedulerRef.current.onBeat(() => {
      setTotalBeatCount(prev => {
        const newTotalBeat = prev + 1
        const currentBeat = (newTotalBeat - 1) % 4
        const currentLine = lyricsRef.current?.lines[Math.floor((newTotalBeat - 1) / 4) % (lyricsRef.current?.lines.length || 1)]
        const currentMapping = currentLine?.beatMappings.find(m => m.beat === currentBeat)
        const word = currentMapping?.skip ? '(silent)' : currentMapping?.word || '(none)'
        
        console.log(`Beat ${newTotalBeat - 1}: ${word}`)
        
        // Advance to next line between measures (after beat 4, before beat 1)
        if (newTotalBeat > 1 && (newTotalBeat - 1) % 4 === 3) {
          // Use setTimeout to advance shortly after beat 4
          setTimeout(() => {
            setCurrentLineIndex(prevLine => {
              return (prevLine + 1) % (lyricsRef.current?.lines.length || 0);
            })
          }, 100); // Advance 100ms after beat 4 (earlier transition)
        }
        
        return newTotalBeat
      })
    })
    
    // Cleanup on unmount
    return () => {
      unsubscribe()
      if (beatSchedulerRef.current) {
        beatSchedulerRef.current.dispose()
      }
    }
  }, [])

  useEffect(() => {
    // Update BPM when changed
    if (beatSchedulerRef.current) {
      beatSchedulerRef.current.setBPM(bpm)
    }
  }, [bpm])

  const handlePlayPause = async () => {
    if (!beatSchedulerRef.current) return

    try {
      // MOBILE FIX: Explicit audio context activation
      if (Tone.getContext().state !== 'running') {
        // Force start Tone.js (required for mobile)
        await Tone.start();
        
        // Double-check and resume if still suspended
        if (Tone.getContext().state === 'suspended') {
          await Tone.getContext().resume();
        }
        
        // Play a brief silent sound to fully activate audio pipeline
        const unlock = new Tone.Oscillator(440, "sine").toDestination();
        unlock.volume.value = -Infinity; // Silent
        unlock.start();
        unlock.stop("+0.01");
      }
    } catch (error) {
      console.error('Failed to activate audio context:', error);
    }

    if (isPlaying) {
      beatSchedulerRef.current.pause()
      setIsPlaying(false)
    } else {
      if (totalBeatCount === 0) {
        // Fresh start - reset everything
        setTotalBeatCount(0)
        setCurrentLineIndex(0)
        await beatSchedulerRef.current.start()
      } else {
        // Resume from pause position
        beatSchedulerRef.current.resume()
      }
      setIsPlaying(true)
    }
  }


  const currentLine = lyricsRef.current?.lines[currentLineIndex] || null
  const currentBeat = totalBeatCount > 0 ? (totalBeatCount - 1) % 4 : 0 // 0-3 for current beat within line/measure

  // Remove loading flash - just render immediately

  return (
    <>
      {/* Lyrics Display - centered on screen */}
      <LyricsRenderer 
        currentLine={currentLine}
        currentBeat={currentBeat}
      />

      {/* Pulsehead - center prominent */}
      {beatSchedulerRef.current && (
        <Pulsehead beatScheduler={beatSchedulerRef.current} />
      )}

      {/* Controls - positioned at top right */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button 
          onClick={handlePlayPause}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '30px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
          }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#333',
            minWidth: '40px',
            textAlign: 'center'
          }}>
            {bpm}
          </span>
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={handleBpmChange}
            style={{
              width: '120px',
              height: '8px',
              borderRadius: '4px',
              background: `linear-gradient(to right, #44ff44 0%, #44ff44 ${(bpm-60)/(200-60)*100}%, #ddd ${(bpm-60)/(200-60)*100}%, #ddd 100%)`,
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          />
        </div> */}
      </div>
    </>
  )
}

export default App
