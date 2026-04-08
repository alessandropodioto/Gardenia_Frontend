import { Component, ViewChild, TemplateRef, signal } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-carrello',
  standalone: false,
  templateUrl: './carrello.html',
  styleUrl: './carrello.css',
})
export class CarrelloComponent {
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;

  // Segnali per la notifica (stessa logica del product-details)
  showToast = signal(false);
  toastMessage = signal('');

  constructor(
    public cartService: CartService, // public per usarlo direttamente nel template
    private dialog: MatDialog,
  ) {}

  get items() {
    return this.cartService.cartItems();
  }

  get subtotal(): number {
    return this.items.reduce((acc, item) => acc + item.price * item.amount, 0);
  }

  /**
   * Metodo unificato per gestire il cambio quantità
   */
  cambiaQuantita(item: any, delta: number) {
    console.log('Dati elemento:', item); // <--- Guarda la console del browser (F12)
  console.log('Stock disponibile:', item.productStock);
    const nuovaQty = item.amount + delta;
    const maxAvailable = item.productStock; // Assicurati che il backend lo invii

    // Gestione Diminuzione / Rimozione
    if (nuovaQty < 1) {
      this.dialog
        .open(this.confirmDialog)
        .afterClosed()
        .subscribe((result) => {
          if (result === true) {
            this.cartService.removeItem(item.id).subscribe();
          }
        });
      return;
    }

    // Gestione Aumento: Controllo Stock
    if (delta > 0 && nuovaQty > maxAvailable) {
      this.notify(`Sorry, only ${maxAvailable} items available in stock.`);
      return;
    }

    // Gestione Aumento: Controllo Limite 10
    if (delta > 0 && nuovaQty > 10) {
      this.notify('Maximum limit is 10 units per product.');
      return;
    }

    // Se tutto ok, procedi
    this.cartService.updateQuantity(item.id, nuovaQty, item.price).subscribe({
      error: () => this.notify('Could not update quantity.'),
    });
  }

  private notify(msg: string) {
    this.toastMessage.set(msg);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}
