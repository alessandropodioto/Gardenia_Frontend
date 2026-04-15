/**
 * RENDER MODE — COME ANGULAR GESTISCE OGNI ROUTE SUL SERVER
 * ─────────────────────────────────────────────────────────────────────────────
 * Questo file dice ad Angular SSR come trattare ogni pagina:
 *
 * RenderMode.Prerender → il server pre-genera l'HTML della pagina durante la build.
 *   Vantaggio: il browser riceve subito una pagina già pronta (ottimo per SEO).
 *   Usato per: home, prodotti, login, ecc. — pagine pubbliche senza autenticazione.
 *
 * RenderMode.Client → il server invia solo un HTML vuoto, tutto è fatto dal browser.
 *   Usato per: /user e /user/** — pagine che richiedono che l'utente sia loggato.
 *   Il server non ha accesso al token JWT dell'utente (è nel localStorage del browser),
 *   quindi non può fare le chiamate API necessarie.
 *
 * L'ordine conta: Angular usa la prima regola che corrisponde all'URL.
 * /user e /user/** devono stare PRIMA di '**' (che cattura tutto il resto).
 */

import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'user',        // La route /user
    renderMode: RenderMode.Client
  },
  {
    path: 'user/**',     // Tutte le sotto-route: /user/overview, /user/orders, ecc.
    renderMode: RenderMode.Client
  },
  {
    path: '**',          // Tutte le altre pagine → pre-renderizzate lato server
    renderMode: RenderMode.Prerender
  }
];
