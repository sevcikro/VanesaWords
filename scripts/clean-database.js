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

function correction(slovak, accepted, explanation, definition, english) {
  return {
    ...(english ? { english } : {}),
    slovak,
    accepted_answers: accepted,
    normalized_answers: [...new Set(accepted.map(normalizeAnswer).filter(Boolean))].sort(),
    explanation_sk: explanation,
    definition_en: definition,
  };
}

const removeIds = new Set([
  // Standalone alphabet letters, excluding the real words "a" and "I".
  509, 585, 959, 1030, 1082, 1087, 1118, 1213, 1291, 1385, 1513, 1523, 1682, 1793, 1866,
  // Corrupted fragments, transcription noise, archaic filler, and low-value non-words.
  107, 138, 264, 582, 594, 618, 792, 1194, 1379, 1528, 1924, 1969,
  // Repeated copies of an existing English entry.
  747, 1069, 1444, 1597, 1703,
  // Personal-name-only records and one low-value local place name.
  266, 619, 796, 884, 913, 1000, 1024, 1073, 1119, 1227, 1307, 1394, 1441, 1483, 1510,
  1717, 1822, 1833, 1926, 1956,
]);

const corrections = new Map([
  [4, correction("do, k, na, aby", ["do", "k", "na", "aby"], "predložka alebo infinitívna častica\nVyjadruje smer, cieľ, príjemcu alebo uvádza infinitív slovesa.", "preposition, infinitive marker\nUsed for direction, destination, a recipient, or before the base form of a verb.")],
  [6, correction("v, vo, do, na, za", ["v", "vo", "do", "na", "za"], "predložka\nVyjadruje polohu vnútri, časové obdobie alebo pohyb dovnútra.", "preposition\nUsed for position inside something, a period of time, or movement into a place.")],
  [11, correction("ja", ["ja"], "zámeno\nOsobné zámeno, ktorým hovoriaci označuje sám seba.", "pronoun\nThe pronoun a speaker uses to refer to himself or herself.")],
  [35, correction("tam", ["tam"], "príslovka\nNa uvedenom alebo vzdialenejšom mieste.", "adverb\nAt, in, or to a place that is away from the speaker.")],
  [52, correction("povedal, povedala, povedalo", ["povedal", "povedala", "povedalo"], "sloveso\nMinulý čas slovesa say; vyjadril niečo slovami.", "verb\nPast tense of say; expressed something in words.")],
  [58, correction("nejaký, niektorý, trochu", ["nejaký", "niektorý", "trochu"], "zámeno alebo určovacie slovo\nNeurčité množstvo alebo neurčitý počet ľudí či vecí.", "determiner, pronoun\nAn unspecified amount or number of people or things.")],
  [59, correction("mohol, mohla, mohlo; mohol by", ["mohol", "mohla", "mohlo", "mohol by"], "modálne sloveso\nMinulý alebo podmieňovací tvar slovesa can; vyjadruje schopnosť alebo možnosť.", "modal verb\nThe past or conditional form of can, expressing ability or possibility.")],
  [62, correction("jeho, jej, svoje", ["jeho", "jej", "svoje"], "privlastňovacie zámeno\nOznačuje, že niečo patrí zvieraťu, veci alebo inému neživotnému podmetu.", "possessive determiner\nShows that something belongs to an animal, thing, or non-human subject.")],
  [67, correction("mať rád, páčiť sa, ako, podobný", ["mať rád", "páčiť sa", "ako", "podobný"], "sloveso, predložka alebo prídavné meno\nVyjadruje obľubu, podobnosť alebo spôsob porovnania.", "verb, preposition, adjective\nExpresses enjoyment, similarity, or comparison.")],
  [76, correction("práve, iba, len, spravodlivý", ["práve", "iba", "len", "spravodlivý"], "príslovka alebo prídavné meno\nNajčastejšie znamená práve alebo iba; ako prídavné meno znamená spravodlivý.", "adverb, adjective\nUsually means exactly now or only; as an adjective, it means fair.")],
  [101, correction("veľa, mnoho, veľmi", ["veľa", "mnoho", "veľmi"], "zámeno alebo príslovka\nVeľké množstvo alebo vysoká miera.", "determiner, pronoun, adverb\nA large amount or a high degree.")],
  [109, correction("bytie, existencia, súc", ["bytie", "existencia", "súc"], "podstatné meno alebo príčastie\nStav existencie; tiež priebehový tvar slovesa be.", "noun, participle\nThe state of existing; also the present participle of be.")],
  [112, correction("správny, pravý, právo, doprava", ["správny", "pravý", "právo", "doprava"], "prídavné meno, podstatné meno alebo príslovka\nMôže znamenať správny, pravú stranu alebo právny nárok.", "adjective, noun, adverb\nCan mean correct, the right-hand side, or a legal entitlement.")],
  [118, correction("urobiť, vyrobiť, vytvoriť, spôsobiť", ["urobiť", "vyrobiť", "vytvoriť", "spôsobiť"], "sloveso\nVytvoriť, vyrobiť alebo spôsobiť, aby sa niečo stalo.", "verb\nTo create or produce something, or cause something to happen.")],
  [121, correction("stále, ešte, nehybný", ["stále", "ešte", "nehybný"], "príslovka alebo prídavné meno\nVyjadruje pokračovanie deja; ako prídavné meno znamená nehybný.", "adverb, adjective\nShows that something continues; as an adjective, it means not moving.")],
  [125, correction("dokonca, aj, rovný", ["dokonca", "aj", "rovný"], "príslovka alebo prídavné meno\nZdôrazňuje prekvapujúcu skutočnosť; môže tiež znamenať rovný alebo párny.", "adverb, adjective\nEmphasizes something surprising; it can also mean level or divisible by two.")],
  [136, correction("použitý, používal", ["použitý", "používal"], "prídavné meno alebo sloveso\nNie nový; alebo minulý čas slovesa use.", "adjective, verb\nNot new; or the past tense of use.")],
  [137, correction("idúci, odchod, chodenie", ["idúci", "odchod", "chodenie"], "príčastie alebo podstatné meno\nPohybovanie sa na iné miesto alebo odchod.", "participle, noun\nMoving to another place or the act of leaving.")],
  [152, correction("myšlienka, myslel", ["myšlienka", "myslel"], "podstatné meno alebo sloveso\nMyšlienka; tiež minulý čas slovesa think.", "noun, verb\nAn idea; also the past tense of think.")],
  [153, correction("zatiaľ čo, kým, chvíľa", ["zatiaľ čo", "kým", "chvíľa"], "spojka alebo podstatné meno\nPočas toho, ako sa deje iná činnosť; tiež krátky čas.", "conjunction, noun\nDuring the time that something else happens; also a short period.")],
  [158, correction("potrebovať, potreba", ["potrebovať", "potreba"], "sloveso alebo podstatné meno\nVyžadovať niečo nevyhnutné; tiež stav nedostatku.", "verb, noun\nTo require something essential; also a lack of something necessary.")],
  [169, correction("od, odkedy, keďže", ["od", "odkedy", "keďže"], "predložka, spojka alebo príslovka\nVyjadruje začiatok obdobia alebo uvádza dôvod.", "preposition, conjunction, adverb\nMarks the start of a period or introduces a reason.")],
  [179, correction("ľavý, odišiel, zostávajúci", ["ľavý", "odišiel", "zostávajúci"], "prídavné meno alebo sloveso\nMôže označovať ľavú stranu, odchod alebo to, čo zostalo.", "adjective, verb\nCan refer to the left side, departure, or what remains.")],
  [206, correction("strana, večierok, oslava", ["strana", "večierok", "oslava"], "podstatné meno\nPolitická organizácia alebo spoločenské stretnutie s oslavou.", "noun\nA political organization or a social gathering held for enjoyment.")],
  [207, correction("bod, zmysel, hrot", ["bod", "zmysel", "hrot"], "podstatné meno alebo sloveso\nBod, hlavná myšlienka, ostrý koniec alebo jednotka skóre.", "noun, verb\nA dot, main idea, sharp end, or unit of score.")],
  [212, correction("neskôr, neskorší", ["neskôr", "neskorší"], "príslovka alebo prídavné meno\nV neskoršom čase alebo nasledujúci po inom čase.", "adverb, adjective\nAt a time after the present or after another stated time.")],
  [219, correction("informácie, informácia", ["informácie", "informácia"], "podstatné meno\nFakty alebo údaje poskytnuté či získané o niečom.", "noun\nFacts or details provided or learned about something.")],
  [225, correction("videný, videl", ["videný", "videl"], "príčastie\nMinulé príčastie slovesa see.", "participle\nThe past participle of see.")],
  [239, correction("majúci, vlastniaci", ["majúci", "vlastniaci"], "príčastie\nPriebehový tvar slovesa have; označuje vlastníctvo alebo skúsenosť.", "participle\nThe present participle of have, referring to possession or experience.")],
  [248, correction("milimeter, mm", ["milimeter", "mm"], "skratka alebo podstatné meno\nMilimeter, jedna tisícina metra.", "abbreviation, noun\nA millimetre, equal to one thousandth of a metre.")],
  [265, correction("volal, nazvaný, zavolaný", ["volal", "nazvaný", "zavolaný"], "sloveso\nMinulý čas slovesa call; telefonoval, privolal alebo pomenoval.", "verb\nPast tense of call; phoned, summoned, or gave a name to something.")],
  [293, correction("pracujúci, fungujúci, práca", ["pracujúci", "fungujúci", "práca"], "prídavné meno, príčastie alebo podstatné meno\nVykonávajúci prácu alebo správne fungujúci.", "adjective, participle, noun\nDoing work or operating correctly.")],
  [297, correction("robenie, činnosť", ["robenie", "činnosť"], "podstatné meno alebo príčastie\nVykonávanie nejakej činnosti.", "noun, participle\nThe act of performing an activity.")],
  [302, correction("ostatní, ostatné, iní", ["ostatní", "ostatné", "iní"], "zámeno\nIní ľudia alebo veci než tí, ktorí už boli spomenutí.", "pronoun\nPeople or things different from those already mentioned.")],
  [310, correction("jeden alebo druhý, ktorýkoľvek", ["jeden alebo druhý", "ktorýkoľvek"], "určovacie slovo alebo zámeno\nJeden z dvoch, pričom nezáleží na tom ktorý.", "determiner, pronoun\nOne or the other of two people or things.")],
  [323, correction("nasledujúci, ďalší, po", ["nasledujúci", "ďalší", "po"], "prídavné meno, podstatné meno alebo predložka\nTo, čo prichádza hneď potom; môže označovať aj skupinu priaznivcov.", "adjective, noun, preposition\nComing immediately after; it can also mean a group of supporters.")],
  [341, correction("známy, poznaný", ["známy", "poznaný"], "prídavné meno alebo príčastie\nTaký, o ktorom sa vie alebo ktorého ľudia poznajú.", "adjective, participle\nRecognized, familiar, or understood by people.")],
  [368, correction("minister, duchovný", ["minister", "duchovný"], "podstatné meno\nČlen vlády zodpovedný za rezort; tiež protestantský duchovný.", "noun\nA senior member of government; also a member of the clergy in some churches.")],
  [374, correction("druh, typ, milý, láskavý", ["druh", "typ", "milý", "láskavý"], "podstatné meno alebo prídavné meno\nSkupina podobných vecí; ako prídavné meno znamená milý a ohľaduplný.", "noun, adjective\nA type or category; as an adjective, caring and considerate.")],
  [385, correction("znamená, prostriedky, spôsob", ["znamená", "prostriedky", "spôsob"], "sloveso alebo podstatné meno v množnom čísle\nVyjadruje význam; tiež zdroje alebo spôsob dosiahnutia cieľa.", "verb, plural noun\nExpresses meaning; also resources or a method used to achieve something.")],
  [395, correction("pozícia, poloha", ["pozícia", "poloha"], "podstatné meno\nMiesto, postavenie alebo názor v určitej situácii.", "noun\nA place, status, or point of view in a particular situation.")],
  [412, correction("prítomný, súčasný, dar, predstaviť", ["prítomný", "súčasný", "dar", "predstaviť"], "prídavné meno, podstatné meno alebo sloveso\nSúčasný čas, prítomná osoba, dar alebo akt predstavenia.", "adjective, noun, verb\nCurrent or attending; also a gift or the act of showing or introducing something.")],
  [420, correction("výsledok, vyplynúť", ["výsledok", "vyplynúť"], "podstatné meno alebo sloveso\nNásledok činnosti alebo situácie; vzniknúť ako následok.", "noun, verb\nThe outcome of an action or situation; to happen as a consequence.")],
  [438, correction("zavrieť, blízky, blízko", ["zavrieť", "blízky", "blízko"], "sloveso, prídavné meno alebo príslovka\nUzatvoriť alebo byť v malej vzdialenosti.", "verb, adjective, adverb\nTo shut something, or to be a short distance away.")],
  [446, correction("vonku, mimo, vonkajšok", ["vonku", "mimo", "vonkajšok"], "príslovka, predložka alebo podstatné meno\nNa vonkajšej strane alebo mimo budovy či priestoru.", "adverb, preposition, noun\nOn the outer side or beyond the limits of a place.")],
  [448, correction("inak, ďalší, iný", ["inak", "ďalší", "iný"], "príslovka alebo prídavné meno\nIným spôsobom alebo okrem už uvedeného.", "adverb, adjective\nIn a different way or in addition to what has been mentioned.")],
  [466, correction("budem, bude, má sa", ["budem", "bude", "má sa"], "modálne sloveso\nFormálne vyjadruje budúcnosť, zámer alebo povinnosť.", "modal verb\nFormally expresses future time, intention, or obligation.")],
  [472, correction("zapojený, zúčastnený, zložitý", ["zapojený", "zúčastnený", "zložitý"], "prídavné meno\nAktívne sa zúčastňujúci alebo obsahujúci veľa zložitých častí.", "adjective\nTaking part in something or containing many complicated elements.")],
  [482, correction("odišiel, preč, minulý", ["odišiel", "preč", "minulý"], "príčastie\nMinulé príčastie slovesa go; označuje odchod alebo neprítomnosť.", "participle\nThe past participle of go, indicating departure or absence.")],
  [497, correction("jednotlivec, individuálny", ["jednotlivec", "individuálny"], "podstatné meno alebo prídavné meno\nJedna osoba alebo samostatná vec; patriaci jednotlivcovi.", "noun, adjective\nA single person or separate item; relating to one person.")],
  [516, correction("založený, umiestnený", ["založený", "umiestnený"], "príčastie alebo prídavné meno\nMajúci základ v niečom alebo umiestnený na určitom mieste.", "participle, adjective\nFounded on something or located in a particular place.")],
  [519, correction("veľa, množstvo, pozemok, žreb", ["veľa", "množstvo", "pozemok", "žreb"], "zámeno, podstatné meno alebo príslovka\nVeľké množstvo; tiež parcela alebo predmet určený žrebovaním.", "pronoun, noun, adverb\nA large amount; also a plot of land or an item used in drawing lots.")],
  [538, correction("banka, breh", ["banka", "breh"], "podstatné meno\nFinančná inštitúcia alebo vyvýšený okraj rieky.", "noun\nA financial institution or the raised land beside a river.")],
  [547, correction("číslo, postava, údaj", ["číslo", "postava", "údaj"], "podstatné meno alebo sloveso\nČíselný údaj, tvar osoby alebo dôležitá osoba; tiež vypočítať.", "noun, verb\nA number, a person's shape, or an important person; also to calculate.")],
  [548, correction("únia, zväz, zjednotenie", ["únia", "zväz", "zjednotenie"], "podstatné meno\nSpojenie ľudí, štátov alebo organizácií do jedného celku.", "noun\nA group of people, states, or organizations joined together.")],
  [558, correction("Spojené kráľovstvo, Veľká Británia", ["Spojené kráľovstvo", "Veľká Británia"], "skratka\nSkratka pre United Kingdom, Spojené kráľovstvo.", "abbreviation\nShort for the United Kingdom.", "UK")],
  [588, correction("klub, kyjak", ["klub", "kyjak"], "podstatné meno\nOrganizovaná skupina ľudí; tiež ťažká palica používaná ako zbraň.", "noun\nAn organized group of people; also a heavy stick used as a weapon.")],
  [596, correction("kvalita, vlastnosť", ["kvalita", "vlastnosť"], "podstatné meno\nÚroveň akosti alebo charakteristická vlastnosť osoby či veci.", "noun\nThe standard of something or a characteristic of a person or thing.")],
  [608, correction("situácia, stav, poloha", ["situácia", "stav", "poloha"], "podstatné meno\nSúbor okolností v určitom čase alebo poloha veci.", "noun\nThe set of circumstances at a particular time, or the position of something.")],
  [613, correction("účet, konto, správa", ["účet", "konto", "správa"], "podstatné meno alebo sloveso\nFinančný záznam, používateľské konto alebo opis udalostí.", "noun, verb\nA financial record, a user profile, or a description of events.")],
  [636, correction("pridal, pridaný", ["pridal", "pridaný"], "sloveso alebo príčastie\nMinulý tvar slovesa add; vložil alebo pripojil niečo navyše.", "verb, participle\nPast form of add; put something extra together with something else.")],
  [645, correction("skúsil, pokúsil sa", ["skúsil", "pokúsil sa"], "sloveso\nMinulý čas slovesa try; vynaložil úsilie niečo urobiť.", "verb\nPast tense of try; made an effort to do something.")],
  [646, correction("rozhodol, rozhodnutý", ["rozhodol", "rozhodnutý"], "sloveso alebo prídavné meno\nUrobil rozhodnutie alebo je pevne odhodlaný.", "verb, adjective\nMade a choice, or firmly resolved to do something.")],
  [647, correction("červený, červená farba", ["červený", "červená farba"], "prídavné meno alebo podstatné meno\nFarba krvi alebo ohňa.", "adjective, noun\nThe colour of blood or fire.")],
  [673, correction("napriek", ["napriek"], "predložka\nBez ohľadu na prekážku alebo protikladnú skutočnosť.", "preposition\nWithout being affected by a difficulty or opposing fact.")],
  [737, correction("dostal, prijal, prijatý", ["dostal", "prijal", "prijatý"], "sloveso alebo príčastie\nMinulý tvar slovesa receive; niečo dostal alebo bolo prijaté.", "verb, participle\nPast form of receive; got or accepted something.")],
  [742, correction("v poriadku, jemný, pokuta", ["v poriadku", "jemný", "pokuta"], "prídavné meno, príslovka alebo podstatné meno\nDobrý alebo prijateľný; tiež peňažný trest.", "adjective, adverb, noun\nGood or acceptable; also a monetary penalty.")],
  [753, correction("pocit, cit", ["pocit", "cit"], "podstatné meno\nTelesný alebo emocionálny vnem.", "noun\nA physical sensation or an emotion.")],
  [761, correction("kúsok, trochu, bit, vrták", ["kúsok", "trochu", "bit", "vrták"], "podstatné meno alebo príslovka\nMalé množstvo; tiež jednotka digitálnych údajov alebo pracovný hrot nástroja.", "noun, adverb\nA small amount; also a unit of digital data or the working end of a tool.")],
  [763, correction("úrady, autority", ["úrady", "autority"], "podstatné meno v množnom čísle\nOrganizácie alebo osoby s právomocou rozhodovať.", "plural noun\nOrganizations or people that have official power.")],
  [777, correction("strany, večierky, oslavy", ["strany", "večierky", "oslavy"], "podstatné meno v množnom čísle\nPolitické organizácie alebo spoločenské oslavy.", "plural noun\nPolitical organizations or social gatherings.")],
  [798, correction("počas celého, všade po", ["počas celého", "všade po"], "predložka alebo príslovka\nV každej časti miesta alebo od začiatku do konca obdobia.", "preposition, adverb\nIn every part of a place or from the beginning to the end of a period.")],
  [809, correction("libry, búši", ["libry", "búši"], "podstatné meno v množnom čísle alebo sloveso\nJednotky hmotnosti či britská mena; tiež opakovane silno udiera.", "plural noun, verb\nUnits of weight or British currency; also hits repeatedly and heavily.")],
  [813, correction("problémy, otázky, vydania", ["problémy", "otázky", "vydania"], "podstatné meno v množnom čísle\nDôležité problémy alebo témy; tiež vydania publikácie.", "plural noun\nImportant problems or topics; also editions of a publication.")],
  [824, correction("úrovne, vyrovnáva", ["úrovne", "vyrovnáva"], "podstatné meno v množnom čísle alebo sloveso\nVýškové alebo výkonové stupne; tiež robí niečo rovným.", "plural noun, verb\nStages of height or achievement; also makes something flat or equal.")],
  [841, correction("náhle, zrazu", ["náhle", "zrazu"], "príslovka\nRýchlo a neočakávane.", "adverb\nQuickly and unexpectedly.")],
  [846, correction("tí, tie, jednotky", ["tí", "tie", "jednotky"], "zámeno alebo podstatné meno v množnom čísle\nNahrádza už pomenované osoby alebo veci; tiež číslice jedna.", "pronoun, plural noun\nReplaces people or things already mentioned; also instances of the number one.")],
  [854, correction("otvoril, otvorený", ["otvoril", "otvorený"], "sloveso alebo príčastie\nMinulý tvar slovesa open; sprístupnil alebo odokryl.", "verb, participle\nPast form of open; made something accessible or uncovered.")],
  [871, correction("vhodný, primeraný", ["vhodný", "primeraný"], "prídavné meno\nSprávny alebo vhodný pre danú situáciu.", "adjective\nSuitable or correct for a particular situation.")],
  [880, correction("prepáčte, ľúto, poľutovaniahodný", ["prepáčte", "ľúto", "poľutovaniahodný"], "citoslovce alebo prídavné meno\nPoužíva sa na ospravedlnenie alebo vyjadrenie ľútosti.", "exclamation, adjective\nUsed to apologize or express regret.")],
  [903, correction("doktor, Dr.", ["doktor", "Dr"], "skratka\nSkratka titulu Doctor.", "abbreviation\nShort for Doctor.", "Dr")],
  [916, correction("zjavne, očividne", ["zjavne", "očividne"], "príslovka\nSpôsobom, ktorý je ľahko viditeľný alebo pochopiteľný.", "adverb\nIn a way that is easy to see or understand.")],
  [918, correction("odvolanie, žiadosť, prosba", ["odvolanie", "žiadosť", "prosba"], "podstatné meno alebo sloveso\nNaliehavá žiadosť alebo formálna žiadosť o zmenu rozhodnutia.", "noun, verb\nAn urgent request or a formal request to change a decision.")],
  [944, correction("prešiel, schválený", ["prešiel", "schválený"], "sloveso alebo príčastie\nMinulý tvar slovesa pass; prešiel okolo, uspel alebo bol schválený.", "verb, participle\nPast form of pass; moved by, succeeded, or was approved.")],
  [948, correction("spadol, klesol, zoťal", ["spadol", "klesol", "zoťal"], "sloveso\nMinulý čas slovesa fall; môže byť aj minulý čas slovesa fell, zoťať strom.", "verb\nPast tense of fall; it can also be the past tense of fell, meaning to cut down a tree.")],
  [968, correction("ekonomika, hospodárstvo, úspornosť", ["ekonomika", "hospodárstvo", "úspornosť"], "podstatné meno\nSystém výroby a obchodu krajiny; tiež hospodárne využívanie zdrojov.", "noun\nA country's system of production and trade; also careful use of resources.")],
  [972, correction("komisia, provízia, poverenie", ["komisia", "provízia", "poverenie"], "podstatné meno alebo sloveso\nOficiálna skupina, poplatok za predaj alebo formálne poverenie.", "noun, verb\nAn official group, a sales fee, or formal authorization.")],
  [973, correction("modrý, modrá farba", ["modrý", "modrá farba"], "prídavné meno alebo podstatné meno\nFarba jasnej oblohy.", "adjective, noun\nThe colour of a clear sky.")],
  [1002, correction("stojaci, postavenie", ["stojaci", "postavenie"], "príčastie alebo podstatné meno\nByť vo vzpriamenej polohe; tiež spoločenské alebo právne postavenie.", "participle, noun\nBeing upright; also social or legal status.")],
  [1054, correction("existujúci, súčasný", ["existujúci", "súčasný"], "prídavné meno\nTaký, ktorý už existuje alebo je prítomný teraz.", "adjective\nAlready present or currently in existence.")],
  [1063, correction("zápas, zhoda, zápalka", ["zápas", "zhoda", "zápalka"], "podstatné meno alebo sloveso\nSúťaž, vhodná dvojica alebo tenká palička na zapálenie ohňa.", "noun, verb\nA contest, a suitable pair, or a small stick used to make fire.")],
  [1066, correction("oko", ["oko"], "podstatné meno\nOrgán zraku.", "noun\nThe organ used for seeing.")],
  [1097, correction("pošta, príspevok, stĺp", ["pošta", "príspevok", "stĺp"], "podstatné meno alebo sloveso\nPoštová služba, zverejnená správa alebo zvislá opora.", "noun, verb\nMail service, a published message, or an upright support.")],
  [1105, correction("spojený, súvisiaci, združený", ["spojený", "súvisiaci", "združený"], "prídavné meno alebo príčastie\nPrepojený s inou osobou, vecou alebo myšlienkou.", "adjective, participle\nConnected with another person, thing, or idea.")],
  [1120, correction("šoférovať, jazda, poháňať", ["šoférovať", "jazda", "poháňať"], "sloveso alebo podstatné meno\nOvládať vozidlo, cesta vozidlom alebo sila uvádzajúca niečo do pohybu.", "verb, noun\nTo control a vehicle, a journey by vehicle, or force something to move.")],
  [1142, correction("tvrdí, nároky, žiada", ["tvrdí", "nároky", "žiada"], "sloveso alebo podstatné meno v množnom čísle\nVyhlasuje niečo za pravdivé alebo požaduje právo na niečo.", "verb, plural noun\nStates that something is true or demands a right to something.")],
  [1176, correction("rozmanitosť, druh, odroda", ["rozmanitosť", "druh", "odroda"], "podstatné meno\nMnožstvo rôznych vecí alebo konkrétny typ rastliny či výrobku.", "noun\nA range of different things or a particular type of plant or product.")],
  [1203, correction("úplne, celkom", ["úplne", "celkom"], "príslovka\nV plnej miere, bez chýbajúcej časti.", "adverb\nFully and without any part missing.")],
  [1237, correction("tvrdil, nárokoval si", ["tvrdil", "nárokoval si"], "sloveso\nMinulý čas slovesa claim; vyhlásil niečo za pravdivé alebo požadoval právo.", "verb\nPast tense of claim; stated something as true or demanded a right.")],
  [1238, correction("organizácia", ["organizácia"], "podstatné meno\nUsporiadaná skupina ľudí so spoločným cieľom; tiež proces organizovania.", "noun\nAn organized group with a shared purpose; also the process of organizing.")],
  [1253, correction("žil, býval", ["žil", "býval"], "sloveso\nMinulý čas slovesa live; existoval alebo mal domov na určitom mieste.", "verb\nPast tense of live; existed or had a home in a particular place.")],
  [1287, correction("kurzy, smery", ["kurzy", "smery"], "podstatné meno v množnom čísle\nVzdelávacie programy, smery pohybu alebo časti jedla.", "plural noun\nPrograms of study, directions of movement, or parts of a meal.")],
  [1289, correction("znížený, zmenšený, redukovaný", ["znížený", "zmenšený", "redukovaný"], "prídavné meno alebo príčastie\nUrobený menším v množstve, veľkosti alebo význame.", "adjective, participle\nMade smaller in amount, size, or importance.")],
  [1294, correction("predstavil, prezentoval, odovzdal", ["predstavil", "prezentoval", "odovzdal"], "sloveso\nMinulý čas slovesa present; ukázal, predstavil alebo formálne odovzdal.", "verb\nPast tense of present; showed, introduced, or formally gave something.")],
  [1311, correction("listy, písmená", ["listy", "písmená"], "podstatné meno v množnom čísle\nPísané správy posielané ľuďom alebo znaky abecedy.", "plural noun\nWritten messages sent to people or characters of the alphabet.")],
  [1334, correction("rozhodnutý, odhodlaný, určil", ["rozhodnutý", "odhodlaný", "určil"], "prídavné meno alebo sloveso\nPevne rozhodnutý; alebo minulý čas slovesa determine.", "adjective, verb\nFirmly resolved; or the past tense of determine.")],
  [1345, correction("zvládol, riadil, podarilo sa mu", ["zvládol", "riadil", "podarilo sa mu"], "sloveso\nÚspešne niečo vykonal alebo mal niečo pod kontrolou.", "verb\nSucceeded in doing something or controlled an activity or organization.")],
  [1348, correction("bunky, cely", ["bunky", "cely"], "podstatné meno v množnom čísle\nNajmenšie jednotky živých organizmov alebo malé uzavreté miestnosti vo väzení.", "plural noun\nThe smallest units of living things or small locked rooms in a prison.")],
  [1349, correction("záznamy, nahráva, zapisuje", ["záznamy", "nahráva", "zapisuje"], "podstatné meno v množnom čísle alebo sloveso\nUložené informácie; alebo zaznamenáva zvuk, obraz či údaje.", "plural noun, verb\nStored information; or captures sound, images, or data.")],
  [1351, correction("mierka, váha, rozsah", ["mierka", "váha", "rozsah"], "podstatné meno alebo sloveso\nSystém merania, pomer veľkostí alebo rozsah hodnôt.", "noun, verb\nA system of measurement, a size ratio, or a range of values.")],
  [1372, correction("nakreslený, vytiahnutý, ťahaný", ["nakreslený", "vytiahnutý", "ťahaný"], "príčastie\nMinulé príčastie slovesa draw; nakreslený, potiahnutý alebo vytiahnutý.", "participle\nPast participle of draw; sketched, pulled, or taken out.")],
  [1382, correction("vplyv, dopad, náraz", ["vplyv", "dopad", "náraz"], "podstatné meno alebo sloveso\nSilný účinok na niečo alebo fyzický náraz.", "noun, verb\nA strong effect on something or a physical collision.")],
  [1412, correction("železnica, železničná trať", ["železnica", "železničná trať"], "podstatné meno\nSystém koľají a vlakov na prepravu ľudí alebo nákladu.", "noun\nA system of tracks and trains used to transport people or goods.")],
  [1420, correction("účty, kontá, správy", ["účty", "kontá", "správy"], "podstatné meno v množnom čísle alebo sloveso\nFinančné záznamy, používateľské kontá alebo opisy udalostí.", "plural noun, verb\nFinancial records, user profiles, or descriptions of events.")],
  [1434, correction("stávajúci sa, slušivý", ["stávajúci sa", "slušivý"], "príčastie alebo prídavné meno\nMeniaci sa na niečo; ako prídavné meno znamená vhodný alebo slušivý.", "participle, adjective\nChanging into something; as an adjective, suitable or attractive.")],
  [1457, correction("zaobchádzal, liečil, ošetril", ["zaobchádzal", "liečil", "ošetril"], "sloveso\nMinulý čas slovesa treat; správal sa k niekomu určitým spôsobom alebo poskytol liečbu.", "verb\nPast tense of treat; behaved toward someone in a certain way or gave medical care.")],
  [1460, correction("banky, brehy", ["banky", "brehy"], "podstatné meno v množnom čísle\nFinančné inštitúcie alebo okraje riek.", "plural noun\nFinancial institutions or the sides of rivers.")],
  [1467, correction("diskutovali, preberali, rokovali", ["diskutovali", "preberali", "rokovali"], "sloveso\nMinulý čas slovesa discuss; hovorili podrobne o určitej téme.", "verb\nPast tense of discuss; talked about a subject in detail.")],
  [1475, correction("sily, právomoci, poháňa", ["sily", "právomoci", "poháňa"], "podstatné meno v množnom čísle alebo sloveso\nSchopnosti či právomoci; alebo dodáva energiu stroju.", "plural noun, verb\nAbilities or legal authority; or supplies energy to a machine.")],
  [1492, correction("skutočný, reálny", ["skutočný", "reálny"], "prídavné meno\nExistujúci v skutočnosti, nie iba domnelý alebo plánovaný.", "adjective\nExisting in fact, rather than imagined or planned.")],
  [1501, correction("ministri, duchovní", ["ministri", "duchovní"], "podstatné meno v množnom čísle\nČlenovia vlády zodpovední za rezorty; tiež duchovní niektorých cirkví.", "plural noun\nSenior members of government; also clergy members in some churches.")],
  [1532, correction("pomerne, celkom, spravodlivo", ["pomerne", "celkom", "spravodlivo"], "príslovka\nDo určitej miery alebo spôsobom, ktorý je spravodlivý.", "adverb\nTo a moderate degree or in a just way.")],
  [1546, correction("míňanie, výdavky", ["míňanie", "výdavky"], "podstatné meno alebo príčastie\nPoužívanie peňazí na nákup vecí alebo služieb.", "noun, participle\nThe use of money to buy goods or services.")],
  [1560, correction("chôdza, kráčajúci", ["chôdza", "kráčajúci"], "podstatné meno alebo príčastie\nPohybovanie sa pešo.", "noun, participle\nThe activity of moving on foot.")],
  [1562, correction("ukazovanie, predstavenie", ["ukazovanie", "predstavenie"], "podstatné meno alebo príčastie\nAkt ukázania niečoho alebo verejné predstavenie.", "noun, participle\nThe act of displaying something or a public performance.")],
  [1574, correction("kontrast, porovnať", ["kontrast", "porovnať"], "podstatné meno alebo sloveso\nVýrazný rozdiel medzi vecami alebo ukázanie takého rozdielu.", "noun, verb\nA clear difference between things, or to show that difference.")],
  [1577, correction("televízia, televízor", ["televízia", "televízor"], "skratka alebo podstatné meno\nSkratka slova television; systém alebo zariadenie na sledovanie vysielania.", "abbreviation, noun\nShort for television; the system or device used to watch broadcasts.", "TV")],
  [1590, correction("videnie, vidiac", ["videnie", "vidiac"], "podstatné meno alebo príčastie\nSchopnosť alebo akt vidieť; tiež priebehový tvar slovesa see.", "noun, participle\nThe ability or act of seeing; also the present participle of see.")],
  [1593, correction("tvrdil, hádal sa", ["tvrdil", "hádal sa"], "sloveso\nMinulý čas slovesa argue; uvádzal dôvody alebo sa slovne sporil.", "verb\nPast tense of argue; gave reasons or disagreed verbally.")],
  [1595, correction("šoférovanie, hnací", ["šoférovanie", "hnací"], "podstatné meno alebo prídavné meno\nOvládanie vozidla alebo sila uvádzajúca niečo do pohybu.", "noun, adjective\nThe activity of controlling a vehicle or providing force for movement.")],
  [1599, correction("súdny proces, skúška, pokus", ["súdny proces", "skúška", "pokus"], "podstatné meno\nFormálne súdne konanie alebo skúšanie niečoho počas obmedzeného času.", "noun\nA formal court case or a test of something for a limited period.")],
  [1610, correction("pojem, koncept, predstava", ["pojem", "koncept", "predstava"], "podstatné meno\nVšeobecná myšlienka alebo spôsob chápania niečoho.", "noun\nA general idea or way of understanding something.")],
  [1619, correction("akciová spoločnosť, Inc.", ["akciová spoločnosť", "Inc"], "skratka\nSkratka slova incorporated v názvoch spoločností.", "abbreviation\nShort for incorporated in company names.", "Inc")],
  [1625, correction("môj, baňa, mína", ["môj", "baňa", "mína"], "zámeno alebo podstatné meno\nNiečo patriace hovoriacemu; tiež miesto ťažby alebo výbušné zariadenie.", "pronoun, noun\nSomething belonging to the speaker; also an excavation or explosive device.")],
  [1642, correction("rozprávanie, výpovedný, pôsobivý", ["rozprávanie", "výpovedný", "pôsobivý"], "podstatné meno, príčastie alebo prídavné meno\nAkt rozprávania; alebo znak, ktorý veľa prezrádza.", "noun, participle, adjective\nThe act of speaking or a sign that reveals a great deal.")],
  [1648, correction("udržiavanie, dodržiavanie", ["udržiavanie", "dodržiavanie"], "podstatné meno alebo príčastie\nPokračovanie v určitom stave alebo dodržiavanie pravidla či sľubu.", "noun, participle\nMaintaining a state or obeying a rule or promise.")],
  [1655, correction("vďaka, ďakujem", ["vďaka", "ďakujem"], "citoslovce alebo podstatné meno\nPoužíva sa na vyjadrenie vďačnosti.", "exclamation, plural noun\nUsed to express gratitude.")],
  [1656, correction("zatiaľ čo, kým, kdežto", ["zatiaľ čo", "kým", "kdežto"], "spojka\nSpája dve skutočnosti, ktoré sa dejú súčasne alebo sú v protiklade.", "conjunction\nConnects facts that happen at the same time or contrast with each other.")],
  [1663, correction("poplatky, obvinenia, účtuje", ["poplatky", "obvinenia", "účtuje"], "podstatné meno v množnom čísle alebo sloveso\nPožadované platby, formálne obvinenia alebo akt účtovania ceny.", "plural noun, verb\nRequired payments, formal accusations, or the act of asking a price.")],
  [1664, correction("poznamenal, známy, uznávaný", ["poznamenal", "známy", "uznávaný"], "sloveso alebo prídavné meno\nZapísal či povedal poznámku; alebo je všeobecne známy.", "verb, adjective\nRecorded or mentioned something; or widely known.")],
  [1697, correction("operácie, prevádzky, činnosti", ["operácie", "prevádzky", "činnosti"], "podstatné meno v množnom čísle\nOrganizované činnosti, lekárske zákroky alebo fungovanie systému.", "plural noun\nOrganized activities, medical procedures, or the working of a system.")],
  [1704, correction("súbor, spis, kartotéka", ["súbor", "spis", "kartotéka"], "podstatné meno alebo sloveso\nDigitálne uložené údaje, zbierka dokumentov alebo akt ich založenia.", "noun, verb\nStored digital data, a collection of documents, or the act of submitting them.")],
  [1705, correction("dokončil, dokončený", ["dokončil", "dokončený"], "sloveso alebo príčastie\nPriviedol úlohu do konca alebo je úplne hotová.", "verb, participle\nFinished a task or fully brought it to an end.")],
  [1712, correction("jar, prameň, pružina, vyskočiť", ["jar", "prameň", "pružina", "vyskočiť"], "podstatné meno alebo sloveso\nRočné obdobie, zdroj vody, pružný diel alebo rýchly skok.", "noun, verb\nA season, a source of water, a flexible coil, or a sudden jump.")],
  [1744, correction("konflikt, rozpor, byť v rozpore", ["konflikt", "rozpor", "byť v rozpore"], "podstatné meno alebo sloveso\nVážny nesúhlas alebo situácia, v ktorej sa veci navzájom vylučujú.", "noun, verb\nA serious disagreement or a situation in which things are incompatible.")],
  [1759, correction("spadol, upustil, klesol", ["spadol", "upustil", "klesol"], "sloveso\nMinulý čas slovesa drop; nechal niečo padnúť alebo sa znížil.", "verb\nPast tense of drop; let something fall or decreased.")],
  [1797, correction("nahradil, nahradený", ["nahradil", "nahradený"], "sloveso alebo príčastie\nMinulý tvar slovesa replace; dal inú osobu alebo vec na pôvodné miesto.", "verb, participle\nPast form of replace; put another person or thing in the original position.")],
  [1803, correction("priznal, prijal, vpustil", ["priznal", "prijal", "vpustil"], "sloveso\nMinulý čas slovesa admit; uznal pravdu alebo dovolil vstup.", "verb\nPast tense of admit; accepted a fact or allowed entry.")],
  [1815, correction("nepravdepodobný", ["nepravdepodobný"], "prídavné meno\nTaký, pri ktorom sa neočakáva, že sa stane alebo je pravdivý.", "adjective\nNot expected to happen or be true.")],
  [1821, correction("diskutovať, preberať, rokovať", ["diskutovať", "preberať", "rokovať"], "sloveso\nHovoriť podrobne o téme a vymieňať si názory.", "verb\nTo talk about a subject in detail and exchange views.")],
  [1834, correction("predaj, predajný", ["predaj", "predajný"], "podstatné meno, príčastie alebo prídavné meno\nČinnosť predávania alebo niečo určené na podporu predaja.", "noun, participle, adjective\nThe activity of selling or something intended to promote sales.")],
  [1900, correction("prekvapený, prekvapil", ["prekvapený", "prekvapil"], "prídavné meno alebo sloveso\nCítiaci neočakávaný údiv; alebo spôsobil niekomu prekvapenie.", "adjective, verb\nFeeling unexpected wonder, or caused someone to feel surprised.")],
  [1904, correction("objem, hlasitosť, zväzok", ["objem", "hlasitosť", "zväzok"], "podstatné meno\nMnožstvo priestoru, sila zvuku alebo jedna kniha zo série.", "noun\nThe amount of space, the level of sound, or one book in a series.")],
  [1906, correction("lieky, drogy", ["lieky", "drogy"], "podstatné meno v množnom čísle\nLátky používané na liečbu alebo nelegálne omamné látky.", "plural noun\nSubstances used as medicines or illegal intoxicating substances.")],
  [1907, correction("inštitút, ústav, zaviesť", ["inštitút", "ústav", "zaviesť"], "podstatné meno alebo sloveso\nOrganizácia na odbornú činnosť; alebo formálne niečo zaviesť.", "noun, verb\nAn organization for specialist work; or to formally establish a system.")],
  [1917, correction("sluch, vypočutie, pojednávanie", ["sluch", "vypočutie", "pojednávanie"], "podstatné meno alebo príčastie\nSchopnosť počuť, akt vypočutia alebo súdne zasadnutie.", "noun, participle\nThe ability to hear, the act of listening, or a court session.")],
  [1935, correction("postupy, procedúry", ["postupy", "procedúry"], "podstatné meno v množnom čísle\nUstálené série krokov na vykonanie úlohy.", "plural noun\nEstablished series of steps for carrying out tasks.")],
  [1939, correction("obchody", ["obchody"], "podstatné meno v množnom čísle\nMiesta, kde sa predáva tovar alebo poskytujú služby.", "plural noun\nPlaces where goods are sold or services are provided.")],
  [1940, correction("odkaz, spojenie, článok", ["odkaz", "spojenie", "článok"], "podstatné meno alebo sloveso\nPrepojenie medzi vecami, internetový odkaz alebo časť reťaze.", "noun, verb\nA connection between things, a web reference, or one part of a chain.")],
  [1947, correction("lži, leží", ["lži", "leží"], "podstatné meno v množnom čísle alebo sloveso\nNepravdivé tvrdenia; alebo tretia osoba slovesa lie, ležať.", "plural noun, verb\nFalse statements; or the third-person form of lie, meaning to rest flat.")],
  [1962, correction("marketing, predaj, propagácia", ["marketing", "predaj", "propagácia"], "podstatné meno\nČinnosti spojené s propagáciou a predajom výrobkov alebo služieb.", "noun\nActivities involved in promoting and selling products or services.")],
  [1967, correction("pod, nižšie", ["pod", "nižšie"], "predložka alebo príslovka\nNa nižšom mieste alebo priamo pod niečím.", "preposition, adverb\nIn a lower position or directly under something.")],
  [1987, correction("korporácia, spoločnosť, Corp.", ["korporácia", "spoločnosť", "Corp"], "skratka\nSkratka slova corporation v názvoch spoločností.", "abbreviation\nShort for corporation in company names.", "Corp")],
  [1996, correction("potešený, spokojný, potešil", ["potešený", "spokojný", "potešil"], "prídavné meno alebo sloveso\nCítiaci radosť alebo spokojnosť; alebo niekomu radosť spôsobil.", "adjective, verb\nFeeling happy or satisfied, or caused someone to feel pleased.")],
]);

