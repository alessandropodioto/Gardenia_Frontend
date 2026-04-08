import { Component, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';

export interface ProductVariant {
  id: string;
  label: string;
  description: string;
  price: number;
  originalPrice?: number;
  available: boolean;
}

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

  /* ── Product Data from API ── */
  product = signal<Product | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  suggestedProducts = signal<Product[]>([]);

/* ── Immagini ── */
images = computed<ProductImage[]>(() => {
  const p = this.product();
  if (p && p.images && p.images.length > 0) {
    return p.images.map(img => ({
      // ...
      url: img.link.startsWith('http') ? img.link : 'http://localhost:8080/rest/image/file/' + img.link,
// ... 
      alt: p.name
    }));
  }
  // Usa l'immagine Base64 qui!
  return [{ url: 'assets/no-image.png', alt: 'Nessuna immagine' }];
});


  activeImageIndex = signal(0);

  /* ── Varianti ── */
  variants: ProductVariant[] = [
    {
      id: 's',
      label: 'Vaso Ø 12 cm',
      description: 'Altezza ~40 cm',
      price: 12.90,
      available: true
    },
    {
      id: 'm',
      label: 'Vaso Ø 17 cm',
      description: 'Altezza ~65 cm',
      price: 22.90,
      originalPrice: 27.90,
      available: true
    },
    {
      id: 'l',
      label: 'Vaso Ø 21 cm',
      description: 'Altezza ~95 cm',
      price: 38.90,
      available: true
    },
    {
      id: 'xl',
      label: 'Vaso Ø 27 cm',
      description: 'Altezza ~130 cm',
      price: 64.90,
      available: false
    }
  ];

  selectedVariant = signal<ProductVariant>(this.variants[1]);
  quantity = signal(1);
  addedToCart = signal(false);
  wishlistActive = signal(false);

  /* ── Computed ── */
  currentPrice = computed(() => this.selectedVariant().price);
  originalPrice = computed(() => this.selectedVariant().originalPrice);
  discount = computed(() => {
    const orig = this.originalPrice();
    if (!orig) return null;
    return Math.round((1 - this.currentPrice() / orig) * 100);
  });

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private productService: ProductService
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
  this.activeImageIndex.set(0); // Reset alla prima immagine quando cambi prodotto

  this.productService.getProductById(productId).subscribe({
    next: (product) => {
      this.product.set(product);
      this.loading.set(false);
      this.loadSuggestedProducts(product.subcategoryId, product.id);
    },
    error: (err) => {
      this.error.set('Failed to load product details');
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
      error: (err) => {
        console.error('Error loading suggested products:', err);
      }
    });
  }

  /* ── Metodi ── */
  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  selectVariant(variant: ProductVariant): void {
    if (variant.available) {
      this.selectedVariant.set(variant);
    }
  }

  decreaseQty(): void {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  increaseQty(): void {
    this.quantity.update(q => q + 1);
  }

  setQty(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 1) this.quantity.set(val);
  }

  addToCart(): void {
    if (!this.selectedVariant().available) return;
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2200);
  }

  toggleWishlist(): void {
    this.wishlistActive.update(v => !v);
  }
}
