/**
 * ROOT COMPONENT — COMPONENTE RADICE DELL'APPLICAZIONE
 * ─────────────────────────────────────────────────────────────────────────────
 * App è il componente radice: il punto di partenza dell'albero dei componenti Angular.
 * Il suo template (app.html) è lo "scheletro" di tutta l'applicazione.
 *
 * SELECTOR 'app-root':
 * Angular cerca nell'HTML di index.html l'elemento <app-root> e lo sostituisce
 * con il template di questo componente. Tutto ciò che l'utente vede parte da qui.
 *
 * standalone: false:
 * Questo componente è dichiarato in AppModule (declarations: [App, ...]).
 * NON è standalone (non gestisce i propri imports nel decoratore @Component).
 * Segue l'architettura NgModule tradizionale di Angular.
 *
 * signal('Gardenia_Frontend'):
 * Il titolo dell'app è memorizzato come signal — anche se non viene letto nel template.
 * Questo è un residuo del template iniziale di Angular CLI che usa il title
 * per mostrare un messaggio di benvenuto. Qui non viene usato nel template finale
 * ma rimane come esempio di signal() nel componente radice.
 * signal() crea uno stato reattivo: se il valore cambia, ogni lettore viene notificato.
 *
 * PERCHÉ NON C'È ALTRA LOGICA:
 * Il componente radice non deve fare nulla oltre a fungere da contenitore.
 * Header, Footer e Router Outlet (in app.html) sono indipendenti e si gestiscono da soli.
 * Aggiungere logica qui renderebbe il componente radice un "god component" — anti-pattern.
 *
 * ALBERO COMPONENTI:
 * App (app-root)
 * ├── Header (app-header) — navigazione, carrello, wishlist
 * ├── RouterOutlet — renderizza il componente attivo per la route corrente
 * │   ├── HomeComponent (/home, /category/:cat/:sub)
 * │   ├── LoginComponent (/login)
 * │   ├── RegisterComponent (/register)
 * │   ├── ProductDetailsComponent (/products/:id)
 * │   ├── CarrelloComponent (/cart)
 * │   ├── PagamentoComponent (/payment)
 * │   ├── User (shell /user) → sotto-route con sidebar
 * │   │   ├── OverviewComponent (/user/overview)
 * │   │   ├── OrdersComponent (/user/orders)
 * │   │   └── ...
 * │   ├── AdminComponent (/admin)
 * │   └── AboutUsComponent (/about-us)
 * └── Footer (app-footer) — informazioni statiche
 */

import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',       // Corrisponde a <app-root> in index.html
  templateUrl: './app.html',  // Template: header + router-outlet + footer
  standalone: false,          // Dichiarato in AppModule, non standalone
  styleUrl: './app.css'
})
export class App {
  // signal() crea uno stato reattivo immutabile dall'esterno (protected = non accessibile fuori dalla classe).
  // Il valore 'Gardenia_Frontend' è il nome dell'app; non viene attualmente letto nel template.
  protected readonly title = signal('Gardenia_Frontend');
  // Non serve nient'altro per il carrello al momento! Material fa tutto il lavoro sporco.
}
