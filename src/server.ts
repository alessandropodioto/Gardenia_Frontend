/**
 * SERVER EXPRESS PER IL SSR (Server-Side Rendering)
 * ─────────────────────────────────────────────────────────────────────────────
 * Questo file è il server Node.js che fa girare l'app Angular lato server.
 * Viene usato in produzione (o con `ng serve` in modalità SSR).
 *
 * COME FUNZIONA:
 * 1. Le richieste per file statici (JS, CSS, immagini) vengono servite direttamente
 *    dalla cartella /browser senza passare da Angular.
 * 2. Tutte le altre richieste (pagine HTML) vengono gestite da Angular che
 *    pre-renderizza la pagina lato server e la invia al browser già pronta.
 *
 * isMainModule(): true se il file viene eseguito direttamente con Node.
 * process.env['pm_id']: presente quando il server è avviato con PM2 (tool di produzione).
 * In entrambi i casi si avvia il server sulla porta 4000 (o quella in PORT).
 *
 * reqHandler: esportato per Angular CLI, che lo usa durante lo sviluppo con SSR.
 */

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

// Percorso alla cartella con i file compilati del browser
const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

// Motore Angular per il rendering lato server
const angularApp = new AngularNodeAppEngine();

/**
 * Serve i file statici dalla cartella /browser (JS, CSS, immagini).
 * maxAge: '1y' = cache di 1 anno (sicuro perché i file hanno un hash nel nome).
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,    // Non cercare index.html nelle directory
    redirect: false,
  }),
);

/**
 * Tutte le altre richieste vengono passate ad Angular, che renderizza la pagina.
 * Se Angular non trova una route corrispondente, chiama next() (pagina non trovata).
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Avvia il server HTTP se questo file è il punto di ingresso principale.
 * La porta viene letta dalla variabile d'ambiente PORT, default 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Handler usato da Angular CLI in sviluppo e da ambienti serverless (es. Firebase).
 */
export const reqHandler = createNodeRequestHandler(app);
