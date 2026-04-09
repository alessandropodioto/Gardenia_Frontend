import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AddressService, Address } from '../../services/address.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-address',
  standalone: false,
  templateUrl: './address.html',
  styleUrl: './address.css',
})
export class AddressComponent implements OnInit {
  addresses: Address[] = [];

  constructor(
    private addressService: AddressService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.addressService.getAllAddressesByUsername().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.cdr.markForCheck();
      },
      error: (err) => console.error(err),
    });
  }
}
