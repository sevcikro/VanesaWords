"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const databasePath = path.join(root, "english_slovak_words.json");

function normalizeAnswer(value) {
  return String(value)
    .normalize("NFKC")
    .toLocaleLowerCase("sk")
    .replace(/[\s\-_]+/gu, " ")
    .replace(/[^\p{L}\p{N}_\s]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function answers(values) {
  return {
    accepted_answers: values,
    normalized_answers: [...new Set(values.map(normalizeAnswer).filter(Boolean))].sort(),
  };
}

const corrections = new Map([
  [
    240,
    {
      english: "thing",
      slovak: "vec",
      ...answers(["vec"]),
      explanation_sk:
        "podstatné meno\nPredmet, skutočnosť, myšlienka alebo záležitosť.\nPríklad: To je dôležitá vec.",
      definition_en:
        "noun\nAn object, fact, idea, event, or matter that is being discussed or considered.",
    },
  ],
  [661, { english: "chapter" }],
  [
    757,
    {
      english: "environment",
      explanation_sk:
        "podstatné meno\nOkolité podmienky, v ktorých ľudia, zvieratá alebo rastliny žijú; tiež prírodné životné prostredie.",
    },
  ],
  [
    1224,
    {
      english: "environmental",
      slovak: "environmentálny, týkajúci sa životného prostredia",
      ...answers(["environmentálny", "týkajúci sa životného prostredia"]),
      explanation_sk:
        "prídavné meno\nSúvisiaci so životným prostredím alebo s vplyvom ľudskej činnosti na prírodu.",
      definition_en:
        "adjective\nRelating to the natural world and the effect of human activity on it.",
    },
  ],
  [1856, { english: "occurred" }],
]);

const additions = [
  {
    english: "replace",
    slovak: "nahradiť, vymeniť, zastúpiť",
    accepted: ["nahradiť", "vymeniť", "zastúpiť"],
    level: "A2",
    explanation: "sloveso\nDať niekoho alebo niečo namiesto inej osoby alebo veci.",
    definition: "verb\nTo put someone or something in the place of another person or thing.",
  },
  {
    english: "comfortable",
    slovak: "pohodlný, príjemný",
    accepted: ["pohodlný", "príjemný"],
    level: "A2",
    explanation: "prídavné meno\nPoskytujúci telesnú pohodu alebo pocit uvoľnenia a istoty.",
    definition: "adjective\nMaking you feel physically relaxed, or making you feel calm and confident.",
  },
  {
    english: "hello",
    slovak: "ahoj, dobrý deň",
    accepted: ["ahoj", "dobrý deň"],
    level: "A1",
    explanation: "citoslovce\nPozdrav používaný pri stretnutí alebo začatí rozhovoru.",
    definition: "exclamation\nUsed as a greeting when meeting someone or beginning a conversation.",
  },
  {
    english: "goodbye",
    slovak: "dovidenia, zbohom",
    accepted: ["dovidenia", "zbohom"],
    level: "A1",
    explanation: "citoslovce\nPozdrav používaný pri odchode alebo ukončení rozhovoru.",
    definition: "exclamation, noun\nUsed when leaving someone or ending a conversation.",
  },
  {
    english: "excuse",
    slovak: "ospravedlniť, výhovorka",
    accepted: ["ospravedlniť", "výhovorka"],
    level: "B2",
    explanation: "sloveso alebo podstatné meno\nOdpustiť drobnú chybu; tiež dôvod uvedený na ospravedlnenie konania.",
    definition: "verb, noun\nTo forgive a minor fault; also a reason given to explain or defend an action.",
  },
  {
    english: "hungry",
    slovak: "hladný",
    accepted: ["hladný"],
    level: "A1",
    explanation: "prídavné meno\nCítiaci hlad alebo potrebu jesť.",
    definition: "adjective\nFeeling that you need or want to eat food.",
  },
  {
    english: "thirsty",
    slovak: "smädný",
    accepted: ["smädný"],
    level: "A1",
    explanation: "prídavné meno\nCítiaci smäd alebo potrebu napiť sa.",
    definition: "adjective\nFeeling that you need or want to drink something.",
  },
  {
    english: "breakfast",
    slovak: "raňajky",
    accepted: ["raňajky"],
    level: "A1",
    explanation: "podstatné meno\nPrvé jedlo dňa, zvyčajne jedené ráno.",
    definition: "noun\nThe first meal of the day, usually eaten in the morning.",
  },
  {
    english: "bathroom",
    slovak: "kúpeľňa, toaleta",
    accepted: ["kúpeľňa", "toaleta"],
    level: "A1",
    explanation: "podstatné meno\nMiestnosť s vaňou alebo sprchou; v americkej angličtine aj miestnosť s toaletou.",
    definition: "noun\nA room containing a bath or shower; in American English, also a room with a toilet.",
  },
  {
    english: "toilet",
    slovak: "toaleta, záchod",
    accepted: ["toaleta", "záchod"],
    level: "A1",
    explanation: "podstatné meno\nZariadenie alebo miestnosť používaná na vykonanie telesnej potreby.",
    definition: "noun\nA fixture or room used for getting rid of waste from the body.",
  },
  {
    english: "Tuesday",
    slovak: "utorok",
    accepted: ["utorok"],
    level: "A1",
    explanation: "podstatné meno\nDeň v týždni medzi pondelkom a stredou.",
    definition: "noun\nThe day of the week after Monday and before Wednesday.",
  },
  {
    english: "Wednesday",
    slovak: "streda",
    accepted: ["streda"],
    level: "A1",
    explanation: "podstatné meno\nDeň v týždni medzi utorkom a štvrtkom.",
    definition: "noun\nThe day of the week after Tuesday and before Thursday.",
  },
  {
    english: "Thursday",
    slovak: "štvrtok",
    accepted: ["štvrtok"],
    level: "A1",
    explanation: "podstatné meno\nDeň v týždni medzi stredou a piatkom.",
    definition: "noun\nThe day of the week after Wednesday and before Friday.",
  },
  {
    english: "zero",
    slovak: "nula",
    accepted: ["nula"],
    level: "A2",
    explanation: "číslovka alebo podstatné meno\nČíslo 0; hodnota vyjadrujúca neprítomnosť množstva.",
    definition: "number, noun\nThe number 0, representing no amount or quantity.",
  },
  {
    english: "eleven",
    slovak: "jedenásť",
    accepted: ["jedenásť"],
    level: "A1",
    explanation: "číslovka\nČíslo 11.",
    definition: "number\nThe number 11.",
  },
  {
    english: "thirteen",
    slovak: "trinásť",
    accepted: ["trinásť"],
    level: "A1",
    explanation: "číslovka\nČíslo 13.",
    definition: "number\nThe number 13.",
  },
  {
    english: "fourteen",
    slovak: "štrnásť",
    accepted: ["štrnásť"],
    level: "A1",
    explanation: "číslovka\nČíslo 14.",
    definition: "number\nThe number 14.",
  },
  {
    english: "sixteen",
    slovak: "šestnásť",
    accepted: ["šestnásť"],
    level: "A1",
    explanation: "číslovka\nČíslo 16.",
    definition: "number\nThe number 16.",
  },
  {
    english: "seventeen",
    slovak: "sedemnásť",
    accepted: ["sedemnásť"],
    level: "A1",
    explanation: "číslovka\nČíslo 17.",
    definition: "number\nThe number 17.",
  },
  {
    english: "eighteen",
    slovak: "osemnásť",
    accepted: ["osemnásť"],
    level: "A1",
    explanation: "číslovka\nČíslo 18.",
    definition: "number\nThe number 18.",
  },
  {
    english: "nineteen",
    slovak: "devätnásť",
    accepted: ["devätnásť"],
    level: "A1",
    explanation: "číslovka\nČíslo 19.",
    definition: "number\nThe number 19.",
  },
  {
    english: "autumn",
    slovak: "jeseň",
    accepted: ["jeseň"],
    level: "A1",
    explanation: "podstatné meno\nRočné obdobie medzi letom a zimou; v americkej angličtine sa často používa slovo fall.",
    definition: "noun\nThe season between summer and winter; often called fall in American English.",
  },
];

const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));

