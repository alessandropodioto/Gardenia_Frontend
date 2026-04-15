/**
 * SHOPPINGCART SERVICE (legacy)
 * ─────────────────────────────────────────────────────────────────────────────
 * Servizio alternativo per il carrello, con un approccio più "classico" rispetto
 * a CartService (che usa signal()).
 *
 * DIFFERENZA CON CartService:
 * - CartService usa signal() per lo stato reattivo → aggiorna automaticamente il DOM
 * - ShoppingcartService è un semplice wrapper HTTP senza stato locale
 *
 * Attualmente CartService è il servizio principale usato dai componenti. Questo
 * servizio potrebbe essere usato in scenari dove serve solo la chiamata HTTP senza
 * bisogno di aggiornare lo stato globale dell'applicazione.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

// Interfaccia che rispecchia la riga del carrello sul backend (ShoppingCartDTO)
export interface ShoppingCart {
  id?: number;
  idOrder: number;    // Null se carrello attivo; popolato quando l'ordine viene confermato
  idProduct: number;
  amount: number;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class ShoppingcartService {
  private baseUrl = 'http://localhost:8080/rest/shoppingCart';

  constructor(private http: HttpClient) {}

  addItemToCart(cartItem: ShoppingCart): Observable<ShoppingCart> {
    return this.http.post<ShoppingCart>(`${this.baseUrl}/add`, cartItem).pipe(
      catchError((error) => {
        console.error('Error adding item to cart:', error);
        return throwError(() => new Error('Failed to add item to cart'));
      }),
    );
  }

  updateCartItem(cartItem: ShoppingCart): Observable<ShoppingCart> {
    return this.http.put<ShoppingCart>(`${this.baseUrl}/update`, cartItem).pipe(
      catchError((error) => {
        console.error('Error updating cart item:', error);
        return throwError(() => new Error('Failed to update cart item'));
      }),
    );
  }

  removeItemFromCart(cartItemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${cartItemId}`).pipe(
      catchError((error) => {
        console.error('Error removing item from cart:', error);
        return throwError(() => new Error('Failed to remove item from cart'));
      }),
    );
  }

  /** Recupera gli item del carrello associati a un ordine specifico */
  getcartItemsByOrderId(orderId: number): Observable<ShoppingCart[]> {
    return this.http.get<ShoppingCart[]>(`${this.baseUrl}/getByOrder/${orderId}`).pipe(
      catchError((error) => {
        console.error(`Error fetching cart items for order ${orderId}:`, error);
        return throwError(() => new Error('Failed to fetch cart items by order ID'));
      }),
    );
  }

  /** Recupera il carrello attivo dell'utente (item non ancora associati a un ordine) */
  getActiveCart(userName: string): Observable<ShoppingCart[]> {
    return this.http.get<ShoppingCart[]>(`${this.baseUrl}/activeCart/${userName}`).pipe(
      catchError((error) => {
        console.error(`Error fetching active cart for user ${userName}:`, error);
        return throwError(() => new Error('Failed to fetch active cart for user'));
      }),
    );
  }
}
