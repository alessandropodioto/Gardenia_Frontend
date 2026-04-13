import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
  standalone: false
})
export class Wishlist implements OnInit {
  
  constructor(
    public wishlistService: WishlistService,
    private cartService: CartService 
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      const user = JSON.parse(userStr);
      const userName = user.userName || user.username;
      this.wishlistService.getWishlist(userName).subscribe();
    }
  }

  formatImg(imgName: string): string {
    return imgName && imgName.startsWith('http') 
      ? imgName 
      : `http://localhost:8080/rest/image/file/${imgName}`;
  }

  rimuovi(id: number) {
    this.wishlistService.removeFromWishlist(id).subscribe();
  }

  aggiungiAlCarrello(item: any) {
    this.cartService.addItem(item.productId, 1, item.price).subscribe({
      next: () => this.rimuovi(item.id),
      error: (err) => console.error("Error:", err)
    });
  }
}