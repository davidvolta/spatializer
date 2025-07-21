# TODAY - Monday, July 21st, 2025
## Phase 2: Lyrics Preview with Beat-Synced Word Highlighting

### 🎯 Goal
Transform Spatializer from a visual metronome into a lyrical rhythm experience where **THE WORDS ARE THE SYNC**. Text files with markup trigger word highlighting on beats.

### ✅ Success Criteria
- [ ] Parse text files with bracket markup: `[tree] [free]`
- [ ] Display full line of text on screen
- [ ] Turn marked words red precisely on metronome beats
- [ ] Maintain sample-accurate timing from Phase 1
- [ ] Support file input/loading mechanism
- [ ] Handle beat counting and word sequence mapping
- [ ] Clean UI integration with existing play/pause controls

### 🏗️ Implementation Tasks

#### Core Components
- [ ] **LyricsParser.ts** - Parse bracket markup syntax
  - Extract plain text and beat-marked words
  - Create beat-to-word mapping data structure
  - Handle malformed markup gracefully

- [ ] **LyricsRenderer.tsx** - Display and highlight text
  - Render full line with word-level spans
  - Turn individual words red on beat hits
  - Use direct DOM manipulation (no React state lag)
  - Maintain text readability and flow

- [ ] **Extend BeatScheduler.ts** - Add lyric sync support
  - Track beat count since start
  - Map beat numbers to word positions
  - Emit word-specific beat events

- [ ] **File Input Component** - Load lyrics files
  - File input or textarea for lyrics
  - Parse and validate markup
  - Preview parsed content

### 🎨 Visual Requirements
- **Background**: White (maintained from Phase 1)
- **Text**: Black, readable font
- **Beat Words**: Turn red (#FF0000) on beat
- **Layout**: Text displayed prominently on screen
- **Controls**: Keep existing BPM/play controls

### ⚡ Technical Requirements
- Maintain Phase 1's sample-accurate timing system
- Use direct DOM manipulation for word highlighting (no React state)
- Support dynamic text loading and parsing
- Handle variable-length lyrics and beat patterns
- Integrate with existing Tone.Transport timing

### 🔧 Markup Format
```
I've been ripped right [out] of the ground so my [roots] don't run too [deep]
```
- Regular words display normally
- `[word]` brackets mark beat-synchronized words
- Sequential beats map to marked words in order

### 🔧 Development Notes
- Build on Phase 1's timing architecture
- Words become the visual metronome (may replace pulsehead)
- Maintain hybrid React approach: UI components + direct DOM for timing
- Test with various lyric patterns and BPM speeds