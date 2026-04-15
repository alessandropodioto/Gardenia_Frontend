/**
 * CARRELLO COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Mostra il carrello attivo dell'utente e permette di modificare quantità,
 * rimuovere prodotti e procedere al checkout.
 *
 * ARCHITETTURA:
 * Lo stato del carrello è in CartService (signal cartItems). Questo componente
 * non mantiene una copia locale: legge sempre dal service tramite il getter "items".
 * In questo modo carrello, header (badge) e qualsiasi altro componente vedono
 * sempre lo stesso stato sincronizzato.
 *
 * DIALOG DI CONFERMA:
 * Per la conferma di rimozione si usa MatDialog con un TemplateRef.
 * @ViewChild('confirmDialog') punta a un <ng-template #confirmDialog> nel template HTML.
 * Questo approccio evita di creare un componente dialog separato per una conferma semplice.
 */

import { Component, ViewChild, TemplateRef, signal } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { UserorderService } from '../../services/userorder.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-carrello',
  standalone: false,
  templateUrl: './carrello.html',
  styleUrl: './carrello.css',
})
export class CarrelloComponent {
  // @ViewChild('confirmDialog'): ottiene il riferimento al template inline nel HTML.
  // TemplateRef<any> rappresenta un blocco <ng-template> che può essere aperto come dialog.
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;

  // signal(): stati reattivi locali per notifiche e loading
  showToast = signal(false);
  toastMessage = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    public cartService: CartService,       // "public" per accesso diretto nel template
    private productService: ProductService,
    private userOrderService: UserorderService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  // ── Getter per semplificare il template ─────────────────────────────────

  /** Restituisce gli item correnti dal signal del CartService */
  get items() {
    return this.cartService.cartItems();
  }

  /**
   * Calcola il subtotale sommando (prezzo × quantità) per ogni item.
   * Viene ricalcolato automaticamente ogni volta che items cambia
   * (perché items() chiama il signal del CartService).
   */
  get subtotal(): number {
    return this.items.reduce((acc, item) => acc + item.price * item.amount, 0);
  }

  /** Naviga alla pagina di pagamento se ci sono item nel carrello */
  confermaOrdine() {
    if (this.items.length === 0) return;
    this.router.navigate(['/pagamento']);
  }

  /**
   * Modifica la quantità di un item (+1 o -1).
   * Gestisce tre casi:
   *   1. La nuova quantità sarebbe 0 → chiede conferma di eliminazione
   *   2. Superamento dello stock disponibile → notifica e blocca
   *   3. Superamento del limite di 10 per prodotto → notifica e blocca
   *
   * delta: +1 per aumentare, -1 per diminuire
   */
  cambiaQuantita(item: any, delta: number) {
    const nuovaQty = item.amount + delta;
    const maxAvailable = item.productStock; // Stock disponibile del prodotto

    if (nuovaQty < 1) {
      // Anziché rimuovere silenziosamente, apriamo il dialog di conferma.
      // dialog.open() con un TemplateRef apre il template come modale Material.
      // afterClosed() è un Observable che emette il valore passato a dialogRef.close().
      this.dialog
        .open(this.confirmDialog)
        .afterClosed()
        .subscribe((result) => {
          // result === true solo se l'utente ha cliccato "Conferma" (non "Annulla")
          if (result === true) {
            this.cartService.removeItem(item.id).subscribe();
          }
        });
      return;
    }

    if (delta > 0 && nuovaQty > maxAvailable) {
      this.notify(`Only ${maxAvailable} units available.`);
      return;
    }

    if (delta > 0 && nuovaQty > 10) {
      this.notify('Maximum 10 units per product.');
      return;
    }

    // Aggiornamento normale: chiama il backend e ricarica il signal
    this.cartService.updateQuantity(item.id, nuovaQty, item.price).subscribe({
      error: () => this.notify('Update failed.'),
    });
  }

  /** Rimuove un intero item previa conferma dialog */
  rimuoviTutto(item: any) {
    this.dialog
      .open(this.confirmDialog)
      .afterClosed()
      .subscribe((result) => {
        if (result === true) {
          this.cartService.removeItem(item.id).subscribe({
            next: () => this.notify('Item removed'),
            error: () => this.notify('Error during removal'),
          });
        }
      });
  }

  /**
   * Mostra un toast di notifica per 3 secondi.
   * signal.set() aggiorna il valore e il template reagisce automaticamente.
   */
  private notify(msg: string) {
    this.toastMessage.set(msg);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  /**
   * trackBy per *ngFor: Angular usa questa funzione per identificare univocamente
   * gli elementi della lista. Senza trackBy, Angular ricostruisce il DOM ad ogni
   * aggiornamento dell'array; con trackBy, aggiorna solo gli item cambiati.
   */
  trackById(index: number, item: any): number {
    return item.id;
  }
}
