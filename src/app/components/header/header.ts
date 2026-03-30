import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { SubcategoryService, Subcategory } from '../../services/subcategory.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.css',
  standalone: false,
})
export class HeaderComponent implements OnInit, OnDestroy {

  phrases: string[] = [
    'Free shipping on orders over €79',
    'Fast delivery throughout Italy',
    'Easy returns within 30 days',
    '10% discount on your first order!'
  ];

  currentIndex: number = 0;
  private intervalId: any;
  private authSubscription: Subscription | null = null;
  isAdmin: boolean = false;
  isLoggedIn: boolean = false;

  activeMenu: string | null = null;
  categories: any[] = [];
  subcategoriesMap: { [categoryId: number]: Subcategory[] } = {};

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private categoryService: CategoryService,
    private subcategoryService: SubcategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.phrases.length;
      this.cdr.detectChanges();
    }, 4000);

    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();
      this.authService.emitAuthState(userData);
    }

    this.authSubscription = this.authService.getAuthState().subscribe(userData => {
      this.isLoggedIn = !!userData;
      this.isAdmin = userData && userData.role === 'ADMIN';
      this.cdr.detectChanges();
    });

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;

        categories.forEach(category => {
          this.subcategoryService.getSubcategoriesByCategory(category.id).subscribe({
            next: (subcategories) => {
              this.subcategoriesMap[category.id] = subcategories;
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error(`Error fetching subcategories for category ${category.id}:`, error);
            }
          });
        });
      },
      error: (error) => {
        console.error('Error fetching categories:', error);
      }
    });
  }

  toggleMenu(menuName: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeMenu = this.activeMenu === menuName ? null : menuName;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.activeMenu = null;
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}