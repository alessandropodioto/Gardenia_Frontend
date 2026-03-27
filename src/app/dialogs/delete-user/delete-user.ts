import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DeleteUserDialogData {
  user: {
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
  };
}

@Component({
  selector: 'app-delete-user',
  standalone: false,
  templateUrl: './delete-user.html',
  styleUrl: './delete-user.css',
})
export class DeleteUser {
  constructor(
    public dialogRef: MatDialogRef<DeleteUser>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteUserDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}