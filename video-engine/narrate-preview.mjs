// Narration is intentionally one complete thought per three-second scene.
// The visual shows the German word; Persian audio explains when to use it.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { minimaxSpeakable } from '../lib/pronounce.mjs';
import { narrationLineCheck } from '../lib/voice-settings.mjs';
import { synthesize } from '../lib/edge-tts.mjs';
import { loadEnv } from '../lib/telegram.mjs';
import { config } from '../core/config.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const persianLines = [
  'برای سلام کردن، از این واژه استفاده کنید.',
  'بعد از کمک کسی، با این واژه تشکر کنید.',
  'وقتی چیزی می‌خواهید، از این واژه استفاده کنید.',
  'این عبارت را صبح‌ها به کار می‌برید.',
  'برای خداحافظی رسمی، این عبارت مناسب است.',
];
const germanLines = ['Hallo', 'Danke', 'Bitte', 'Guten Morgen', 'Auf Wiedersehen'];
const dir = resolve(root, 'public/preview-narration');
const hasMiniMax = Boolean(process.env.MINIMAX_API_KEY || loadEnv('.env').MINIMAX_API_KEY);
const selected = hasMiniMax ? config.narration.primary : config.narration.fallback;
const engine = `${selected.provider}-${selected.voice}`;
const signature = createHash('sha256').update(`${engine}\n${persianLines.join('\n')}\n${germanLines.join('\n')}`).digest('hex');
mkdirSync(dir, {recursive:true});
const manifest = resolve(dir, 'manifest.json');
const current = existsSync(manifest) && (() => { try { return JSON.parse(readFileSync(manifest,'utf8')).signature === signature; } catch { return false; } })();
if (!current) {
  for (const [i, written] of persianLines.entries()) {
    const spoken = minimaxSpeakable(written);
    const issues = narrationLineCheck(spoken);
    if (issues.length) throw new Error(`Narration line ${i + 1} rejected: ${issues.join(', ')}`);
    const output = resolve(dir, `fa-${i}.mp3`);
    let last = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (hasMiniMax) execFileSync(process.execPath, [resolve(root,'music/minimax-tts.mjs'), spoken, '-o', output], {cwd:root,stdio:'inherit'});
        else writeFileSync(output, await synthesize({text: spoken, voice:selected.voice, rate:selected.rate, pitch:selected.pitch, volume:selected.volume}));
        if (statSync(output).size < 1000) throw new Error('empty audio response');
        last = null;
        break;
      } catch (error) { last = error; }
    }
    if (last) throw new Error(`Narration line ${i + 1} failed after 3 attempts: ${last.message}`);
  }
  for (const [i, word] of germanLines.entries()) {
    const output = resolve(dir, `de-${i}.mp3`);
    let last = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { writeFileSync(output, await synthesize({text:word, voice:'de-DE-KatjaNeural', rate:'-4%', pitch:'+0Hz', volume:'+0%'})); if (statSync(output).size < 1000) throw new Error('empty audio response'); last = null; break; } catch (error) { last = error; }
    }
    if (last) throw new Error(`German pronunciation ${i + 1} failed after 3 attempts: ${last.message}`);
  }
  writeFileSync(manifest, JSON.stringify({signature, persianLines, germanLines, persianEngine:engine, germanVoice:'de-DE-KatjaNeural', spokenAt:new Date().toISOString()}, null, 2));
}
for (let i=0;i<persianLines.length;i++) for (const prefix of ['fa-','de-']) if (!existsSync(resolve(dir,`${prefix}${i}.mp3`)) || statSync(resolve(dir,`${prefix}${i}.mp3`)).size < 1000) throw new Error(`Verified ${prefix === 'fa-' ? 'Persian' : 'German'} narration clip ${i+1} missing`);
console.log(`Preview narration ready (${engine})`);
