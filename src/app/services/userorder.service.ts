import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Product } from './product.service';

export interface UserOrder {
  id?: number;
  wharehouse: string;
  isPaid: boolean;
  userName?: string;
  addressId?: number;
  statusDescription?: string;
  date: string;
}

@Injectable({
  providedIn: 'root',
})

export class UserorderService {
  private apiUrl = 'http://localhost:8080/rest/order';

  constructor(private http: HttpClient) {}

  create(order: UserOrder) {
    return this.http.post<UserOrder>(`${this.apiUrl}/create`, order).pipe(
      catchError(error => {
        console.error('Error creating order:', error);
        return throwError(() => new Error('Failed to create order'));
      })
    );
  }

  update(order: UserOrder): Observable<UserOrder> {
    return this.http.put<UserOrder>(`${this.apiUrl}/update`, order).pipe(
      catchError(error => {
        console.error('Error updating order:', error);
        return throwError(() => new Error('Failed to update order'));
      })
    );
  }

  getOrdersByUser(userName: string): Observable<UserOrder[]> {
    const params = new HttpParams().set('userName', userName);
    return this.http.get<UserOrder[]>(`${this.apiUrl}/listByUser`, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching orders for user ${userName}:`, error);
        return throwError(() => new Error('Failed to fetch orders by user'));
      })
    );
  }
}

