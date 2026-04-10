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
    const userData = this.authService.getUserData();
    if (userData) {
      this.userFirstName = userData.firstName || '';
      this.userLastName = userData.lastName || '';
    }

    this.loadAddresses();
  }

  private loadAddresses(): void {
    this.addressService.getAllAddressesByUsername().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.cdr.markForCheck();
      },
      error: (err) => console.error(err),
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddressDialog, {
      width: '500px',
      data: {
        address: null,
        mode: 'create',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result !== false) {
        this.addressService.addAddress(result).subscribe({
          next: () => {
            this.loadAddresses();
          },
          error: (err) => console.error('Error adding address:', err),
        });
      }
    });
  }

  openEditDialog(address: Address): void {
    const dialogRef = this.dialog.open(AddressDialog, {
      width: '500px',
      data: {
        address: address,
        mode: 'edit',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result !== false) {
        this.addressService.updateAddress(result).subscribe({
          next: () => {
            this.loadAddresses();
          },
          error: (err) => console.error('Error updating address:', err),
        });
      }
    });
  }

  openDeleteDialog(address: Address): void {
    const dialogRef = this.dialog.open(DeleteAddress, {
      width: '500px',
      data: {
        address: address,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.addressService.deleteAddress(address.id).subscribe({
          next: () => {
            this.loadAddresses();
          },
          error: (err) => console.error('Error deleting address:', err),
        });
      }
    });
  }
}
