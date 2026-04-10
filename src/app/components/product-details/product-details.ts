import { Component, signal, computed, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

export interface ProductImage {
  url: string;
  alt: string;
}

@Component({
  selector: 'app-product-details',
  standalone: false,
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  @ViewChild('authDialog') authDialog!: ElementRef<HTMLDialogElement>;

  /* ── Product Data ── */
  product = signal<Product | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  suggestedProducts = signal<Product[]>([]);

  /* ── Immagini ── */
  images = computed<ProductImage[]>(() => {
    const p = this.product();
    if (p && p.images && p.images.length > 0) {
      return p.images.map((img) => ({
        url: img.link.startsWith('http')
          ? img.link
          : 'http://localhost:8080/rest/image/file/' + img.link,
        alt: p.name,
      }));
    }
    return [{ url: 'assets/no-image.png', alt: 'Nessuna immagine' }];
  });

  activeImageIndex = signal(0);

  /* ── UI State ── */
  quantity = signal(1);
  addedToCart = signal(false);
  wishlistActive = signal(false);
  
  /* ── Notification State ── */
  showToast = signal(false);
  toastMessage = signal('');

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    public cartService: CartService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(parseInt(productId, 10));
      } else {
        this.error.set('Invalid product ID');
        this.loading.set(false);
      }
    });
  }

  /* ── Notification Helper ── */
  private notify(msg: string) {
    this.toastMessage.set(msg);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }

  loadProduct(productId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.activeImageIndex.set(0);
    this.quantity.set(1);

    this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.loadSuggestedProducts(product.subcategoryId, product.id);
      },
      error: () => {
        this.error.set('Unable to load product details');
        this.loading.set(false);
      },
    });
  }

  loadSuggestedProducts(subcategoryId: number, currentProductId: number): void {
    this.productService.getProductsBySubcategory(subcategoryId).subscribe({
      next: (products) => {
        const filtered = products
          .filter((p) => p.id !== currentProductId && !p.isDeleted)
          .slice(0, 4);
        this.suggestedProducts.set(filtered);
      },
      error: (err) => console.error('Suggestions error:', err),
    });
  }

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  decreaseQty(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  increaseQty(): void {
    const stockAvailable = this.product()?.stock || 0;
    const currentQty = this.quantity();
    if (currentQty < 10 && currentQty < stockAvailable) {
      this.quantity.update((q) => q + 1);
    }
  }

  setQty(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    const stockAvailable = this.product()?.stock || 0;
    const maxAllowed = Math.min(10, stockAvailable);

    if (isNaN(val) || val < 1) val = 1;
    else if (val > maxAllowed) val = maxAllowed;

    this.quantity.set(val);
    input.value = val.toString();
  }

  goTo(path: string): void {
    this.closeDialog();
    this.router.navigate([path]);
  }

  closeDialog(): void {
    this.authDialog.nativeElement.close();
  }

  addToCart(): void {
    if (!this.authService.isLoggedIn()) {
      this.authDialog.nativeElement.showModal();
      return;
    }

    const p = this.product();
    if (!p) return;

    const qtyInCart = this.cartService.getItemQuantity(p.id);
    const requestedQty = this.quantity();
    const totalPotentialQty = qtyInCart + requestedQty;

    if (totalPotentialQty > p.stock) {
      const remaining = p.stock - qtyInCart;
      this.notify(remaining <= 0 
        ? `You already have ${qtyInCart} in your cart (maximum stock reached).` 
        : `You can only add ${remaining} more (already have ${qtyInCart} in cart).`);
      return;
    }

    if (totalPotentialQty > 10) {
      this.notify('Maximum limit per product is 10 units.');
      return;
    }

    this.cartService.addItem(p.id, requestedQty, p.price).subscribe({
      next: () => {
        this.addedToCart.set(true);
        setTimeout(() => this.addedToCart.set(false), 2000);
      },
      error: (err) => {
        console.error('Cart error', err);
        this.notify('Could not add item to cart. Please try again.');
      },
    });
  }
}