corrections.set(5, correction("neurčitý člen, jeden, nejaký, akýsi", ["neurčitý člen", "jeden", "nejaký", "akýsi"], "neurčitý člen\nPoužíva sa pred počítateľným podstatným menom v jednotnom čísle, keď osobu alebo vec nešpecifikujeme.", "indefinite article\nUsed before a singular countable noun when the person or thing is not specified."));
corrections.set(119, correction("nás, nám, nami", ["nás", "nám", "nami"], "zámeno\nPredmetový tvar zámena we; označuje hovoriaceho spolu s ďalšími ľuďmi.", "pronoun\nThe object form of we, referring to the speaker together with other people."));
corrections.set(163, correction("pán, pánovi", ["pán", "pánovi"], "skratka a titul\nZdvorilostný titul používaný pred menom muža.", "abbreviation, title\nA polite title used before a man's name.", "Mr"));
corrections.set(473, correction("pani", ["pani"], "skratka a titul\nZdvorilostný titul používaný pred menom vydatej ženy alebo ženy bez uvedenia rodinného stavu.", "abbreviation, title\nA polite title used before a married woman's name, and often for women generally.", "Mrs"));
corrections.set(791, correction("ani, ani nie", ["ani", "ani nie"], "spojka\nPoužíva sa na pridanie ďalšej zápornej možnosti alebo tvrdenia.", "conjunction\nUsed to introduce an additional negative possibility or statement."));
corrections.set(1005, correction("položiť, ležal", ["položiť", "ležal"], "sloveso\nDať niečo do vodorovnej polohy; tiež minulý čas slovesa lie vo význame ležať.", "verb\nTo put something in a flat position; also the past tense of lie meaning to rest flat."));
corrections.set(1953, correction("lož, klamstvo, klamať, ležať", ["lož", "klamstvo", "klamať", "ležať"], "podstatné meno alebo sloveso\nNepravdivé tvrdenie, hovoriť nepravdu alebo byť vo vodorovnej polohe.", "noun, verb\nA false statement, to say something untrue, or to rest in a flat position."));

