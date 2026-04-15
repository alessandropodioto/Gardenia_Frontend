/**
 * EDIT PROFILE DIALOG
 * ─────────────────────────────────────────────────────────────────────────────
 * Dialog per modificare email, telefono e opzionalmente la password dell'utente.
 *
 * LOGICA DI CAMBIO PASSWORD:
 * Il campo password è opzionale. Se l'utente lo compila:
 *   1. Si verifica la password corrente tramite una chiamata login() al backend
 *      (soluzione pragmatica: non c'è un endpoint dedicato "verify password")
 *   2. Solo se la verifica va a buon fine, si procede con l'aggiornamento
 * Se l'utente NON compila password, si aggiorna solo email/telefono.
 *
 * VALIDATORE CROSS-FIELD (passwordSectionValidator):
 * Funzione esterna al componente (non un metodo) per essere passata come
 * secondo argomento a fb.group({...}, { validators: fn }).
 * Controlla che: se si inserisce la nuova password, anche currentPassword sia presente;
 * e che newPassword === confirmPassword.
 */

import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';

export interface EditProfileDialogData {
  userName: string;
  email: string;
  phone: string;
}

/**
 * Validatore cross-field: viene chiamato ogni volta che cambia qualsiasi campo del form.
 * Riceve l'intero FormGroup e può accedere a qualsiasi controllo con form.get('campo').
 */
function passwordSectionValidator(form: FormGroup) {
  const newPwd = form.get('password')?.value;
  const confirmPwd = form.get('confirmPassword')?.value;
  const currentPwd = form.get('currentPassword')?.value;

  // Se l'utente sta inserendo una nuova password, la password corrente è obbligatoria
  if (newPwd && !currentPwd) {
    form.get('currentPassword')?.setErrors({ required: true });
  } else if (!newPwd && form.get('currentPassword')?.hasError('required')) {
    form.get('currentPassword')?.setErrors(null); // Rimuove l'errore se non si sta cambiando password
  }

  // Le due nuove password devono coincidere
  if (newPwd && newPwd !== confirmPwd) {
    form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
  } else if (form.get('confirmPassword')?.hasError('passwordMismatch')) {
    form.get('confirmPassword')?.setErrors(null);
  }
}

@Component({
  selector: 'app-edit-profile',
  standalone: false,
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile implements OnInit {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Flag per mostrare/nascondere le password (toggle visibilità campo input)
  showCurrentPassword = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<EditProfile>,
    // @Inject(MAT_DIALOG_DATA): riceve { userName, email, phone } da Overview.openEditDialog()
    @Inject(MAT_DIALOG_DATA) public data: EditProfileDialogData
  ) {
    // I campi email e phone sono prepopolati con i dati attuali.
    // I campi password iniziano vuoti (opzionali).
    this.form = this.fb.group(
      {
        email:           [data.email, [Validators.required, Validators.email]],
        phone:           [data.phone, [Validators.required]],
        currentPassword: [''], // Obbligatorio solo se si compila "password" (validatore cross-field)
        password:        [''],
        confirmPassword: [''],
      },
      { validators: passwordSectionValidator } // Validatore applicato all'intero form
    );
  }

  ngOnInit(): void {}

  /** Getter: true se l'utente ha iniziato a compilare il campo nuova password */
  get isChangingPassword(): boolean {
    return !!this.form.get('password')?.value; // !! converte stringa non vuota in true
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    if (this.isChangingPassword) {
      // Prima verifichiamo la password corrente: usiamo il login come "verifica"
      // (nessun endpoint dedicato nel backend per questo scopo)
      this.authService.login({
        userName: this.data.userName,
        password: this.form.value.currentPassword,
      }).subscribe({
        next: () => this.doUpdate(),          // Verifica ok: procede con l'update
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Current password is incorrect.';
          this.form.get('currentPassword')?.setErrors({ wrong: true }); // Errore custom sul campo
          this.cdr.detectChanges();
        },
      });
    } else {
      // Nessun cambio password: aggiorna solo email e telefono
      this.doUpdate();
    }
  }

  /** Esegue effettivamente la chiamata di aggiornamento al backend */
  private doUpdate(): void {
    const payload: any = {
      userName: this.data.userName,
      email: this.form.value.email,
      phone: this.form.value.phone,
    };

    // Aggiunge la nuova password al payload solo se è stata compilata
    if (this.form.value.password) {
      payload.password = this.form.value.password;
    }

    this.authService.updateUser(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully!';
        this.cdr.detectChanges();
        // Chiude il dialog dopo 1.2s con "true" → Overview riceve true in afterClosed()
        // e ricarica il profilo dal backend
        setTimeout(() => this.dialogRef.close(true), 1200);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Update failed. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  /** Chiude il dialog senza salvare → Overview riceve false e non ricarica il profilo */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  // ── Getter per i FormControl ────────────────────────────────────────────
  get email()           { return this.form.get('email'); }
  get phone()           { return this.form.get('phone'); }
  get currentPassword() { return this.form.get('currentPassword'); }
  get password()        { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  /** Toggle visibilità per i campi password (tipo text/password) */
  toggleVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') this.showCurrentPassword = !this.showCurrentPassword;
    if (field === 'new')     this.showPassword = !this.showPassword;
    if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }
}
