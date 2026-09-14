import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia} from '@remotion/renderer';
import {mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function renderPreview() {
  // Deterministic, short synthesized typing click. No paid APIs or publication.
  const rate=44100, n=1764, wav=Buffer.alloc(44+n*2);
  wav.write('RIFF'); wav.writeUInt32LE(36+n*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*2,40);
  for(let i=0;i<n;i++) wav.writeInt16LE(Math.round(Math.sin(i*1.7)*Math.exp(-i/170)*9000),44+i*2);
  writeFileSync(resolve(root,'public/typing.wav'),wav);
  // Never render a video that claims narration if every scene's verified clip is absent.
  execFileSync(process.execPath, [resolve(root,'video-engine/narrate-preview.mjs')], {cwd:root,stdio:'inherit'});
  const serveUrl=await bundle({entryPoint:resolve(root,'video-engine/remotion/index.tsx'),publicDir:resolve(root,'public')});
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browserExecutable=existsSync(chrome)?chrome:undefined;
  const composition=await selectComposition({serveUrl,id:'Preview',browserExecutable});
  mkdirSync(resolve(root,'output'),{recursive:true});
  const outputLocation=resolve(root,'output/preview.mp4');
  await renderMedia({serveUrl,composition,codec:'h264',outputLocation,browserExecutable,concurrency:2});
  writeFileSync(resolve(root,'output/metadata.json'),JSON.stringify({kind:'local-motion-preview',typewriterSequences:5,parallaxSequences:5,narration:{persian:{scenes:5,engine:'configured-primary-or-edge-fallback'},german:{scenes:5,voice:'de-DE-KatjaNeural'},visualExplanations:false},published:false,composition},null,2));
  return {outputLocation};
}
