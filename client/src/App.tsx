import { useState, useEffect, useRef } from 'react'
import { BeatScheduler } from './BeatScheduler'
import { LyricsRenderer } from './LyricsRenderer'
import { LyricsParser, type ParsedLyrics } from './LyricsParser'
import Pulsehead from './Pulsehead'
import './App.css'

// Dandelion lyrics embedded
const DANDELION_LYRICS = `TITLE: DANDELION
ARTIST: BROOKE LEE

[I]'ve been [ripped] right [out] of the [ground] 
so my [roots] don't [run] too [deep] [-]
And [I've] been [wished] on a [thousand] [times] 
with [promises] [I] don't [keep] [-]
I [stood] up [on] a [sunny] [day], 
laid [down] [in] the [night] [-]
Woah-[woh],[oh] [oh], 
[I]'m a dande[lion] [-] [-] [-]

[I]'ve been [picked] and [held] real [tight] 
in an [I] love [you] bou[quet] [-]
[I]'ve been [simply] [cast] a[side] 
like [I] was [in] the [way] [-]
But [I] push [through] a [side]walk [crack] 
and [come] back [every] [time] [-]
Woah-[woh],[oh] [oh], 
[I]'m a dande[lion] [-] [-] [-]

[Dande] [lion] [-] [-] [-], 
We're just [dancing] [in] the [breeze] [-]
[Dande] [lion] [-] [-] [-], 
Not a [flower] [not] a [weed] [-]
[You] can [keep] your [roses] [-] 
And [I]'ll keep [growing] [wild] [-]
Woah-[woh],[oh] [oh], 
[I]'m a dande[lion] [-] [-] [-]

I've [never] [heard] a [bettеr] [song] 
than [rain]drops [falling] [down] [-]
I've [never] [fеlt] [more] at [home] 
than [where] I [am] right [now] [-]
So [I]'m just [gonna] [stay] right [here] 
and [watch] the [world] go [by] [-]
Woah-[woh],[oh] [oh], 
[I]'m a dande[lion] [-] [-] [-]

[Dande] [lion] [-] [-] [-], 
We're just [dancing] [in] the [breeze] [-]
[Dande] [lion] [-] [-] [-], 
Not a [flower] [not] a [weed] [-]
[You] can [keep] your [roses] [-] 
And [I]'ll keep [growing] [wild] [-]
Woah-[woh],[oh] [oh], 
[I]'m a dande[lion] [-] [-] [-]`;

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(100)
  const [totalBeatCount, setTotalBeatCount] = useState(0)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const beatSchedulerRef = useRef<BeatScheduler | null>(null)
  const lyricsRef = useRef<ParsedLyrics | null>(null)

  useEffect(() => {
    // Parse lyrics
    lyricsRef.current = LyricsParser.parse(DANDELION_LYRICS)
    
    // Initialize BeatScheduler
    beatSchedulerRef.current = new BeatScheduler(bpm)
    
    // Subscribe to beat events
    const unsubscribe = beatSchedulerRef.current.onBeat(() => {
      setTotalBeatCount(prev => {
        const newTotalBeat = prev + 1
        
        // Advance to next line on beat 1 of each measure (beats 1,5,9,13...)
        if (newTotalBeat > 1 && (newTotalBeat - 1) % 4 === 0) {
          console.log(`Advancing line at beat ${newTotalBeat}`);
          setCurrentLineIndex(prevLine => {
            const newLine = (prevLine + 1) % (lyricsRef.current?.lines.length || 0);
            console.log(`Line changed from ${prevLine} to ${newLine}`);
            return newLine;
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
  const currentBeat = totalBeatCount % 4 // 0-3 for current beat within line/measure

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

      {/* Controls - positioned at bottom */}
      <div className="controls" style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
        <div className="control-panel">
          <button 
            className="play-pause-btn"
            onClick={handlePlayPause}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <div className="bpm-control">
            <label htmlFor="bpm">BPM: {bpm}</label>
            <input
              id="bpm"
              type="range"
              min="60"
              max="200"
              value={bpm}
              onChange={handleBpmChange}
              className="bpm-slider"
            />
          </div>
          
          <div style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
            Line: {currentLineIndex + 1} | Beat: {currentBeat + 1}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
