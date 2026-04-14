import { inject, PLATFORM_ID, Injectable, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private baseUrl = 'http://localhost:8080/rest/shoppingCart';

  private platformId = inject(PLATFORM_ID);

  cartItems = signal<any[]>([]);

  cartCount = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.amount, 0);
  });

  constructor(private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCart();
    }
  }

  private getUserName(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const rawData = localStorage.getItem('user_data');
      if (rawData) {
        try {
          const parsed = JSON.parse(rawData);
          const nameFromObj = parsed.userName || parsed.username || parsed.name;
          if (nameFromObj) return nameFromObj;
        } catch (e) {}
      }
      return localStorage.getItem('username') || localStorage.getItem('userName');
    }
    return null;
  }

  /**
   * CARICAMENTO CARRELLO: Aggiornato per matchare il Backend
   */
  loadCart(): void {
    const user = this.getUserName();

    if (!user) {
      this.cartItems.set([]);
      return;
    }

    this.http.get<any[]>(`${this.baseUrl}/activeCart/${user}`).subscribe({
      next: (items) => {
        const sortedItems = items.sort((a, b) => a.id - b.id);
        this.cartItems.set(sortedItems);
      },
      error: (err) => {
        console.error('Errore nel caricamento del carrello:', err);
        this.cartItems.set([]);
      },
    });
  }

  getItemQuantity(prodId: number): number {
    const item = this.cartItems().find((i) => i.idProduct === prodId);
    return item ? item.amount : 0;
  }

  addItem(prodId: number, qta: number, prezzo: number): Observable<any> {
    const esistente = this.cartItems().find((i) => i.idProduct === prodId);
    const user = this.getUserName();

    if (esistente) {
      return this.updateQuantity(esistente.id, esistente.amount + qta, prezzo);
    } else {
      const body = {
        idProduct: prodId,
        amount: qta,
        price: prezzo,
        idOrder: null,
        userName: user,
      };

      return this.http.post(`${this.baseUrl}/create`, body).pipe(tap(() => this.loadCart()));
    }
  }

  updateQuantity(idCart: number, nuovaQty: number, prezzo: number): Observable<any> {
    const body = {
      id: idCart,
      amount: nuovaQty,
      price: prezzo,
      userName: this.getUserName(),
    };
    return this.http.put(`${this.baseUrl}/update`, body).pipe(tap(() => this.loadCart()));
  }

  removeItem(idCart: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${idCart}`).pipe(tap(() => this.loadCart()));
  }

  resetCartSignal(): void {
    this.cartItems.set([]);
  }
}
