/**
 * ADDRESS SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce le operazioni CRUD sugli indirizzi dell'utente loggato.
 *
 * NOTA sul campo "id" in userData:
 * Il backend, nella risposta al login, restituisce lo userName nel campo "id"
 * (es. { id: "mario123", role: "USER" }). Per questo motivo `userData.id` viene
 * usato ovunque come identifier dell'utente nelle chiamate API, anche se
 * semanticamente sarebbe più corretto chiamarlo userName.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

// Interfaccia che rispecchia l'AddressDTO del backend
export interface Address {
  id: number;
  country: string;
  city: string;
  postalCode: number;
  street: string;
  number: number;
}

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private baseUrl = 'http://localhost:8080/rest/address';

  // AuthService iniettato per recuperare lo userName dell'utente corrente
  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Recupera tutti gli indirizzi dell'utente loggato.
   * Lo userName viene letto da localStorage tramite AuthService (non viene
   * passato come parametro per evitare che chi chiama debba conoscerlo).
   */
  getAllAddressesByUsername() {
    const userData = this.authService.getUserData();
    // Vedi nota in testa al file: userData.id = userName nel token del backend
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

  /**
   * Aggiunge un nuovo indirizzo per l'utente loggato.
   * Lo userName viene passato come query param anziché nel body (scelta del backend).
   */
  addAddress(address: Address) {
    const userData = this.authService.getUserData();
    const userName = userData ? userData.id : null;
    if (!userName) {
      throw new Error('User is not logged in');
    }

    return this.http.post<Address>(`${this.baseUrl}/create`, address, { params: { userName } }).pipe(
      catchError(error => {
        console.error('Error adding address:', error);
        return throwError(() => new Error('Failed to add address'));
      })
    );
  }

  /** Aggiorna un indirizzo esistente (l'id è incluso nell'oggetto Address) */
  updateAddress(address: Address) {
    return this.http.put<Address>(`${this.baseUrl}/update`, address).pipe(
      catchError(error => {
        console.error('Error updating address:', error);
        return throwError(() => new Error('Failed to update address'));
      })
    );
  }

  /** Elimina un indirizzo tramite il suo id (path param: /delete/{id}) */
  deleteAddress(id: number) {
    return this.http.delete(`${this.baseUrl}/delete/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting address:', error);
        return throwError(() => new Error('Failed to delete address'));
      })
    );
  }
}
