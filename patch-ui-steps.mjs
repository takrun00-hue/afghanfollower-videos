import { readFileSync, writeFileSync } from "node:fs";
import { UI_CSS } from "./lib/ui-mock.mjs";

// ---------- 1. give each step a screen to show ----------
let f = readFileSync("lib/features.mjs", "utf8");
if (!f.includes("ui:")) {
  const UI = {
    collab: [
      `, ui: { screen: "compose", title: "پست جدید", cta: "اشتراک‌گذاری" }`,
      `, ui: { screen: "list", title: "پست جدید", rows: ["تگ کردن افراد", "افزودن مکان", "افزودن موسیقی"], hit: 0 }`,
      `, ui: { screen: "list", title: "تگ کردن افراد", rows: ["دعوت از همکار (Collab)", "جستجوی افراد"], hit: 0 }`,
      `, ui: { screen: "result", title: "منتشر شد" }`,
    ],
    "hidden-words": [
      `, ui: { screen: "list", title: "تنظیمات", rows: ["حریم خصوصی", "اعلان‌ها", "حساب کاربری"], hit: 0 }`,
      `, ui: { screen: "list", title: "حریم خصوصی", rows: ["کلمات پنهان", "محدودکردن", "مسدودشده‌ها"], hit: 0 }`,
      `, ui: { screen: "list", title: "کلمات پنهان", rows: ["پنهان‌کردن کامنت‌های آزاردهنده", "فیلتر پیام‌ها"], hit: 0 }`,
      `, ui: { screen: "result", title: "فعال شد" }`,
    ],
    "reels-template": [
      `, ui: { screen: "compose", title: "ریلز", cta: "استفاده از قالب" }`,
      `, ui: { screen: "list", title: "ریلز", rows: ["استفاده از قالب", "ذخیره", "اشتراک‌گذاری"], hit: 0 }`,
      `, ui: { screen: "compose", title: "انتخاب رسانه", cta: "بعدی" }`,
      `, ui: { screen: "result", title: "آمادهٔ انتشار" }`,
    ],
    "reply-video": [
      `, ui: { screen: "comment", title: "کامنت‌ها", rows: ["این را چطور ساختی؟", "خیلی خوب بود!"], hit: 0 }`,
      `, ui: { screen: "comment", title: "کامنت‌ها", rows: ["این را چطور ساختی؟"], hit: 0 }`,
      `, ui: { screen: "compose", title: "ضبط جواب", cta: "ضبط" }`,
      `, ui: { screen: "result", title: "منتشر شد" }`,
    ],
    qa: [
      `, ui: { screen: "list", title: "ابزارهای سازنده", rows: ["پرسش و پاسخ (Q&A)", "تحلیل‌ها", "پروموت"], hit: 0 }`,
      `, ui: { screen: "list", title: "پرسش و پاسخ", rows: ["فعال‌سازی Q&A"], hit: 0 }`,
      `, ui: { screen: "comment", title: "سؤال‌ها", rows: ["چطور شروع کنم؟", "بهترین ساعت کدام است؟"], hit: 0 }`,
      `, ui: { screen: "compose", title: "جواب با ویدیو", cta: "ضبط" }`,
    ],
    "photo-mode": [
      `, ui: { screen: "list", title: "ساخت", rows: ["عکس (Photo)", "ویدیو", "لایو"], hit: 0 }`,
      `, ui: { screen: "compose", title: "حالت عکس", cta: "انتخاب عکس" }`,
      `, ui: { screen: "compose", title: "انتخاب عکس‌ها", cta: "بعدی" }`,
      `, ui: { screen: "result", title: "منتشر شد" }`,
    ],
    upscayl: [
      `, ui: { screen: "tool", url: "upscayl.org", cta: "دانلود رایگان" }`,
      `, ui: { screen: "tool", url: "upscayl", cta: "انتخاب عکس" }`,
      `, ui: { screen: "tool", url: "upscayl", cta: "بزرگ‌نمایی ۴x" }`,
      `, ui: { screen: "tool", url: "upscayl", cta: "ذخیرهٔ خروجی" }`,
    ],
    removebg: [
      `, ui: { screen: "tool", url: "remove.bg", cta: "باز کردن سایت" }`,
      `, ui: { screen: "tool", url: "remove.bg", cta: "بارگذاری عکس" }`,
      `, ui: { screen: "tool", url: "remove.bg", cta: "حذف پس‌زمینه" }`,
      `, ui: { screen: "tool", url: "remove.bg", cta: "دانلود" }`,
    ],
    "capcut-captions": [
      `, ui: { screen: "compose", title: "CapCut", cta: "افزودن ویدیو" }`,
      `, ui: { screen: "list", title: "ابزارها", rows: ["زیرنویس (Captions)", "متن", "افکت"], hit: 0 }`,
      `, ui: { screen: "list", title: "زیرنویس", rows: ["ساخت خودکار", "ویرایش متن"], hit: 0 }`,
      `, ui: { screen: "result", title: "زیرنویس آماده شد" }`,
    ],
  };

  for (const [id, uis] of Object.entries(UI)) {
    const idIdx = f.indexOf(`id: "${id}"`);
    if (idIdx < 0) continue;
    const stepsIdx = f.indexOf("steps: [", idIdx);
    const endIdx = f.indexOf("      ],", stepsIdx);
    if (stepsIdx < 0 || endIdx < 0) continue;
    let block = f.slice(stepsIdx, endIdx);
    let k = 0;
    block = block.replace(/\}\,\n/g, () => (k < uis.length ? `${uis[k++]} },\n` : "},\n"));
    f = f.slice(0, stepsIdx) + block + f.slice(endIdx);
  }
  writeFileSync("lib/features.mjs", f);
  console.log("features: UI screens attached");
}

