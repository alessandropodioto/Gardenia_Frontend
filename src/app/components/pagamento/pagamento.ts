/**
 * PAGAMENTO COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Pagina di riepilogo e conferma ordine. Mostra gli articoli del carrello,
 * il totale e il metodo di pagamento selezionato.
 *
 * FLUSSO ACQUISTO:
 *   1. L'utente vede il riepilogo (items dal CartService, totale calcolato)
 *   2. Sceglie il metodo di pagamento (simulato, non integrazione reale)
 *   3. Clicca "Conferma acquisto" → crea un ordine sul backend
 *   4. Il signal del carrello viene svuotato localmente
 *   5. Redirect a /user/orders dopo 2 secondi
 *
 * NOTA SUL CARRELLO POST-PAGAMENTO:
 * Chiamare resetCartSignal() svuota solo lo stato locale (signal).
 * Il backend gestisce il carrello come "consumato" quando l'ordine viene creato:
 * le righe del carrello vengono associate all'ordine (idOrder ≠ null).
 */

import { Component, signal } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { UserorderService } from '../../services/userorder.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagamento',
  standalone: false,
  templateUrl: './pagamento.html',
  styleUrls: ['./pagamento.css']
})
export class PagamentoComponent {

  loading = signal(false);
  showToast = signal(false);
  toastMessage = signal('');

  // Costo spedizione: 0 = spedizione gratuita (viene sommato al totale)
  shippingCost = signal(0);

  // Metodo di pagamento attualmente selezionato (gestione UI, non integrazione reale)
  metodoScelto: string = 'carta';

  constructor(
    public cartService: CartService, // "public" per usarlo direttamente nel template
    private userOrderService: UserorderService,
    private router: Router
  ) {}

  // ── Getter per il template ────────────────────────────────────────────────

  /** Accede direttamente al signal del CartService */
  get items() {
    return this.cartService.cartItems();
  }

  /** Somma prezzi × quantità di ogni item */
  get subtotale(): number {
    return this.items.reduce((acc, item) => acc + item.price * item.amount, 0);
  }

  /** Totale finale incluse spese di spedizione */
  get totale(): number {
    return this.subtotale + this.shippingCost();
  }

  /** Aggiorna il metodo di pagamento selezionato (riflesso nel template) */
  impostaMetodo(metodo: string) {
    this.metodoScelto = metodo;
  }

  /**
   * Esegue la conferma dell'ordine:
   * 1. Legge lo username dal localStorage (SSR-safe)
   * 2. Costruisce il DTO dell'ordine
   * 3. Chiama il backend per creare l'ordine
   * 4. Svuota il carrello e redirect
   */
  completaAcquisto() {
    if (this.items.length === 0) return;

    this.loading.set(true);
    let userIdentifier: string | null = null;

    // SSR-safe: typeof window verifica che siamo nel browser prima di accedere a localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        userIdentifier = parsed.userName || parsed.username;
      }
      // Fallback alla stringa semplice se l'oggetto completo non c'è
      if (!userIdentifier) userIdentifier = localStorage.getItem('username');
    }

    if (!userIdentifier) {
      this.notify('Please log in to confirm the order.');
      this.loading.set(false);
      return;
    }

    // DTO inviato al backend per creare l'ordine.
    // "wharehouse": typo ereditato dal backend (corretto sarebbe "warehouse")
    // "date": il backend richiede il formato YYYY-MM-DD (toISOString().split('T')[0])
    const ordineDaInviare = {
      userId: userIdentifier,
      wharehouse: 'Main',
      isPaid: true,
      statusDescription: 'PAID',
      date: new Date().toISOString().split('T')[0],
      totalPrice: this.totale,
    };

    this.userOrderService.create(ordineDaInviare).subscribe({
      next: () => {
        // Il carrello sul backend è già "consumato" dall'ordine creato;
        // svuotiamo solo lo stato locale (il signal) per aggiornare il badge
        this.cartService.resetCartSignal();
        this.loading.set(false);
        this.notify('Order confirmed! Redirecting...');
        // Aspettiamo 2 secondi per lasciare leggere il messaggio, poi redirect
        setTimeout(() => this.router.navigate(['/user/orders']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify('Error during payment. Please try again.');
        console.error('Order failed:', err);
      }
    });
  }

  private notify(msg: string) {
    this.toastMessage.set(msg);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
