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
  // Signals for notifications
  showToast = signal(false);
  toastMessage = signal('');

  constructor(
    public wishlistService: WishlistService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userName = user.userName || user.username;
        if (userName) {
          this.wishlistService.getWishlist(userName).subscribe();
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  formatImg(imgName: string): string {
    if (!imgName) return 'assets/placeholder.png';
    return imgName.startsWith('http')
      ? imgName
      : `http://localhost:8080/rest/image/file/${imgName}`;
  }

  remove(id: number) {
    this.wishlistService.removeFromWishlist(id).subscribe({
      next: () => this.notify('Item removed from wishlist'),
      error: () => this.notify('Error removing item'),
    });
  }

  addToCart(item: any) {
    const currentStock = item.productStock ?? item.stock ?? 0;
    if (currentStock <= 0) {
      this.notify('Sorry, this item is out of stock!');
      return;
    }

    this.cartService.addItem(item.productId, 1, item.price).subscribe({
      next: () => {
        this.wishlistService.removeFromWishlist(item.id).subscribe({
          next: () => {
            this.notify('Moved to cart!');
          },
          error: () => this.notify('Added to cart, but failed to remove from wishlist.'),
        });
      },
      error: (err) => {
        this.notify('Error adding to cart.');
        console.error(err);
      },
    });
  }

  notify(msg: string) {
    if (!msg) return;

    this.toastMessage.set(msg);
    this.showToast.set(true);

    setTimeout(() => {
      this.showToast.set(false);
      setTimeout(() => this.toastMessage.set(''), 400);
    }, 3000);
  }
}
