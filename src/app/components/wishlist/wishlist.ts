/**
 * WISHLIST COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Pagina della lista dei desideri dell'utente (/user/wishlist).
 * Permette di rimuovere prodotti dalla wishlist o spostarli direttamente nel carrello.
 *
 * STATO CONDIVISO:
 * Gli item della wishlist sono in WishlistService.items (signal).
 * Questo componente non mantiene una copia locale: accede direttamente al service
 * (dichiarato "public" per permettere l'accesso nel template).
 * Quando removeFromWishlist() aggiorna il signal, il template si aggiorna automaticamente.
 */

import { Component, OnInit, signal } from '@angular/core';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
  standalone: false,
})
export class Wishlist implements OnInit {
  // Toast di notifica locale (non condiviso con altri componenti)
  showToast = signal(false);
  toastMessage = signal('');

  constructor(
    public wishlistService: WishlistService, // "public" per accesso nel template
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    // Carichiamo la wishlist dal backend all'apertura della pagina.
    // Potrebbe essere già caricata (es. se l'utente è venuto da ProductDetails),
    // ma ricaricare garantisce dati freschi.
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userName = user.userName || user.username;
        if (userName) {
          this.wishlistService.getWishlist(userName).subscribe();
        }
      } catch (e) {
        // JSON.parse può fallire se il localStorage è corrotto
        console.error('Error parsing user data', e);
      }
    }
  }

  /**
   * Costruisce l'URL dell'immagine per il template.
   * Stessa logica di HomeComponent e ProductDetails: se il link è già assoluto
   * lo usa direttamente, altrimenti lo prefissa con il path del file server.
   */
  formatImg(imgName: string): string {
    if (!imgName) return 'assets/placeholder.png';
    return imgName.startsWith('http')
      ? imgName
      : `http://localhost:8080/rest/image/file/${imgName}`;
  }

  /** Rimuove un item dalla wishlist (per id riga wishlist, non id prodotto) */
  remove(id: number) {
    this.wishlistService.removeFromWishlist(id).subscribe({
      next: () => this.notify('Item removed from wishlist'),
      error: () => this.notify('Error removing item'),
    });
  }

  /**
   * Sposta un prodotto dalla wishlist al carrello in due passi:
   * 1. Aggiunge al carrello (CartService.addItem)
   * 2. Se riesce, rimuove dalla wishlist (WishlistService.removeFromWishlist)
   * Le due chiamate sono annidate (non forkJoin) perché la seconda dipende dal successo della prima.
   */
  addToCart(item: any) {
    // Controlla lo stock prima di procedere (campo può avere nomi diversi)
    const currentStock = item.productStock ?? item.stock ?? 0;
    if (currentStock <= 0) {
      this.notify('Sorry, this item is out of stock!');
      return;
    }

    this.cartService.addItem(item.productId, 1, item.price).subscribe({
      next: () => {
        // Aggiunta al carrello riuscita: ora rimuoviamo dalla wishlist
        this.wishlistService.removeFromWishlist(item.id).subscribe({
          next: () => this.notify('Moved to cart!'),
          error: () => this.notify('Added to cart, but failed to remove from wishlist.'),
        });
      },
      error: (err) => {
        this.notify('Error adding to cart.');
        console.error(err);
      },
    });
  }

  /**
   * Mostra un toast per 3 secondi.
   * Il secondo setTimeout svuota il testo dopo la dissolvenza (400ms dopo la scomparsa).
   */
  notify(msg: string) {
    if (!msg) return;
    this.toastMessage.set(msg);
    this.showToast.set(true);

    setTimeout(() => {
      this.showToast.set(false);
      setTimeout(() => this.toastMessage.set(''), 400); // Pulisce il testo dopo l'animazione di fade
    }, 3000);
  }
}
