# Folderizr Handover

Data handover: 2026-06-29

Autore handover: Codex, agente di sviluppo

Repository locale:

```text
/mnt/hgfs/DEV_VM/__PROGETTI_DIVERSI/Folderizr.2026
```

Remote GitHub:

```text
https://github.com/trincio/ChatGPT-Folderizr.git
```

## Stato Git

Branch principali:

```text
main
chore/v1.1-modernization
feature/foldersearcher
```

Branch corrente al momento dell'handover:

```text
feature/foldersearcher
```

Tag locali importanti:

```text
v1.1.0-candidate
foldersearcher-prototype
```

Significato dei tag:

- `v1.1.0-candidate`: stato stabile della modernizzazione v1.1, gia pushato su GitHub nella branch `chore/v1.1-modernization`.
- `foldersearcher-prototype`: primo prototipo funzionante del pannello detached FolderSearcher, prima del piano di scansione avanzata.

Commit rilevanti:

```text
c83b010 Plan advanced FolderSearcher scanning
068f86f Add detached FolderSearcher prototype
bfe0ab2 Document future Folderizr ideas
6b03996 Add dedicated Folderizr sidebar section
a2a181d Add v1.1 release notes draft
0c81676 Add v1.1 release and compliance docs
60e7fa8 Modernize extension runtime for v1.1
```

Al momento dell'handover `estrazione.html` e un file locale non tracciato usato come campione DOM della sidebar. Non e stato committato e non va pubblicato senza revisione.

## Cosa E Stato Fatto

### v1.1 Modernization

Branch:

```text
chore/v1.1-modernization
```

Stato:

- pushata su GitHub;
- taggata come `v1.1.0-candidate`;
- pensata come release candidate privacy-safe e cross-browser.

Modifiche principali:

- manifest portato a `1.1.0`;
- nome pubblico preferito: `Folderizr`;
- disclaimer indipendenza/OpenAI inserito in manifest e documenti;
- supporto a:
  - `https://chatgpt.com/*`
  - `https://chat.openai.com/*`
- permessi ridotti a:
  - `storage`
- rimosse chiavi duplicate nel manifest;
- niente `activeTab`;
- niente telemetry, analytics, ads, backend, remote code;
- content script riscritto con `MutationObserver`;
- eliminato `setInterval` aggressivo;
- non vengono piu nascosti o disabilitati i pulsanti nativi ChatGPT;
- la visualizzazione e solo locale;
- nessuna modifica server-side dei titoli o dei contenuti.

### Sezione Folderizr Nella Sidebar

Funzione:

- legge le chat normali nella sezione `Chats`;
- individua titoli con prefisso:

```text
[LAVORO] Sicurezza fisica NIS2
```

- crea una sezione locale `Folderizr` sopra `Chats`;
- sposta visualmente le chat prefissate sotto cartelle dedotte;
- mostra il titolo senza prefisso solo nella UI locale;
- mantiene intatto il titolo reale lato ChatGPT.

Limite:

- non indicizza automaticamente tutta la history;
- lavora sulle chat caricate nel DOM in quel momento;
- non include Projects.

### FolderSearcher Prototype

Branch:

```text
feature/foldersearcher
```

Tag stabile:

```text
foldersearcher-prototype
```

Funzione:

- aggiunge un pulsante flottante `FolderSearcher`;
- apre un pannello detached/standalone fuori dalla sidebar;
- `Rescan chats` indicizza localmente le chat visibili/caricate;
- costruisce un albero cartelle dai prefissi nel titolo;
- supporta percorsi annidati con `/`;
- filtro testuale pota i rami senza match;
- risultati apribili come link standalone `/c/...`;
- `Export index` scarica JSON locale dell'indice;
- reminder locale per ricordare il backup dell'indice.

Esempio:

```text
[GRAFICA/vettoriale] Operazioni di rotazione automatici JS
```

diventa:

```text
GRAFICA
  vettoriale
    Operazioni di rotazione automatici JS
```

Indice locale:

- titolo originale visibile;
- titolo visualizzato senza prefisso;
- href locale `/c/...`;
- percorso cartella dedotto;
- timestamp di indicizzazione.

Non contiene:

- prompt;
- risposte;
- contenuti della conversazione;
- dati esportati da ChatGPT;
- dati remoti.

## File Importanti

```text
manifest.json
content.js
popup.html
popup.js
README.md
privacy.md
CHANGELOG.md
TESTING.md
STORE_LISTINGS.md
RELEASE_NOTES.md
BUFFER_IDEE_DA_IMPLEMENTARE.md
FOLDERSEARCHER_ADVANCED_SCAN_PLAN.md
HANDOVER_FOLDERIZR.md
```

