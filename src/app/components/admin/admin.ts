import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { AdminServices, User } from '../../services/admin.service';
import { ProductService, Product } from '../../services/product.service';
import { DeleteUser } from '../../dialogs/delete-user/delete-user';
import { ProductDialog, ProductDialogData } from '../../dialogs/product-dialog/product-dialog';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  users: User[] = [];
  products: Product[] = [];
  error: string | null = null;
  activeView: string = 'users';

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private adminService: AdminServices,
    private productService: ProductService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const userData = this.authService.getUserData();
      this.isAdmin = userData && userData.role === 'ADMIN';

      if (this.isAdmin) {
        this.loadUsers();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onViewChange(view: string | Event): void {
    const viewStr = typeof view === 'string' ? view : '';
    this.activeView = viewStr;
    this.error = null;
    if (viewStr === 'products') {
      this.loadProducts();
    }
    this.cdr.markForCheck();
  }

  // User Management Methods
  loadUsers(): void {
    this.error = null;

    this.adminService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error loading users';
          this.cdr.markForCheck();
          console.error('Error loading users:', err);
        }
      });
  }

  openDeleteUserDialog(user: User): void {
    const dialogRef = this.dialog.open(DeleteUser, {
      width: '400px',
      data: {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          email: user.email,
        },
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.confirmDeleteUser(user.userName);
        }
      });
  }

  confirmDeleteUser(username: string): void {
    this.adminService.deleteUser(username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.users = this.users.filter(u => u.userName !== username);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error deleting user';
          this.cdr.markForCheck();
          console.error('Error deleting user:', err);
        }
      });
  }

  // Product Management Methods
  loadProducts(): void {
    this.error = null;

    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error loading products';
          this.cdr.markForCheck();
          console.error('Error loading products:', err);
        }
      });
  }

  openCreateProductDialog(): void {
    const dialogRef = this.dialog.open(ProductDialog, {
      width: '500px',
      data: {
        product: null,
        mode: 'create'
      } as ProductDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.createProduct(result);
        }
      });
  }

  openEditProductDialog(product: Product): void {
    const dialogRef = this.dialog.open(ProductDialog, {
      width: '500px',
      data: {
        product: product,
        mode: 'edit'
      } as ProductDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.updateProduct(result);
        }
      });
  }

  openDeleteProductDialog(product: Product): void {
    const confirmDialog = this.dialog.open(DeleteUser, {
      width: '400px',
      data: {
        user: {
          firstName: 'Product',
          lastName: product.name,
          userName: product.id.toString(),
          email: '',
        },
      },
    });

    confirmDialog.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.deleteProduct(product.id);
        }
      });
  }

  createProduct(product: Product): void {
    this.productService.create(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newProduct) => {
          this.products.push(newProduct);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error creating product';
          this.cdr.markForCheck();
          console.error('Error creating product:', err);
        }
      });
  }

  updateProduct(product: Product): void {
    this.productService.update(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedProduct) => {
          const index = this.products.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            this.products[index] = updatedProduct;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error updating product';
          this.cdr.markForCheck();
          console.error('Error updating product:', err);
        }
      });
  }

  deleteProduct(productId: number): void {
    this.productService.delete(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== productId);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error deleting product';
          this.cdr.markForCheck();
          console.error('Error deleting product:', err);
        }
      });
  }
}