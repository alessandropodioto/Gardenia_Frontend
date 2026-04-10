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
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
