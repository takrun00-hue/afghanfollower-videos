// A1 German curriculum for the (former "German Insider" news) channel —
// owner request 2026-09-08: replace the news feed with a continuing,
// animated German-lesson series, narrated in Persian with the target
// German word/phrase shown and spoken; then owner corrections the same day:
// (1) the German itself must actually be pronounced, not just shown as
// text — handled in german-lesson-build.mjs/lib/voice-settings.mjs;
// (2) formal (Sie) vs informal (du) register must be taught explicitly,
// not left implicit — every item below that has a register carries it
// directly in `fa`, and a whole unit (a1-02) is now built around the
// distinction, since it is one of the first things a real A1 course
// covers right after greetings; (3) no mascot animation — real, topic-
// matched photos instead (`img`, an English search phrase used by
// lib/lesson-image.mjs), same real-photo bar (assertVisualProof) the rest
// of this project's tutorials already meet, not the cartoon style.
//
// Standard CEFR/Goethe-Institut A1 sequencing: greetings and courtesy
// before grammar, numbers before dates, question words before full
// sentences. Content itself (vocabulary, meaning, register, pronunciation)
// is fixed pedagogical material, not something that needs live research
// the way a news story or app-feature claim does.
//
// Each unit: 4 items (word/phrase, Persian meaning, an English search
// phrase for a real matching photo, and a short bilingual usage example).

