import { readFileSync, writeFileSync } from "node:fs";

// ---- 1. the platform icon sits INSIDE the empty photo frame ----
let u = readFileSync("lib/ui-mock.mjs", "utf8");
if (!u.includes("pmedia-app")) {
  u = u.replace(
    '<div class="pmedia"><span class="pmedia-mark"></span></div>',
    '<div class="pmedia"><span class="pmedia-app">${MARK_SLOT}</span><span class="pmedia-mark"></span></div>'
  );
  u = u.replace(
    '<div class="pmedia small"><span class="pmedia-mark"></span></div>',
    '<div class="pmedia small"><span class="pmedia-app">${MARK_SLOT}</span><span class="pmedia-mark"></span></div>'
  );
  u = u.replace(
    ".pmedia.small{min-height:150px}",
    `.pmedia.small{min-height:150px}
.pmedia-app{position:absolute;top:14px;right:14px;z-index:2;display:grid;place-items:center;
  width:64px;height:64px;border-radius:18px;background:rgba(255,255,255,.92);
  box-shadow:0 8px 18px rgba(0,0,0,.22)}
.pmedia-app .papp{background:none;width:auto;height:auto}
.pmedia-app svg{width:40px;height:40px}`
  );
  writeFileSync("lib/ui-mock.mjs", u);
  console.log("app icon placed inside the photo frame");
}

// ---- 2. nothing sits on empty paper: a sticker accompanies every step ----
let b = readFileSync("lib/build-ink.mjs", "utf8");
if (!b.includes("sticker")) {
  b = b.replace(
    '    <span class="backdrop" style="color:${ink}">${illo(tip.icon, i)}</span>',
    `    <span class="backdrop" style="color:\${ink}">\${illo(tip.icon, i)}</span>
    <span class="sticker s-a" style="color:\${ink}">\${illo(tip.icon, i)}</span>
    <span class="sticker s-b" style="color:\${PAIR[(i + 1) % PAIR.length]}">\${illo(i % 2 ? "sparkle" : "star", i + 3)}</span>`
  );
  b = b.replace(
    "/* --- step scene --- */",
    `/* stickers fill the corners the layout leaves bare */
.sticker{position:absolute;z-index:1;opacity:.9;pointer-events:none}
.sticker svg{width:150px;height:150px}
.sticker.s-a{left:70px;top:400px}
.sticker.s-b{right:80px;top:330px}
.sticker.s-b svg{width:110px;height:110px}
/* --- step scene --- */`
  );
  b = b.replace(
    "  // the backdrop drifts so the frame is never static behind the device",
    `  // stickers pop in and bob so the corners never read as dead space
  tl.fromTo(id+" .sticker",{scale:0,rotation:-24,opacity:0},
            {scale:1,rotation:0,opacity:.9,duration:.5,stagger:.12,ease:"back.out(2.2)"},at+.35);
  tl.to(id+" .s-a",{y:-18,rotation:6,duration:1.5,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.5)),ease:"sine.inOut"},at+.9);
  tl.to(id+" .s-b",{y:16,rotation:-8,duration:1.8,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.8)),ease:"sine.inOut"},at+1.0);
  // the backdrop drifts so the frame is never static behind the device`
  );
  writeFileSync("lib/build-ink.mjs", b);
  console.log("corner stickers added");
}

// ---- 3. music dynamics: loud in the gaps, well under the voice ----
let d = readFileSync("daily-render.mjs", "utf8");
if (!d.includes("volume=0.85")) {
  d = d.replace(
    '`-filter_complex "[1:a]volume=0.55[m];[m][2:a]sidechaincompress=threshold=0.03:ratio=12:attack=15:release=320[duck];[duck][2:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]" ` +',
    '`-filter_complex "[1:a]volume=0.85[m];[m][2:a]sidechaincompress=threshold=0.02:ratio=20:attack=8:release=260:makeup=1[duck];[duck][2:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]" ` +'
  );
  writeFileSync("daily-render.mjs", d);
  console.log("music: louder in gaps, deeper duck under speech");
}
