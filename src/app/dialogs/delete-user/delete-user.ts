/**
 * DELETE USER DIALOG
 * ─────────────────────────────────────────────────────────────────────────────
 * Dialog di conferma per l'eliminazione di un utente (o prodotto: viene riusato).
 * Mostra i dati dell'entità da eliminare e due pulsanti: Conferma / Annulla.
 *
 * CONCETTO — Material Dialog con dati iniettati:
 * MatDialog.open(ComponentClass, { data: {...} }) apre il componente come modale.
 * Il componente aperto riceve i dati tramite l'iniezione di MAT_DIALOG_DATA:
 *   @Inject(MAT_DIALOG_DATA) public data: DeleteUserDialogData
 * È un token Angular che viene "risolto" con l'oggetto passato in { data: ... }.
 *
 * MatDialogRef permette al dialog di "comunicare" con chi lo ha aperto:
 *   dialogRef.close(true)  → chi ha chiamato open() riceve "true" in afterClosed()
 *   dialogRef.close(false) → chi ha chiamato open() riceve "false" in afterClosed()
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// Interfaccia dei dati passati al dialog al momento dell'apertura
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
    // MatDialogRef: riferimento al dialog aperto, usato per chiuderlo con un valore
    public dialogRef: MatDialogRef<DeleteUser>,
    // @Inject(MAT_DIALOG_DATA): riceve i dati passati in MatDialog.open(..., { data: ... })
    @Inject(MAT_DIALOG_DATA) public data: DeleteUserDialogData
  ) {}

  /** Chiude il dialog restituendo true → il chiamante procede con l'eliminazione */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /** Chiude il dialog restituendo false → il chiamante non fa nulla */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
