/**
 * USER COMPONENT — Shell dell'area utente
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente contenitore (shell) per tutte le sotto-pagine dell'area utente.
 * Il template contiene: <app-sidebar> + <router-outlet>.
 *
 * CONCETTO — Shell Pattern con rotte figlie:
 * Questo componente non ha logica propria: la sua unica funzione è fare da
 * "cornice" per la sidebar e il <router-outlet> interno. Quando si naviga a
 * /user/overview, Angular carica User come contenitore e Overview dentro il
 * suo <router-outlet>. La sidebar rimane sempre visibile mentre il contenuto
 * principale cambia con la navigazione.
 *
 * Esempio dell'albero dei componenti:
 *   App
 *   └── Header
 *   └── router-outlet (principale)
 *       └── User                    ← questa shell
 *           ├── Sidebar             ← sempre visibile nell'area utente
 *           └── router-outlet       ← figlio: mostra Overview, Orders, Address...
 *               └── Overview        ← o Orders, o Address, ecc.
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {
  // Nessuna logica: la struttura è tutta nel template (sidebar + router-outlet)
}
