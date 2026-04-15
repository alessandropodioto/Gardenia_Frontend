/**
 * CHANGE PASSWORD DIALOG
 * ─────────────────────────────────────────────────────────────────────────────
 * Dialog "Forgot Password": l'utente inserisce il proprio userName e il backend
 * invia un'email con il link per reimpostare la password.
 * Aperto da LoginComponent al click di "Forgot password?".
 *
 * DIFFERENZA CON ResetPasswordComponent:
 * - Questo dialog → l'utente NON sa la password attuale → chiede di inviare un'email
 * - ResetPasswordComponent → l'utente arriva dal link email → inserisce la nuova password
 * - EditProfile dialog → l'utente è loggato → può cambiare password verificando quella corrente
 */

import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css']
})
export class ChangePasswordComponent {
  userName: string = ''; // Input dell'utente: il proprio username
  msg: string = '';      // Messaggio di feedback (successo o errore)

  constructor(
    // MatDialogRef senza dati iniettati: questo dialog non riceve nulla dal chiamante
    public dialogRef: MatDialogRef<ChangePasswordComponent>,
    private authService: AuthService
  ) {}

  /**
   * Invia la richiesta di reset password al backend.
   * Il backend trova l'utente per userName e invia l'email con il link.
   */
  inviaRichiesta() {
    if (this.userName) {
      this.authService.requestPasswordReset(this.userName).subscribe({
        next: (_r: any) => {
          this.msg = 'Email sent! Check your inbox.';
        },
        error: (err: any) => {
          this.msg = 'Error: ' + err.message;
        }
      });
    }
  }

  /** Chiude il dialog senza restituire dati (l'utente non ha bisogno di un risultato) */
  close() {
    this.dialogRef.close();
  }
}
