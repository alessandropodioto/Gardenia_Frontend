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
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;

  // Reactive States (Signals)
  showToast = signal(false);
  toastMessage = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    public cartService: CartService,
    private productService: ProductService,
    private userOrderService: UserorderService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  // Getters for template simplicity
  get items() {
    return this.cartService.cartItems();
  }

  get subtotal(): number {
    return this.items.reduce((acc, item) => acc + item.price * item.amount, 0);
  }

  confermaOrdine() {
    if (this.items.length === 0) return;
    
    this.loading.set(true);
    let userIdentifier: string | null = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        userIdentifier = parsed.userName || parsed.username;
      }
      if (!userIdentifier) {
        userIdentifier = localStorage.getItem('username');
      }
    }

    if (!userIdentifier) {
      this.notify('Please log in to continue.');
      this.loading.set(false);
      return;
    }

    // BACKEND OBJECT CONSTRUCTION
    const ordineDaInviare = {
      userId: userIdentifier,
      wharehouse: 'Main',
      isPaid: false,
      statusDescription: 'PENDING',
      date: new Date().toISOString().split('T')[0],
      totalPrice: this.subtotal,
    };

    this.userOrderService.create(ordineDaInviare).subscribe({
      next: () => {
        this.cartService.loadCart();
        this.cartService.resetCartSignal();
        this.loading.set(false);
        this.notify('Order created successfully!');
        this.router.navigate(['/user/orders']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify('Error creating the order.');
        console.error('Order creation failed:', err);
      },
    });
  }

  /**
   * Change quantity with safety and stock checks
   */
  cambiaQuantita(item: any, delta: number) {
    const nuovaQty = item.amount + delta;
    const maxAvailable = item.productStock;

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

    if (delta > 0 && nuovaQty > maxAvailable) {
      this.notify(`Only ${maxAvailable} units available.`);
      return;
    }

    if (delta > 0 && nuovaQty > 10) {
      this.notify('Maximum 10 units per product.');
      return;
    }

    this.cartService.updateQuantity(item.id, nuovaQty, item.price).subscribe({
      error: () => this.notify('Update failed.'),
    });
  }

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

  private notify(msg: string) {
    this.toastMessage.set(msg);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}