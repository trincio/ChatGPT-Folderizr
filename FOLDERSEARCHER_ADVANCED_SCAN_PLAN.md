# FolderSearcher Advanced Scan Plan

Branch di lavoro: `feature/foldersearcher`

Milestone stabile di partenza: `foldersearcher-prototype`

## Stato Implementazione

Implementato il 2026-06-29 sul branch di lavoro:

- rilevamento del container con overflow e fallback sul range scrollabile;
- scansione progressiva con limite massimo di round;
- deduplica per `href`;
- salvataggio locale dopo ogni batch con nuove chat;
- `MutationObserver` temporaneo durante la scansione;
- pulsante `Stop scan` e conservazione dell'indice parziale;
- ripristino della posizione iniziale;
- arresto sicuro quando la pagina cambia;
- avanzamento con round, totale indicizzato e nuovi elementi.
- probe passivo esportabile con metriche numeriche di scroll, mutazioni e timing;
- finestra di quiete temporale al fondo per tollerare lazy loading variabile.

Validazione manuale Firefox sul DOM ChatGPT reale ancora necessaria.

## Obiettivo

Migliorare `Rescan chats` per indicizzare progressivamente tutta la lista chat disponibile nella sidebar, non solo il primo blocco gia caricato.

La scansione deve restare locale, esplicita e privacy-preserving:

- nessuna chiamata API;
- nessun endpoint privato;
- nessun export dei contenuti delle conversazioni;
- nessuna modifica server-side;
- solo titoli, link locali `/c/...`, percorso cartella dedotto, timestamp di indicizzazione.

## Strategia Di Scansione Sidebar

1. Individuare il container scrollabile della chat history.
2. Eseguire una lettura iniziale dei link `/c/...` gia presenti nel DOM.
3. Scorrere il container a step controllati.
4. Attendere un breve intervallo dopo ogni step per consentire il lazy loading.
5. Rileggere il DOM e aggiungere solo chat nuove.
6. Fermarsi quando la lista non cambia piu per N iterazioni consecutive o quando si raggiunge stabilmente il fondo.

## Deduplica

Chiave primaria:

```text
href /c/<conversation-id>
```

Regole:

- se una chat gia indicizzata ricompare, aggiornare titolo/path/timestamp;
- non duplicare mai item con lo stesso `href`;
- mantenere un contatore di nuovi item trovati per round;
- salvare progressivamente l'indice locale dopo ogni batch significativo.

## Rilevamento Fine Lista

Combinare piu segnali:

- `scrollTop + clientHeight >= scrollHeight - tolerance`;
- nessun nuovo `href` trovato per 2-3 round;
- `scrollHeight` invariato per 2-3 round;
- limite massimo di round come protezione.

Evitare loop infiniti se ChatGPT cambia layout o il lazy loading si blocca.

## Eventi E MutationObserver

Durante la scansione, usare un `MutationObserver` temporaneo sul container della chat history per intercettare nuovi nodi.

Approccio:

- avviare observer solo mentre `scannerRunning = true`;
- accumulare nuovi link in una queue;
- usare debounce breve prima di aggiornare indice/UI;
- disconnettere observer al termine o su stop manuale.

Lo scroll resta il driver principale; il MutationObserver serve a rendere la raccolta piu precisa e reattiva.

## Stop Manuale

Aggiungere pulsante:

```text
Stop scan
```

Comportamento:

- imposta `scannerAbortRequested = true`;
- salva l'indice parziale;
- aggiorna status con numero chat indicizzate;
- ripristina, se possibile, la posizione originale dello scroll.

## Stato UI

Mostrare durante la scansione:

- numero chat indicizzate;
- round corrente;
- nuovi item trovati nell'ultimo round;
- stato: scanning, waiting, saving, stopped, complete.

Esempio:

```text
Scanning... 184 chats indexed, 7 new in last batch
```

## Ricerca E Albero

Il filtro deve potare i rami senza match:

- una cartella resta visibile se il suo nome matcha;
- oppure se almeno una sottocartella o chat discendente matcha;
- le sottocartelle non pertinenti scompaiono;
- i risultati devono restare apribili come link standalone `/c/...`.

Percorsi:

```text
[GRAFICA/vettoriale] Operazioni JS
```

diventa:

```text
GRAFICA
  vettoriale
    Operazioni JS
```

## Navigazione Standalone

Prima scelta: link standalone nel pannello detached.

Motivo:

- meno dipendenza dalla sidebar originale;
- meno rischio di conflitto con virtualizzazione/lazy loading;
- comportamento comprensibile e reversibile.

Fallback da valutare solo se necessario:

- trovare la voce originale nella sidebar;
- portarla in vista;
- simulare click sulla voce originale.

Questo fallback e piu fragile e va tenuto come opzione successiva.

## Projects

Supporto Projects da trattare come feature separata e opzionale.

Proposta UI:

```text
[ ] Include Projects in rescan
```

Motivi per tenerlo separato:

- i Projects hanno DOM e navigazione diversi dalla sidebar Chats;
- richiedono apertura/visita dei project;
- possono essere molto piu lenti;
- rischiano di sorprendere l'utente.

Regole se implementato:

- disattivato di default;
- scansione solo su comando esplicito;
- indicizzare solo titolo chat, link locale, nome project visibile, timestamp;
- nessun contenuto conversazione;
- nessuna modifica a Project o chat.

## Backup Reminder

Dopo una scansione consistente, mostrare reminder simile a Executive Bullet:

```text
Reminder: export a local backup of the Folderizr index.
```

Trigger possibili:

- primo indice creato;
- piu di 24 ore dall'ultimo export;
- piu di N nuove chat dall'ultimo export;
- scansione completata con successo.

Export:

- JSON locale;
- solo metadati indicizzati;
- nessun contenuto conversazione.

## Rischi

- ChatGPT puo cambiare DOM, classi o virtualizzazione della sidebar.
- Lo scroll automatico puo essere interrotto da navigazione o reload.
- La lista potrebbe non caricare tutto se ChatGPT cambia strategia di lazy loading.
- Projects richiedono validazione separata.

## Sequenza Implementativa

1. Aggiungere stato cancellabile dello scanner.
2. Aggiungere `MutationObserver` temporaneo durante rescan.
3. Migliorare rilevamento fine lista con segnali multipli.
4. Salvare indice progressivamente.
5. Aggiungere `Stop scan`.
6. Testare standalone links.
7. Solo dopo, valutare Projects.