for (const word of database.words) {
  const correction = corrections.get(word.id);
  if (correction) Object.assign(word, correction);
}

let nextId = Math.max(...database.words.map((word) => word.id)) + 1;
const existing = new Set(database.words.map((word) => word.english.toLocaleLowerCase("en-US")));

for (const addition of additions) {
  const key = addition.english.toLocaleLowerCase("en-US");
  if (existing.has(key)) continue;
  database.words.push({
    id: nextId,
    english: addition.english,
    slovak: addition.slovak,
    source_page: null,
    source_list: "Oxford 3000",
    cefr_level: addition.level,
    ...answers(addition.accepted),
    explanation_sk: addition.explanation,
    definition_en: addition.definition,
  });
  existing.add(key);
  nextId += 1;
}

database.count = database.words.length;
database.curation = {
  updated_at: "2026-09-30",
  added_source: "Oxford 3000",
  corrected_record_ids: [...corrections.keys()],
  added_record_ids: database.words.filter((word) => word.source_list === "Oxford 3000").map((word) => word.id),
};

if (database.merge_notes?.corrected_source_error_ids) {
  database.merge_notes.corrected_source_error_ids = [...new Set([
    ...database.merge_notes.corrected_source_error_ids,
    240,
  ])].sort((a, b) => a - b);
}

fs.writeFileSync(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
console.log(`Database now contains ${database.count} records and ${existing.size} unique English spellings.`);
