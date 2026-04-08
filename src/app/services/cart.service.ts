import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CartService {
  private baseUrl = 'http://localhost:8080/rest/shoppingCart';
  
  cartItems = signal<any[]>([]);

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  loadCart() {
    this.http.get<any[]>(`${this.baseUrl}/getAll`).subscribe(items => {
      const sortedItems = items.sort((a, b) => a.id - b.id);
      this.cartItems.set(sortedItems);
    });
  }

  updateQuantity(idCart: number, nuovaQty: number, prezzo: number) {
    const body = { id: idCart, amount: nuovaQty, price: prezzo };
    return this.http.put(`${this.baseUrl}/update`, body).pipe(
      tap(() => this.loadCart())
    );
  }

  removeItem(idCart: number) {
    return this.http.delete(`${this.baseUrl}/delete/${idCart}`).pipe(
      tap(() => this.loadCart())
    );
  }

  addItem(prodId: number, qta: number, prezzo: number) {
    // Controlliamo se il prodotto è già nella lista locale
    const esistente = this.cartItems().find(i => i.idProduct === prodId);

    if (esistente) {
      // Se esiste, chiamiamo la UPDATE invece della CREATE
      return this.updateQuantity(esistente.id, esistente.amount + qta, prezzo);
    } else {
      // Se è nuovo, facciamo la CREATE
      const body = { idProduct: prodId, amount: qta, price: prezzo, idOrder: null };
      return this.http.post(`${this.baseUrl}/create`, body).pipe(
        tap(() => this.loadCart())
      );
    }
  }
}