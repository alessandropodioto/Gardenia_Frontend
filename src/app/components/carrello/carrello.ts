import { Component } from '@angular/core';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-carrello',
  standalone: false,
  templateUrl: './carrello.html',
  styleUrl: './carrello.css'
})
export class CarrelloComponent {
  
  constructor(private cartService: CartService) {}

  get items() {
    return this.cartService.cartItems();
  }

  get subtotal(): number {
    return this.items.reduce((acc, item) => acc + (item.price * item.amount), 0);
  }

  get mancanoPerSpedizione(): number {
    const soglia = 50;
    return Math.max(0, soglia - this.subtotal);
  }

  get percentualeSpedizione(): number {
    return Math.min(100, (this.subtotal / 50) * 100);
  }

  cambiaQuantita(item: any, delta: number) {
    const nuovaQty = item.amount + delta;

    if (nuovaQty > 0) {
      // Aggiorna se la quantità è positiva
      this.cartService.updateQuantity(item.id, nuovaQty, item.price).subscribe();
    } else {
      // Elimina se l'utente preme "-" quando la quantità è 1
      this.cartService.removeItem(item.id).subscribe();
    }
  }

  // FIX STABILITÀ: trackBy impedisce lo scambio visivo dei componenti
  trackById(index: number, item: any): number {
    return item.id;
  }
}