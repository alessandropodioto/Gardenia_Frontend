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
  Math = Math;
  products = signal<Product[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  isHome = signal<boolean>(false);

  // Imposta un numero ragionevole di prodotti per pagina
  pageSize = 10; 
  pageIndex = 0;

  constructor(
    private productService: ProductService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      const categoryName = params['categoryName'];
      const subcategoryName = params['subcategoryName'];

      this.pageIndex = 0;

      if (categoryName && subcategoryName) {
        this.isHome.set(false);
        this.activatedRoute.queryParams.subscribe((queryParams) => {
          const subcategoryId = queryParams['subcategoryId'];
          if (subcategoryId) {
            this.loadProductsBySubcategoryId(parseInt(subcategoryId, 10));
          } else {
            this.loadAllProducts();
          }
        });
      } else {
        this.isHome.set(true);
        this.loadAllProducts();
      }
    });
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    // Scorrimento fluido verso l'alto della griglia prodotti
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

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

  navigateToProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  getImageUrl(product: any): string {
    if (!product || !product.images || product.images.length === 0) {
      return 'assets/no-image.png';
    }
    const link = product.images[0].link;
    return link.startsWith('http') ? link : 'http://localhost:8080/rest/image/file/' + link;
  }

  // GETTERS PER LA PAGINAZIONE
  get totalPagesCount(): number {
    return Math.ceil(this.products().length / this.pageSize);
  }

  get visiblePages(): number[] {
    const total = this.totalPagesCount;
    const current = this.pageIndex;
    const maxVisible = 5; 

    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible);

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