# VanesaWords

Prémiovo spracovaná webová aplikácia na precvičovanie najčastejších anglických slov v oboch smeroch.

## Online verzia

https://ubuntu-orbit-fqv8.here.now/

## Ako funguje

- Vyberiete si náhodný balík 10, 20, 50 alebo 100 slov.
- Vyberiete si smer angličtina → slovenčina, slovenčina → angličtina alebo vyvážený mix oboch smerov.
- Aplikácia zobrazí vždy jeden výraz a čaká na preklad v zvolenom smere.
- Odpoveď sa kontroluje bez ohľadu na veľkosť písmen, diakritiku a interpunkciu.
- Ak záznam obsahuje viac prekladov, stačí správne zadať ktorýkoľvek z nich.
- Ak má rovnaký slovenský výraz viac platných anglických prekladov, aplikácia v opačnom smere uzná všetky prepojené možnosti.
- Pri nesprávnej odpovedi sa zobrazí preklad a slovo sa zaradí späť do toho istého kola.
- Po každej odpovedi sa zobrazí správny preklad a slovenské vysvetlenie významu.
- Kolo skončí až po správnom zodpovedaní všetkých vybraných slov.

Databázu tvorí presne 2 000 unikátnych anglicko-slovenských záznamov v `english_slovak_words.json`. Pôvodný frekvenčný zoznam bol doplnený o 52 základných hesiel z Oxford 3000. Z databázy boli odstránené samostatné písmená, poškodené fragmenty, duplicity a osobné mená bez slovnej zásoby; 171 problematických prekladov a vysvetlení bolo opravených.

Anglická výslovnosť je uložená ako hotové MP3 súbory v `audio/en-us/geffen-32/`. Aplikácia ich prehráva priamo a pri každom kliknutí preto neposiela nový požiadavok na TTS službu. Súbor `audio/manifest.json` prepája všetkých 2 000 databázových záznamov s 2 000 unikátnymi nahrávkami.

Nové alebo chýbajúce nahrávky možno doplniť skriptom `scripts/generate-speechify-audio.js`. Skript používa premennú prostredia `SPEECHIFY_API_KEY`, existujúce MP3 preskočí a kľúč nikam neukladá.

## Lokálne spustenie

Keďže aplikácia načítava JSON cez `fetch`, spustite ju cez jednoduchý lokálny server:

```bash
python -m http.server 8080
```

Potom otvorte `http://localhost:8080`.

Alternatíva s Node.js:

```bash
node tests/dev-server.js
```

## Technológie

Čisté HTML, CSS a JavaScript bez build kroku alebo externých závislostí.