### `manifest.json`

Manifest MV3.

Permessi:

```json
[
  "storage"
]
```

Content script:

```text
https://chatgpt.com/*
https://chat.openai.com/*
```

### `content.js`

Contiene:

- enable/disable logic;
- compatibilita `browser` / `chrome`;
- migrazione chiavi storage legacy;
- grouping locale della sidebar;
- sezione `Folderizr`;
- pannello `FolderSearcher`;
- rescan locale;
- export JSON dell'indice;
- reminder backup indice.

Punti critici:

- selettori DOM ChatGPT sono fragili per definizione;
- `findChatsList()` cerca la sezione `Chats`;
- `getChatScrollContainer()` al momento usa una euristica da migliorare;
- la prossima priorita e identificare con certezza il container scrollabile reale.

### `popup.html` / `popup.js`

Popup semplice:

- stato enabled/disabled;
- bottone enable/disable;
- dettagli privacy e disclaimer.

Non richiede `tabs`.

### `privacy.md`

Dichiara:

- nessuna raccolta dati;
- nessuna trasmissione;
- nessun tracking;
- nessun remote code;
- storage locale solo per preferenze e indice FolderSearcher;
- export solo dell'indice locale.

### `FOLDERSEARCHER_ADVANCED_SCAN_PLAN.md`

Documento di progetto per la prossima iterazione:

- scroll controllato;
- deduplica;
- fine lista;
- `MutationObserver` temporaneo;
- stop manuale;
- salvataggio progressivo;
- Projects opzionali.

## Come Testare In Firefox

1. Aprire:

```text
about:debugging#/runtime/this-firefox
```

2. Se l'estensione e gia caricata, premere `Reload`.

3. Se va caricata da zero, scegliere:

```text
Load Temporary Add-on
```

e selezionare:

```text
/mnt/hgfs/DEV_VM/__PROGETTI_DIVERSI/Folderizr.2026/manifest.json
```

4. Aprire:

```text
https://chatgpt.com/
```

5. Aprire il popup Folderizr e premere `Enable`.

6. Ricaricare ChatGPT con `Ctrl+R`.

7. Verificare:

- comparsa della sezione `Folderizr` se ci sono chat prefissate nel DOM;
- comparsa del pulsante flottante `FolderSearcher`;
- apertura pannello detached;
- `Rescan chats`;
- filtro ricerca;
- apertura link `/c/...`;
- export JSON indice.

## Test Manuale Specifico

Creare o rinominare chat normali sotto `Chats`:

```text
[LAVORO] Sicurezza fisica NIS2
[NIARB-FILOSOPHY] LTEE e pensiero laterale
[GRAFICA/vettoriale] Operazioni di rotazione automatici JS
```

Atteso nella sezione sidebar `Folderizr`:

```text
LAVORO
  Sicurezza fisica NIS2
NIARB-FILOSOPHY
  LTEE e pensiero laterale
```

Atteso in FolderSearcher:

```text
GRAFICA
  vettoriale
    Operazioni di rotazione automatici JS
```

Filtro:

- cercando `vettoriale`, devono sparire i rami non pertinenti;
- cercando `NIS2`, devono restare solo cartelle/chat con match diretto o discendente;
- sottocartelle senza discendenti matchanti devono scomparire.

## Comandi Git Utili

Stato:

```bash
git -c safe.directory=/mnt/hgfs/DEV_VM/__PROGETTI_DIVERSI/Folderizr.2026 status --short --branch
```

Tornare alla candidate v1.1:

```bash
git switch chore/v1.1-modernization
git reset --hard v1.1.0-candidate
```

Tornare al prototipo FolderSearcher:

```bash
git switch feature/foldersearcher
git reset --hard foldersearcher-prototype
```

Confrontare modifiche successive al prototipo:

```bash
git diff foldersearcher-prototype
```

Push branch feature, se desiderato:

```bash
git push -u origin feature/foldersearcher
```

Push tag prototipo, se desiderato:

```bash
git push origin foldersearcher-prototype
```

## Vincoli Di Progetto

Da preservare:

- progetto free/open source;
- nessuna monetizzazione;
- nessun ads;
- nessuna analytics;
- nessuna telemetry;
- nessun tracking;
- nessun affiliate link;
- nessun backend;
- nessun remote logging;
- nessun remote code;
- nessun export dei contenuti ChatGPT;
- nessun endpoint privato o non documentato;
- nessun bypass di rate limit, auth, paywall o protezioni;
- nessuna modifica server-side delle conversazioni;
- organizzazione puramente locale/visuale;
- disclaimer indipendenza/OpenAI.

Disclaimer richiesto:

