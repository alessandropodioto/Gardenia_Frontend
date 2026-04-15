/**
 * SIDEBAR COMPONENT (area utente)
 * ─────────────────────────────────────────────────────────────────────────────
 * Barra laterale dell'area utente (/user/*). Mostra i link di navigazione e
 * il nome dell'utente loggato. Gestisce anche il logout.
 *
 * NOTA — standalone: true:
 * Questo componente è "standalone": non appartiene ad AppModule.declarations ma
 * si importa direttamente nei moduli che lo usano (in AppModule.imports: [Sidebar]).
 * I componenti standalone importano le loro dipendenze direttamente nel decoratore.
 * RouterModule viene importato qui per usare routerLink e routerLinkActive nel template.
 */

import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,               // Componente standalone: gestisce le proprie dipendenze
  imports: [RouterModule],        // Necessario per routerLink e routerLinkActive nel template
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  userName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Leggiamo lo username qui nel costruttore (sincrono) invece che in ngOnInit
    // perché non implementiamo OnInit e il valore è disponibile immediatamente da localStorage.
    // userData.id = userName (vedi nota in auth.service.ts)
    const userData = this.authService.getUserData();
    this.userName = userData?.id ?? 'User'; // '?? "User"' = fallback se userData è null
  }

  /** Esegue il logout e reindirizza alla home */
  logout(): void {
    this.authService.logout(); // Cancella localStorage + notifica BehaviorSubject
    this.router.navigate(['/home']);
  }
}
