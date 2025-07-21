interface BeatMapping {
  beat: number;
  word?: string;
  skip?: boolean;
}

interface ParsedLine {
  displayText: string;
  beatMappings: BeatMapping[];
}

interface ParsedLyrics {
  title: string;
  artist: string;
  lines: ParsedLine[];
}

export type { BeatMapping, ParsedLine, ParsedLyrics };

export class LyricsParser {
  static parse(lyricsText: string): ParsedLyrics {
    const lines = lyricsText.split('\n').filter(line => line.trim() !== '');
    
    // Extract metadata
    const titleLine = lines.find(line => line.startsWith('TITLE:'));
    const artistLine = lines.find(line => line.startsWith('ARTIST:'));
    
    const title = titleLine ? titleLine.replace('TITLE:', '').trim() : '';
    const artist = artistLine ? artistLine.replace('ARTIST:', '').trim() : '';
    
    // Process lyric lines (skip metadata lines)
    const lyricLines = lines.filter(line => 
      !line.startsWith('TITLE:') && 
      !line.startsWith('ARTIST:') &&
      line.trim() !== ''
    );
    
    const parsedLines = lyricLines.map(line => this.parseLine(line));
    
    return {
      title,
      artist,
      lines: parsedLines
    };
  }
  
  private static parseLine(line: string): ParsedLine {
    const beatMappings: BeatMapping[] = [];
    let beat = 0;
    
    // Extract all bracketed content and their positions
    const bracketPattern = /\[([^\]]+)\]/g;
    let match;
    
    while ((match = bracketPattern.exec(line)) !== null) {
      const content = match[1];
      
      if (content === '-') {
        // Gap tick - silent beat
        beatMappings.push({ beat, skip: true });
      } else {
        // Regular word to highlight
        beatMappings.push({ beat, word: content });
      }
      beat++;
    }
    
    // Create display text by replacing brackets but hiding [-] completely
    let displayText = line;
    
    // First replace [-] with nothing (completely invisible)
    displayText = displayText.replace(/\[-\]/g, '');
    
    // Then replace [word] with word (add spaces around)
    displayText = displayText.replace(/\[([^\]]+)\]/g, ' $1 ');
    
    // Clean up whitespace
    displayText = displayText.replace(/\s+/g, ' ').trim();
    
    return {
      displayText: displayText.trim(),
      beatMappings
    };
  }
}