/**
 * HOME COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Mostra la griglia dei prodotti. È usato per DUE rotte diverse:
 *   - /home → mostra tutti i prodotti
 *   - /category/:categoryName/:subcategoryName?subcategoryId=X → filtra per sottocategoria
 *
 * CONCETTO — Riuso dello stesso componente su rotte diverse:
 * Angular non ricrea il componente se si naviga tra due rotte che usano lo stesso
 * componente. ngOnInit però si esegue una sola volta. Per ricaricare i dati al
 * cambio di rotta, ci si iscrive a activatedRoute.params (Observable che emette
 * ogni volta che i parametri cambiano).
 *
 * CONCETTO — Paginazione manuale (lato client):
 * Tutti i prodotti vengono caricati in memoria; pageIndex e pageSize controllano
 * quale "fetta" viene mostrata nel template. Non è paginazione server-side.
 */

import { Component, OnInit, signal } from '@angular/core';
import { ProductService, Product } from '../../services/product.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  // Math esposto come proprietà pubblica per usarlo nel template ({{ Math.ceil(...) }})
  Math = Math;

  // signal<Product[]>: la lista prodotti. Ogni volta che cambia, il template si aggiorna.
  products = signal<Product[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // true = stiamo mostrando tutti i prodotti (home); false = filtro per sottocategoria
  isHome = signal<boolean>(false);

  // Configurazione paginazione lato client
  pageSize = 10;   // Prodotti visibili per pagina
  pageIndex = 0;   // Pagina corrente (0-based)

  constructor(
    private productService: ProductService,
    private router: Router,
    private activatedRoute: ActivatedRoute, // Dà accesso ai parametri dell'URL corrente
  ) {}

  ngOnInit(): void {
    // Ci iscriviamo all'Observable dei parametri di rotta.
    // Questo Observable emette ogni volta che l'URL cambia (anche da /home a /category/...),
    // permettendo di ricaricare i prodotti senza ricreare il componente.
    this.activatedRoute.params.subscribe((params) => {
      const categoryName = params['categoryName'];
      const subcategoryName = params['subcategoryName'];

      this.pageIndex = 0; // Torna sempre alla prima pagina quando si cambia filtro

      if (categoryName && subcategoryName) {
        // Siamo su /category/:categoryName/:subcategoryName
        this.isHome.set(false);

        // Ci iscriviamo anche ai queryParams perché subcategoryId arriva come ?subcategoryId=X
        // (l'Header naviga con router.navigate(['/category/...'], { queryParams: { subcategoryId } }))
        this.activatedRoute.queryParams.subscribe((queryParams) => {
          const subcategoryId = queryParams['subcategoryId'];
          if (subcategoryId) {
            this.loadProductsBySubcategoryId(parseInt(subcategoryId, 10));
          } else {
            // Rotta categoria senza subcategoryId: mostra tutti (caso edge)
            this.loadAllProducts();
          }
        });
      } else {
        // Siamo su /home: nessun filtro
        this.isHome.set(true);
        this.loadAllProducts();
      }
    });
  }

  /** Gestisce il cambio pagina del paginator; scorre verso i prodotti */
  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    // Scroll fluido verso la griglia prodotti (top: 300 = sotto l'header/hero)
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  /** Carica tutti i prodotti senza filtri */
  loadAllProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load products');
        this.loading.set(false);
      },
    });
  }

  /** Carica i prodotti filtrati per ID sottocategoria */
  loadProductsBySubcategoryId(subcategoryId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProductsBySubcategory(subcategoryId).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load products');
        this.loading.set(false);
      },
    });
  }

  /** Naviga alla pagina di dettaglio del prodotto cliccato */
  navigateToProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  /**
   * Costruisce l'URL dell'immagine principale di un prodotto.
   * Se il link è già un URL assoluto (inizia con "http") lo usa direttamente;
   * altrimenti assume che sia un nome file servito dal backend.
   */
  getImageUrl(product: any): string {
    if (!product || !product.images || product.images.length === 0) {
      return 'assets/no-image.png';
    }
    const link = product.images[0].link;
    return link.startsWith('http') ? link : 'http://localhost:8080/rest/image/file/' + link;
  }

  // ── Getter per la paginazione lato client ──────────────────────────────────
  // I getter sono accessibili nel template come proprietà (senza parentesi).

  /** Numero totale di pagine in base al numero di prodotti caricati */
  get totalPagesCount(): number {
    return Math.ceil(this.products().length / this.pageSize);
  }

  /**
   * Calcola quali numeri di pagina mostrare nel paginator (max 5 alla volta).
   * Logica: centra la finestra sulla pagina corrente, poi aggiusta i bordi
   * per non andare sotto 0 o oltre il totale.
   */
  get visiblePages(): number[] {
    const total = this.totalPagesCount;
    const current = this.pageIndex;
    const maxVisible = 5;

    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible);

    // Se la finestra non è piena (vicino alla fine), sposta l'inizio a sinistra
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    const pages = [];
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
