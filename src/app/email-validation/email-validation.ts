/**
 * EMAIL VALIDATION COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Permette all'utente di convalidare il proprio account usando il token
 * ricevuto via email dopo la registrazione. Raggiunto da /emailValidation/:id.
 *
 * Il componente non convalida automaticamente all'apertura: mostra un pulsante
 * che l'utente deve cliccare. Questo pattern evita convalide accidentali se
 * il link viene aperto da bot/scanner di email.
 */

import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-email-validation',
  standalone: false,
  templateUrl: './email-validation.html',
  styleUrls: ['./email-validation.css']
})
export class EmailValidationComponent implements OnInit {
  id: string | null = null;  // Token/ID ricevuto dall'URL (generato dal backend)

  // signal(): aggiorna il template automaticamente quando cambia il messaggio
  msg = signal('');

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.msg.set('');
    // Legge il token dall'URL con snapshot (lettura una-tantum, sufficiente per questa pagina)
    this.id = this.route.snapshot.paramMap.get('id');
  }

  /**
   * Chiama il backend per convalidare l'email.
   * Se riesce, l'account diventa attivo e l'utente può fare login.
   */
  validate() {
    if (this.id) {
      this.authService.validateEmail(this.id).subscribe({
        next: (_r: any) => {
          this.msg.set('Email successfully validated! You can now log in.');
        },
        error: (err: any) => {
          this.msg.set('Validation error: ' + err.message);
        }
      });
    }
  }
}