```text
Independent open-source browser extension. Not affiliated with, endorsed by, or sponsored by OpenAI.
```

## Decisioni Architetturali

### Pannello Detached

Scelta preferita per FolderSearcher:

- pannello standalone fuori dalla sidebar;
- meno conflitti con virtualizzazione ChatGPT;
- meno dipendenza dalla posizione delle voci originali;
- risultato apribile con link normale `/c/...`.

Fallback futuro:

- se i link standalone non funzionano in qualche caso, cercare la voce originale nella sidebar, scrollarla in vista e simulare click.

Questo fallback e piu fragile e va implementato solo se necessario.

### Ricerca Con Potatura Dei Rami

La ricerca deve:

- mostrare cartelle che matchano direttamente;
- mostrare cartelle con discendenti matchanti;
- nascondere sottocartelle senza match;
- rendere semplice trovare una chat senza rumore.

### Storage

Attuale:

- `browser.storage.local` / `chrome.storage.local`.

Usi:

- preferenza enabled;
- indice locale FolderSearcher;
- timestamp ultimo export indice.

Futuro:

- valutare IndexedDB se l'indice cresce molto;
- mantenere `storage.local` per preferenze e metadati piccoli.

## Prossimo Step Tecnico

Prima di migliorare lo scroll automatico bisogna identificare il vero container scrollabile.

Non assumere che sia `window`.

Strategia proposta:

```js
function findScrollableChatContainer() {
  const chatsList = findChatsList();
  const candidates = [];

  let node = chatsList;
  while (node && node !== document.body) {
    candidates.push(node);
    node = node.parentElement;
  }

  const chatHistory = document.querySelector('nav[aria-label="Chat history"]');
  if (chatHistory) {
    candidates.push(chatHistory);
  }

  candidates.push(document.scrollingElement);

  return candidates.find((element) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const canScroll = /(auto|scroll)/.test(style.overflowY);
    return canScroll && element.scrollHeight > element.clientHeight + 20;
  }) || null;
}
```

Poi verificare dinamicamente:

```js
const before = element.scrollTop;
element.scrollTop += 200;
await wait(100);
const moved = element.scrollTop !== before;
```

Solo un elemento che si muove davvero va usato come scroll driver.

## Scanner Avanzato Proposto

Stati:

```text
idle
scanning
waiting
saving
stopped
complete
error
```

Loop:

1. trova container scrollabile reale;
2. salva `originalScrollTop`;
3. indicizza link visibili;
4. scroll step;
5. aspetta lazy loading;
6. usa `MutationObserver` temporaneo per nuovi nodi;
7. indicizza nuovi link;
8. deduplica per `href`;
9. salva progressivamente;
10. stop se:
    - fondo stabile;
    - nessun nuovo item per N round;
    - `scrollHeight` invariato per N round;
    - stop manuale;
    - max round raggiunto.

Metriche UI:

```text
Scanning... 184 chats indexed, 7 new in last batch
```

## Projects

Non implementati nel prototipo.

Possibile v1.3:

```text
[ ] Include Projects in rescan
```

Regole:

- disattivato di default;
- solo su comando esplicito;
- indicizza solo metadati visibili:
  - project name;
  - chat title;
  - local link;
  - timestamp;
- nessun contenuto conversazione;
- nessuna modifica Project/chat.

Rischi Projects:

- DOM diverso;
- necessita apertura/visita project;
- piu lento;
- maggiore fragilita;
- potenzialmente sorprendente per l'utente.

## Rischi Attuali

- ChatGPT puo cambiare markup;
- sidebar virtualizzata/lazy-loaded;
- scroll container non ancora rilevato robustamente;
- il rescan attuale puo limitarsi alla prima lista caricata;
- Projects fuori scope;
- UI detached potrebbe coprire elementi su viewport piccoli;
- export indice va comunicato bene per evitare confusione con export conversazioni.

## Cose Da Non Fare

- Non leggere prompt/risposte;
- non scaricare conversazioni;
- non chiamare API private;
- non usare endpoint OpenAI non documentati;
- non rinominare chat automaticamente;
- non inserire tag server-side;
- non fare scansioni automatiche all'avvio;
- non inviare indice fuori dal browser;
- non aggiungere dipendenze pesanti o bundler senza motivo.

## Stato Finale Handover

La base sicura per release v1.1 e:

```text
v1.1.0-candidate
```

La base funzionante per sviluppo FolderSearcher e:

```text
foldersearcher-prototype
```

La branch attiva per continuare lo sviluppo e:

```text
feature/foldersearcher
```

Prima modifica consigliata dopo handover:

```text
implementare scroll container discovery + verification
```
