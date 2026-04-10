import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

export interface ShoppingCart {
  id?: number;
  idOrder: number;
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

  getcartItemsByOrderId(orderId: number): Observable<ShoppingCart[]> {
    return this.http.get<ShoppingCart[]>(`${this.baseUrl}/getByOrder/${orderId}`).pipe(
      catchError((error) => {
        console.error(`Error fetching cart items for order ${orderId}:`, error);
        return throwError(() => new Error('Failed to fetch cart items by order ID'));
      }),
    );
  }

  getActiveCart(userName: string): Observable<ShoppingCart[]> {
    return this.http.get<ShoppingCart[]>(`${this.baseUrl}/activeCart/${userName}`).pipe(
      catchError((error) => {
        console.error(`Error fetching active cart for user ${userName}:`, error);
        return throwError(() => new Error('Failed to fetch active cart for user'));
      }),
    );
  }
}
