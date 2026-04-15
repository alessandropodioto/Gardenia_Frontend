/**
 * LOGIN COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce il form di accesso con validazione reattiva (Reactive Forms).
 *
 * CONCETTO — Reactive Forms (FormBuilder):
 * Angular offre due approcci per i form:
 * 1. Template-driven: logica nel template con [(ngModel)] — semplice ma meno testabile
 * 2. Reactive:       logica nel TypeScript con FormGroup/FormControl — più potente
 *
 * Con FormBuilder:
 *   fb.group({ campo: [valore_iniziale, [validatori]] })
 * si crea un FormGroup che tiene traccia di: valore, stato (valid/invalid/touched/dirty)
 * e errori di ogni campo. Il template si collega con [formGroup]="loginForm" e formControlName="...".
 *
 * FLUSSO DOPO IL LOGIN:
 *   1. setUserData() salva in localStorage e notifica il BehaviorSubject
 *   2. cartService.loadCart() carica il carrello attivo dell'utente
 *   3. router.navigate(['/home']) → l'Header si aggiorna via subscription auth state
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginData } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordComponent } from '../../dialogs/change-password/change-password';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  // FormGroup: oggetto che raggruppa i FormControl e coordina la validazione del form
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,       // Servizio helper che semplifica la creazione di FormGroup
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef, // Necessario per forzare l'aggiornamento del template dopo errori asincroni
    private dialog: MatDialog       // Servizio Material per aprire dialoghi (usato per "forgot password")
  ) {
    // Costruiamo il form nel costruttore (non in ngOnInit) per averlo disponibile subito.
    // Ogni campo: [valore_iniziale, [array_di_validatori]]
    // Validators.required = il campo non può essere vuoto
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    // Controlliamo la validità del form prima di fare la chiamata HTTP.
    // Se i campi sono vuoti, loginForm.valid è false e Angular mostra gli errori nel template.
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      // Estraiamo i valori dal FormGroup con .get('campo')?.value
      const loginData: LoginData = {
        userName: this.loginForm.get('userName')?.value,
        password: this.loginForm.get('password')?.value
      };

      // subscribe() con oggetto { next, error } è il pattern moderno (RxJS 7+)
      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          // 1. Salva in localStorage e notifica l'Header tramite BehaviorSubject
          this.authService.setUserData(response);
          // 2. Carica subito il carrello attivo per aggiornare il badge nell'header
          this.cartService.loadCart();
          // 3. Naviga alla home
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Login failed. Please try again.';
          // cdr.detectChanges() forza il template a rileggersi dopo un errore asincrono
          this.cdr.detectChanges();
          console.error('Login error:', error);
        }
      });
    }
  }

  /**
   * Apre il dialog "Forgot Password" (ChangePasswordComponent).
   * MatDialog.open() crea il componente in una modale; la larghezza è configurabile.
   */
  openForgotPwd() {
    this.dialog.open(ChangePasswordComponent, { width: '400px' });
  }

  // ── Getter per accesso rapido ai FormControl nel template ─────────────────
  // Usati nel template per mostrare errori: *ngIf="userName?.invalid && userName?.touched"
  get userName() { return this.loginForm.get('userName'); }
  get password() { return this.loginForm.get('password'); }
}
