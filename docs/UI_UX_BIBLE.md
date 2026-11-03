# Fabelnest UI/UX-Bible „Nachtnest“

Version 1.0 · gültig ab UI-Iteration 2 · Sprache der Oberfläche: Deutsch

Diese Bible ist die verbindliche Referenz für Oberfläche, Interaktion und Feedback von Fabelnest. Sie gilt für Menschen und KI-Assistenten (Claude, Copilot), die am Projekt arbeiten. Bei Widerspruch gilt diese Reihenfolge:

1. `AGENTS.md` (Produkt- und Architekturregeln)
2. `src/styles/tokens.css` (Werte der Design Tokens, einzige Quelle für Zahlen und Farben)
3. Diese Bible (Bedeutung, Regeln, Verhalten)

Neue UI-Arbeit beginnt immer mit dem Abschnitt [17. Definition of Done](#17-definition-of-done-für-ui-arbeit).

---

## Inhalt

1. [Produkt, Zielgruppe, Designprinzipien](#1-produkt-zielgruppe-designprinzipien)
2. [Art Direction](#2-art-direction-nachtnest)
3. [Farbe](#3-farbe)
4. [Typografie](#4-typografie)
5. [Raster, Layout, Breakpoints](#5-raster-layout-breakpoints)
6. [Formen, Tiefe, Ebenen](#6-formen-tiefe-ebenen)
7. [Ikonografie und Illustration](#7-ikonografie-und-illustration)
8. [Komponenten](#8-komponenten)
9. [Informationsarchitektur und Bildschirme](#9-informationsarchitektur-und-bildschirme)
10. [Interaktionsregeln](#10-interaktionsregeln)
11. [Juice: Feedback, Zeichen, Feiern](#11-juice-feedback-zeichen-feiern)
12. [Bewegung](#12-bewegung)
13. [Audio (Spezifikation für später)](#13-audio-spezifikation-für-später)
14. [Barrierefreiheit](#14-barrierefreiheit)
15. [Sprache und Tonalität](#15-sprache-und-tonalität)
16. [Assets und Platzhalter](#16-assets-und-platzhalter)
17. [Definition of Done für UI-Arbeit](#17-definition-of-done-für-ui-arbeit)
18. [Implementierung und Dateien](#18-implementierung-und-dateien)
19. [Änderungsprotokoll](#19-änderungsprotokoll)

---

## 1. Produkt, Zielgruppe, Designprinzipien

**Produkt:** Fabelnest ist ein mobile-first Creature-Care-Spiel. Kinder pflegen ein Fantasiewesen, verdienen Sterne mit echten Haushaltsaufgaben (bestätigt durch einen Eltern-PIN), kaufen damit Einrichtung, Spielzeug und ein zweites Wesen und spielen ein Lieferflug-Minispiel.

**Zielgruppe:** Kinder von 8 bis 12 Jahren, zwei getrennte Profile pro Gerät. Zweite Zielgruppe: Erwachsene, die Aufgaben freigeben und den PIN verwalten.

**Nutzungskontext:** Smartphone im Hochformat, oft einhändig, kurze Sessions (2 bis 5 Minuten), mehrmals täglich. Tablets im Hoch- und Querformat werden voll unterstützt.

### Designprinzipien

| # | Prinzip | Bedeutung in der Praxis |
|---|---|---|
| P1 | **Das Wesen ist der Star** | Die Spielzimmer-Bühne ist das größte Element im Spielzimmer. Werte und Hinweise liegen als HUD auf der Bühne, nicht als Textblöcke daneben. |
| P2 | **Jede Aktion antwortet** | Kein Tap bleibt stumm. Jede Eingabe erhält innerhalb von 100 ms sichtbares Feedback, jede Belohnung eine eigene kleine Szene. |
| P3 | **Erklären statt sperren** | Nicht verfügbare Aktionen sehen gedämpft aus, bleiben aber antippbar und sagen dann, warum sie nicht gehen und wie es weitergeht. |
| P4 | **Wenig Text, klare Zeichen** | Zustand wird über Farbe, Form, Icon und Position kommuniziert. Text ergänzt, ersetzt aber nie das Zeichen. Lange Erklärungen wandern in Sheets und Aufklapper. |
| P5 | **Wertschätzend, nicht babyhaft** | Freundliche Formen und warme Farben, aber erwachsene Typografie, präzise Texte und keine Verniedlichungen. |
| P6 | **Daumen zuerst** | Häufige Aktionen liegen in der unteren Bildschirmhälfte. Alle Ziele sind mindestens 48 × 48 px groß. |
| P7 | **Ruhe vor Lautstärke** | Juice ist dosiert: Mikro-Feedback immer, große Feiern nur für echte Meilensteine. Reduzierte Bewegung wird respektiert. |

---

## 2. Art Direction „Nachtnest“

**Leitbild:** Ein gemütliches Nest unter einem Sternenhimmel. Die App ist die Nacht, Inhalte sind Pergamentkarten im Laternenlicht, Belohnungen leuchten wie Sterne.

| Ebene | Material | Wirkung |
|---|---|---|
| Hintergrund | Tiefes Indigo mit zwei funkelnden Sternenebenen | ruhig, magisch, macht helle Inhalte und die pinken Platzhalter lesbar |
| Chrome (Topbar, Tabbar, HUD, Dock) | dunkles Glas mit feiner Lichtkante | tritt zurück, rahmt |
| Inhalte (Karten, Sheets, Ergebnisse) | Pergament (Creme) mit dunkler Tinte | warm, lesbar, „Zettel im Nest“ |
| Belohnung und Hauptaktion | Sternengold | „hier passiert etwas Gutes“ |
| Spielgrafik | pinke Platzhalter aus der Asset-Registry | bewusst neutral, wird später ersetzt |

**Tun:** weiche Kieselformen, kräftige 3D-Kanten an Knöpfen („chunky“), leuchtende Akzente, großzügige Abstände, klare Hierarchie.

**Nicht tun:** Emojis als Icons, Neon auf Weiß, harte Ecken, Schlagschatten ohne Lichtlogik, Farbverläufe als Dekoration ohne Bedeutung, mehr als ein goldener Hauptknopf pro Blickfeld (Ausnahme: Listen gleichartiger Karten).

---

## 3. Farbe

Alle Werte stehen in `src/styles/tokens.css`. Komponenten verwenden ausschließlich Tokens, nie Literale.

### 3.1 Paletten

| Familie | Tokens | Rolle |
|---|---|---|
| Nacht | `night-1000` #0b0920 · `night-900` #110e2b · `night-800` #1a1640 · `night-700` #241f55 · `night-600` #2e2868 · `night-500` #3b3480 · `night-400` #554ca3 · `night-300` #8a83c9 | Hintergrund, dunkle Flächen, Kanten unter dunklen Knöpfen |
| Pergament | `paper-50` #fffaf0 · `paper-100` #fbf1de · `paper-200` #f1e2c4 · `paper-300` #e3cc9f | Karten, Sheets, Kartenkanten |
| Tinte | `ink-900` #231c48 · `ink-700` #463d78 · `ink-500` #6f66a3 | Text auf Pergament und auf farbigen Flächen |
| Licht | `light-100` #fbf8ff · `light-200` #e9e4ff · `light-400` #b4acdf | Text auf Nacht |
| Sternengold | `gold-200` … `gold-700`, `gold-ink` #2b1a00 | Sterne, Hauptaktion, aktive Navigation, Belohnung |

### 3.2 Bedeutungsfarben (Farbe = Bedeutung)

Jede Farbe hat genau eine Bedeutung. Eine Farbe wird nie nur zur Dekoration eingesetzt.

| Bedeutung | Token | Wo |
|---|---|---|
| Fröhlichkeit, Streicheln | `rose-500` | Bedürfnis-HUD, Pflegeknopf, Herz-Partikel, Leben im Flug |
| Sättigung, Füttern | `peach-500` | Bedürfnis-HUD, Pflegeknopf, Krümel |
| Energie, Schlafen | `sky-500` | Bedürfnis-HUD, Pflegeknopf, Energiekosten-Chips, Zzz |
| XP und Level | `lilac-500` | Level-Ring, XP-Zahlen, XP-Bereit-Badge, Level-Feier |
| Abenteuer, Spielen | `mint-500` | Spielen-Knopf, Minispiel-Karte, Flug-Fortschritt |
| Sterne, Hauptaktion | `gold-500` | Sternzähler, Preis, Primärknopf, aktive Tabs |
| Erfolg, erledigt | `mint-500` / `mint-300` | Status „Heute erledigt“, Erfolgs-Toast |
| Wartet, Achtung | `amber-500` / `amber-300` | Status „Wartet auf Bestätigung“, Elternfreigabe, Warn-Toast, Pflege-Badge |
| Fehler, niedrig | `coral-500` / `coral-300` | Fehlerbanner, Bedürfnis unter 30, Treffer im Flug |

### 3.3 Kontrast (WCAG 2.2)

Regel: Text auf farbigen Flächen ist immer `ink-900` oder `gold-ink`, nie Weiß. Kleiner Text braucht mindestens 4,5 : 1, große Zahlen und Icons mindestens 3 : 1.

| Paar | Kontrast |
|---|---|
| `light-100` auf `night-900` | 17,8 : 1 |
| `light-200` auf `night-700` | 12,1 : 1 |
| `light-400` auf `night-700` | 7,1 : 1 |
| `gold-300` auf `night-900` | 14,5 : 1 |
| `ink-900` auf `paper-50` | 15,2 : 1 |
| `ink-700` auf `paper-50` | 9,2 : 1 |
| `ink-500` auf `paper-50` | 4,9 : 1 |
| `gold-700` auf `paper-50` | 5,7 : 1 |
| `gold-ink` auf `gold-500` | 10,4 : 1 |
| `ink-900` auf `rose-500` / `peach-500` / `sky-500` | 7,4 / 8,6 / 9,2 : 1 |
| `ink-900` auf `mint-500` / `lilac-500` / `amber-500` | 10,1 / 7,3 / 9,0 : 1 |
| `rose-700` / `peach-700` / `sky-700` auf `paper-50` | 4,8 / 4,8 / 5,3 : 1 |
| `mint-700` / `lilac-700` / `amber-700` auf `paper-50` | 5,1 / 5,6 / 5,3 : 1 |

### 3.4 Regeln

- Pink (`placeholder-pink`, `placeholder-room`) ist für Spielgrafik reserviert und kommt nicht in UI-Elementen vor.
- Farbe trägt nie allein Information: jeder Zustand hat zusätzlich Icon, Text oder Form (zum Beispiel Sanduhr plus Amber plus „Wartet auf Bestätigung“).
- Die App ist bewusst einthemig dunkel (`color-scheme: dark`). Ein Hellmodus ist nicht vorgesehen; Pergamentflächen liefern den hellen Lesekontrast.

---

## 4. Typografie

| Rolle | Schrift | Datei | Lizenz |
|---|---|---|---|
| Display (Titel, Zahlen, Namen) | **Fredoka** (variabel 300–700) | `src/assets/fonts/fredoka-latin-wght.woff2` | SIL OFL 1.1 |
| Text (Fließtext, Knöpfe, Labels) | **Nunito** (variabel 200–1000) | `src/assets/fonts/nunito-latin-wght.woff2` | SIL OFL 1.1 |

Die Schriften liegen lokal im Repo (kein Google-Fonts-Abruf, offline-fähig, datenschutzfreundlich). Fallback: `ui-rounded`, `system-ui`.

### 4.1 Skala

| Token | Größe | Zeilenhöhe | Schrift / Gewicht | Einsatz |
|---|---|---|---|---|
| `text-hero` | 36–48 px (clamp) | 1,15 | Fredoka 700 | Feier-Titel, Logo |
| `text-h1` | 28–34 px (clamp) | 1,15 | Fredoka 600 | Bildschirmtitel, Sheet-Titel |
| `text-h2` | 22 px | 1,2 | Fredoka 600 | Abschnittstitel |
| `text-h3` | 18 px | 1,25 | Fredoka 600 | Kartentitel |
| `text-body` | 16 px | 1,45 | Nunito 600 | Fließtext, Knöpfe (800) |
| `text-small` | 14 px | 1,4 | Nunito 600–800 | Beschreibungen, Labels |
| `text-micro` | 12 px | 1,3 | Nunito 800, Versalien, +0,08 em | Eyebrows, Chips, Kategorien |

### 4.2 Regeln

- Mindestgröße für lesbaren Text: 14 px. 12 px nur für Versal-Labels, Chips und Zähler.
- Fließtext nutzt Gewicht 600 (auf dunklem Grund wirkt 400 zu dünn).
- Zahlen, die sich ändern (Sterne, Werte, Score), nutzen `font-variant-numeric: tabular-nums`, damit nichts springt.
- Versalien nur für Eyebrows und Kategorien, nie für Sätze.
- Deutsche Anführungszeichen „…“ und typografischer Apostroph ’.
- Überschriften: `text-wrap: balance`; Fließtext: `text-wrap: pretty`.

---

## 5. Raster, Layout, Breakpoints

### 5.1 Raster und Abstände

4-px-Raster. Abstands-Tokens: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 20 · `space-6` 24 · `space-8` 32 · `space-10` 40 · `space-12` 48.

- Seitenrand (`gutter`): 16 px plus Safe-Area.
- Abstand zwischen Karten einer Liste: 12 px. Zwischen Abschnitten: 16 px.
- Innenabstand von Karten: 12–16 px; Sheets: 20 px.
- Abstände entstehen über `gap` in Grid/Flex, nicht über Außenabstände einzelner Elemente.

### 5.2 Layoutmodi

| Modus | Bedingung | Navigation | Spielzimmer |
|---|---|---|---|
| **Phone hoch** (Basis) | Standard | Tabbar unten, 72 px | eine Spalte: Bühne, Pflege-Dock, zwei Einstiegskarten |
| **Phone quer** | `landscape` und Höhe ≤ 600 px | Seitenleiste links, 96 px | zwei Spalten: Bühne links, Dock und Einstiege rechts (gestapelt) |
| **Tablet hoch** | Breite ≥ 600 px, hoch | Tabbar unten | eine Spalte, max. 760 px, Shop dreispaltig, Aufgaben einzeilig |
| **Tablet quer / Desktop** | `landscape` und Breite ≥ 900 px | Seitenleiste links | zwei Spalten, max. 1120 px; Listen bleiben max. 760 px |
| **Fokusmodus** | Minispiel läuft | keine | Vollbild ohne Topbar und Tabbar |

Sheets erscheinen bis 640 px Breite als Bottom Sheet, darüber als zentrierter Dialog (max. 560 px).

### 5.3 Daumenzonen (Phone hoch)

- **Unten (leicht erreichbar):** Tabbar, Pflege-Dock, Einstiegskarten, Flugsteuerung, Sticky-CTA.
- **Mitte:** Bühne und direkte Interaktion mit dem Wesen.
- **Oben (schwer erreichbar):** nur Status und seltene Aktionen: Profilwechsel, Sternzähler, Namensschild, Level-Ring, Pause im Flug.

### 5.4 Safe Areas

`viewport-fit=cover` ist gesetzt. Topbar, Tabbar, Seitenleiste, Sheets und Fokusmodus addieren die passenden `env(safe-area-inset-*)`-Werte. Kein interaktives Element liegt in einer Safe-Area.

---

## 6. Formen, Tiefe, Ebenen

### 6.1 Formsprache „Kiesel“

Alles ist rund und weich, nichts ist spitz. Radien: `radius-xs` 8 · `radius-sm` 12 · `radius-md` 18 · `radius-lg` 24 · `radius-xl` 32 · `radius-pill`.

| Element | Radius |
|---|---|
| Knopf normal | `radius-md` (18) |
| Knopf groß | `radius-lg` (24) |
| Karte | `radius-lg` (24) |
| Bühne, Sheet, Dock, Ergebnis | `radius-xl` (32) |
| Chips, Badges, Zähler, Toasts | `radius-pill` |
| Pflegeknöpfe, Avatare, Ringe | Kreis |

### 6.2 Tiefe

| Token | Einsatz |
|---|---|
| `shadow-1` | Karten in Listen, HUD-Elemente |
| `shadow-2` | Bühne, Tray, schwebende Karten |
| `shadow-3` | Sheets, Ergebnis, Feier |
| `highlight` / `card-highlight` | 1-px-Lichtkante oben auf jeder Fläche |
| `edge-gold` / `edge-paper` / `edge-night` | 4-px-Kante unter drückbaren Elementen |
| `glow-gold` / `glow-mint` | ausgewählt, kaufbar, abgeschlossen |

**Drück-Physik:** Drückbare Elemente haben eine Kante (4 px). Beim Drücken fährt das Element 3 px nach unten, die Kante schrumpft auf 1 px. Nicht drückbare Flächen haben nie eine Kante.

### 6.3 Ebenen (z-index)

`z-stage-hud` 5 · `z-chrome` 20 · `z-toast` 40 · `z-fx` 60. Sheets, PIN-Dialog und Feier liegen als `<dialog>` im Top Layer über allem. Toasts sind unter offenen Dialogen nicht sichtbar; Dialoge zeigen ihr Feedback deshalb selbst (zum Beispiel „Gekauft!“ im Produkt-Sheet).

---

## 7. Ikonografie und Illustration

**Iconset:** `src/ui/Icon.tsx`. 24-px-Raster, 2 px Linie, runde Enden und Ecken. Gefüllte Variante nur für Werte-Icons (Stern, Herz, Apfel, Mond, Blitz, Funkeln, Play).

| Icon | Bedeutung |
|---|---|
| `nest` | Spielzimmer |
| `tasks` | Aufgaben |
| `shop` | Shop |
| `collection` (Pfote) | Sammlung |
| `star` | Sterne, Belohnung |
| `heart` | Fröhlichkeit, Leben |
| `apple` | Sättigung, Füttern |
| `moon` | Schlafen |
| `bolt` | Energie, Energiekosten |
| `hand` | Streicheln, Hinweis zum Antippen |
| `ball` | Spielen, Spielzeug |
| `sparkle` | XP, Magie |
| `rocket` | Minispiel starten |
| `plane` | Position im Flug |
| `pizza` | Beläge, Lieferziel |
| `trophy` | Highscore |
| `sofa` | Einrichten |
| `liftUp` / `swap` / `plus` | Aufheben / Tauschen / Platz frei |
| `hourglass` | wartet, Wartezeit |
| `lock` / `key` | Elternbereich / PIN |
| `history` | Sternebuchungen |
| `check` / `close` / `info` / `chevron` | erledigt / schließen / Hinweis / weiter |
| `pause` / `play` / `up` / `down` | Flugsteuerung |

**Regeln:** Icons sind dekorativ (`aria-hidden`), die Beschriftung trägt der Knopf. Icon-only-Knöpfe haben ein `aria-label`. Keine Emojis in der Oberfläche. Neue Icons folgen Raster und Strichstärke und werden hier eingetragen.

**Illustration:** `src/ui/Art.tsx` zeichnet SVG-Gegenstücke der Pixi-Platzhalter (Wesen, Lampe, Ball, Stern) aus Farbe und Form der Asset-Registry. Gesperrte Wesen erscheinen als Nacht-Silhouette mit „?“. Wesen in Feiern zeigen die fröhliche Variante (geschlossene Augen, breites Lächeln).

**App-Icon:** `public/icon.svg`: Nachthimmel, goldene Mondsichel, pinkes Wesen in einem Nest.

---

## 8. Komponenten

Für jede Komponente gilt: Zustände **Ruhe, Gedrückt, Fokus, Deaktiviert/Blockiert, Laden** sind definiert. Fokus ist immer ein 3-px-Ring in `sky-300` mit 3 px Abstand.

### 8.1 Knopf (`.btn`)

| Variante | Fläche / Text | Einsatz |
|---|---|---|
| `btn-primary` | Gold-Verlauf, `gold-ink`, Goldkante | genau eine Hauptaktion pro Blickfeld |
| `btn-secondary` | Glas (auf Nacht) oder `paper-100` mit Kante (auf Pergament) | Alternativen, Abbrechen, „Zum Shop“ |
| `btn-amber` | Amber-Verlauf, `ink-900` | Elternfreigabe (Aktion, die einen Erwachsenen braucht) |
| `btn-ghost` | transparent, gestrichelte Kontur | Elternbereich, seltene Verwaltung |

Größen: normal 48 px, `btn-lg` 56 px, `btn-block` volle Breite. Icon links vom Text, 20 px. Text in Verbform („Erledigt melden“, „Kaufen für 5 ★“). Laden: Text wechselt auf „Wird gespeichert …“, Knopf deaktiviert.

### 8.2 Icon-Knopf (`.icon-btn`)

48 × 48 px Kreis. Varianten: Standard (auf Pergament), `icon-btn-glass` (auf Nacht/Bühne), `icon-btn-sm` 36 px nur innerhalb von Bannern. Braucht immer `aria-label`.

### 8.3 Chips und Status

- `chip`: neutrale Info („3× XP heute“). `chip-energy`: Energiekosten in Himmelblau.
- `status-chip`: `status-open` (Pergament), `status-pending` (Amber), `status-completed` (Mint).
- `reward-chip`: Belohnung in Gold („3 Sterne“, „+3 erhalten“).
- `price-tag`: Preis; `is-affordable` = Goldfläche mit Kante.
- `count-pill`, `count-badge`: Anzahlen.

### 8.4 Banner und Toast

- **Banner** (`banner-error`, `banner-info`, `banner-success`): bleibt stehen, bis das Problem gelöst ist oder es geschlossen wird. Fehler haben `role="alert"`.
- **Toast** (`toast-success`, `-info`, `-warn`, `-error`): kurze Rückmeldung, 2,8 s, max. 2 gleichzeitig, gleiche Texte werden ersetzt statt gestapelt. Position: über der Tabbar; im Fokusmodus oben. Region mit `role="status"`.

### 8.5 Meter und Ringe

- **Meter** (`.meter`): 8–10 px Pillenbalken, Farbe über `--meter-color`, Breite animiert (`dur-slow`). Varianten `meter-xp` (Lila), `meter-gold` (Sparfortschritt).
- **Level-Ring** (`.level-ring`): 60 px, konischer Ring in Lila zeigt XP im Level, Mitte „Lv“ + Zahl. Höchstlevel: Gold-Lila-Verlauf.
- **Fortschrittsring** (`.progress-ring`): 76 px, Tagesfortschritt der Aufgaben, wird bei 4/4 mint mit Glow.
- **Pflege-Ring** (`.care-ring`): zeigt die XP-Pause einer Aktion, füllt sich in Echtzeit.

### 8.6 Navigation

- **Topbar:** links Profil-Chip (Profilwechsel), Mitte Wortmarke (ab 381 px), rechts Sternzähler (öffnet Shop). Sticky, Glas.
- **Tabbar / Seitenleiste:** 4 Ziele mit Icon und immer sichtbarem Label: Spielzimmer, Aufgaben, Shop, Sammlung. Aktiv: Gold, Pille hinter dem Icon, 2 px angehoben. Badges siehe 11.3.

### 8.7 Sheet und Dialoge

- **Sheet** (`src/ui/Sheet.tsx`): `<dialog>` mit Griff, Eyebrow, Titel, Schließen-Knopf; schließt per Escape, Hintergrund-Tap oder ✕, außer während gespeichert wird (`locked`).
- **PIN-Dialog:** Sheet-Optik, Eyebrow „Für Erwachsene“ mit Schloss, Aufgabe als Amber-Karte, PIN-Feld zentriert mit großen Punkten. Falscher PIN: Felder schütteln, Fehlerbanner, Haptik „warn“. Kein Schließen per Hintergrund-Tap.
- **Feier-Dialog:** Vollbild, Strahlenkranz, Bild (Wesen oder Icon) in leuchtender Scheibe, Eyebrow, Titel in `text-hero`, Untertitel, ein Knopf. Tönung: `gold` (Sterne, Aufgaben), `lilac` (Level), `mint` (neues Wesen). Warteschlange: immer nur eine Feier.

### 8.8 Spielzimmer-Komponenten

| Komponente | Beschreibung |
|---|---|
| **Bühne** (`.stage`) | Pixi-Raum 640 × 480 (4 : 3), `radius-xl`, rosa Leuchten. Trägt alle HUD-Elemente. |
| **Namensschild** | Glas-Pille oben links: Art (Eyebrow), Name (h1), Stift-Knopf. Ganze Fläche öffnet das Wesen-Sheet. |
| **Level-Ring** | oben rechts, öffnet das Wesen-Sheet. |
| **Wesen-Wechsler** | Avatar-Knopf unter dem Namensschild, nur bei zwei Wesen. |
| **Bedürfnis-HUD** | Glasleiste unten in der Bühne: drei Werte mit Icon, Meter, Zahl. Unter 30: Meter coral, Icon pulsiert. |
| **Bedürfnis-Zeichen** | weiße Gedankenblase mit Icon des dringendsten Bedürfnisses neben dem Wesen, schwebt. |
| **Coach-Bubble** | „Tippe oder streichle {Name}“ mit winkender Hand, bis zur ersten Pflege eines Wesens mit 0 XP. |
| **Pflege-Dock** | vier runde Knöpfe (Streicheln rose, Füttern peach, Schlafen sky, Spielen mint) mit Pausen-Ring, „XP“-Badge bei Bereitschaft, Energiekosten-Badge bei Spielen. |
| **Einstiegskarten** | Pergament: Pizzalieferung (Kosten, XP-Flüge heute oder Wartezeit) und Einrichten (freie Plätze). Goldener Pfeil = „los“, Sanduhr = wartet. |
| **Einrichten-Tray** | ersetzt Dock und Karten: Hinweistext (live), „Fertig“, Inventar als horizontale Kacheln. |
| **Platz-Marker** | Kreise über den Plätzen: `empty` (gedimmt), `target` (Gold, pulsiert), `filled` (Ring um den Gegenstand, Aufheben-Badge), `swap` (Goldring, Tauschen-Badge). |

### 8.9 Karten

- **Aufgabenkarte:** Kachel links (Gold mit Sternzahl / Amber mit Sanduhr / Mint mit Haken), Titel, Beschreibung, Status- und Belohnungs-Chip, Aktion darunter (ab 600 px rechts). Erledigt: mint getönt, ohne Knopf.
- **Produktkarte:** ganze Karte ist ein Knopf. Bildkachel, Kategorie, Name, Preis. Kaufbar: Goldrahmen und schwebendes Bild. Zu teuer: Sparbalken und „noch N ★“. Gekauft: Mint-Band „Im Besitz“.
- **Wesenkarte (Sammlung):** Bild, Art, Name, Level und XP-Balken, „Aktivieren“. Aktiv: Goldrahmen, Band „Aktiv“. Gesperrt: Silhouette, Preis, „Zum Shop“ (öffnet direkt das Produkt).
- **Startwesen-Karte:** Radio-Karte; Auswahl hebt sie an, Goldglow, Haken-Badge, Wesen hüpft und lächelt.

### 8.10 Minispiel-Komponenten

| Komponente | Beschreibung |
|---|---|
| **Kopfzeile** | Pause (links), Titel, Highscore-Pille (rechts). Im Querformat wandert der HUD in die Kopfzeile. |
| **Flug-HUD** | drei Herzen (verlorene grau), Beläge mit Zähl-Pop, Score. |
| **Strecken-Leiste** | Mint-Gold-Verlauf, Flieger-Marker wandert zur Pizza am Ziel. |
| **Countdown** | „Bereit?“ + Ziffer 3-2-1 mit Pop, danach „Los!“ in Mint. |
| **Steuerung** | zwei 88 px hohe Knöpfe „Hoch“/„Runter“ mit Spurenanzeige dazwischen; im Querformat rechts übereinander. |
| **Pause-Overlay** | Vollbild-Glas: „Weiterfliegen“ (primär), „Flug beenden“ mit Konsequenz-Hinweis. |
| **Ergebnis-Karte** | Emblem, Titel, Kacheln Beläge/Score, XP-Zeile, Highscore-Band, Aktionen. |

### 8.11 Leerer Zustand

Pergament-Fläche mit Icon, einem Satz und genau einer Aktion, die den Zustand auflöst (zum Beispiel „Zum Shop“).

---

## 9. Informationsarchitektur und Bildschirme

```
Profilwahl ──► [Ladebild] ──► App
                               ├─ Spielzimmer (Start)
                               │    ├─ Startwesen wählen (nur ohne Wesen) ─► Feier ─► Namens-Sheet
                               │    ├─ Wesen-Sheet (Details, Name)
                               │    ├─ Einrichten-Modus
                               │    └─ Pizzalieferung (Fokusmodus) ─► Pause / Ergebnis
                               ├─ Aufgaben ─► Eltern-PIN-Dialog · Sternebuchungen-Sheet
                               ├─ Shop ─► Produkt-Sheet ─► „Gekauft!“ ─► Aufstellen / Kennenlernen
                               └─ Sammlung ─► Aktivieren · Zum Shop (Produkt-Sheet)
```

### 9.1 Profilwahl

Ziel: in einem Tap ins eigene Nest. Logo mit schwebendem Mond, Frage „Wer spielt heute?“, zwei große Profilkarten (Stern-Gold, Mond-Blau), Hinweis „Dein Spielstand bleibt auf diesem Gerät.“ Auswahl: gewählte Karte wächst mit Goldglow, die andere tritt zurück, nach 320 ms öffnet das Nest.

### 9.2 Startwesen

Zwei Radio-Karten nebeneinander, Sticky-CTA „{Name} ins Nest holen“ (vorher deaktiviert: „Tippe auf ein Wesen“). Danach Feier „Hallo, {Name}!“ und direkt das Namens-Sheet („{Name} passt so“ oder „Namen speichern“).

### 9.3 Spielzimmer

Reihenfolge von oben: Bühne mit HUD → Pflege-Dock → Einstiegskarten. Alle Erklärtexte des alten Prototyps leben jetzt im Wesen-Sheet („Tipps“) oder als Toast im Moment, in dem sie relevant werden.

### 9.4 Aufgaben

Kopf mit Tagesfortschritt-Ring und Satz „Heute kannst du noch bis zu N Sterne verdienen.“ → Aufgabenkarten → Aufklapper „So funktioniert’s“ (4 Schritte) → Bereich „Für Erwachsene“ (PIN verwalten, Sternebuchungen).

### 9.5 Shop

Kopf mit Satz zur Sternenherkunft → ggf. Info-Banner ohne Startwesen → Raster (2 Spalten Phone, 3 Tablet). Kauf immer über das Produkt-Sheet (zweiter Tap = Bestätigung, schützt vor Fehlkäufen).

### 9.6 Sammlung

Zähler „1/2“, Wesenkarten. Gesperrte Wesen führen direkt zum passenden Produkt.

### 9.7 Pizzalieferung (Fokusmodus)

Kopfzeile → HUD → Strecke → Spielfeld → Steuerung im Daumenbereich → Hilfetext. Ergebnis ersetzt das Spielfeld.

---

## 10. Interaktionsregeln

### 10.1 Eingaben

| Eingabe | Wirkung |
|---|---|
| Tap auf das Wesen | Antippen (+2 XP, Reaktion „happy“) |
| Wischen über das Wesen (≥ 24 px) | Streicheln (+5 XP) |
| Tap auf aufgestelltes Spielzeug | Spielen über das Spielzeug |
| Pflegeknopf | jeweilige Aktion |
| Enter/Leertaste auf der Bühne | Antippen |
| Flug: Knopf, Tap über/unter dem Flieger, Pfeiltasten | eine Spur hoch/runter |
| Flug: Escape oder Pause-Knopf | Pause umschalten |

### 10.2 Touch-Ziele

Minimum 48 × 48 px (`touch-min`), Hauptaktionen 56 px (`touch-primary`), Spielsteuerung 72–88 px (`touch-game`). Mindestens 8 px Abstand zwischen benachbarten Zielen.

### 10.3 Erklären statt sperren

Blockierte Aktionen (`aria-disabled="true"`, Klasse `is-blocked`) bleiben antippbar und antworten mit Toast (Grund + nächster Schritt) und Haptik „warn“. Beispiele:

- Spielen ohne Energie: Knopf schüttelt, Toast „Zum Spielen brauchst du mindestens 10 Energie. Schlafen hilft dir dabei.“
- Flug ohne Energie: Toast mit konkreter Wartezeit („Genug Energie ist in 5 Minuten da. Schlafen hilft sofort.“).
- Zu teure Produkte: Sheet nennt fehlende Sterne und bietet „Sterne verdienen“.

Echtes `disabled` nur, wenn eine Aktion logisch keinen Sinn hat (bereits aktiv, bereits gekauft, Steuerung im Countdown).

### 10.4 Bestätigungen

- Ausgaben (Sterne) brauchen zwei Taps: Karte öffnen, dann „Kaufen für N ★“.
- Abbruch mit Verlust (Flug beenden) braucht das Pause-Overlay mit Konsequenz-Text.
- Freigaben brauchen den Eltern-PIN.
- Alles andere wirkt sofort und ist umkehrbar (Einrichten, Wesen wechseln, Name).

### 10.5 Speichern und Sperren

Während gespeichert wird, ist der Inhaltsbereich `inert` und `aria-busy`. Doppelte Eingaben werden ignoriert. Fehler erscheinen als schließbares Banner oben im Inhalt; der Spielstand wird nie überschrieben.

### 10.6 Navigation

- Tabwechsel setzt Einrichten-Modus und gehaltenen Gegenstand zurück und scrollt nach oben.
- Querverweise öffnen das Ziel direkt im richtigen Zustand: „Jetzt aufstellen“ → Spielzimmer im Einrichten-Modus mit dem Gegenstand in der Hand; „Zum Shop“ in der Sammlung → Produkt-Sheet; Sternzähler → Shop.
- Der Fokusmodus hat keinen Tab-Ausgang; Verlassen nur über Pause oder Ergebnis.

---

## 11. Juice: Feedback, Zeichen, Feiern

Umsetzung: `src/ui/feedback.tsx` (API `useFeedback()`), Styles in `src/styles/juice.css`.

### 11.1 Intensitätsstufen

| Stufe | Wann | Mittel | Budget |
|---|---|---|---|
| **Mikro** | jede Eingabe | Drück-Physik, Pop, Farbwechsel | immer |
| **Meso** | jede Belohnung oder Zustandsänderung | Partikel, schwebende Zahl, Toast, Zähleranimation, Haptik „tap“ | max. 12 Partikel pro Ereignis, 80 gleichzeitig |
| **Makro** | Meilensteine | Feier-Dialog mit Konfetti und Strahlen, Haptik „success“ | max. eine Feier gleichzeitig, Warteschlange |

Makro-Momente sind: erstes Wesen, Level-Aufstieg, neues Wesen, alle Tagesaufgaben erledigt. Gewonnener Flug feiert in der Ergebnis-Karte (Konfetti, Highscore-Band), ohne zusätzlichen Dialog.

### 11.2 Feedback-Matrix

| Ereignis | Bild | Partikel | Text | Haptik |
|---|---|---|---|---|
| Wesen antippen | Reaktion „happy“ | 6 Funken | „+2 XP“ oder „XP-Pause“ | tap |
| Streicheln | „happy“ | 9 Herzen | „+5 XP“ | tap |
| Füttern | „eat“ | 12 Krümel | „+8 XP“ | tap |
| Schlafen | „sleep“ (5 s) | 3 × „z“ | „+6 XP“ | tap |
| Spielen | „play“ | 7 Bälle | „+10 XP“ | tap |
| Spielen ohne Energie | Knopf schüttelt | – | Warn-Toast | warn |
| Wert steigt / fällt | Meter glüht, Icon poppt / Zahl coral | – | – | – |
| Level-Aufstieg | Feier (lilac), Wesen hüpft | Konfetti | „Level N!“ | success |
| Name gespeichert | Funken am Namensschild | 8 Funken | „Schöner Name: …“ | – |
| Aufgabe gemeldet | Kachel wird Amber, Sanduhr dreht | 7 Funken am Knopf | Toast | tap |
| Aufgabe bestätigt | Kachel stempelt Mint-Haken | Sterne fliegen zum Zähler (bis 8) + 8 Sterne | „+N Sterne für „…““ | – |
| Alle Aufgaben erledigt | Feier (gold) | Konfetti | „Alle Aufgaben geschafft!“ | success |
| Sterne kommen an | Zähler zählt hoch (900 ms), Stern poppt, Glow | – | – | – |
| Kauf | „Gekauft!“, Bild ploppt, Goldglow | 10 Strahlen | Zähler zählt runter | success |
| Neues Wesen kennenlernen | Feier (mint) | Konfetti | „{Name} ist eingezogen!“ | success |
| Gegenstand aufheben | Kachel kippt, „In der Hand“ | – | Hinweis (live) | tap |
| Gegenstand abstellen | – | 9 Staubwölkchen | Screenreader-Meldung | tap |
| Flug startet | Fokusmodus, Countdown-Pop | – | „Bereit? 3-2-1“, „Los!“ | tap |
| Belag eingesammelt | Zähler poppt Gold | „+10“ am Flieger | – | tap |
| Treffer | Bühne schüttelt, rote Vignette, Herz bricht | – | – | hit |
| Lieferung geschafft | Ergebnis-Karte ploppt | 18 Konfetti | XP zählt hoch, ggf. „Neuer Highscore!“ | success |
| Lieferung verloren | Herz-Emblem hüpft | – | ermutigender Satz | – |
| Falscher PIN | PIN-Felder schütteln | – | Fehlerbanner | warn |

Haptik-Muster (`navigator.vibrate`, wenn verfügbar): `tap` 8 ms · `success` 14-50-22 ms · `warn` 30-60-30 ms · `hit` 70 ms.

### 11.3 Zeichen (Signs)

Zeichen zeigen, wo etwas zu tun ist, ohne Text zu verlangen.

| Zeichen | Bedingung | Form |
|---|---|---|
| Tab-Badge Aufgaben (Amber, Zahl, pulsiert) | Aufgaben warten auf Elternfreigabe | hat Vorrang vor Gold |
| Tab-Badge Aufgaben (Gold, Zahl) | offene Aufgaben heute | – |
| Tab-Badge Shop (Gold, Zahl) | Produkte jetzt kaufbar | – |
| Tab-Badge Spielzimmer (Amber-Punkt) | ein Bedürfnis unter 30, Spielzimmer nicht offen | – |
| Bedürfnis-Zeichen | Bedürfnis unter 30 | Gedankenblase + passender Pflegeknopf pulsiert |
| „XP“-Badge | Aktion gibt wieder XP | lila Badge am Pflegeknopf |
| Pausen-Ring | Aktion in XP-Pause | Ring füllt sich in Echtzeit |
| Coach-Bubble | Wesen hat 0 XP, noch keine Pflege | Glas-Pille mit winkender Hand |
| Goldrahmen | Produkt kaufbar | Karte mit Goldkontur, Bild schwebt |
| Sanduhr | Wartezeit läuft | Einstiegskarte, Aufgabenkachel |
| Pulsierender Goldpfeil | Minispiel startbereit | Einstiegskarte |

---

## 12. Bewegung

### 12.1 Tokens

| Token | Wert | Einsatz |
|---|---|---|
| `dur-instant` | 90 ms | Drücken |
| `dur-fast` | 160 ms | Farbwechsel, kleine Pops |
| `dur-base` | 260 ms | Badges, Toast-Ausgang, Fades |
| `dur-slow` | 420 ms | Sheets, Karten-Eintritt, Meter |
| `dur-epic` | 900 ms | Belohnungs-Pop, Zähler |
| `ease-out` | cubic-bezier(.22,1,.36,1) | Eintritte, Bewegungen |
| `ease-in` | cubic-bezier(.55,0,1,.45) | Austritte, fliegende Sterne |
| `ease-inout` | cubic-bezier(.65,0,.35,1) | Schleifen (Schweben, Funkeln) |
| `ease-spring` | cubic-bezier(.34,1.56,.64,1) | Pops, Auswahl, Badges |

### 12.2 Choreografie

- Bildschirmwechsel: Inhalt gleitet 10 px nach oben ein (`view-in`, 420 ms).
- Listen: Karten erscheinen gestaffelt (60–90 ms Versatz).
- Sheets: von unten (Phone) oder mit leichtem Zoom (Tablet).
- Dauerschleifen nur für Zeichen mit Bedeutung (Bedürfnis, Ziel, Startbereitschaft) und Atmosphäre (Sterne, Logo). Nie mehr als drei pulsierende Elemente gleichzeitig.
- Animationen verändern nur `transform`, `opacity`, `box-shadow`, `filter` und registrierte Variablen (`--p`).

### 12.3 Reduzierte Bewegung

Bei `prefers-reduced-motion: reduce`: alle Animationen und Übergänge auf 1 ms, keine Partikel, kein Konfetti, keine Strahlen, kein Sternenfunkeln. Zahlen erscheinen sofort. Schwebende Zahlen und Toasts blenden nur ein und aus. Informationen gehen nie verloren.

---

## 13. Audio (Spezifikation für später)

Die aktuelle Iteration hat keinen Ton. Wenn Audio kommt, gilt:

- Ton ist standardmäßig aus; ein Schalter lebt im Bereich „Für Erwachsene“.
- Jeder Ton spiegelt ein Ereignis aus der Feedback-Matrix (11.2); kein Ton ohne visuelles Gegenstück.
- Slots: `tap` (weich, kurz), `reward` (aufsteigendes Glöckchen), `star-land` (heller Pling pro Stern, max. 8), `level-up` (kurze Fanfare), `deny` (dumpfes Plopp), `hit` (Wobble), `win` (Jingle), `countdown` (3 Ticks + Startton).
- Lautstärke-Hierarchie: Makro > Meso > Mikro; max. zwei Töne gleichzeitig.
- Lokale Dateien oder WebAudio-Synthese, keine externen Quellen.

---

## 14. Barrierefreiheit

Ziel: WCAG 2.2 AA.

- **Kontrast:** siehe 3.3.
- **Fokus:** sichtbarer Ring auf allen interaktiven Elementen; Dialoge fangen den Fokus (`<dialog>`), der erste sinnvolle Knopf erhält `autoFocus`.
- **Screenreader:** Bühne ist ein benannter Knopf; Bedürfnisse sind `role="meter"`; XP ist `role="progressbar"`; Interaktionsergebnisse werden über eine versteckte Live-Region angesagt; Toasts liegen in `role="status"`; Fehler in `role="alert"`. Icons sind `aria-hidden`.
- **Tastatur:** alle Funktionen sind per Tastatur erreichbar, auch Spielzeug im Zimmer (unsichtbarer, fokussierbarer Knopf über dem Objekt) und der Flug (Pfeiltasten, Escape).
- **Motorik:** große Ziele, keine Zeitlimits außer im Minispiel; Wischgeste hat einen gleichwertigen Knopf.
- **Kognition:** ein Gedanke pro Satz, Zahlen statt Umschreibungen, Zustände immer mit Icon und Text.
- **Sprache:** `lang="de"`.

---

## 15. Sprache und Tonalität

**Stimme:** wie eine freundliche ältere Spielleitung. Du-Form, aktiv, konkret, ermutigend, nie herablassend.

| Tun | Nicht tun |
|---|---|
| „Erledigt melden“ | „Klicke hier, um die Aufgabe als erledigt zu markieren“ |
| „Dir fehlen noch 3 Sterne.“ | „Leider nicht genug Sterne :(“ |
| „Auch Piloten üben.“ | „Verloren!“ |
| „Für den Flug brauchst du 20 Energie. Genug Energie ist in 5 Minuten da.“ | „Fehler: Energie zu niedrig“ |
| „Schöner Name: Flocke“ | „Super-duper toll gemacht!!!“ |

**Muster:**

- Knöpfe: Verb + Objekt, max. 3 Wörter, Kosten in Klammern oder als Chip („Erneut fliegen (−20 Energie)“).
- Toasts: Ergebnis zuerst, dann nächster Schritt.
- Fehler: was ist passiert, was hilft. Keine Entschuldigungen, keine Technik.
- Zahlen: Ziffern, Minuszeichen „−“ für Kosten, „+“ für Gewinne.

**Glossar (verbindlich):** Spielzimmer · Nest (Marke, Stimmung) · Wesen · Sterne (Währung) · XP · Level · Energie · Fröhlichkeit · Sättigung · Aufgaben · Elternfreigabe · Eltern-PIN · Einrichten · Platz · Pizzalieferung · Beläge · Highscore · Sammlung.

---

## 16. Assets und Platzhalter

- Spielgrafik bleibt pinker, programmatisch erzeugter Platzhalter, bis echte Spritesheets kommen (`ASSET_GUIDE.md`). Die UI darf sie rahmen, aber nicht umfärben.
- Zimmerraster: 640 × 480 logische Pixel (`src/data/room.ts`). Plätze (`PLACEMENT_SLOTS`) und Overlay-Marker beziehen sich darauf; die Bühne skaliert per CSS im Verhältnis 4 : 3.
- Fluggrafik: 640 × 400 (`FLIGHT`), Verhältnis 8 : 5.
- UI-Illustrationen (`Art.tsx`) lesen Farbe und Form aus der Registry. Wenn echte Assets kommen, können Karten auf Bilder aus der Registry umgestellt werden, ohne Komponenten zu ändern.
- Schriften liegen lokal mit OFL-Lizenztext in `src/assets/fonts/`.

---

## 17. Definition of Done für UI-Arbeit

Eine UI-Änderung ist fertig, wenn:

- [ ] nur Tokens verwendet werden (keine neuen Literale für Farbe, Abstand, Radius, Dauer)
- [ ] jede neue Farbe einer Bedeutung aus 3.2 zugeordnet ist
- [ ] alle Zustände (Ruhe, Gedrückt, Fokus, Blockiert, Laden, Leer, Fehler) gestaltet sind
- [ ] die Aktion Feedback nach 11.2 hat (mindestens Mikro, bei Belohnung Meso)
- [ ] blockierte Aktionen erklären, warum (10.3)
- [ ] Touch-Ziele ≥ 48 px und Kontrast nach 3.3 erfüllt sind
- [ ] Phone hoch (320 und 390 px), Phone quer, Tablet hoch und quer ohne horizontales Scrollen funktionieren
- [ ] `prefers-reduced-motion` geprüft ist
- [ ] Texte dem Ton aus 15 folgen und das Glossar nutzen
- [ ] `npm run typecheck`, `npm test` und `npm run build` grün sind
- [ ] diese Bible aktualisiert ist, wenn eine Regel oder Komponente neu ist

---

## 18. Implementierung und Dateien

```
src/
├── App.tsx                  Zustand, Speichern, Abläufe, Feedback-Auslöser
├── ui/
│   ├── Icon.tsx             Iconset
│   ├── Art.tsx              SVG-Wesen und -Produkte aus der Registry
│   ├── Chrome.tsx           Topbar, Tabbar/Seitenleiste, Profil-Badge
│   ├── Sheet.tsx            Bottom Sheet / Dialog
│   ├── feedback.tsx         Juice-System (Toasts, Partikel, Sterne, Feiern, Haptik)
│   └── useCountUp.ts        Zähl-Animation, usePrevious
├── screens/                 Profil, Startwesen, Spielzimmer, Wesen-Sheet, Aufgaben, Shop, Sammlung
├── components/              PixiCreature, PizzaDelivery, ParentPinDialog
├── game/insights.ts         reine, getestete Ableitungen für Hinweise (Pausen, Wartezeiten, Zusammenfassungen)
├── data/room.ts             Zimmerraster
└── styles/
    ├── tokens.css           Design Tokens (Quelle der Wahrheit)
    ├── base.css             Reset, Sternenhimmel, Typografie
    ├── components.css       Bausteine
    ├── layout.css           App-Rahmen, Breakpoints
    ├── screens.css          Bildschirme
    ├── flight.css           Minispiel
    └── juice.css            Partikel, Feiern, Keyframes, reduzierte Bewegung
```

**CSS-Konventionen:** Klassen in Kebab-Case nach Komponente (`.care-btn`), Zustände als `is-*` (`is-ready`, `is-blocked`, `is-low`), Varianten als `tone-*` / `btn-*`. Pergament-Kontext wird über die Kartenklassen gesetzt und schaltet Text- und Linienfarben um. Kein Inline-Style außer berechneten Werten (`--p`, Positionen, Breiten).

**Logik-Grenze:** Hinweise, die Spielregeln auswerten (XP-Pause, Wartezeit, kaufbare Produkte), gehören nach `src/game/insights.ts` und haben Tests. Komponenten rechnen keine Spielregeln selbst.

**Feste Testanker (nicht umbenennen):** `.flight-controls button` (Index 0 = Hoch, 1 = Runter), `[role="img"]` mit Spurenname im Label, Text „Erhaltene XP: …“, „Ergebnis erneut speichern“, „noch nicht gespeichert“, eine einzige `role="alert"`-Fehlermeldung im Minispiel.

---

## 19. Änderungsprotokoll

| Version | Änderung |
|---|---|
| 1.0 | Komplette Neugestaltung „Nachtnest“: neue Art Direction, Token-System, Bottom-Navigation und Seitenleiste, Spielzimmer als Bühne mit HUD, Pflege-Dock mit XP-Pausen, Einrichten-Modus auf der Bühne, Produkt-Sheet mit Kaufbestätigung, Fokusmodus mit Pause für das Minispiel, Juice-System mit Feedback-Matrix, Zeichen und Feiern, lokale Schriften, neues App-Icon. |
