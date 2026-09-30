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

const additions = [
  ["actor", "herec", ["herec"], "podstatné meno\nMuž, ktorý hrá postavy vo filmoch, divadle alebo televízii.", "noun\nA man who performs characters in films, theatre, or television."],
  ["actress", "herečka", ["herečka"], "podstatné meno\nŽena, ktorá hrá postavy vo filmoch, divadle alebo televízii.", "noun\nA woman who performs characters in films, theatre, or television."],
  ["airport", "letisko", ["letisko"], "podstatné meno\nMiesto s dráhami a budovami, odkiaľ odlietajú a pristávajú lietadlá.", "noun\nA place with runways and buildings where aircraft take off and land."],
  ["amazing", "úžasný, ohromujúci", ["úžasný", "ohromujúci"], "prídavné meno\nVeľmi prekvapujúci alebo mimoriadne dobrý.", "adjective\nVery surprising or exceptionally good."],
  ["angry", "nahnevaný, rozzúrený", ["nahnevaný", "rozzúrený"], "prídavné meno\nCítiaci silnú nespokojnosť alebo hnev.", "adjective\nFeeling strong displeasure or anger."],
  ["apartment", "byt", ["byt"], "podstatné meno\nSúbor obytných miestností tvoriaci samostatné bývanie v budove.", "noun\nA set of rooms forming a separate home within a building."],
  ["apple", "jablko", ["jablko"], "podstatné meno\nOkrúhle ovocie, zvyčajne so zelenou, žltou alebo červenou šupkou.", "noun\nA round fruit, usually with green, yellow, or red skin."],
  ["artist", "umelec, umelkyňa", ["umelec", "umelkyňa"], "podstatné meno\nOsoba, ktorá vytvára umenie, napríklad obrazy, hudbu alebo sochy.", "noun\nA person who creates art such as paintings, music, or sculpture."],
  ["aunt", "teta", ["teta"], "podstatné meno\nSestra rodiča alebo manželka strýka.", "noun\nThe sister of a parent or the wife of an uncle."],
  ["banana", "banán", ["banán"], "podstatné meno\nDlhé zahnuté žlté ovocie s mäkkou dužinou.", "noun\nA long curved yellow fruit with soft flesh."],
  ["beach", "pláž", ["pláž"], "podstatné meno\nPiesčitý alebo kamenistý breh pri mori či jazere.", "noun\nA sandy or stony shore beside the sea or a lake."],
  ["bedroom", "spálňa", ["spálňa"], "podstatné meno\nMiestnosť určená najmä na spanie.", "noun\nA room used mainly for sleeping."],
  ["bicycle", "bicykel", ["bicykel"], "podstatné meno\nDvojkolesové vozidlo poháňané pedálmi.", "noun\nA two-wheeled vehicle moved by pedals."],
  ["birthday", "narodeniny", ["narodeniny"], "podstatné meno\nVýročný deň narodenia človeka.", "noun\nThe yearly anniversary of a person's birth."],
  ["bread", "chlieb", ["chlieb"], "podstatné meno\nPečené jedlo vyrobené najmä z múky, vody a droždia.", "noun\nBaked food made mainly from flour, water, and yeast."],
  ["butter", "maslo", ["maslo"], "podstatné meno\nMäkký mliečny výrobok používaný na natieranie alebo varenie.", "noun\nA soft dairy product used for spreading or cooking."],
  ["camera", "fotoaparát, kamera", ["fotoaparát", "kamera"], "podstatné meno\nZariadenie používané na vytváranie fotografií alebo videozáznamov.", "noun\nA device used to take photographs or record video."],
  ["cat", "mačka, kocúr", ["mačka", "kocúr"], "podstatné meno\nMalé domáce zviera z čeľade mačkovitých.", "noun\nA small domesticated animal of the feline family."],
  ["cheese", "syr", ["syr"], "podstatné meno\nPotravina vyrábaná z mlieka, zvyčajne zrazením a zrením.", "noun\nFood made from milk, usually by curdling and maturing it."],
  ["chicken", "kura, kurča, kuracie mäso", ["kura", "kurča", "kuracie mäso"], "podstatné meno\nDomáci vták chovaný pre vajcia alebo mäso; tiež jeho mäso.", "noun\nA domestic bird kept for eggs or meat; also the meat of this bird."],
  ["cinema", "kino", ["kino"], "podstatné meno\nBudova, v ktorej sa verejne premietajú filmy.", "noun\nA building where films are shown to an audience."],
  ["classroom", "trieda, učebňa", ["trieda", "učebňa"], "podstatné meno\nMiestnosť v škole, kde prebieha vyučovanie.", "noun\nA room in a school where lessons are taught."],
  ["clock", "hodiny", ["hodiny"], "podstatné meno\nZariadenie, ktoré ukazuje čas a zvyčajne sa nenosí na zápästí.", "noun\nA device that shows the time and is not usually worn on the wrist."],
  ["coat", "kabát", ["kabát"], "podstatné meno\nVrchný kus oblečenia nosený na ochranu pred chladom alebo dažďom.", "noun\nAn outer piece of clothing worn for protection from cold or rain."],
  ["cook", "variť, kuchár, kuchárka", ["variť", "kuchár", "kuchárka"], "sloveso alebo podstatné meno\nPripravovať jedlo teplom; tiež osoba, ktorá jedlo pripravuje.", "verb, noun\nTo prepare food using heat; also a person who prepares food."],
  ["cousin", "bratranec, sesternica", ["bratranec", "sesternica"], "podstatné meno\nDieťa strýka alebo tety.", "noun\nA child of an uncle or aunt."],
  ["desk", "písací stôl, lavica", ["písací stôl", "lavica"], "podstatné meno\nStôl používaný na písanie, štúdium alebo kancelársku prácu.", "noun\nA table used for writing, studying, or office work."],
  ["dictionary", "slovník", ["slovník"], "podstatné meno\nKniha alebo elektronický zdroj vysvetľujúci slová, ich významy a použitie.", "noun\nA book or electronic resource explaining words, meanings, and usage."],
  ["ear", "ucho", ["ucho"], "podstatné meno\nOrgán na bokoch hlavy používaný na počutie.", "noun\nThe organ on the side of the head used for hearing."],
  ["egg", "vajce", ["vajce"], "podstatné meno\nOválny predmet znášaný vtákmi, často používaný ako jedlo.", "noun\nAn oval object laid by birds and often used as food."],
];

const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));
const existing = new Set(database.words.map((word) => word.english.toLocaleLowerCase("en-US")));
let nextId = Math.max(...database.words.map((word) => word.id)) + 1;
const addedIds = [];

for (const [english, slovak, accepted, explanation, definition] of additions) {
  const key = english.toLocaleLowerCase("en-US");
  if (existing.has(key)) continue;
  const normalized = [...new Set(accepted.map(normalizeAnswer).filter(Boolean))].sort();
  database.words.push({
    id: nextId,
    english,
    slovak,
    source_page: null,
    source_list: "Oxford 3000",
    cefr_level: "A1",
    accepted_answers: accepted,
    normalized_answers: normalized,
    accepted_english_answers: [english],
    explanation_sk: explanation,
    definition_en: definition,
  });
  existing.add(key);
  addedIds.push(nextId);
  nextId += 1;
}

database.count = database.words.length;
database.curation = {
  ...(database.curation || {}),
  expanded_to_2000_at: "2026-09-30",
  added_next_30_record_ids: addedIds,
};

fs.writeFileSync(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
console.log(`Added ${addedIds.length} records.`);
console.log(`Database now contains ${database.words.length} unique records.`);
