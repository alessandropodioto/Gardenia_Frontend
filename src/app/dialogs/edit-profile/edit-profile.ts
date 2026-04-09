import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';

export interface EditProfileDialogData {
  userName: string;
  email: string;
  phone: string;
}

function passwordSectionValidator(form: FormGroup) {
  const newPwd = form.get('password')?.value;
  const confirmPwd = form.get('confirmPassword')?.value;
  const currentPwd = form.get('currentPassword')?.value;

  // Se si vuole cambiare password, currentPassword è obbligatoria
  if (newPwd && !currentPwd) {
    form.get('currentPassword')?.setErrors({ required: true });
  } else if (!newPwd && form.get('currentPassword')?.hasError('required')) {
    form.get('currentPassword')?.setErrors(null);
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
  showCurrentPassword = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<EditProfile>,
    @Inject(MAT_DIALOG_DATA) public data: EditProfileDialogData
  ) {
    this.form = this.fb.group(
      {
        email: [data.email, [Validators.required, Validators.email]],
        phone: [data.phone, [Validators.required]],
        currentPassword: [''],
        password: [''],
        confirmPassword: [''],
      },
      { validators: passwordSectionValidator }
    );
  }

  ngOnInit(): void {}

  get isChangingPassword(): boolean {
    return !!this.form.get('password')?.value;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    if (this.isChangingPassword) {
      // Prima verifica la password corrente tramite login
      this.authService.login({
        userName: this.data.userName,
        password: this.form.value.currentPassword,
      }).subscribe({
        next: () => this.doUpdate(),
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Current password is incorrect.';
          this.form.get('currentPassword')?.setErrors({ wrong: true });
          this.cdr.detectChanges();
        },
      });
    } else {
      this.doUpdate();
    }
  }

  private doUpdate(): void {
    const payload: any = {
      userName: this.data.userName,
      email: this.form.value.email,
      phone: this.form.value.phone,
    };

    if (this.form.value.password) {
      payload.password = this.form.value.password;
    }

    this.authService.updateUser(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully!';
        this.cdr.detectChanges();
        setTimeout(() => this.dialogRef.close(true), 1200);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Update failed. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get email() { return this.form.get('email'); }
  get phone() { return this.form.get('phone'); }
  get currentPassword() { return this.form.get('currentPassword'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  toggleVisibility(field: 'current' | 'new' | 'confirm'): void {
  if (field === 'current') this.showCurrentPassword = !this.showCurrentPassword;
  if (field === 'new') this.showPassword = !this.showPassword;
  if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
}
}
