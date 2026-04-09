import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private baseUrl = 'http://localhost:8080/rest/shoppingCart';
  
  // Signal che contiene gli elementi nel carrello
  cartItems = signal<any[]>([]);

  cartCount = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.amount, 0);
  });

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  loadCart(): void {
    this.http.get<any[]>(`${this.baseUrl}/getAll`).subscribe(items => {
      // Ordiniamo per ID per evitare che gli elementi saltino di posizione nella UI
      const sortedItems = items.sort((a, b) => a.id - b.id);
      this.cartItems.set(sortedItems);
    });
  }

  /**
   * Helper: Restituisce la quantità di un prodotto specifico già presente nel carrello
   */
  getItemQuantity(prodId: number): number {
    const item = this.cartItems().find(i => i.idProduct === prodId);
    return item ? item.amount : 0;
  }

  updateQuantity(idCart: number, nuovaQty: number, prezzo: number): Observable<any> {
    const body = { id: idCart, amount: nuovaQty, price: prezzo };
    return this.http.put(`${this.baseUrl}/update`, body).pipe(
      tap(() => this.loadCart())
    );
  }

  removeItem(idCart: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${idCart}`).pipe(
      tap(() => this.loadCart())
    );
  }

  addItem(prodId: number, qta: number, prezzo: number): Observable<any> {
    const esistente = this.cartItems().find(i => i.idProduct === prodId);

    if (esistente) {
      // Se esiste, aggiorniamo la quantità esistente
      return this.updateQuantity(esistente.id, esistente.amount + qta, prezzo);
    } else {
      // Se è nuovo, creiamo una nuova voce
      const body = { idProduct: prodId, amount: qta, price: prezzo, idOrder: null };
      return this.http.post(`${this.baseUrl}/create`, body).pipe(
        tap(() => this.loadCart())
      );
    }
  }
}