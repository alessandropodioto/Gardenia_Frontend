/**
 * CART SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestisce lo stato del carrello attivo dell'utente e le relative chiamate API.
 *
 * CONCETTO — Signals (introdotti in Angular 16):
 * Un signal è un contenitore di valore reattivo. A differenza degli Observable RxJS
 * (che sono stream asincroni da sottoscrivere), un signal:
 *   - Si legge chiamandolo come funzione:  cartItems()
 *   - Si aggiorna con .set() o .update(): cartItems.set([...])
 *   - Notifica automaticamente il DOM quando cambia (nessun subscribe necessario)
 *
 * CONCETTO — computed():
 * Crea un signal derivato che si ricalcola automaticamente ogni volta che i
 * signal da cui dipende cambiano. È l'equivalente reattivo di un getter calcolato.
 * Esempio: cartCount dipende da cartItems → ogni volta che cartItems cambia,
 * cartCount si ricalcola e il badge nell'header si aggiorna da solo.
 */

import { inject, PLATFORM_ID, Injectable, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private baseUrl = 'http://localhost:8080/rest/shoppingCart';

  // PLATFORM_ID: token per sapere se siamo nel browser o lato server (SSR)
  private platformId = inject(PLATFORM_ID);

  // signal<any[]>([]) crea uno stato reattivo inizializzato a array vuoto.
  // Tutti i componenti che leggono cartItems() si aggiornano automaticamente
  // quando lo stato cambia (senza Subject/subscribe manuale).
  cartItems = signal<any[]>([]);

  // computed(): questo signal NON ha un valore proprio, lo CALCOLA dai signal che usa.
  // Somma tutte le proprietà "amount" per ottenere il totale unità nel carrello.
  // Usato nel template dell'header: [matBadge]="cartService.cartCount()"
  cartCount = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.amount, 0);
  });

  constructor(private http: HttpClient) {
    // Carica il carrello solo nel browser: lato server (SSR) localStorage non esiste
    // e l'utente non è ancora noto. isPlatformBrowser() è il modo ufficiale Angular.
    if (isPlatformBrowser(this.platformId)) {
      this.loadCart();
    }
  }

  /**
   * Recupera lo userName dal localStorage cercando in più chiavi.
   * Il backend ha restituito formati diversi nel tempo (userName, username, name),
   * quindi si tenta ogni variante per robustezza. Metodo privato: usato solo internamente.
   */
  private getUserName(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const rawData = localStorage.getItem('user_data');
      if (rawData) {
        try {
          const parsed = JSON.parse(rawData);
          // Proviamo prima l'oggetto completo con diverse capitalizzazioni
          const nameFromObj = parsed.userName || parsed.username || parsed.name;
          if (nameFromObj) return nameFromObj;
        } catch (e) {
          // JSON.parse può fallire se il valore è corrotto: ignoriamo silenziosamente
        }
      }
      // Fallback alla stringa semplice salvata da AuthService.setUserData()
      return localStorage.getItem('username') || localStorage.getItem('userName');
    }
    return null;
  }

  /**
   * Carica dal backend gli item del carrello attivo (non ancora associati a un ordine).
   * Ordina per id crescente per mantenere un ordine stabile nella UI.
   * Viene chiamato: all'avvio (costruttore), dopo ogni modifica (tap in add/update/remove).
   */
  loadCart(): void {
    const user = this.getUserName();
    if (!user) return; // Utente non loggato: nessun carrello da caricare

    this.http.get<any[]>(`${this.baseUrl}/activeCart/${user}`).subscribe({
      next: (items) => {
        const sortedItems = items.sort((a, b) => a.id - b.id);
        // .set() aggiorna il signal: tutti i template che leggono cartItems() si ri-renderizzano
        this.cartItems.set(sortedItems);
      },
      error: (err) => console.error('Errore nel caricamento del carrello:', err),
    });
  }

  /** Ritorna la quantità attuale in carrello per un dato prodotto (0 se non presente) */
  getItemQuantity(prodId: number): number {
    const item = this.cartItems().find((i) => i.idProduct === prodId);
    return item ? item.amount : 0;
  }

  /**
   * Aggiunge un prodotto al carrello.
   * Se il prodotto è già presente, aggiorna la quantità (evita righe duplicate).
   * Se è nuovo, crea una nuova riga con POST.
   * tap() esegue un side-effect (ricaricare il carrello) senza modificare l'Observable.
   */
  addItem(prodId: number, qta: number, prezzo: number): Observable<any> {
    const esistente = this.cartItems().find((i) => i.idProduct === prodId);
    const user = this.getUserName();

    if (esistente) {
      // Prodotto già in carrello: aggiorna quantità sommando la nuova
      return this.updateQuantity(esistente.id, esistente.amount + qta, prezzo);
    } else {
      const body = {
        idProduct: prodId,
        amount: qta,
        price: prezzo,
        idOrder: null,   // null = carrello attivo, non ancora un ordine confermato
        userName: user,
      };

      return this.http.post(`${this.baseUrl}/create`, body).pipe(
        // tap() viene eseguito quando la chiamata POST ha successo,
        // ricarica il carrello per sincronizzare lo stato locale col backend
        tap(() => this.loadCart())
      );
    }
  }

  /** Aggiorna la quantità di una riga carrello esistente (identificata dal suo id) */
  updateQuantity(idCart: number, nuovaQty: number, prezzo: number): Observable<any> {
    const body = {
      id: idCart,
      amount: nuovaQty,
      price: prezzo,
      userName: this.getUserName(),
    };
    return this.http.put(`${this.baseUrl}/update`, body).pipe(
      tap(() => this.loadCart()) // Ricarica per aggiornare il signal
    );
  }

  /** Rimuove una riga dal carrello tramite il suo id (non l'id prodotto) */
  removeItem(idCart: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${idCart}`).pipe(
      tap(() => this.loadCart()) // Ricarica per aggiornare il signal
    );
  }

  /**
   * Svuota il signal localmente senza chiamare il backend.
   * Usato dopo la conferma del pagamento (PagamentoComponent): il carrello
   * sul backend viene già "consumato" dall'ordine, quindi basta azzerare lo stato UI.
   */
  resetCartSignal(): void {
    this.cartItems.set([]);
  }
}
