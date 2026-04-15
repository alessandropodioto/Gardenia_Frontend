/**
 * USERORDER SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce le chiamate HTTP per gli ordini utente.
 * Usato sia dalla pagina "I miei ordini" (utente) che dalla dashboard admin.
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

// Interfaccia che rispecchia l'OrderDTO del backend.
// I campi opzionali (?) possono non essere presenti in tutte le risposte.
export interface UserOrder {
  id?: number;
  wharehouse: string;         // Nota: typo "wharehouse" ereditato dal backend (corretto: warehouse)
  isPaid: boolean;
  userId?: string;            // Lo userName dell'utente (il backend lo chiama userId)
  addressId?: number;
  statusDescription: string;  // Es. "PAID", "SHIPPED", "DELIVERED"
  date: string;               // Formato YYYY-MM-DD
  totalPrice?: number;
  items?: any[];              // Lista prodotti nell'ordine (popolata da getById)
}

@Injectable({
  providedIn: 'root',
})
export class UserorderService {
  private apiUrl = 'http://localhost:8080/rest/order';

  constructor(private http: HttpClient) {}

  /** Crea un nuovo ordine (chiamato da PagamentoComponent al completamento acquisto) */
  create(order: UserOrder): Observable<UserOrder> {
    return this.http.post<UserOrder>(`${this.apiUrl}/create`, order).pipe(
      catchError((error) => {
        console.error('Error creating order:', error);
        return throwError(() => new Error('Failed to create order'));
      }),
    );
  }

  /** Aggiorna un ordine esistente (usato dall'admin per cambiare lo stato) */
  update(order: UserOrder): Observable<UserOrder> {
    return this.http.put<UserOrder>(`${this.apiUrl}/update`, order).pipe(
      catchError((error) => {
        console.error('Error updating order:', error);
        return throwError(() => new Error('Failed to update order'));
      }),
    );
  }

  /**
   * Recupera la lista degli ordini di un utente specifico.
   * Usata dalla pagina "I miei ordini" (OrdersComponent).
   * HttpParams costruisce il query param: /listByUser?userName=...
   */
  getOrdersByUser(userName: string): Observable<UserOrder[]> {
    const params = new HttpParams().set('userName', userName);
    return this.http.get<UserOrder[]>(`${this.apiUrl}/listByUser`, { params }).pipe(
      catchError((error) => {
        console.error(`Error fetching orders for user ${userName}:`, error);
        return throwError(() => new Error('Failed to fetch orders by user'));
      }),
    );
  }

  /**
   * Recupera il dettaglio completo di un singolo ordine, inclusa la lista dei
   * prodotti acquistati (campo "items"). Il mapping viene fatto lato backend.
   * Usato da OrderDetail.
   */
  getById(id: number): Observable<UserOrder> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<UserOrder>(`${this.apiUrl}/getById`, { params }).pipe(
      catchError((error) => {
        console.error(`Errore recupero ordine ${id}:`, error);
        return throwError(() => new Error('Dettagli ordine non trovati'));
      }),
    );
  }

  /** Recupera tutti gli ordini (usato solo dalla dashboard admin) */
  list(): Observable<UserOrder[]> {
    return this.http.get<UserOrder[]>(`${this.apiUrl}/list`).pipe(
      catchError((error) => {
        console.error('Error fetching all orders:', error);
        return throwError(() => new Error('Failed to fetch all orders'));
      }),
    );
  }
}
