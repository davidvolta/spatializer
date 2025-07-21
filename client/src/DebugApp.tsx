import { useState, useEffect, useRef } from 'react'
import { BeatScheduler } from './BeatScheduler'
import { LyricsParser, type ParsedLyrics } from './LyricsParser'

const SIMPLE_TEST = `TITLE: TEST
ARTIST: TEST

[ONE] [TWO] [THREE] [FOUR]
[FIVE] [SIX] [SEVEN] [EIGHT]`;

function DebugApp() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const beatSchedulerRef = useRef<BeatScheduler | null>(null)
  const lyricsRef = useRef<ParsedLyrics | null>(null)
  const beatCountRef = useRef(0)
  const lineIndexRef = useRef(0)

  useEffect(() => {
    lyricsRef.current = LyricsParser.parse(SIMPLE_TEST)
    console.log('Parsed lyrics:', lyricsRef.current)
    
    beatSchedulerRef.current = new BeatScheduler(120) // Slower for debugging
    
    const unsubscribe = beatSchedulerRef.current.onBeat(() => {
      const currentBeat = beatCountRef.current % 4
      const currentLine = lyricsRef.current?.lines[lineIndexRef.current]
      
      // Log what should happen
      const logEntry = `Beat ${beatCountRef.current} | Line ${lineIndexRef.current} | Beat in line: ${currentBeat} | Line text: "${currentLine?.displayText || 'none'}"`
      
      setDebugInfo(prev => [...prev.slice(-10), logEntry])
      
      // Advance beat
      beatCountRef.current += 1
      
      // Check line advancement AFTER processing current beat
      if (beatCountRef.current % 4 === 0) {
        lineIndexRef.current = (lineIndexRef.current + 1) % (lyricsRef.current?.lines.length || 1)
      }
    })
    
    return () => {
      unsubscribe()
      beatSchedulerRef.current?.dispose()
    }
  }, [])

  const handlePlayPause = async () => {
    if (!beatSchedulerRef.current) return

    if (isPlaying) {
      beatSchedulerRef.current.stop()
      setIsPlaying(false)
    } else {
      // Reset counters
      beatCountRef.current = 0
      lineIndexRef.current = 0
      setDebugInfo([])
      
      await beatSchedulerRef.current.start()
      setIsPlaying(true)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Debug Timing</h2>
      
      <button onClick={handlePlayPause}>
        {isPlaying ? 'Stop' : 'Start'}
      </button>
      
      <div style={{ marginTop: '20px', backgroundColor: '#f5f5f5', padding: '10px' }}>
        <h3>Expected:</h3>
        <div>Beat 0: Line 0 "ONE TWO THREE FOUR" - highlight "ONE"</div>
        <div>Beat 1: Line 0 "ONE TWO THREE FOUR" - no highlight</div>
        <div>Beat 2: Line 0 "ONE TWO THREE FOUR" - highlight "THREE"</div>
        <div>Beat 3: Line 0 "ONE TWO THREE FOUR" - no highlight</div>
        <div>Beat 4: Line 1 "FIVE SIX SEVEN EIGHT" - highlight "FIVE"</div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Debug Log:</h3>
        {debugInfo.map((info, i) => (
          <div key={i} style={{ fontSize: '12px' }}>{info}</div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Parsed Lines:</h3>
        {lyricsRef.current?.lines.map((line, i) => (
          <div key={i}>
            Line {i}: "{line.displayText}" - {JSON.stringify(line.beatMappings)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DebugApp