/**
 * ADDRESS DIALOG
 * ─────────────────────────────────────────────────────────────────────────────
 * Dialog riusabile per creare o modificare un indirizzo.
 * La modalità (create/edit) viene passata via MAT_DIALOG_DATA.
 * In modalità "edit" il form viene prepopolato con i dati dell'indirizzo esistente.
 *
 * PATTERN — Dialog con form:
 * Al click di "Conferma", se il form è valido, il dialog si chiude passando
 * il form value a chi ha aperto il dialog (AddressComponent).
 * AddressComponent riceve i dati in afterClosed() e chiama il service appropriato.
 * Separazione netta: il dialog gestisce SOLO l'input utente, non le chiamate HTTP.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Address } from '../../services/address.service';

export interface AddressDialogData {
  address: Address | null; // null = modalità creazione; oggetto = modalità modifica
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

    // Se siamo in modalità edit, i campi vengono prepopolati con i valori esistenti.
    // data.address?.id || 0: l'operatore ?. evita errori se address è null (modalità create)
    this.addressForm = this.fb.group({
      id:         [data.address?.id || 0],
      street:     [data.address?.street || '',   [Validators.required, Validators.minLength(3)]],
      number:     [data.address?.number || 0,    [Validators.required, Validators.min(1)]],
      city:       [data.address?.city || '',     [Validators.required, Validators.minLength(2)]],
      postalCode: [data.address?.postalCode || '',[Validators.required, Validators.minLength(3)]],
      country:    [data.address?.country || '',  [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {}

  // ── Getter per i FormControl (usati nel template per mostrare errori) ─────
  get street()     { return this.addressForm.get('street'); }
  get number()     { return this.addressForm.get('number'); }
  get city()       { return this.addressForm.get('city'); }
  get postalCode() { return this.addressForm.get('postalCode'); }
  get country()    { return this.addressForm.get('country'); }

  /**
   * Chiude il dialog passando il valore del form ad AddressComponent.
   * addressForm.value = { id, street, number, city, postalCode, country }
   * Se il form non è valido, Angular mostrerà i messaggi di errore nel template.
   */
  onConfirm(): void {
    if (this.addressForm.valid) {
      this.dialogRef.close(this.addressForm.value);
    }
  }

  /** Chiude il dialog senza passare dati → AddressComponent non farà nulla */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
