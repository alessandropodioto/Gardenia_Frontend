import { Component, ViewChild, TemplateRef } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-carrello',
  standalone: false,
  templateUrl: './carrello.html',
  styleUrl: './carrello.css'
})
export class CarrelloComponent {
  // Riferimento al template nel file HTML
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;

  constructor(
    private cartService: CartService,
    private dialog: MatDialog
  ) {}

  get items() {
    return this.cartService.cartItems();
  }

  get subtotal(): number {
    return this.items.reduce((acc, item) => acc + (item.price * item.amount), 0);
  }

  cambiaQuantita(item: any, delta: number) {
    const nuovaQty = item.amount + delta;

    if (nuovaQty > 0) {
      this.cartService.updateQuantity(item.id, nuovaQty, item.price).subscribe();
    } else {
      // APRE IL DIALOG UTILIZZANDO IL TEMPLATE INLINE
      this.dialog.open(this.confirmDialog).afterClosed().subscribe(result => {
        if (result === true) {
          this.cartService.removeItem(item.id).subscribe();
        }
      });
    }
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}