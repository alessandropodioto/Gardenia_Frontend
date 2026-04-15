/**
 * REGISTER COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce la registrazione di un nuovo utente con validazione del form.
 * Include un validatore personalizzato cross-field (confronto password).
 *
 * CONCETTO — Validatore cross-field:
 * I validatori standard di Angular (required, email, minLength...) lavorano su
 * un singolo controllo. A volte si deve confrontare DUE campi (es. password vs
 * conferma password). In quel caso si crea un validatore di gruppo che riceve
 * l'intero FormGroup e può leggere qualsiasi controllo.
 * Si passa come secondo argomento a fb.group(): fb.group({...}, { validators: fn })
 *
 * FLUSSO POST-REGISTRAZIONE:
 * Il backend invia un'email di convalida. L'utente deve cliccare il link
 * (che porta a /emailValidation/:id) prima di poter fare login.
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterData } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      userName:        ['', [Validators.required]],
      firstName:       ['', [Validators.required]],
      lastName:        ['', [Validators.required]],
      phone:           ['', [Validators.required]],
      email:           ['', [Validators.required, Validators.email]], // Validators.email verifica il formato
      password:        ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    }, {
      // Validatore cross-field applicato all'intero FormGroup (secondo argomento)
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // confirmPassword non viene inviato al backend (non fa parte di RegisterData)
      const registerData: RegisterData = {
        userName:  this.registerForm.get('userName')?.value,
        firstName: this.registerForm.get('firstName')?.value,
        lastName:  this.registerForm.get('lastName')?.value,
        phone:     this.registerForm.get('phone')?.value,
        email:     this.registerForm.get('email')?.value,
        password:  this.registerForm.get('password')?.value
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Il backend risponde con { msg: "rest_created" } in caso di successo
          if (response.msg === 'rest_created') {
            this.successMessage = 'Registration successful! Redirecting to login...';
            // Reindirizza dopo 2 secondi per dare tempo di leggere il messaggio
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            // Il backend può restituire messaggi di errore specifici (es. username già in uso)
            this.errorMessage = response.msg || 'Registration failed';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Registration failed. Please try again.';
          this.cdr.detectChanges();
          console.error('Registration error:', error);
        }
      });
    }
  }

  /**
   * Validatore personalizzato cross-field per la corrispondenza delle password.
   * Riceve il FormGroup intero (non un singolo controllo).
   * Se le password non coincidono, imposta l'errore "passwordMismatch" sul campo
   * confirmPassword; se coincidono rimuove l'errore (setErrors(null)).
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      // setErrors() aggiunge un errore custom leggibile nel template con:
      // *ngIf="confirmPassword?.hasError('passwordMismatch')"
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null); // Rimuove tutti gli errori di validazione
    }
  }

  // ── Getter per accesso rapido ai FormControl nel template ─────────────────
  get userName()        { return this.registerForm.get('userName'); }
  get firstName()       { return this.registerForm.get('firstName'); }
  get lastName()        { return this.registerForm.get('lastName'); }
  get phone()           { return this.registerForm.get('phone'); }
  get email()           { return this.registerForm.get('email'); }
  get password()        { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
