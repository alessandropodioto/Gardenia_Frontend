/**
 * PRODUCT DETAILS COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * La pagina più ricca dell'applicazione. Gestisce:
 *   - Dettaglio prodotto con galleria immagini
 *   - Aggiunta al carrello con controllo stock
 *   - Wishlist (aggiungi/rimuovi)
 *   - Prodotti suggeriti dalla stessa sottocategoria
 *   - Recensioni: lettura, scrittura, modifica, eliminazione con filtri e ordinamento
 *
 * CONCETTI CHIAVE:
 * - signal() per ogni stato locale (prodotto, loading, quantità, recensioni...)
 * - computed() per stati derivati (immagini elaborate, media voto, lista recensioni filtrata)
 * - @ViewChild per riferimenti diretti a elementi del DOM (dialoghi nativi HTML)
 * - Dialog nativo HTML (<dialog>) vs Material Dialog: qui si usa il tag nativo
 *   per i dialog di autenticazione (più leggero, senza dipendenze Material)
 */

import { Component, signal, computed, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';
import { Review, ReviewService } from '../../services/reviews.service';

// Interfaccia interna per le immagini già elaborate (URL assoluto + testo alternativo)
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
  // @ViewChild('authDialog'): recupera il riferimento all'elemento DOM con #authDialog nel template.
  // ElementRef<HTMLDialogElement> dà accesso all'API nativa del tag <dialog>
  // (showModal() per aprire, close() per chiudere).
  @ViewChild('authDialog') authDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('confirmDeleteDialog') confirmDeleteDialog!: ElementRef<HTMLDialogElement>;

  // ── Stato principale ────────────────────────────────────────────────────────
  product = signal<Product | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  suggestedProducts = signal<Product[]>([]); // Prodotti della stessa sottocategoria

  // ── Stato recensioni ────────────────────────────────────────────────────────
  reviews = signal<Review[]>([]);          // Lista grezza dal backend
  selectedRating = signal(0);              // Stelle selezionate nel form
  reviewComment = '';                       // Testo della recensione (property binding semplice)
  isEditing = signal(false);               // true = stiamo modificando una recensione esistente
  currentReviewId = signal<number | null>(null); // ID della recensione in modifica

  // ── Filtri, ordinamento e "show more" recensioni ────────────────────────────
  filterStars = signal<number>(0);              // 0 = nessun filtro; 1-5 = filtra per quel punteggio
  sortBy = signal<'date' | 'rating'>('date');   // Criterio di ordinamento attivo
  limit = signal<number>(3);                    // Quante recensioni mostrare (inizia con 3)

  // ── Immagini elaborate (computed) ───────────────────────────────────────────
  // computed() crea un signal derivato: si ricalcola automaticamente ogni volta
  // che product() cambia. Converte i link raw in URL assoluti pronti per <img src="...">.
  images = computed<ProductImage[]>(() => {
    const p = this.product();
    if (p && p.images && p.images.length > 0) {
      return p.images.map((img) => ({
        // Link assoluto (CDN esterno) → usato direttamente
        // Link relativo (nome file) → costruiamo l'URL del file server del backend
        url: img.link.startsWith('http')
          ? img.link
          : 'http://localhost:8080/rest/image/file/' + img.link,
        alt: p.name,
      }));
    }
    return [{ url: 'assets/no-image.png', alt: 'No image' }];
  });

  // ── Stato UI ────────────────────────────────────────────────────────────────
  activeImageIndex = signal(0);   // Indice dell'immagine attiva nella galleria
  quantity = signal(1);           // Quantità selezionata dall'utente
  addedToCart = signal(false);    // Flag temporaneo per feedback visivo "aggiunto!"
  showToast = signal(false);      // Visibilità del toast di notifica
  toastMessage = signal('');      // Testo del toast
  dialogMessage = signal('');     // Testo nel dialog di autenticazione
  reviewIdToDelete: number | null = null; // ID recensione in attesa di conferma eliminazione

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    public cartService: CartService,        // "public" per accedere nel template
    public authService: AuthService,        // "public" per accedere nel template
    public wishlistService: WishlistService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    // Ci iscriviamo ai parametri di rotta: se l'utente naviga da /product/1 a /product/2
    // senza ricaricare la pagina, questo callback viene rieseguito con il nuovo ID.
    this.activatedRoute.params.subscribe((params) => {
      const productId = params['id'];
      if (productId) {
        window.scrollTo(0, 0); // Torna in cima quando si carica un nuovo prodotto
        const id = parseInt(productId, 10); // Convertiamo da stringa a numero
        this.loadProduct(id);
        this.loadReviews(id);
      }
    });

    // Carichiamo la wishlist per sapere se il cuore va mostrato rosso (prodotto già preferito)
    const user = this.getUserName();
    if (user) this.wishlistService.getWishlist(user).subscribe();
  }

  // ── Caricamento dati dal backend ─────────────────────────────────────────

  /** Carica il prodotto e, una volta ricevuto, carica anche i prodotti suggeriti */
  loadProduct(productId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        // I suggeriti si caricano solo dopo aver ricevuto il prodotto (serve subcategoryId)
        this.loadSuggestedProducts(product.subcategoryId, product.id);
      },
      error: () => {
        this.error.set('Unable to load product details');
        this.loading.set(false);
      },
    });
  }

  /**
   * Carica fino a 4 prodotti della stessa sottocategoria da mostrare come suggeriti.
   * Esclude il prodotto corrente e quelli con soft delete (isDeleted = true).
   */
  loadSuggestedProducts(subcategoryId: number, currentProductId: number): void {
    this.productService.getProductsBySubcategory(subcategoryId).subscribe({
      next: (products) => {
        const filtered = products
          .filter((p) => p.id !== currentProductId && !p.isDeleted) // Escludi corrente e eliminati
          .slice(0, 4); // Massimo 4 suggeriti
        this.suggestedProducts.set(filtered);
      },
      error: (err) => console.error('Suggestions error:', err),
    });
  }

  /** Carica le recensioni di un prodotto dal backend */
  loadReviews(productId: number): void {
    this.reviewService.getByProduct(productId).subscribe({
      next: (data) => this.reviews.set(data),
      error: (err) => console.error('Error loading reviews', err),
    });
  }

  // ── Logica recensioni ────────────────────────────────────────────────────

  /** Prepopola il form con i dati della recensione da modificare e scrolla giù */
  startEdit(rev: any): void {
    this.isEditing.set(true);
    this.currentReviewId.set(rev.id || null);
    this.selectedRating.set(rev.rating);
    this.reviewComment = rev.comment;
    // Scorrimento fluido verso il form di recensione
    document.getElementById('reviews-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Imposta il punteggio stelle selezionato dall'utente */
  setRating(val: number): void {
    this.selectedRating.set(val);
  }

  /**
   * Invia la recensione (crea o aggiorna in base a isEditing).
   * Dopo il successo ricarica le recensioni e resetta il form.
   */
  submitReview(): void {
    const userName = this.getUserName();
    const p = this.product();
    if (!userName || !p || this.selectedRating() === 0) return; // Validazione minima

    const reviewData: any = {
      productId: p.id,
      userName: userName,
      rating: this.selectedRating(),
      comment: this.reviewComment,
    };

    const reviewId = this.currentReviewId();

    if (this.isEditing() && reviewId) {
      // AGGIORNAMENTO: PUT con l'ID della recensione esistente
      this.reviewService.update(reviewId, reviewData).subscribe({
        next: (res) => {
          this.notify(res.msg || 'Review updated!');
          this.cancelEdit();
          this.loadReviews(p.id);
        },
        error: () => this.notify('Error updating review'),
      });
    } else {
      // CREAZIONE: POST senza ID
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
        this.loadReviews(this.product()!.id); // "!" = TypeScript: siamo sicuri che product() non sia null qui
      },
      error: () => this.notify('Error deleting review'),
    });
  }

  /** Azzera il form di recensione senza salvare */
  cancelEdit(): void {
    this.isEditing.set(false);
    this.selectedRating.set(0);
    this.reviewComment = '';
    this.currentReviewId.set(null);
  }

  resetReviewForm(): void {
    this.cancelEdit();
  }

  // ── Dialog di conferma eliminazione ──────────────────────────────────────

  /** Apre il dialog nativo <dialog> per la conferma eliminazione recensione */
  openConfirmDialog(id: number) {
    this.reviewIdToDelete = id;
    this.confirmDeleteDialog.nativeElement.showModal(); // API nativa del tag <dialog>
  }

  closeConfirmDialog() {
    this.confirmDeleteDialog.nativeElement.close();
    this.reviewIdToDelete = null;
  }

  /** Elimina la recensione se l'utente ha confermato */
  confirmDeletion() {
    if (this.reviewIdToDelete !== null) {
      this.deleteReview(this.reviewIdToDelete);
      this.closeConfirmDialog();
    }
  }

  // ── Galleria immagini e quantità ─────────────────────────────────────────

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  decreaseQty(): void {
    if (this.quantity() > 1) this.quantity.update((q) => q - 1); // .update() modifica il valore corrente
  }

  increaseQty(): void {
    const stock = this.product()?.stock || 0;
    // Doppio limite: massimo 10 unità per ordine oppure tutto lo stock disponibile
    if (this.quantity() < 10 && this.quantity() < stock) this.quantity.update((q) => q + 1);
  }

  /** Gestisce l'input diretto nel campo quantità con clamp tra 1 e max(10, stock) */
  setQty(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    const max = Math.min(10, this.product()?.stock || 0);
    if (isNaN(val) || val < 1) val = 1;
    else if (val > max) val = max;
    this.quantity.set(val);
    input.value = val.toString(); // Sincronizza il valore visivo con quello clampato
  }

  // ── Carrello ─────────────────────────────────────────────────────────────

  /**
   * Aggiunge il prodotto al carrello.
   * Se l'utente non è loggato apre il dialog nativo di autenticazione.
   * Controlla che la somma (già in carrello + nuovi) non superi lo stock.
   */
  addToCart(): void {
    if (!this.authService.isLoggedIn()) {
      this.dialogMessage.set(
        'To add products to your cart and complete your purchase, please log in.',
      );
      this.authDialog.nativeElement.showModal(); // Apre il <dialog> nativo HTML
      return;
    }
    const p = this.product();
    if (!p) return;

    const qtyInCart = this.cartService.getItemQuantity(p.id); // Quantità già presente nel carrello
    const requested = this.quantity();

    if (qtyInCart + requested > p.stock) {
      this.notify('Maximum stock reached.');
      return;
    }

    this.cartService.addItem(p.id, requested, p.price).subscribe({
      next: () => {
        this.addedToCart.set(true);
        // Resetta il flag dopo 2 secondi (feedback visivo temporaneo)
        setTimeout(() => this.addedToCart.set(false), 2000);
      },
      error: () => this.notify('Error adding to cart.'),
    });
  }

  // ── Wishlist ─────────────────────────────────────────────────────────────

  /** Verifica se il prodotto corrente è già nella wishlist dell'utente */
  isFavorite(): boolean {
    const p = this.product();
    if (!p) return false;
    // Cerca nel signal items() del WishlistService (aggiornato automaticamente)
    return this.wishlistService.items().some((item) => item.productId === p.id);
  }

  /**
   * Toggle wishlist: aggiunge se non presente, rimuove se già presente.
   * Se l'utente non è loggato apre il dialog di autenticazione.
   */
  toggleWishlist(): void {
    const p = this.product();
    const userName = this.getUserName();

    if (!this.authService.isLoggedIn() || !userName) {
      // authDialog è un <dialog> nativo HTML: showModal() lo apre come modale
      this.dialogMessage.set(
        'To add products to your wishlist and save them for later, please log in.',
      );
      this.authDialog.nativeElement.showModal();
      return;
    }
    if (!p) return;

    if (this.isFavorite()) {
      // Cerca l'item nella wishlist per recuperare il suo id (id della riga, non del prodotto)
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

  // ── Navigazione e dialoghi ────────────────────────────────────────────────

  goTo(path: string): void {
    this.closeDialog();
    this.router.navigate([path]);
  }

  closeDialog(): void {
    this.authDialog.nativeElement.close(); // Chiude il <dialog> nativo
  }

  scrollToReviews(): void {
    document.getElementById('reviews-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Filtri e ordinamento recensioni ──────────────────────────────────────

  /**
   * Imposta il filtro per numero di stelle.
   * Se si clicca la stessa stella già selezionata, il filtro viene rimosso (toggle).
   * Reset anche della paginazione (limit torna a 3).
   */
  setFilter(stars: number): void {
    this.filterStars.set(stars === this.filterStars() ? 0 : stars);
    this.limit.set(3);
  }

  toggleSort(type: 'date' | 'rating'): void {
    this.sortBy.set(type);
  }

  /** Mostra 5 recensioni in più ("carica altre") */
  showMore(): void {
    this.limit.update((n) => n + 5); // .update() riceve una funzione che trasforma il valore corrente
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  /**
   * Recupera lo userName dal localStorage.
   * Questo componente lo legge direttamente invece di usare AuthService
   * perché serve spesso in modo sincrono (non asincrono).
   */
  public getUserName(): string | null {
    const rawData = localStorage.getItem('user_data');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      return parsed.userName || parsed.username;
    }
    return null;
  }

  /**
   * Mostra un toast di notifica per 4 secondi.
   * Mappa i codici risposta del backend (es. "rest_created") in messaggi leggibili.
   */
  private notify(msg: string) {
    const friendlyMessages: { [key: string]: string } = {
      rest_created: 'Review posted successfully!',
      rest_updated: 'Review updated!',
      rest_deleted: 'Review removed!',
    };
    const finalMsg = friendlyMessages[msg] || msg; // Usa la traduzione se esiste, altrimenti il messaggio raw
    this.toastMessage.set(finalMsg);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }

  // ── Computed signals (stati derivati automatici) ──────────────────────────

  /**
   * Media aritmetica dei voti. computed() la ricalcola ogni volta che reviews() cambia.
   * Restituisce una stringa con 1 decimale (es. "4.3").
   */
  averageRating = computed(() => {
    const allRevs = this.reviews();
    if (allRevs.length === 0) return '0.0';
    const sum = allRevs.reduce((acc, r) => acc + r.rating, 0);
    return (sum / allRevs.length).toFixed(1);
  });

  /**
   * PIPELINE di elaborazione recensioni: Filtro → Ordinamento → Limite.
   * computed() ricalcola questo valore ogni volta che cambia UNO dei signal usati:
   * reviews(), filterStars(), sortBy(), limit().
   * È il cuore della funzionalità recensioni: il template legge solo processedReviews().
   */
  processedReviews = computed(() => {
    let list = [...this.reviews()]; // Copia dell'array (non modifichiamo l'originale)

    // STEP 1 — Filtro per stelle (0 = nessun filtro)
    if (this.filterStars() > 0) {
      list = list.filter((r) => r.rating === this.filterStars());
    }

    // STEP 2 — Ordinamento
    list.sort((a, b) => {
      if (this.sortBy() === 'date') {
        // Ordina per data decrescente (più recenti prima). || 0 gestisce date mancanti.
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      } else {
        return b.rating - a.rating; // Ordina per voto decrescente (più alte prime)
      }
    });

    // STEP 3 — Tronca alla dimensione corrente (per "show more")
    return list.slice(0, this.limit());
  });
}
