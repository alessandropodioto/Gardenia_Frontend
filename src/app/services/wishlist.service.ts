/**
 * WISHLIST SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce la lista dei desideri dell'utente: caricamento, aggiunta e rimozione.
 *
 * Usa signal() per lo stato reattivo (stesso pattern di CartService):
 * - items: la lista completa degli item della wishlist
 * - wishlistCount: il numero di item, letto dall'header per il badge
 *
 * Dopo ogni modifica (add/remove) i signal vengono aggiornati immediatamente
 * in modo che il badge sull'icona cuore nell'header si aggiorni senza refresh.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root', // Singleton condiviso da Header, ProductDetails, Wishlist page
})
export class WishlistService {
  private apiUrl = 'http://localhost:8080/rest/wishlist';

  // signal<any[]>(): stato reattivo della lista. I componenti che leggono items()
  // si aggiornano automaticamente quando cambia (es. ProductDetails per il cuore rosso)
  items = signal<any[]>([]);

  // Contatore separato per il badge nell'header (evita di ricalcolare items().length)
  wishlistCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  /**
   * Carica la wishlist dal backend e aggiorna entrambi i signal.
   * tap() aggiorna lo stato locale dopo che il backend ha risposto con successo,
   * senza modificare i dati che fluiscono nell'Observable.
   */
  getWishlist(userName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/list/${userName}`).pipe(
      tap((list) => {
        this.items.set(list);               // Aggiorna la lista completa
        this.wishlistCount.set(list.length); // Aggiorna il badge
      }),
    );
  }

  /**
   * Aggiunge un prodotto alla wishlist.
   * Dopo il successo, ricarica l'intera lista dal backend per garantire
   * la sincronizzazione (invece di aggiungere manualmente all'array locale).
   */
  addToWishlist(productId: number, userName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, { productId, userName }).pipe(
      tap(() => {
        // Ricarichiamo dal backend per avere dati freschi (incluso l'id del nuovo item)
        this.getWishlist(userName).subscribe();
      }),
    );
  }

  /**
   * Rimuove un item dalla wishlist per id (id della riga wishlist, non dell'id prodotto).
   * Aggiorna i signal localmente senza ricaricare dal backend (ottimizzazione):
   * filtra via l'item rimosso dall'array esistente invece di fare una nuova GET.
   */
  removeFromWishlist(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`).pipe(
      tap(() => {
        // Aggiornamento ottimistico: rimuove l'item dall'array locale senza nuova GET
        const updatedItems = this.items().filter((item) => item.id !== id);
        this.items.set(updatedItems);
        this.wishlistCount.set(updatedItems.length);
      }),
    );
  }
}
