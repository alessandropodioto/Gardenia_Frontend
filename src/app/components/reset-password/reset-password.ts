/**
 * RESET PASSWORD COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Permette all'utente di impostare una nuova password tramite il link ricevuto via email.
 * Raggiunto da /reset-password/:id dove ":id" è lo userName (non un token UUID).
 *
 * FLUSSO:
 *   1. L'utente clicca "Forgot password" nel Login → si apre ChangePasswordComponent
 *   2. Inserisce il proprio userName → il backend invia un'email con il link
 *   3. Il link porta a /reset-password/{userName}
 *   4. Questo componente legge lo userName dall'URL e permette di cambiare la password
 *
 * CONCETTO — route.snapshot vs route.paramMap:
 * - snapshot.paramMap.get('id'): legge il parametro una volta sola al momento del caricamento.
 *   Adatto quando il componente non deve reagire a cambiamenti successivi dell'URL.
 * - route.paramMap (Observable): emette ogni volta che i parametri cambono.
 *   Necessario quando lo stesso componente può essere riusato con ID diversi.
 * Qui usiamo snapshot perché l'utente non può cambiare la rotta senza lasciare la pagina.
 */

import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPasswordComponent implements OnInit {
  userName: string | null = null; // Letto dall'URL; null se il parametro non è presente
  newPassword = '';
  confirmPassword = '';

  // signal(): messaggio di feedback all'utente (successo o errore)
  msg = signal('');

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // snapshot.paramMap: lettura sincrona una-tantum del parametro "id" dall'URL
    // (adatto perché questo componente non viene riusato con ID diversi)
    this.userName = this.route.snapshot.paramMap.get('id');
  }

  /**
   * Valida i campi e invia la nuova password al backend.
   * Validazione manuale (non reactive form): controlla i campi vuoti e la corrispondenza.
   */
  cambiaPassword() {
    // Step 1: campi vuoti
    if (!this.newPassword || !this.confirmPassword) {
      this.msg.set('Please fill in both password fields.');
      return;
    }

    // Step 2: le due password devono coincidere
    if (this.newPassword !== this.confirmPassword) {
      this.msg.set('Passwords do not match! Please check again.');
      return;
    }

    // Step 3: invia al backend (solo se userName è presente nell'URL)
    if (this.userName) {
      const req = {
        userName: this.userName,
        newPassword: this.newPassword
      };

      this.authService.changePassword(req).subscribe({
        next: (_r: any) => {
          this.msg.set('Password changed successfully! You can now log in.');
        },
        error: (err: any) => {
          this.msg.set('Error: ' + err.message);
        }
      });
    }
  }
}
