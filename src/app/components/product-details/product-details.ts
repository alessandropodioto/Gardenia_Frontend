import { Component, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

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

  /* ── Dati Prodotto ── */
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

  /* ── Stato UI ── */
  quantity = signal(1);
  addedToCart = signal(false);
  wishlistActive = signal(false);

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    public cartService: CartService 
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(parseInt(productId, 10));
      } else {
        this.error.set('ID prodotto non valido');
        this.loading.set(false);
      }
    });
  }

  loadProduct(productId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.activeImageIndex.set(0); 
    this.quantity.set(1); // Reset quantità al cambio prodotto

    this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.loadSuggestedProducts(product.subcategoryId, product.id);
      },
      error: (err) => {
        this.error.set('Impossibile caricare i dettagli del prodotto');
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
      error: (err) => console.error('Errore suggeriti:', err)
    });
  }

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  /* ── Gestione Quantità e Stock ── */
  decreaseQty(): void {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  increaseQty(): void {
    const stockAvailable = this.product()?.stock || 0;
    if (this.quantity() < stockAvailable) {
      this.quantity.update(q => q + 1);
    }
  }

  setQty(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    const stockAvailable = this.product()?.stock || 0;
    
    if (!isNaN(val) && val >= 1) {
      this.quantity.set(val > stockAvailable ? stockAvailable : val);
    }
  }

  /* ── LOGICA CORE: Aggiunta al carrello senza varianti ── */
  addToCart(): void {
    const p = this.product();
    if (!p || p.stock <= 0) return;

    // Passiamo i dati direttamente dal prodotto caricato dal DB
    this.cartService.addItem(
      p.id, 
      this.quantity(), 
      p.price // <--- Prezzo diretto dal prodotto
    ).subscribe({
      next: () => {
        this.addedToCart.set(true);
        
        // Scaliamo lo stock locale per feedback immediato
        this.product.update(prod => prod ? { ...prod, stock: prod.stock - this.quantity() } : null);

        setTimeout(() => this.addedToCart.set(false), 2000);
      },
      error: (err) => {
        console.error("Errore durante l'invio a Spring Boot", err);
      }
    });
  }
}