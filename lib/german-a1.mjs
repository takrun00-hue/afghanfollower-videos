// A1 German curriculum for the (former "German Insider" news) channel —
// owner request 2026-09-08: replace the news feed with a continuing,
// animated German-lesson series, narrated in Persian with the target
// German word/phrase shown and spoken.
//
// Standard CEFR/Goethe-Institut A1 sequencing: greetings and courtesy
// before grammar, numbers before dates, question words before full
// sentences. Content itself (vocabulary, meaning, pronunciation) is fixed
// pedagogical material, not something that needs live research the way a
// news story or app-feature claim does.
//
// Each unit: 4 items (word/phrase, Persian meaning, a short usage example
// spoken half in German half in Persian so the example itself teaches
// context, not just a word list).

export const GERMAN_A1 = [
  {
    id: "a1-01-greetings",
    topic: "سلام و احوال‌پرسی",
    hook: "با یک کلمه، اولین برخوردت به آلمانی حرفه‌ای می‌شود.",
    items: [
      { de: "Hallo", fa: "سلام", example: "Hallo! Wie geht's? — سلام! حالت چطوره؟" },
      { de: "Guten Morgen", fa: "صبح بخیر", example: "Guten Morgen, Frau Meyer! — صبح بخیر خانم مایر!" },
      { de: "Guten Tag", fa: "روز بخیر (رسمی)", example: "Guten Tag, ich heiße Ali. — روز بخیر، اسم من علی است." },
      { de: "Tschüss", fa: "خداحافظ (غیررسمی)", example: "Tschüss, bis morgen! — خداحافظ، تا فردا!" },
    ],
  },
  {
    id: "a1-02-introduce",
    topic: "معرفی خودت",
    hook: "با ۴ جمله، خودت را کامل به آلمانی معرفی کن.",
    items: [
      { de: "Ich heiße...", fa: "اسم من ... است", example: "Ich heiße Sara. — اسم من سارا است." },
      { de: "Wie heißt du?", fa: "اسم تو چیست؟", example: "Wie heißt du? — Ich heiße Tom." },
      { de: "Ich komme aus...", fa: "من اهل ... هستم", example: "Ich komme aus Afghanistan. — من اهل افغانستان هستم." },
      { de: "Woher kommst du?", fa: "اهل کجا هستی؟", example: "Woher kommst du? — Ich komme aus Kabul." },
    ],
  },
  {
    id: "a1-03-politeness",
    topic: "ادب و تعارف",
    hook: "این ۴ کلمه هر مکالمه‌ای را مؤدبانه می‌کند.",
    items: [
      { de: "Danke", fa: "متشکرم", example: "Danke schön! — خیلی متشکرم!" },
      { de: "Bitte", fa: "خواهش می‌کنم / بفرمایید", example: "Bitte, kein Problem. — خواهش می‌کنم، مشکلی نیست." },
      { de: "Entschuldigung", fa: "ببخشید", example: "Entschuldigung, wo ist der Bahnhof? — ببخشید، ایستگاه قطار کجاست؟" },
      { de: "Es tut mir leid", fa: "متأسفم", example: "Es tut mir leid, ich bin spät. — متأسفم، دیر کردم." },
    ],
  },
  {
    id: "a1-04-numbers-1",
    topic: "اعداد ۰ تا ۵",
    hook: "شمردن به آلمانی را از همین‌جا شروع کن.",
    items: [
      { de: "null, eins", fa: "صفر، یک", example: "eins, zwei — یک، دو" },
      { de: "zwei, drei", fa: "دو، سه", example: "drei Kaffee, bitte. — سه قهوه، لطفاً." },
      { de: "vier", fa: "چهار", example: "Ich habe vier Kinder. — من چهار فرزند دارم." },
      { de: "fünf", fa: "پنج", example: "Es ist fünf Uhr. — ساعت پنج است." },
    ],
  },
  {
    id: "a1-05-numbers-2",
    topic: "اعداد ۶ تا ۱۰",
    hook: "تا ده به آلمانی بشمار، بدون مکث.",
    items: [
      { de: "sechs, sieben", fa: "شش، هفت", example: "sechs Tage — شش روز" },
      { de: "acht", fa: "هشت", example: "Ich arbeite acht Stunden. — من هشت ساعت کار می‌کنم." },
      { de: "neun", fa: "نه", example: "Der Bus kommt um neun. — اتوبوس ساعت نه می‌آید." },
      { de: "zehn", fa: "ده", example: "zehn Euro, bitte. — ده یورو، لطفاً." },
    ],
  },
  {
    id: "a1-06-family",
    topic: "خانواده",
    hook: "با این ۴ کلمه، دربارهٔ خانواده‌ات آلمانی حرف بزن.",
    items: [
      { de: "die Mutter", fa: "مادر", example: "Das ist meine Mutter. — این مادر من است." },
      { de: "der Vater", fa: "پدر", example: "Mein Vater arbeitet viel. — پدرم زیاد کار می‌کند." },
      { de: "der Bruder", fa: "برادر", example: "Ich habe einen Bruder. — من یک برادر دارم." },
      { de: "die Schwester", fa: "خواهر", example: "Meine Schwester ist nett. — خواهرم مهربان است." },
    ],
  },
  {
    id: "a1-07-question-words",
    topic: "کلمات پرسشی",
    hook: "این ۴ کلمه، هر سؤالی را برایت ممکن می‌کند.",
    items: [
      { de: "Was?", fa: "چی؟", example: "Was ist das? — این چیست؟" },
      { de: "Wo?", fa: "کجا؟", example: "Wo bist du? — کجا هستی؟" },
      { de: "Wann?", fa: "کی؟", example: "Wann kommst du? — کی می‌آیی؟" },
      { de: "Wie?", fa: "چطور؟", example: "Wie geht's dir? — حالت چطوره؟" },
    ],
  },
  {
    id: "a1-08-sein",
    topic: "فعل sein (بودن)",
    hook: "مهم‌ترین فعل آلمانی را در ۴ جمله یاد بگیر.",
    items: [
      { de: "ich bin", fa: "من هستم", example: "Ich bin müde. — من خسته‌ام." },
      { de: "du bist", fa: "تو هستی", example: "Du bist nett. — تو مهربانی." },
      { de: "er/sie ist", fa: "او هست", example: "Sie ist Lehrerin. — او معلم است." },
      { de: "wir sind", fa: "ما هستیم", example: "Wir sind zu Hause. — ما در خانه هستیم." },
    ],
  },
];

// Curriculum order = teaching order; a resume/restart never skips ahead
// on its own. dayIndex is only used to keep the id deterministic if two
// runs land the same day (mirrors packsForDate's own convention).
export function germanUnitAt(index) {
  return GERMAN_A1[((index % GERMAN_A1.length) + GERMAN_A1.length) % GERMAN_A1.length];
}
