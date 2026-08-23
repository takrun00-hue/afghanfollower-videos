import { readFileSync, writeFileSync } from "node:fs";

let u = readFileSync("lib/ui-mock.mjs", "utf8");
// the before/after cards collapsed to zero height
u = u.replace(
  ".pcompare{flex:1;display:flex;gap:16px;padding:20px}",
  ".pcompare{flex:1;min-height:300px;display:flex;gap:16px;padding:20px}"
);
u = u.replace(
  ".pshot{position:relative;flex:1;border-radius:16px;overflow:hidden;border:3px solid rgba(18,58,99,.22);\n  display:grid;place-items:center}",
  ".pshot{position:relative;flex:1;min-height:260px;border-radius:16px;overflow:hidden;\n  border:3px solid rgba(18,58,99,.22);display:block}"
);
// the URL sat under the step badge — move it away from the badge corner
u = u.replace(
  '.purl{margin-right:auto;direction:ltr;',
  '.purl{margin-right:auto;margin-left:96px;direction:ltr;'
);
writeFileSync("lib/ui-mock.mjs", u);
console.log("tool window: cards sized, url cleared of the badge");

let b = readFileSync("lib/build-ink.mjs", "utf8");
// stickers were oversized line art floating loose; make them small badges
b = b.replace(
  `.sticker{position:absolute;z-index:1;opacity:.9;pointer-events:none}
.sticker svg{width:150px;height:150px}
.sticker.s-a{left:70px;top:400px}
.sticker.s-b{right:80px;top:330px}
.sticker.s-b svg{width:110px;height:110px}`,
  `.sticker{position:absolute;z-index:1;pointer-events:none;display:grid;place-items:center;
  width:132px;height:132px;border-radius:38px;background:rgba(255,255,255,.92);
  border:3px solid currentColor;box-shadow:0 14px 30px rgba(30,20,10,.16)}
.sticker svg{width:78px;height:78px}
.sticker.s-a{left:64px;top:430px}
.sticker.s-b{right:64px;top:360px;width:110px;height:110px;border-radius:32px}
.sticker.s-b svg{width:62px;height:62px}`
);
// the step badge must not cover the window chrome
b = b.replace(".stepnum{position:absolute;top:-26px;left:-26px;", ".stepnum{position:absolute;top:-30px;left:-34px;");
writeFileSync("lib/build-ink.mjs", b);
console.log("stickers restyled as badges");
