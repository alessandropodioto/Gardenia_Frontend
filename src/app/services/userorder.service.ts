import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

export interface UserOrder {
  id?: number;
  wharehouse: string;
  isPaid: boolean;
  userName?: string;
  addressId?: number;
  statusDescription?: string;
  date: string;
  totalPrice?: number;
  items?: any[];
}

@Injectable({
  providedIn: 'root',
})
export class UserorderService {
  private apiUrl = 'http://localhost:8080/rest/order';

  constructor(private http: HttpClient) {}

  /**
   * Crea un nuovo ordine
   */
  create(order: UserOrder): Observable<UserOrder> {
    return this.http.post<UserOrder>(`${this.apiUrl}/create`, order).pipe(
      catchError((error) => {
        console.error('Error creating order:', error);
        return throwError(() => new Error('Failed to create order'));
      }),
    );
  }

  /**
   * Aggiorna uno stato o un ordine esistente
   */
  update(order: UserOrder): Observable<UserOrder> {
    return this.http.put<UserOrder>(`${this.apiUrl}/update`, order).pipe(
      catchError((error) => {
        console.error('Error updating order:', error);
        return throwError(() => new Error('Failed to update order'));
      }),
    );
  }

  /**
   * Recupera la lista ordini di un utente (usata in My Orders)
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
   * Recupera il dettaglio completo di un ordine (usata in Order Detail)
   * Include la lista dei prodotti grazie al mapping fatto nel Backend
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
}