// ---------- 2. carry ui through the pack ----------
let c = readFileSync("lib/content.mjs", "utf8");
if (!c.includes("ui: s.ui")) {
  c = c.replace(
    "tips: steps.map((s, i) => ({ icon: s.icon, step: i + 1, head: s.text })),",
    "tips: steps.map((s, i) => ({ icon: s.icon, step: i + 1, head: s.text, ui: s.ui })),"
  );
  writeFileSync("lib/content.mjs", c);
  console.log("content: ui passed through");
}

// ---------- 3. render + animate the mock ----------
let b = readFileSync("lib/build-ink.mjs", "utf8");
if (!b.includes("renderUI")) {
  b = b.replace(
    'import { readFileSync } from "node:fs";',
    'import { readFileSync } from "node:fs";\nimport { renderUI, UI_CSS } from "./ui-mock.mjs";'
  );
  // step scene shows the real screen when one is defined
  b = b.replace(
    `      <div class="stepwrap">
        <span class="stepnum" style="background:\${ink}">\${PD(tip.step)}</span>
        <span class="illo-wrap ink step-illo" style="color:\${ink}">\${illo(tip.icon, i)}</span>
      </div>`,
    `      <div class="stepwrap">
        <span class="stepnum" style="background:\${ink}">\${PD(tip.step)}</span>
        \${tip.ui
          ? renderUI(tip.ui, ink)
          : \`<span class="illo-wrap ink step-illo" style="color:\${ink}">\${illo(tip.icon, i)}</span>\`}
      </div>`
  );
  b = b.replace("/* --- step scene --- */", UI_CSS + "\n/* --- step scene --- */");
  // three motion layers on the mock: primary (screen + tap), secondary (rows,
  // shadow), ambient (slow drift)
  b = b.replace(
    '  if(t.k==="step"){',
    `  if(t.k==="step"){
    // primary — the device arrives
    tl.fromTo(id+" .pmock",{y:70,scale:.9,opacity:0},{y:0,scale:1,opacity:1,duration:.5,ease:"back.out(1.5)"},at+.14);
    // secondary — content fills in behind the frame
    tl.fromTo(id+" .ptop",{opacity:0,y:-14},{opacity:1,y:0,duration:.3,ease:"power2.out"},at+.34);
    tl.fromTo(id+" .prow, "+id+" .pcmt",{opacity:0,x:34},{opacity:1,x:0,duration:.32,stagger:.07,ease:"power3.out"},at+.4);
    tl.fromTo(id+" .pmedia, "+id+" .pcompare, "+id+" .pduo",{opacity:0,scale:.94},{opacity:1,scale:1,duration:.36,ease:"power2.out"},at+.4);
    tl.fromTo(id+" .pcta",{opacity:0,y:20},{opacity:1,y:0,duration:.3,ease:"power2.out"},at+.56);
    // primary — the tap lands on the highlighted row
    tl.fromTo(id+" .tap .finger",{opacity:0,scale:1.7},{opacity:1,scale:1,duration:.22,ease:"power3.out"},at+.78);
    tl.fromTo(id+" .tap .ripple",{opacity:.85,scale:.3},{opacity:0,scale:1.25,duration:.55,ease:"power2.out"},at+.82);
    tl.to(id+" .tap .finger",{scale:.86,duration:.12,ease:"power2.out"},at+.82)
      .to(id+" .tap .finger",{scale:1,duration:.22,ease:"back.out(2)"},at+.94);
    tl.to(id+" .tap .finger",{opacity:0,duration:.3,ease:"power1.in"},at+1.25);
    // secondary — the tapped row confirms
    tl.fromTo(id+" .prow.hit, "+id+" .pcmt.hit",{scale:1},{scale:1.05,duration:.16,ease:"power2.out"},at+.84);
    tl.to(id+" .prow.hit, "+id+" .pcmt.hit",{scale:1,duration:.3,ease:"elastic.out(1,.6)"},at+1.0);
    tl.fromTo(id+" .ptick",{scale:0,rotation:-30},{scale:1,rotation:0,duration:.5,ease:"back.out(2.2)"},at+.7);
    // ambient — the device breathes so no frame is dead
    tl.to(id+" .pmock",{y:-10,rotation:.6,duration:2.0,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/2)),ease:"sine.inOut"},at+.9);`
  );
  writeFileSync("lib/build-ink.mjs", b);
  console.log("build-ink: UI mock + 3 motion layers");
}
