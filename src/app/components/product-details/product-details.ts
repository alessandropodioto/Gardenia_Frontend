import { Component, signal, computed, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';
import { Review, ReviewService } from '../../services/reviews.service';

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

  product = signal<Product | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  suggestedProducts = signal<Product[]>([]);

  /* ── Review State ── */
  reviews = signal<Review[]>([]);
  selectedRating = signal(0);
  reviewComment = '';
  isEditing = signal(false);
  currentReviewId = signal<number | null>(null);

  /* --- Filtri, Ordinamento e Paginazione --- */
  filterStars = signal<number>(0);
  sortBy = signal<'date' | 'rating'>('date');
  limit = signal<number>(3);

  /* ── Images & UI ── */
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
    return [{ url: 'assets/no-image.png', alt: 'No image' }];
  });

  activeImageIndex = signal(0);
  quantity = signal(1);
  addedToCart = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  dialogMessage = signal('');

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    public cartService: CartService,
    public authService: AuthService,
    public wishlistService: WishlistService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      const productId = params['id'];
      if (productId) {
        const id = parseInt(productId, 10);
        this.loadProduct(id);
        this.loadReviews(id);
      }
    });
    const user = this.getUserName();
    if (user) this.wishlistService.getWishlist(user).subscribe();
  }

  /* ── Review Logic & UI Helpers ── */

  loadReviews(productId: number): void {
    this.reviewService.getByProduct(productId).subscribe({
      next: (data) => {
        this.reviews.set(data);
      },
      error: (err) => console.error('Error loading reviews', err),
    });
  }

  startEdit(rev: any): void {
    this.isEditing.set(true);
    this.currentReviewId.set(rev.id || null);
    this.selectedRating.set(rev.rating);
    this.reviewComment = rev.comment;

    document
      .getElementById('reviews-anchor')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setRating(val: number): void {
    this.selectedRating.set(val);
  }

  submitReview(): void {
    const userName = this.getUserName();
    const p = this.product();

    if (!userName || !p || this.selectedRating() === 0) return;

    const reviewData: any = {
      productId: p.id,
      userName: userName,
      rating: this.selectedRating(),
      comment: this.reviewComment,
    };

    const reviewId = this.currentReviewId();

    if (this.isEditing() && reviewId) {
      // MODIFICA
      this.reviewService.update(reviewId, reviewData).subscribe({
        next: (res) => {
          this.notify(res.msg || 'Review updated!');
          this.cancelEdit();
          this.loadReviews(p.id);
        },
        error: () => this.notify('Error updating review'),
      });
    } else {
      // CREAZIONE
      this.reviewService.create(reviewData).subscribe({
        next: (res) => {
          this.notify(res.msg || 'Review posted!');
          this.cancelEdit();
          this.loadReviews(p.id);
        },
        error: () => this.notify('Error posting review'),
      });
    }
  }

  deleteReview(id: number): void {
    this.reviewService.delete(id).subscribe({
      next: (res) => {
        this.notify(res.msg || 'Review deleted');
        this.loadReviews(this.product()!.id);
      },
      error: () => this.notify('Error deleting review'),
    });
  }

  resetReviewForm(): void {
    this.cancelEdit();
  }

  /* ── General Helpers ── */

  public getUserName(): string | null {
    const rawData = localStorage.getItem('user_data');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      return parsed.userName || parsed.username;
    }
    return null;
  }

  private notify(msg: string) {
    const friendlyMessages: { [key: string]: string } = {
      rest_created: 'Review posted successfully!',
      rest_updated: 'Review updated!',
      rest_deleted: 'Review removed!',
    };

    const finalMsg = friendlyMessages[msg] || msg;

    this.toastMessage.set(finalMsg);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }

  isFavorite(): boolean {
    const p = this.product();
    if (!p) return false;
    return this.wishlistService.items().some((item) => item.productId === p.id);
  }

  toggleWishlist(): void {
    const p = this.product();
    const userName = this.getUserName();
    if (!this.authService.isLoggedIn() || !userName) {
      this.dialogMessage.set(
        'To add products to your wishlist and save them for later, please log in.',
      );
      this.authDialog.nativeElement.showModal();
      return;
    }
    if (!p) return;
    if (this.isFavorite()) {
      const itemInWishlist = this.wishlistService.items().find((i) => i.productId === p.id);
      if (itemInWishlist) {
        this.wishlistService.removeFromWishlist(itemInWishlist.id).subscribe({
          next: () => this.notify('Removed from wishlist'),
          error: () => this.notify('Error updating wishlist'),
        });
      }
    } else {
      this.wishlistService.addToWishlist(p.id, userName).subscribe({
        next: () => this.notify('Added to wishlist!'),
        error: () => this.notify('Error updating wishlist'),
      });
    }
  }

  loadProduct(productId: number): void {
    this.loading.set(true);
    this.error.set(null);
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
    if (this.quantity() > 1) this.quantity.update((q) => q - 1);
  }
  increaseQty(): void {
    const stock = this.product()?.stock || 0;
    if (this.quantity() < 10 && this.quantity() < stock) this.quantity.update((q) => q + 1);
  }
  setQty(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    const max = Math.min(10, this.product()?.stock || 0);
    if (isNaN(val) || val < 1) val = 1;
    else if (val > max) val = max;
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
      this.dialogMessage.set(
        'To add products to your cart and complete your purchase, please log in.',
      );
      this.authDialog.nativeElement.showModal();
      return;
    }
    const p = this.product();
    if (!p) return;
    const qtyInCart = this.cartService.getItemQuantity(p.id);
    const requested = this.quantity();
    if (qtyInCart + requested > p.stock) {
      this.notify('Maximum stock reached.');
      return;
    }
    this.cartService.addItem(p.id, requested, p.price).subscribe({
      next: () => {
        this.addedToCart.set(true);
        setTimeout(() => this.addedToCart.set(false), 2000);
      },
      error: () => this.notify('Error adding to cart.'),
    });
  }

  /* ── Review Logic & UI Helpers ── */

  cancelEdit(): void {
    this.isEditing.set(false);
    this.selectedRating.set(0);
    this.reviewComment = '';
    this.currentReviewId.set(null);
  }

  scrollToReviews(): void {
    const element = document.getElementById('reviews-anchor');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  setFilter(stars: number): void {
    // Se clicchi sulla stessa stella, resetta il filtro (0), altrimenti imposta
    this.filterStars.set(stars === this.filterStars() ? 0 : stars);
    this.limit.set(3); // Reset della paginazione quando filtri
  }

  toggleSort(type: 'date' | 'rating'): void {
    this.sortBy.set(type);
  }

  showMore(): void {
    this.limit.update((n) => n + 5);
  }

  /* ── Computed States (Automatic Updates) ── */

  // Media voto complessiva
  averageRating = computed(() => {
    const allRevs = this.reviews();
    if (allRevs.length === 0) return '0.0';
    const sum = allRevs.reduce((acc, r) => acc + r.rating, 0);
    return (sum / allRevs.length).toFixed(1);
  });

  // Lista finale elaborata: Filtro -> Sort -> Limit
  processedReviews = computed(() => {
    let list = [...this.reviews()];

    // 1. Filtro per stelle
    if (this.filterStars() > 0) {
      list = list.filter((r) => r.rating === this.filterStars());
    }

    // 2. Ordinamento (Safe check per le date)
    list.sort((a, b) => {
      if (this.sortBy() === 'date') {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA; // Più recenti in alto
      } else {
        return b.rating - a.rating; // Valutazioni alte in alto
      }
    });

    // 3. Taglio per "Show More"
    return list.slice(0, this.limit());
  });

  @ViewChild('confirmDeleteDialog') confirmDeleteDialog!: ElementRef<HTMLDialogElement>;
  reviewIdToDelete: number | null = null;

  openConfirmDialog(id: number) {
    this.reviewIdToDelete = id;
    this.confirmDeleteDialog.nativeElement.showModal();
  }

  closeConfirmDialog() {
    this.confirmDeleteDialog.nativeElement.close();
    this.reviewIdToDelete = null;
  }

  confirmDeletion() {
    if (this.reviewIdToDelete !== null) {
      this.deleteReview(this.reviewIdToDelete);
      this.closeConfirmDialog();
    }
  }
}
