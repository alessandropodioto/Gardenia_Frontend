import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private apiUrl = 'http://localhost:8080/rest/wishlist';

  items = signal<any[]>([]);

  wishlistCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  getWishlist(userName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/list/${userName}`).pipe(
      tap((list) => {
        this.items.set(list);
        this.wishlistCount.set(list.length);
      }),
    );
  }

  addToWishlist(productId: number, userName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, { productId, userName }).pipe(
      tap(() => {
        this.getWishlist(userName).subscribe();
      }),
    );
  }

  removeFromWishlist(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`).pipe(
      tap(() => {
        const updatedItems = this.items().filter((item) => item.id !== id);
        this.items.set(updatedItems);
        this.wishlistCount.set(updatedItems.length);

        console.log('Prodotto rimosso e segnali aggiornati');
      }),
    );
  }
}
