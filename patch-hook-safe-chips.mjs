// 1) A hook that actually stops the scroll: full-bleed colour block, huge type,
//    and a preview of the RESULT instead of a small decorative sketch.
// 2) Text constrained to the 9:16 centre column so TikTok's side rails and the
//    caption strip never cover the ends of a line.
// 3) The like / follow / share chips from the neon cut, brought into this design.
import { readFileSync, writeFileSync } from "node:fs";

let b = readFileSync("lib/build-ink.mjs", "utf8");

// ---------- 1. HOOK ----------
if (!b.includes("hookblock")) {
  b = b.replace(
    `    <div class="world" id="w1">
      <div class="hookbadge">\${pack.hook.badge || "۸ قابلیت"}</div>
      <div class="hookq">\${pack.hook.l1}<br/><span class="hl">\${plain(pack.hook.l2)}</span></div>
      <span class="hookillo">\${illo("bulb", 0)}</span>
    </div>`,
    `    <div class="world hookworld" id="w1">
      <div class="hookblock" style="background:\${PAIR[1]}">
        <span class="hookkicker">\${pack.hook.badge || "قابلیت"}</span>
      </div>
      <div class="hookq">\${pack.hook.l1}<br/><span class="hl">\${plain(pack.hook.l2)}</span></div>
      <div class="hookpreview">
        \${pack.tips && pack.tips.length
          ? renderUI(pack.tips[pack.tips.length - 1].ui || pack.tips[0].ui, PAIR[0])
          : ""}
        <span class="hookburst" style="border-color:\${PAIR[1]}"></span>
      </div>
      <div class="hookcue"><i style="border-color:\${PAIR[1]}"></i><i style="border-color:\${PAIR[1]}"></i></div>
    </div>`
  );

  b = b.replace(
    "/* --- hook --- */",
    `/* --- hook: block + huge type + a preview of the payoff --- */
.hookworld{padding:210px 90px 330px;justify-content:flex-start}
.hookblock{width:calc(100% + 180px);margin:0 -90px 34px;padding:20px 90px;display:flex;justify-content:center;
  box-shadow:0 18px 44px rgba(30,20,10,.28)}
.hookkicker{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:58px;color:#fff;
  direction:ltr;letter-spacing:.01em}
.hookpreview{position:relative;margin-top:26px;display:grid;place-items:center}
.hookpreview .pmock{width:360px;height:520px;transform:rotate(-4deg)}
.hookpreview .pmock .ptext,.hookpreview .pmock .pbubble{font-size:24px}
.hookpreview .pmock .ptitle{font-size:26px}
.hookburst{position:absolute;width:520px;height:520px;border-radius:50%;border:5px dashed;opacity:.35;z-index:-1}
.hookcue{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:22px}
.hookcue i{width:44px;height:44px;border-right:10px solid;border-bottom:10px solid;transform:rotate(45deg);border-radius:4px}
/* --- hook --- */`
  );

  // hook motion: block wipes, type slams, the preview pops, cue pulses
  b = b.replace(
    `tl.fromTo("#s1 .hookq",{scale:1.08},{scale:1,duration:.3,ease:"power3.out"},0);
tl.fromTo("#s1 .hookbadge",{scale:0,rotation:-12},{scale:1,rotation:0,duration:.42,ease:"back.out(2.4)"},.08);
tl.fromTo("#s1 .hookillo",{y:60,opacity:0,rotation:-6},{y:0,opacity:1,rotation:0,duration:.55,ease:"back.out(1.6)"},.3);
drawIn("#s1 .hookillo .illo",.36,.7);`,
    `tl.fromTo("#s1 .hookq",{scale:1.1},{scale:1,duration:.32,ease:"power3.out"},0);
tl.fromTo("#s1 .hookblock",{scaleX:0,transformOrigin:"right center"},{scaleX:1,duration:.4,ease:"power4.out"},0);
tl.fromTo("#s1 .hookkicker",{opacity:0,x:50},{opacity:1,x:0,duration:.34,ease:"power3.out"},.2);
tl.fromTo("#s1 .hookpreview .pmock",{y:90,scale:.7,rotation:-16,opacity:0},
          {y:0,scale:1,rotation:-4,opacity:1,duration:.62,ease:"back.out(1.7)"},.26);
tl.fromTo("#s1 .hookpreview .prow, #s1 .hookpreview .pcmt",{opacity:0,x:24},{opacity:1,x:0,duration:.28,stagger:.06,ease:"power3.out"},.5);
tl.fromTo("#s1 .hookburst",{scale:.5,opacity:0},{scale:1,opacity:.35,duration:.6,ease:"power3.out"},.3);
tl.to("#s1 .hookburst",{rotation:180,duration:6,ease:"none",repeat:1},.4);
tl.fromTo("#s1 .hookcue i",{opacity:0,y:-18},{opacity:1,y:0,duration:.26,stagger:.1,ease:"power2.out"},.62);
tl.to("#s1 .hookcue i",{y:16,duration:.5,yoyo:true,repeat:5,stagger:.1,ease:"sine.inOut"},.9);`
  );
  console.log("hook rebuilt");
}

