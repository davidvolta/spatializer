import { useState, useEffect, useRef } from 'react'
import { BeatScheduler } from './BeatScheduler'
import { LyricsRenderer } from './LyricsRenderer'
import { LyricsParser, type ParsedLyrics } from './LyricsParser'
import Pulsehead from './Pulsehead'
import './App.css'
import './slider-styles.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(73)
  const [totalBeatCount, setTotalBeatCount] = useState(0)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [lyricsLoaded, setLyricsLoaded] = useState(false)
  const beatSchedulerRef = useRef<BeatScheduler | null>(null)
  const lyricsRef = useRef<ParsedLyrics | null>(null)

  useEffect(() => {
    // Load lyrics from file
    const loadLyrics = async () => {
      try {
        const response = await fetch('/lyrics/dandelion.md')
        const lyricsText = await response.text()
        lyricsRef.current = LyricsParser.parse(lyricsText)
        setLyricsLoaded(true)
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
        
        // Advance to next line on beat 1 of each measure (beats 1,5,9,13...)
        if (newTotalBeat > 1 && (newTotalBeat - 1) % 4 === 0) {
          setCurrentLineIndex(prevLine => {
            return (prevLine + 1) % (lyricsRef.current?.lines.length || 0);
          })
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

    if (isPlaying) {
      beatSchedulerRef.current.stop()
      setIsPlaying(false)
    } else {
      // Reset to beginning when starting
      setTotalBeatCount(0)
      setCurrentLineIndex(0)
      await beatSchedulerRef.current.start()
      setIsPlaying(true)
    }
  }

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value)
    if (newBpm >= 60 && newBpm <= 200) {
      setBpm(newBpm)
    }
  }

  const currentLine = lyricsRef.current?.lines[currentLineIndex] || null
  const currentBeat = totalBeatCount > 0 ? (totalBeatCount - 1) % 4 : 0 // 0-3 for current beat within line/measure

  if (!lyricsLoaded) {
    return <div>Loading lyrics...</div>
  }

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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        </div>
      </div>
    </>
  )
}

export default App
