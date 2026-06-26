const fs = require('fs');

const logPath = 'C:\\Users\\lucas\\.gemini\\antigravity-cli\\brain\\7400b609-3f06-4641-bebd-62c16e3d2e4a\\.system_generated\\logs\\transcript_full.jsonl';

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
const artistMap = new Map();

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    const text = JSON.stringify(obj);
    
    let pos = 0;
    while (true) {
      const mbidIdx = text.indexOf('"mbid":"', pos);
      if (mbidIdx === -1) break;
      
      const mbid = text.slice(mbidIdx + 8, mbidIdx + 8 + 36).toLowerCase();
      pos = mbidIdx + 44;
      
      if (mbid === '7400b609-3f06-4641-bebd-62c16e3d2e4a') continue;
      if (mbid.length !== 36) continue;
      
      // Find "name" within a 300 character window around the mbid
      const start = Math.max(0, mbidIdx - 150);
      const end = Math.min(text.length, mbidIdx + 150);
      const window = text.slice(start, end);
      
      const nameMatch = /"name"\s*:\s*"([^"]+)"/i.exec(window);
      if (nameMatch) {
        const name = nameMatch[1];
        // Clean name (remove escaped characters, verify length)
        if (name && name.length < 50 && !name.includes('\\') && !name.includes('{')) {
          artistMap.set(mbid, name);
        }
      }
    }
  } catch (e) {}
}

console.log('--- EXTRACTED ARTISTS ---');
console.log('Count:', artistMap.size);
console.log(JSON.stringify(Array.from(artistMap.entries())));
