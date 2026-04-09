import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export interface Address {
  id:number;
  country: string;
  city: string;
  postalCode: string;
  street: string;
  number:number;
}

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private baseUrl = 'http://localhost:8080/rest/address';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAllAddressesByUsername() {
    const userData = this.authService.getUserData();
    const userName = userData ? userData.id : null;
    if (!userName) {
      throw new Error('User is not logged in');
    }

    return this.http.get<Address[]>(`${this.baseUrl}/myAddresses`, { params: { userName } }).pipe(
      catchError(error => {
        console.error(`Error fetching addresses for user ${userName}:`, error);
        return throwError(() => new Error('Failed to fetch addresses by username'));
      })
    );
  }

  addAddress(address: Address) {
    return this.http.post<Address>(`${this.baseUrl}/add`, address).pipe(
      catchError(error => {
        console.error('Error adding address:', error);
        return throwError(() => new Error('Failed to add address'));
      })
    );
  }

  updateAddress(address: Address) {
    return this.http.put<Address>(`${this.baseUrl}/update`, address).pipe(
      catchError(error => {
        console.error('Error updating address:', error);
        return throwError(() => new Error('Failed to update address'));
      })
    );
  }

  deleteAddress(id: number) {
    return this.http.delete(`${this.baseUrl}/delete/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting address:', error);
        return throwError(() => new Error('Failed to delete address'));
      })
    );
  }
}
