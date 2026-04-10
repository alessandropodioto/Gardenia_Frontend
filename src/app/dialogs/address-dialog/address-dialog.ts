import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Address } from '../../services/address.service';

export interface AddressDialogData {
  address: Address | null;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-address-dialog',
  standalone: false,
  templateUrl: './address-dialog.html',
  styleUrl: './address-dialog.css',
})
export class AddressDialog implements OnInit {
  addressForm: FormGroup;
  mode: 'create' | 'edit';
  isEditMode: boolean;

  constructor(
    public dialogRef: MatDialogRef<AddressDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AddressDialogData,
    private fb: FormBuilder
  ) {
    this.mode = data.mode;
    this.isEditMode = data.mode === 'edit';

    this.addressForm = this.fb.group({
      id: [data.address?.id || 0],
      street: [data.address?.street || '', [Validators.required, Validators.minLength(3)]],
      number: [data.address?.number || 0, [Validators.required, Validators.min(1)]],
      city: [data.address?.city || '', [Validators.required, Validators.minLength(2)]],
      postalCode: [data.address?.postalCode || '', [Validators.required, Validators.minLength(3)]],
      country: [data.address?.country || '', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {}

  get street() {
    return this.addressForm.get('street');
  }

  get number() {
    return this.addressForm.get('number');
  }

  get city() {
    return this.addressForm.get('city');
  }

  get postalCode() {
    return this.addressForm.get('postalCode');
  }

  get country() {
    return this.addressForm.get('country');
  }

  onConfirm(): void {
    if (this.addressForm.valid) {
      this.dialogRef.close(this.addressForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
