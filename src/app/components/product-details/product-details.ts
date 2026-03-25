import { Component, signal, computed } from '@angular/core';
 
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

export class ProductDetails {

  /* ── Immagini ── */
  images: ProductImage[] = [
    {
      url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=900&q=85',
      alt: 'Ficus elastica Belize - vista frontale'
    },
    {
      url: 'https://images.unsplash.com/photo-1611211232932-da3113c5b960?w=900&q=85',
      alt: 'Ficus elastica Belize - dettaglio foglie'
    },
  ];
 
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
