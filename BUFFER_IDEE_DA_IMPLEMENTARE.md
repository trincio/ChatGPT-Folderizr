# Buffer Idee Da Implementare

Questo file raccoglie idee per versioni successive a Folderizr `1.1.0`.

## v1.2 - Indice Locale E Navigazione Cartelle

Obiettivo: aggiungere una funzione opzionale di indicizzazione locale delle chat visibili, attivata esplicitamente dall'utente.

### Rescan Chats

- Aggiungere un pulsante `Rescan chats`.
- Avviare la scansione solo su azione esplicita dell'utente.
- Scorrere progressivamente la lista chat visibile, attendendo il caricamento dei nuovi elementi.
- Prevedere uno stop manuale.
- Evitare chiamate API, endpoint privati, esportazioni o scraping dei contenuti delle conversazioni.
- Indicizzare solo metadati visibili nella UI: titolo, URL locale della chat e data se visibile.

### Archiviazione Locale

- Salvare l'indice solo localmente.
- Valutare `indexedDB` per un indice strutturato e più grande.
- Usare `browser.storage.local` solo per preferenze o piccoli dataset.
- Non trasmettere dati a server remoti.
- Non aggiungere analytics, telemetry, ads, tracking o backend.

### Cartelle Dedotte Dai Titoli

Interpretare i prefissi tra parentesi quadre come percorso cartella.

Esempio:

```text
[GRAFICA/vettoriale] Operazioni di rotazione automatici JS
```

Dovrebbe produrre:

```text
Folderizr
  GRAFICA
    vettoriale
      Operazioni di rotazione automatici JS
```

Regole da valutare:

- Separatore cartelle: `/`.
- Trim degli spazi intorno ai segmenti.
- Normalizzazione opzionale del case solo nella UI, senza rinominare la chat.
- Titolo originale ChatGPT mai modificato dall'estensione.

### Navigatore Ad Albero

- Mostrare un navigatore locale ad albero.
- Aggiungere ricerca testuale sui titoli indicizzati.
- Filtrare per cartella, sottocartella e tag dedotti.
- Consentire apertura della chat tramite il link locale `/c/...`.
- Mantenere chiaro che l'indice puo essere incompleto finche non viene eseguito un rescan.

## v1.3 - Projects

Obiettivo possibile: includere anche le chat interne ai Projects.

Questa funzione va tenuta separata perche e piu fragile:

- richiede di aprire o visitare i Projects;
- dipende da una UI diversa dalla normale sidebar Chats;
- puo essere piu lenta;
- rischia di sorprendere l'utente se non e chiaramente opzionale.

Proposta:

```text
[ ] Include Projects in rescan
```

Regole:

- Funzione disattivata di default.
- Scansione solo su comando esplicito.
- Salvare solo titoli, URL e project di appartenenza se visibili.
- Non leggere contenuti delle conversazioni.
- Non modificare Project o chat server-side.

## Tag

Distinguere tre casi:

- Tag dedotti dal titolo: consigliati, es. `[GRAFICA/vettoriale]`.
- Tag locali aggiunti dall'estensione: possibili, ma solo in storage locale.
- Tag o rinomina automatica dentro ChatGPT: da evitare.

## Criteri Di Sicurezza E Privacy

- Nessuna monetizzazione.
- Nessuna raccolta dati.
- Nessuna trasmissione dati.
- Nessuna scansione automatica all'avvio.
- Nessun endpoint privato o non documentato.
- Nessun bypass di limiti, autenticazione o protezioni.
- Nessuna modifica server-side dei dati ChatGPT.
- Tutte le funzioni avanzate devono essere locali, esplicite e disattivabili.
