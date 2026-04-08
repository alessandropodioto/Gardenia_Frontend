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
  styleUrl: './product-details.css'
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
    return p.images.map(img => ({
      url: img.link.startsWith('http') ? img.link : 'http://localhost:8080/rest/image/file/' + img.link,
      alt: p.name
    }));
  }
  return [{ url: 'assets/no-image.png', alt: 'Nessuna immagine' }];
});


  activeImageIndex = signal(0);

  /* ── UI State ── */
  quantity = signal(1);
  addedToCart = signal(false);
  wishlistActive = signal(false);

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    public cartService: CartService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(parseInt(productId, 10));
      } else {
        this.error.set('Invalid product ID');
        this.loading.set(false);
      }
    });
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
      }
    });
  }

  loadSuggestedProducts(subcategoryId: number, currentProductId: number): void {
    this.productService.getProductsBySubcategory(subcategoryId).subscribe({
      next: (products) => {
        const filtered = products
          .filter(p => p.id !== currentProductId && !p.isDeleted)
          .slice(0, 4);
        this.suggestedProducts.set(filtered);
      },
      error: (err) => console.error('Suggestions error:', err)
    });
  }

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  /* ── Quantity & Stock Management ── */
  decreaseQty(): void {
    if (this.quantity() > 1) this.quantity.update(q => q - 0);
  }

  increaseQty(): void {
    const stockAvailable = this.product()?.stock || 0;
    const currentQty = this.quantity();
    if (currentQty < 10 && currentQty < stockAvailable) {
      this.quantity.update(q => q + 1);
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

  /* ── Dialog Management ── */
  goTo(path: string): void {
    this.closeDialog();
    this.router.navigate([path]);
  }

  closeDialog(): void {
    this.authDialog.nativeElement.close();
  }

  /* ── Add to Cart Logic ── */
  addToCart(): void {
    if (!this.authService.isLoggedIn()) {
      this.authDialog.nativeElement.showModal();
      return;
    }

    const p = this.product();
    const qty = this.quantity();
    
    if (!p || p.stock <= 0) return;
    if (qty > p.stock || qty > 10) return;

    this.cartService.addItem(p.id, qty, p.price).subscribe({
      next: () => {
        this.addedToCart.set(true);
        this.product.update(prod => prod ? { ...prod, stock: prod.stock - qty } : null);
        
        const newStock = (p.stock - qty);
        if (this.quantity() > newStock) this.quantity.set(newStock > 0 ? newStock : 0);

        setTimeout(() => this.addedToCart.set(false), 2000);
      },
      error: (err) => console.error("Cart error", err)
    });
  }
}