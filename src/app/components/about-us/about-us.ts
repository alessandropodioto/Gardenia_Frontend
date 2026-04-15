/**
 * ABOUT US COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente puramente presentazionale: nessuna logica, nessun service, nessun dato dinamico.
 * Il template (about-us.html) contiene solo HTML/CSS statici con informazioni sull'azienda.
 *
 * PERCHÉ LA CLASSE È VUOTA:
 * Angular richiede sempre una classe per ogni @Component, anche se non ha logica.
 * Il decoratore @Component collega il selector, il template e il CSS:
 * - selector: 'app-about-us' → come si usa in altri template (es. nel router)
 * - templateUrl: il file HTML con il contenuto statico
 * - styleUrl: il CSS specifico per questo componente (incapsulato, non globale)
 *
 * standalone: false:
 * Dichiarato in AppModule.declarations[] insieme agli altri componenti.
 * Non è standalone (non gestisce i propri import nel decoratore).
 *
 * ROUTE:
 * Raggiungibile tramite /about-us (definito in app-routing-module.ts).
 * Non ha canActivate: è una pagina pubblica accessibile a tutti.
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-about-us',
  standalone: false,
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {}
