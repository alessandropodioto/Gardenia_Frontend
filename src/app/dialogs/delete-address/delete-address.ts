/**
 * DELETE ADDRESS DIALOG
 * ─────────────────────────────────────────────────────────────────────────────
 * Dialog di conferma per l'eliminazione di un indirizzo.
 * Stesso pattern di DeleteUser: riceve i dati via MAT_DIALOG_DATA e restituisce
 * true (conferma) o false (annulla) tramite MatDialogRef.close().
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DeleteAddressDialogData {
  address: {
    id: number;
    street: string;
    number: number;
    city: string;
    postalCode: string;
    country: string;
  };
}

@Component({
  selector: 'app-delete-address',
  standalone: false,
  templateUrl: './delete-address.html',
  styleUrl: './delete-address.css',
})
export class DeleteAddress {
  constructor(
    public dialogRef: MatDialogRef<DeleteAddress>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteAddressDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true); // Segnala ad AddressComponent di procedere con la DELETE
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
