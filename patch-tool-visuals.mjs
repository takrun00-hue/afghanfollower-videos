import { readFileSync, writeFileSync } from "node:fs";
let u = readFileSync("lib/ui-mock.mjs", "utf8");

// ---- 1. the in-frame app icon was too small ----
u = u.replace(
  ".pmedia-app{position:absolute;top:14px;right:14px;z-index:2;display:grid;place-items:center;\n  width:64px;height:64px;border-radius:18px;",
  ".pmedia-app{position:absolute;top:16px;right:16px;z-index:2;display:grid;place-items:center;\n  width:104px;height:104px;border-radius:28px;"
);
u = u.replace(".pmedia-app svg{width:40px;height:40px}", ".pmedia-app svg{width:68px;height:68px}");
u = u.replace(".papp{margin-left:auto;display:grid;place-items:center;width:52px;height:52px;border-radius:14px;",
              ".papp{margin-left:auto;display:grid;place-items:center;width:64px;height:64px;border-radius:18px;");
u = u.replace(".papp svg{width:34px;height:34px}", ".papp svg{width:44px;height:44px}");

// ---- 2. the tool window showed grey hatch; make it a real before/after ----
if (!u.includes("pshot")) {
  u = u.replace(
    `    <div class="pcompare">
      <span class="pbefore"></span>
      <span class="pafter" style="border-color:\${ink}"></span>
    </div>`,
    `    <div class="pcompare">
      <span class="pshot before"><i class="pshot-img"></i><b class="pshot-tag">قبل</b></span>
      <span class="pshot after" style="border-color:\${ink}">
        <i class="pshot-img"></i><b class="pshot-tag on" style="background:\${ink}">بعد</b>
        <span class="pshot-app">\${MARK_SLOT}</span>
      </span>
    </div>`
  );
  u = u.replace(/function toolScreen\(ui, ink\) \{/, 'function toolScreen(ui, ink, MARK_SLOT = "") {');
  u = u.replace('ui.screen === "tool" ? toolScreen(ui, ink) :', 'ui.screen === "tool" ? toolScreen(ui, ink, mark) :');
  u = u.replace(
    /\.pbefore,\.pafter\{flex:1;border-radius:14px;border:3px solid rgba\(18,58,99,\.25\)\}\n\.pbefore\{background:repeating-linear-gradient\(135deg,rgba\(18,58,99,\.20\) 0 6px,rgba\(18,58,99,\.06\) 6px 12px\);filter:blur\(2\.5px\)\}\n\.pafter\{background:repeating-linear-gradient\(135deg,rgba\(18,58,99,\.20\) 0 14px,rgba\(18,58,99,\.05\) 14px 28px\);border-width:4px\}/,
    `.pshot{position:relative;flex:1;border-radius:16px;overflow:hidden;border:3px solid rgba(18,58,99,.22);
  display:grid;place-items:center}
.pshot.before{filter:blur(2.2px) saturate(.55)}
.pshot.after{border-width:5px;box-shadow:0 10px 26px rgba(0,0,0,.18)}
.pshot-img{position:absolute;inset:0;
  background:linear-gradient(150deg,color-mix(in srgb,var(--ink) 62%,#fff),color-mix(in srgb,var(--ink) 22%,#fff) 55%,#fff)}
.pshot-img::after{content:"";position:absolute;left:16%;top:52%;width:70%;height:60%;border-radius:50% 50% 44% 44%;
  background:rgba(255,255,255,.55)}
.pshot-img::before{content:"";position:absolute;left:28%;top:16%;width:34%;aspect-ratio:1;border-radius:50%;
  background:rgba(255,255,255,.85)}
.pshot-tag{position:absolute;bottom:12px;right:12px;z-index:2;font-weight:800;font-size:24px;direction:rtl;
  background:rgba(255,255,255,.9);color:#1b2430;border-radius:999px;padding:6px 18px}
.pshot-tag.on{color:#fff}
.pshot-app{position:absolute;top:12px;left:12px;z-index:2;display:grid;place-items:center;
  width:74px;height:74px;border-radius:20px;background:rgba(255,255,255,.92);box-shadow:0 8px 18px rgba(0,0,0,.22)}
.pshot-app .papp{background:none;width:auto;height:auto;margin:0}
.pshot-app svg{width:48px;height:48px}`
  );
  console.log("tool window: real before/after imagery");
}
writeFileSync("lib/ui-mock.mjs", u);
console.log("in-frame icons enlarged");
