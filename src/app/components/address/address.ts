/**
 * ADDRESS COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce la lista degli indirizzi di spedizione dell'utente.
 * Permette di aggiungere, modificare ed eliminare indirizzi tramite dialoghi Material.
 *
 * PATTERN — Dialog con ritorno dati:
 * MatDialog.open() restituisce un MatDialogRef. Il metodo afterClosed() è un
 * Observable che emette il valore passato a dialogRef.close(valore) nel dialog.
 * - Se l'utente conferma → dialog.close(formData) → result = { street, city, ... }
 * - Se l'utente annulla → dialog.close(false) → result = false
 * Il componente usa questo result per decidere se chiamare il backend.
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddressService, Address } from '../../services/address.service';
import { AuthService } from '../../services/auth.service';
import { AddressDialog } from '../../dialogs/address-dialog/address-dialog';
import { DeleteAddress } from '../../dialogs/delete-address/delete-address';

@Component({
  selector: 'app-address',
  standalone: false,
  templateUrl: './address.html',
  styleUrl: './address.css',
})
export class AddressComponent implements OnInit {
  addresses: Address[] = [];
  userFirstName: string = '';
  userLastName: string = '';

  constructor(
    private addressService: AddressService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Leggiamo i dati dell'utente loggato per mostrare il nome nella pagina
    const userData = this.authService.getUserData();
    if (userData) {
      this.userFirstName = userData.firstName || '';
      this.userLastName = userData.lastName || '';
    }

    this.loadAddresses();
  }

  /**
   * Carica gli indirizzi dell'utente corrente.
   * Metodo privato perché è un'operazione interna: viene chiamato da ngOnInit
   * e dopo ogni operazione CRUD per mantenere la lista sincronizzata col backend.
   * cdr.markForCheck() forza l'aggiornamento del template.
   */
  private loadAddresses(): void {
    this.addressService.getAllAddressesByUsername().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.cdr.markForCheck();
      },
      error: (err) => console.error(err),
    });
  }

  /** Apre il dialog per creare un nuovo indirizzo (mode: 'create', address: null) */
  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddressDialog, {
      width: '500px',
      data: { address: null, mode: 'create' },
    });

    // afterClosed() emette il form value se l'utente conferma, false se annulla
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result !== false) {
        // result = { id, street, number, city, postalCode, country }
        this.addressService.addAddress(result).subscribe({
          next: () => this.loadAddresses(), // Ricarica per mostrare il nuovo indirizzo
          error: (err) => console.error('Error adding address:', err),
        });
      }
    });
  }

  /** Apre il dialog per modificare un indirizzo esistente, prepopolato con i dati correnti */
  openEditDialog(address: Address): void {
    const dialogRef = this.dialog.open(AddressDialog, {
      width: '500px',
      data: { address: address, mode: 'edit' }, // Passiamo l'indirizzo al dialog
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result !== false) {
        this.addressService.updateAddress(result).subscribe({
          next: () => this.loadAddresses(),
          error: (err) => console.error('Error updating address:', err),
        });
      }
    });
  }

  /** Apre il dialog di conferma eliminazione; elimina solo se l'utente conferma */
  openDeleteDialog(address: Address): void {
    const dialogRef = this.dialog.open(DeleteAddress, {
      width: '500px',
      data: { address: address }, // Passiamo l'indirizzo per mostrarlo nel dialog
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) { // DeleteAddress chiude con true solo se si conferma
        this.addressService.deleteAddress(address.id).subscribe({
          next: () => this.loadAddresses(),
          error: (err) => console.error('Error deleting address:', err),
        });
      }
    });
  }
}
