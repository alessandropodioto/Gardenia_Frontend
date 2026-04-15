/**
 * ADMIN SIDEBAR COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Barra laterale della dashboard admin. Permette di cambiare la sezione
 * visualizzata (Utenti / Prodotti / Ordini).
 *
 * CONCETTO — Comunicazione figlio → genitore con @Output / EventEmitter:
 * In Angular la comunicazione va in due direzioni:
 *   - Genitore → Figlio: tramite @Input (il genitore passa dati al figlio)
 *   - Figlio → Genitore: tramite @Output + EventEmitter (il figlio notifica il genitore)
 *
 * Qui AdminSidebar è il figlio, Admin è il genitore.
 * Quando l'utente clicca su una voce del menu:
 *   1. switchView() aggiorna activeView localmente (per evidenziare la voce attiva)
 *   2. viewChange.emit(view) invia il valore al genitore
 *   3. Il genitore (Admin) ha nel template: (viewChange)="onViewChange($event)"
 *      e riceve il valore in onViewChange() per caricare i dati della sezione scelta
 *
 * NOTA — standalone: true (stesso pattern di Sidebar)
 */

import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,   // Importato direttamente in AppModule.imports (non in declarations)
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css'
})
export class AdminSidebar {
  // @Output(): espone un EventEmitter che il componente genitore può ascoltare
  // con la sintassi: <app-admin-sidebar (viewChange)="onViewChange($event)">
  @Output() viewChange = new EventEmitter<string>();

  // Traccia quale voce del menu è attiva (per stilizzarla nel template)
  activeView: string = 'users';

  /**
   * Aggiorna la sezione attiva e notifica il genitore.
   * Il genitore (Admin) riceverà il valore "view" e caricherà i dati corrispondenti.
   */
  switchView(view: string): void {
    this.activeView = view;
    this.viewChange.emit(view); // Emette l'evento verso il componente Admin genitore
  }
}
