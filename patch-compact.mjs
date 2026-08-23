import { readFileSync, writeFileSync } from "node:fs";
let s = readFileSync("lib/build-ink.mjs", "utf8");

if (!s.includes("const COMPACT")) {
  s = s.replace(
    "  const tipStart = (i) => HOOK + i * TIP;",
    `  const tipStart = (i) => HOOK + i * TIP;
  // Under ~3.2s a two-line caption cannot be read — drop the chrome and let the
  // band headline + illustration carry the message (short-form scanning).
  const COMPACT = TIP < 3.2;`
  );

  // swap the kicker/caption chrome for a compact feature chip
  const oldBlock = [
    '      <div class="kick">${pack.kicker || "قابلیت"}</div>',
    "${inner}",
    '      <div class="cap">${tip.sub}</div>',
  ].join("\n");
  const newBlock = [
    "      ${COMPACT ? \"\" : `<div class=\"kick\">${pack.kicker || \"قابلیت\"}</div>`}",
    "${inner}",
    "      ${COMPACT",
    "        ? (tip.feature || tip.tool ? `<div class=\"chip\">${plain(tip.feature || tip.tool)}</div>` : \"\")",
    "        : `<div class=\"cap\">${tip.sub}</div>`}",
  ].join("\n");
  if (!s.includes(oldBlock)) throw new Error("scene block anchor not found");
  s = s.replace(oldBlock, newBlock);

  // compact styling
  s = s.replace(
    "/* --- hook --- */",
    `/* --- compact (short-form) --- */
.compact .world{padding:300px 70px 420px}
.compact .band{font-size:84px;padding:34px 60px;margin-top:56px}
.compact .circleblock{width:640px;height:640px}
.compact .illo{width:400px}
.compact .illo-wrap.ink.big .illo{width:500px}
.chip{margin-top:34px;font-weight:800;font-size:46px;color:#123a63;background:rgba(255,255,255,.92);
  border:2px solid rgba(18,58,99,.25);border-radius:999px;padding:16px 44px;direction:ltr;
  box-shadow:0 12px 30px rgba(30,20,10,.14)}
/* --- hook --- */`
  );

  // root gets the compact class
  s = s.replace(
    '<div id="root" data-composition-id="main"',
    '<div id="root" class="${COMPACT ? \'compact\' : \'\'}" data-composition-id="main"'
  );

  // faster whip so the entrance does not eat a short scene
  s = s.replace(
    '{x:0,filter:"blur(0px)",opacity:1,duration:.46,ease:"power3.out"},at);',
    '{x:0,filter:"blur(0px)",opacity:1,duration:COMPACT_JS?.34:.46,ease:"power3.out"},at);'
  );
  s = s.replace(
    "var TIPS = ",
    "var COMPACT_JS = " + "${COMPACT};\nvar TIPS = "
  );

  writeFileSync("lib/build-ink.mjs", s);
  console.log("compact mode added");
} else {
  console.log("already patched");
}
