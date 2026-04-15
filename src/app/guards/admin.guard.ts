/**
 * ADMIN GUARD
 * ─────────────────────────────────────────────────────────────────────────────
 * CONCETTO — Route Guard:
 * Un Guard è un servizio che Angular interroga PRIMA di attivare una rotta.
 * Se canActivate() restituisce true la navigazione procede; se restituisce false
 * viene bloccata (e qui l'utente viene rimandato a /home).
 *
 * Questo guard protegge la rotta /admin verificando che l'utente loggato abbia
 * il ruolo ADMIN. Viene dichiarato nella rotta con: canActivate: [AdminGuard].
 */

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root' // Singleton: una sola istanza per tutta l'applicazione
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    // PATTERN SSR-SAFE: "typeof window !== 'undefined'" è il modo corretto per
    // verificare se si è nel browser. Durante il Server-Side Rendering (Angular Universal)
    // questo codice gira in Node.js, dove "window" non esiste. Senza questo controllo
    // si otterrebbe un ReferenceError lato server.
    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();

      // Blocca l'accesso se l'utente non è loggato oppure non ha il ruolo ADMIN
      if (!userData || userData.role !== 'ADMIN') {
        this.router.navigate(['/home']);
        return false;
      }

      return true;
    }

    // Lato server (SSR) non possiamo leggere il localStorage, quindi lasciamo passare.
    // Il controllo reale avverrà nel browser dopo l'hydration.
    return true;
  }
}
