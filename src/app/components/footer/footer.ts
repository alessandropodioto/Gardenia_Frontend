/**
 * FOOTER COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente presentazionale per il footer dell'applicazione.
 * Nessuna logica, nessun service: solo HTML/CSS statici con link, copyright, ecc.
 *
 * POSIZIONE NEL DOM:
 * Renderizzato in fondo a <app-root> (app.html), sempre visibile indipendentemente
 * dalla route corrente. È un componente "layout" permanente, come Header.
 *
 * PERCHÉ LA CLASSE È VUOTA:
 * Angular richiede sempre una classe per ogni @Component.
 * Qui non c'è logica da aggiungere: il footer non ha stato, non fa chiamate HTTP,
 * non risponde a eventi utente oltre ai normali link HTML.
 *
 * standalone: false:
 * Dichiarato in AppModule.declarations[]. Tutti i componenti dell'app usano
 * l'architettura NgModule (non standalone) per coerenza.
 *
 * PATTERN: Componente Presentazionale Puro
 * Questo è un esempio del pattern "Dumb Component" o "Presentational Component":
 * - Non ha @Input / @Output
 * - Non inietta service
 * - Mostra solo dati statici
 * - È completamente riusabile e testabile senza mock
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {

}
