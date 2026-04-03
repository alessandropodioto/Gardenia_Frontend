import { Component, OnInit, signal } from '@angular/core';
import { ProductService, Product } from '../../services/product.service';
import { SubcategoryService, Subcategory } from '../../services/subcategory.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  isHome = signal<boolean>(false);

  constructor(
    private productService: ProductService,
    private subcategoryService: SubcategoryService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const snapshot = this.activatedRoute.snapshot.params;
    this.isHome.set(!(snapshot['categoryName'] && snapshot['subcategoryName']));

    this.activatedRoute.params.subscribe(params => {
      const categoryName = params['categoryName'];
      const subcategoryName = params['subcategoryName'];

      if (categoryName && subcategoryName) {
        this.isHome.set(false);
        // Check if subcategoryId is provided as query param
        this.activatedRoute.queryParams.subscribe(queryParams => {
          const subcategoryId = queryParams['subcategoryId'];
          if (subcategoryId) {
            this.loadProductsBySubcategoryId(parseInt(subcategoryId, 10));
          } else {
            this.loadAllProducts();
          }
        });
      } else {
        this.isHome.set(true);
        // Default home page - show all products
        this.loadAllProducts();
      }
    });
  }

  loadAllProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.error.set('Failed to load products');
        this.loading.set(false);
      }
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
      error: (err) => {
        console.error('Error loading products by subcategory:', err);
        this.error.set('Failed to load products');
        this.loading.set(false);
      }
    });
  }

  loadProductsBySubcategoryName(subcategoryName: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Note: This is a workaround since we don't have direct API for looking up subcategory by name
    // In production, consider adding an API endpoint that takes subcategoryName as input
    // For now, we'll need to fetch all subcategories and find the matching ID
    // This would require CategoryService to be available

    // Alternative: Pass subcategoryId directly via route state or query param
    // For now, we'll just show a message that filtering needs the ID
    console.warn('Subcategory filtering by name requires additional API support');
    this.loadAllProducts();
  }

  navigateToProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }
}
