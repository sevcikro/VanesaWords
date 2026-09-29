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
- Pri nesprávnej odpovedi sa zobrazí preklad a slovo sa zaradí späť do toho istého kola.
- Po každej odpovedi sa zobrazí správny preklad a slovenské vysvetlenie významu.
- Kolo skončí až po správnom zodpovedaní všetkých vybraných slov.

Databázu tvorí 2 000 anglicko-slovenských záznamov v `english_slovak_words.json`.

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
