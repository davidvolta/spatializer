const fs = require('fs');

// Read the lyrics file
const lyrics = fs.readFileSync('./lyrics/dandelion.md', 'utf8');
const lines = lyrics.split('\n').filter(line => line.trim() !== '');

// Extract lyric lines (skip metadata)
const lyricLines = lines.filter(line => 
  !line.startsWith('TITLE:') && 
  !line.startsWith('ARTIST:') &&
  line.trim() !== ''
);

console.log('First 3 lyric lines:');
console.log('Line 0:', lyricLines[0]);
console.log('Line 1:', lyricLines[1]); 
console.log('Line 2:', lyricLines[2]);

// Test parsing logic
function parseLine(line) {
  const beatMappings = [];
  let beat = 0;
  
  const bracketPattern = /\[([^\]]+)\]/g;
  let match;
  
  while ((match = bracketPattern.exec(line)) !== null) {
    const content = match[1];
    
    if (content === '-') {
      beatMappings.push({ beat, skip: true });
    } else {
      beatMappings.push({ beat, word: content });
    }
    beat++;
  }
  
  const displayText = line.replace(/\[([^\]]+)\]/g, '$1').replace(/\[-\]/g, '');
  
  return {
    displayText: displayText.trim(),
    beatMappings
  };
}

console.log('\nParsed mappings:');
for (let i = 0; i < 3; i++) {
  const parsed = parseLine(lyricLines[i]);
  console.log(`Line ${i}: "${parsed.displayText}"`);
  console.log(`Mappings:`, parsed.beatMappings);
  console.log('---');
}