// ---------- 2. SAFE TEXT COLUMN ----------
if (!b.includes("--safe")) {
  // TikTok/Reels paint over roughly 120px each side; keep every line inside the
  // centre column even when its band is full-bleed.
  b = b.replace(
    ".band{position:relative;width:calc(100% + 140px);",
    ".band{--safe:840px;position:relative;width:calc(100% + 140px);"
  );
  b = b.replace(
    ".band .hl{color:#ffd98a}",
    `.band .hl{color:#ffd98a}
.band span{display:block;max-width:var(--safe);margin:0 auto}`
  );
  b = b.replace(
    ".cap{position:absolute;left:60px;right:60px;",
    ".cap{position:absolute;left:120px;right:120px;"
  );
  b = b.replace(
    ".hookq{font-family:",
    ".hookq{max-width:860px;font-family:"
  );
  b = b.replace(
    ".cmprow{width:100%;",
    ".cmprow{width:100%;max-width:840px;"
  );
  console.log("text constrained to the safe column");
}

// ---------- 3. LIKE / FOLLOW / SHARE CHIPS ----------
if (!b.includes("actchips")) {
  b = b.replace(
    `      <div class="cta">\${pack.outro.follow}</div>`,
    `      <div class="cta">\${pack.outro.follow}</div>
      <div class="actchips">
        <div class="actchip"><i style="background:\${PAIR[1]}"></i><span>پست مارو لایک کن!</span></div>
        <div class="actchip"><i style="background:\${PAIR[0]}"></i><span>پیج مارو فالو کن!</span></div>
        <div class="actchip"><i style="background:\${PAIR[1]}"></i><span>پست مارو شیر کن!</span></div>
      </div>`
  );
  b = b.replace(
    ".cta{margin-top:44px;",
    `.actchips{width:100%;max-width:840px;margin-top:34px;display:flex;flex-direction:column;gap:12px}
.actchip{display:flex;align-items:center;gap:16px;background:#fff;border-radius:16px;padding:16px 22px;
  border:2px solid rgba(20,30,50,.10);box-shadow:0 12px 28px rgba(30,20,10,.16)}
.actchip span{font-weight:800;font-size:36px;color:#1b2430}
.actchip i{width:40px;height:40px;border-radius:11px;flex:none;display:block}
.cta{margin-top:44px;`
  );
  b = b.replace(
    `tl.to("#sOut .cta",{scale:1.05,duration:.5,yoyo:true,repeat:2,ease:"sine.inOut"},OUT_AT+1.4);`,
    `tl.fromTo("#sOut .actchip",{x:-220,opacity:0},{x:0,opacity:1,duration:.38,stagger:.11,ease:"power4.out"},OUT_AT+1.0);
tl.to("#sOut .cta",{scale:1.05,duration:.5,yoyo:true,repeat:2,ease:"sine.inOut"},OUT_AT+1.4);`
  );
  // give the outro room for the extra rows
  b = b.replace(".outro .wrap{padding:120px 90px 300px}", ".outro .wrap{padding:150px 90px 300px}");
  b = b.replace(".outrocircle{width:340px;height:340px;", ".outrocircle{width:240px;height:240px;");
  b = b.replace(".outrocircle img{width:200px;height:200px;", ".outrocircle img{width:150px;height:150px;");
  b = b.replace(".brandname{font-weight:900;font-size:96px;", ".brandname{font-weight:900;font-size:74px;");
  b = b.replace(".brandsub{font-weight:700;font-size:46px;", ".brandsub{font-weight:700;font-size:38px;");
  b = b.replace(".payoff{font-weight:800;font-size:48px;", ".payoff{font-weight:800;font-size:40px;");
  b = b.replace(".cta{margin-top:44px;font-weight:900;font-size:52px;", ".cta{margin-top:30px;font-weight:900;font-size:46px;");
  console.log("like / follow / share chips added");
}

writeFileSync("lib/build-ink.mjs", b);