const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));
const previousCount = database.words.length;

for (const word of database.words) {
  const replacement = corrections.get(word.id);
  if (replacement) Object.assign(word, replacement);
}

database.words = database.words.filter((word) => !removeIds.has(word.id));

const englishAnswersByPrompt = new Map();
for (const word of database.words) {
  const promptKey = normalizeAnswer(word.slovak);
  if (!englishAnswersByPrompt.has(promptKey)) englishAnswersByPrompt.set(promptKey, new Set());
  englishAnswersByPrompt.get(promptKey).add(word.english);
}
for (const word of database.words) {
  const promptKey = normalizeAnswer(word.slovak);
  word.accepted_english_answers = [...englishAnswersByPrompt.get(promptKey)].sort((a, b) =>
    a.localeCompare(b, "en")
  );
}

database.count = database.words.length;
database.curation = {
  ...(database.curation || {}),
  cleaned_at: "2026-09-30",
  removed_record_ids: [...removeIds].sort((a, b) => a - b),
  corrected_translation_record_ids: [...corrections.keys()].sort((a, b) => a - b),
};

fs.writeFileSync(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
console.log(`Removed ${previousCount - database.words.length} records.`);
console.log(`Corrected ${corrections.size} records.`);
console.log(`Database now contains ${database.words.length} records.`);