export const GERMAN_A1 = [
  {
    id: "a1-01-greetings",
    topic: "سلام و احوال‌پرسی",
    hook: "با یک کلمه، اولین برخوردت به آلمانی حرفه‌ای می‌شود.",
    items: [
      { de: "Hallo", fa: "سلام (غیررسمی)", img: "two friends waving hello outdoors photo", example: "Hallo! Wie geht's? — سلام! حالت چطوره؟" },
      { de: "Guten Morgen", fa: "صبح بخیر", img: "good morning sunrise coffee photo", example: "Guten Morgen, Frau Meyer! — صبح بخیر خانم مایر!" },
      { de: "Guten Tag", fa: "روز بخیر (رسمی)", img: "business handshake formal greeting office photo", example: "Guten Tag, ich heiße Ali. — روز بخیر، اسم من علی است." },
      { de: "Tschüss", fa: "خداحافظ (غیررسمی)", img: "friends waving goodbye photo", example: "Tschüss, bis morgen! — خداحافظ، تا فردا!" },
    ],
  },
  {
    id: "a1-02-formal-informal",
    topic: "رسمی و غیررسمی: du و Sie",
    hook: "یک اشتباه ساده می‌تواند مؤدبانه یا بی‌ادبانه به نظر برسد — تفاوتش را یاد بگیر.",
    items: [
      { de: "Wie heißt du?", fa: "اسم تو چیست؟ (غیررسمی — با دوستان و هم‌سن‌ها)", img: "young friends talking casually photo", example: "Wie heißt du? — Ich heiße Tom." },
      { de: "Wie heißen Sie?", fa: "اسم شما چیست؟ (رسمی — با غریبه‌ها یا در محیط کار)", img: "formal business meeting introduction photo", example: "Wie heißen Sie? — Ich heiße Frau Schmidt." },
      { de: "Ich heiße...", fa: "اسم من ... است (برای هر دو حالت)", img: "person introducing themselves smiling photo", example: "Ich heiße Sara. — اسم من سارا است." },
      { de: "Und du? / Und Sie?", fa: "تو چطور؟ (غیررسمی) / شما چطور؟ (رسمی)", img: "two people having conversation photo", example: "Ich heiße Ali. Und du? — اسم من علی است. تو چطور؟" },
    ],
  },
  {
    id: "a1-03-politeness",
    topic: "ادب و تعارف",
    hook: "این ۴ کلمه هر مکالمه‌ای را مؤدبانه می‌کند.",
    items: [
      { de: "Danke", fa: "متشکرم", img: "person saying thank you smiling photo", example: "Danke schön! — خیلی متشکرم!" },
      { de: "Bitte", fa: "خواهش می‌کنم / بفرمایید", img: "person offering something politely photo", example: "Bitte, kein Problem. — خواهش می‌کنم، مشکلی نیست." },
      { de: "Entschuldigung", fa: "ببخشید", img: "person asking for directions on street photo", example: "Entschuldigung, wo ist der Bahnhof? — ببخشید، ایستگاه قطار کجاست؟" },
      { de: "Es tut mir leid", fa: "متأسفم", img: "person apologizing photo", example: "Es tut mir leid, ich bin spät. — متأسفم، دیر کردم." },
    ],
  },
  {
    id: "a1-04-numbers-1",
    topic: "اعداد ۰ تا ۵",
    hook: "شمردن به آلمانی را از همین‌جا شروع کن.",
    items: [
      { de: "null, eins", fa: "صفر، یک", img: "number one hand finger counting photo", example: "eins, zwei — یک، دو" },
      { de: "zwei, drei", fa: "دو، سه", img: "three coffee cups on table photo", example: "drei Kaffee, bitte. — سه قهوه، لطفاً." },
      { de: "vier", fa: "چهار", img: "family of four photo", example: "Ich habe vier Kinder. — من چهار فرزند دارم." },
      { de: "fünf", fa: "پنج", img: "clock showing five oclock photo", example: "Es ist fünf Uhr. — ساعت پنج است." },
    ],
  },
  {
    id: "a1-05-numbers-2",
    topic: "اعداد ۶ تا ۱۰",
    hook: "تا ده به آلمانی بشمار، بدون مکث.",
    items: [
      { de: "sechs, sieben", fa: "شش، هفت", img: "calendar week days photo", example: "sechs Tage — شش روز" },
      { de: "acht", fa: "هشت", img: "person working at desk clock photo", example: "Ich arbeite acht Stunden. — من هشت ساعت کار می‌کنم." },
      { de: "neun", fa: "نه", img: "city bus arriving at stop photo", example: "Der Bus kommt um neun. — اتوبوس ساعت نه می‌آید." },
      { de: "zehn", fa: "ده", img: "euro banknotes and coins photo", example: "zehn Euro, bitte. — ده یورو، لطفاً." },
    ],
  },
  {
    id: "a1-06-family",
    topic: "خانواده",
    hook: "با این ۴ کلمه، دربارهٔ خانواده‌ات آلمانی حرف بزن.",
    items: [
      { de: "die Mutter", fa: "مادر", img: "mother and child portrait photo", example: "Das ist meine Mutter. — این مادر من است." },
      { de: "der Vater", fa: "پدر", img: "father and child portrait photo", example: "Mein Vater arbeitet viel. — پدرم زیاد کار می‌کند." },
      { de: "der Bruder", fa: "برادر", img: "two brothers together photo", example: "Ich habe einen Bruder. — من یک برادر دارم." },
      { de: "die Schwester", fa: "خواهر", img: "two sisters together photo", example: "Meine Schwester ist nett. — خواهرم مهربان است." },
    ],
  },
  {
    id: "a1-07-question-words",
    topic: "کلمات پرسشی",
    hook: "این ۴ کلمه، هر سؤالی را برایت ممکن می‌کند.",
    items: [
      { de: "Was?", fa: "چی؟", img: "person asking question confused photo", example: "Was ist das? — این چیست؟" },
      { de: "Wo?", fa: "کجا؟", img: "person looking at map location photo", example: "Wo bist du? — کجا هستی؟" },
      { de: "Wann?", fa: "کی؟", img: "person checking watch time photo", example: "Wann kommst du? — کی می‌آیی؟" },
      { de: "Wie?", fa: "چطور؟", img: "two people talking asking how photo", example: "Wie geht's dir? — حالت چطوره؟" },
    ],
  },
  {
    id: "a1-08-sein",
    topic: "فعل sein (بودن)",
    hook: "مهم‌ترین فعل آلمانی را در ۴ جمله یاد بگیر.",
    items: [
      { de: "ich bin", fa: "من هستم", img: "tired person resting photo", example: "Ich bin müde. — من خسته‌ام." },
      { de: "du bist", fa: "تو هستی", img: "friendly person smiling portrait photo", example: "Du bist nett. — تو مهربانی." },
      { de: "er/sie ist", fa: "او هست", img: "teacher in classroom photo", example: "Sie ist Lehrerin. — او معلم است." },
      { de: "wir sind", fa: "ما هستیم", img: "family at home together photo", example: "Wir sind zu Hause. — ما در خانه هستیم." },
    ],
  },
];

// Curriculum order = teaching order; a resume/restart never skips ahead
// on its own. dayIndex is only used to keep the id deterministic if two
// runs land the same day (mirrors packsForDate's own convention).
export function germanUnitAt(index) {
  return GERMAN_A1[((index % GERMAN_A1.length) + GERMAN_A1.length) % GERMAN_A1.length];
}
